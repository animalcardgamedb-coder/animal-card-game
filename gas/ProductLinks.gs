/*
 * アフィリエイト・パック／デッキリンクシートの初期化・同期・GET API用データ。
 * 既存のスプレッドシートに紐づいたGASプロジェクトへ追加してください。
 */

const ACG_AFFILIATE_HEADERS_ = [
  "カードID", "カード名", "Amazon", "楽天市場", "メルカリ", "ゲーマーズ", "駿河屋"
];
const ACG_PACK_LINK_HEADERS_ = [
  "商品種別", "商品名", "公式商品URL",
  "Amazon", "楽天市場", "メルカリ", "イエローサブマリン",
  "ドラゴンスター", "カードショップアジト", "カードラボ", "ゲーマーズ",
  "収録カードID", "REALiZE", "駿河屋"
];

function setupProductLinkSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("スプレッドシートに紐づいたGASから実行してください。");
  ensureProductHeaderSheet_(ss, "アフィリエイト", ACG_AFFILIATE_HEADERS_);
  ensureProductHeaderSheet_(ss, "パック・デッキリンク", ACG_PACK_LINK_HEADERS_);
  syncProductLinkSheets();
}

function ensureProductHeaderSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    return sheet;
  }
  const current = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getDisplayValues()[0].map(value => String(value || "").trim());
  const missing = headers.filter(header => !current.includes(header));
  if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  sheet.setFrozenRows(1);
  return sheet;
}

function syncProductLinkSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const affiliateSheet = ss.getSheetByName("アフィリエイト");
  const packSheet = ss.getSheetByName("パック・デッキリンク");
  if (!affiliateSheet || !packSheet) {
    throw new Error("先に setupProductLinkSheets() を実行してください。");
  }

  const oldAffiliateRows = readProductRowsByHeader_(affiliateSheet);
  const oldAffiliates = new Map();
  oldAffiliateRows.forEach(row => {
    const id = String(row["カードID"] || "").trim();
    if (id) oldAffiliates.set(id, row);
  });
  const cards = readProductMasterIndex_("Cards", "カード", "card_id", "card_name");
  const affiliateRows = cards.map(card => {
    const old = oldAffiliates.get(card.id) || {};
    return [
      card.id, card.name, old["Amazon"] || "", old["楽天市場"] || "",
      old["メルカリ"] || "", old["ゲーマーズ"] || "", old["駿河屋"] || ""
    ];
  });
  replaceProductDataRows_(affiliateSheet, ACG_AFFILIATE_HEADERS_, affiliateRows);

  // パック・デッキリンクの入力済み行は、手入力を保つため変更しません。
  if (packSheet.getLastRow() === 0) {
    packSheet.getRange(1, 1, 1, ACG_PACK_LINK_HEADERS_.length).setValues([ACG_PACK_LINK_HEADERS_]);
  }
}

function readProductMasterIndex_(sheetName, type, idHeader, nameHeader) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return readProductRowsByHeader_(sheet).map(row => ({
    type: type,
    id: String(row[idHeader] || "").trim(),
    name: String(row[nameHeader] || "").trim()
  })).filter(item => item.id && item.name);
}

function readProductRowsByHeader_(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 1) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values[0].map(value => String(value || "").trim());
  return values.slice(1).filter(row => row.some(value => String(value || "").trim() !== ""))
    .map(row => {
      const object = {};
      headers.forEach((header, index) => { if (header) object[header] = row[index] || ""; });
      return object;
    });
}

function replaceProductDataRows_(sheet, headers, rows) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), headers.length)).clearContent();
  if (rows.length) sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

/*
 * Main.gs の doGet() が createJsonResponse() を呼ぶ前に次の3プロパティをレスポンスへ追加します。
 * const linkData = getPurchaseLinkDataForApi_();
 * responseData.productLinks = linkData.productLinks;
 * responseData.affiliateLinks = linkData.affiliateLinks;
 * responseData.packLinks = linkData.packLinks;
 * responseData は、既存doGetで cards / territories をまとめている変数名に合わせてください。
 */

function getPurchaseLinkDataForApi_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    // 互換性のため空配列を返します。通常の購入検索URLはフロントエンドで生成します。
    productLinks: [],
    affiliateLinks: (function () {
      const sheet = ss.getSheetByName("アフィリエイト");
      return readProductRowsByHeader_(sheet).map(row => ({
        card_id: String(row["カードID"] || ""),
        card_name: String(row["カード名"] || ""),
        amazon_url: String(row["Amazon"] || ""),
        rakuten_url: String(row["楽天市場"] || ""),
        mercari_url: String(row["メルカリ"] || ""),
        gamers_url: String(row["ゲーマーズ"] || ""),
        surugaya_url: String(row["駿河屋"] || "")
      }));
    })(),
    packLinks: (function () {
      const sheet = ss.getSheetByName("パック・デッキリンク");
      return readProductRowsByHeader_(sheet).map(row => ({
        product_type: String(row["商品種別"] || ""),
        product_name: String(row["商品名"] || ""),
        official_url: String(row["公式商品URL"] || ""),
        amazon_url: String(row["Amazon"] || ""),
        rakuten_url: String(row["楽天市場"] || ""),
        mercari_url: String(row["メルカリ"] || ""),
        yellow_submarine_url: String(row["イエローサブマリン"] || ""),
        dragonstar_url: String(row["ドラゴンスター"] || ""),
        ajito_url: String(row["カードショップアジト"] || ""),
        cardlabo_url: String(row["カードラボ"] || ""),
        gamers_url: String(row["ゲーマーズ"] || ""),
        realize_url: String(row["REALiZE"] || ""),
        surugaya_url: String(row["駿河屋"] || ""),
        card_ids: String(row["収録カードID"] || "")
      }));
    })()
  };
}

/*
 * 新カードの登録後に実行すると新しいIDが同期されます。
 * 既存の手入力リンクは、同一IDに対して維持されます。
 */