const GLOSSARY_SHEET_NAME_ = "用語集";
const GLOSSARY_CACHE_KEY_ = "publicGlossary:v1";
const GLOSSARY_CACHE_SECONDS_ = 300;
const GLOSSARY_TERM_MAX_LENGTH_ = 80;
const GLOSSARY_DESCRIPTION_MAX_LENGTH_ = 1500;

function getGlossarySheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error("用語集を保存するスプレッドシートが見つかりません。");

  let sheet = spreadsheet.getSheetByName(GLOSSARY_SHEET_NAME_);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(GLOSSARY_SHEET_NAME_);
    sheet.getRange(1, 1, 1, 3).setValues([["ID", "用語", "説明"]]);
  }
  return sheet;
}

function readGlossaryRows_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return sheet.getRange(2, 1, lastRow - 1, 3).getDisplayValues()
    .filter(row => String(row[0] || "").trim() && String(row[1] || "").trim())
    .map(row => ({ id: String(row[0]), term: String(row[1]), description: String(row[2] || "") }))
    .sort((a, b) => a.term.localeCompare(b.term, "ja"));
}

function getPublicGlossary_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(GLOSSARY_CACHE_KEY_);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) { cache.remove(GLOSSARY_CACHE_KEY_); }
  }

  const items = readGlossaryRows_(getGlossarySheet_());
  try { cache.put(GLOSSARY_CACHE_KEY_, JSON.stringify(items), GLOSSARY_CACHE_SECONDS_); } catch (_) {}
  return items;
}

function saveGlossaryTerm_(body) {
  const id = String(body.id || "").trim();
  const term = String(body.term || "").trim();
  const description = String(body.description || "").trim();
  if (!term) throw new Error("用語を入力してください。");
  if (term.length > GLOSSARY_TERM_MAX_LENGTH_) throw new Error("用語は80文字以内で入力してください。");
  if (!description) throw new Error("説明を入力してください。");
  if (description.length > GLOSSARY_DESCRIPTION_MAX_LENGTH_) throw new Error("説明は1500文字以内で入力してください。");

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error("保存処理が混み合っています。少し待ってから再度お試しください。");
  try {
    const sheet = getGlossarySheet_();
    const lastRow = sheet.getLastRow();
    const values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 3).getDisplayValues() : [];
    const normalizedTerm = term.toLocaleLowerCase("ja-JP");
    const existingIndex = id ? values.findIndex(row => String(row[0]) === id) : -1;
    if (id && existingIndex < 0) throw new Error("編集対象の用語が見つかりません。用語集を再読み込みしてください。");
    const duplicateIndex = values.findIndex((row, index) => index !== existingIndex && String(row[1] || "").trim().toLocaleLowerCase("ja-JP") === normalizedTerm);
    if (duplicateIndex >= 0) throw new Error("同じ用語がすでに登録されています。");

    const savedId = id || Utilities.getUuid();
    if (existingIndex >= 0) {
      sheet.getRange(existingIndex + 2, 1, 1, 3).setValues([[savedId, term, description]]);
    } else {
      sheet.appendRow([savedId, term, description]);
    }
    CacheService.getScriptCache().remove(GLOSSARY_CACHE_KEY_);
    return { success: true, glossary: readGlossaryRows_(sheet) };
  } finally {
    lock.releaseLock();
  }
}

function deleteGlossaryTerm_(body) {
  const id = String(body.id || "").trim();
  if (!id) throw new Error("削除する用語を指定してください。");

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error("削除処理が混み合っています。少し待ってから再度お試しください。");
  try {
    const sheet = getGlossarySheet_();
    const lastRow = sheet.getLastRow();
    const values = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 3).getDisplayValues() : [];
    const index = values.findIndex(row => String(row[0]) === id);
    if (index < 0) throw new Error("削除対象の用語が見つかりません。用語集を再読み込みしてください。");
    sheet.deleteRow(index + 2);
    CacheService.getScriptCache().remove(GLOSSARY_CACHE_KEY_);
    return { success: true, glossary: readGlossaryRows_(sheet) };
  } finally {
    lock.releaseLock();
  }
}