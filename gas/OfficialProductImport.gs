/**
 * 公式の商品情報一覧から各商品ページを読み込み、
 * 「パック・デッキリンク」シートに商品情報を自動登録します。
 *
 * 事前条件:
 * - ProductLinks.gs を同じGASプロジェクトに追加済み
 * - setupProductLinkSheets() を一度実行済み
 *
 * 実行する関数:
 *   importOfficialProductCatalog()
 *
 * 自動更新したい場合は、任意で
 *   installOfficialProductCatalogWeeklySync()
 * を一度実行してください（毎週月曜日の午前4時ごろに同期）。
 */

const OPI_CATALOG_URL_ = "https://acgtcg.com/products.html";
const OPI_META_HEADERS_ = [
  "発売日",
  "希望小売価格",
  "デッキコンセプト",
  "公式情報確認日時"
];

/**
 * 商品一覧の詳細リンクを辿って商品情報をシートへ同期。
 * 手入力済みの販売サイトURLと収録カードIDは保持します。
 */
function importOfficialProductCatalog() {
  if (typeof ensureProductHeaderSheet_ !== "function" ||
      typeof ACG_PACK_LINK_HEADERS_ === "undefined") {
    throw new Error(
      "先に ProductLinks.gs を追加し、保存してください。"
    );
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("スプレッドシートに紐づいたGASから実行してください。");
  }

  const headers = ACG_PACK_LINK_HEADERS_.concat(OPI_META_HEADERS_);
  const sheet = ensureProductHeaderSheet_(
    ss,
    "パック・デッキリンク",
    headers
  );

  const catalogHtml = opiFetchHtml_(OPI_CATALOG_URL_);
  const productUrls = opiExtractProductUrls_(catalogHtml);

  if (!productUrls.length) {
    throw new Error(
      "公式商品一覧から商品詳細ページのURLを見つけられませんでした。サイトのHTML構造が変更された可能性があります。"
    );
  }

  const headerValues = sheet.getRange(
    1, 1, 1, sheet.getLastColumn()
  ).getDisplayValues()[0].map(value => String(value || "").trim());

  const columnByHeader = {};
  headerValues.forEach((header, index) => {
    if (header) columnByHeader[header] = index;
  });

  const currentValues = sheet.getDataRange().getDisplayValues();
  const rowByUrl = new Map();

  for (let i = 1; i < currentValues.length; i++) {
    const row = currentValues[i];
    const urlIndex = columnByHeader["公式商品URL"];
    const existingUrl = urlIndex === undefined ? "" : row[urlIndex];
    const key = opiNormalizeUrl_(existingUrl);
    if (key) rowByUrl.set(key, i + 1);
  }

  const masterItems = []
    .concat(readProductMasterIndex_("Cards", "カード", "card_id", "card_name"))
    .concat(readProductMasterIndex_("Territories", "領土", "territory_id", "territory_name"));

  let added = 0;
  let updated = 0;
  let failed = 0;
  const errors = [];
  const checkedAt = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone() || "Asia/Tokyo",
    "yyyy-MM-dd HH:mm:ss"
  );

  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];

    try {
      const html = opiFetchHtml_(url);
      const info = opiParseProductPage_(html, url, masterItems);

      if (!info.name) {
        failed++;
        errors.push(url + "：商品名を抽出できませんでした");
        continue;
      }

      const urlKey = opiNormalizeUrl_(url);
      const existingRowNumber = rowByUrl.get(urlKey);
      let row;

      if (existingRowNumber) {
        row = sheet.getRange(
          existingRowNumber, 1, 1, headerValues.length
        ).getDisplayValues()[0];
        updated++;
      } else {
        row = new Array(headerValues.length).fill("");
        added++;
      }

      // 公式ページから取得できた項目だけを更新。
      opiSetCell_(row, columnByHeader, "商品種別", info.type);
      opiSetCell_(row, columnByHeader, "商品名", info.name);
      opiSetCell_(row, columnByHeader, "公式商品URL", url);
      opiSetCell_(row, columnByHeader, "発売日", info.releaseDate);
      opiSetCell_(row, columnByHeader, "希望小売価格", info.price);
      opiSetCell_(row, columnByHeader, "デッキコンセプト", info.concept);
      opiSetCell_(row, columnByHeader, "公式情報確認日時", checkedAt);

      // シートに手入力済みのカードIDは残し、ページで検出したIDだけ追加。
      const cardIdsIndex = columnByHeader["収録カードID"];
      if (cardIdsIndex !== undefined && info.cardIds.length) {
        const existingIds = String(row[cardIdsIndex] || "")
          .split(/[,，、;；\s]+/)
          .map(value => value.trim())
          .filter(Boolean);
        const combinedIds = existingIds.slice();
        info.cardIds.forEach(id => {
          if (combinedIds.indexOf(id) === -1) combinedIds.push(id);
        });
        row[cardIdsIndex] = combinedIds.join(",");
      }

      const targetRowNumber = existingRowNumber || sheet.getLastRow() + 1;
      sheet.getRange(
        targetRowNumber, 1, 1, headerValues.length
      ).setValues([row]);

      rowByUrl.set(urlKey, targetRowNumber);

      // 公式サイトへの連続アクセスを抑える。
      if (i < productUrls.length - 1) Utilities.sleep(250);

    } catch (error) {
      failed++;
      errors.push(
        url + "：" + String(error && error.message ? error.message : error)
      );
    }
  }

  // 商品情報の更新後、行全体を発売日の新しい順に並べ替える。
  // 販売サイトURLや収録カードIDなどの手入力データも商品行と一緒に移動する。
  opiSortPackLinkRowsByReleaseDate_(sheet, columnByHeader);

  const summary = {
    success: failed === 0,
    found: productUrls.length,
    added: added,
    updated: updated,
    failed: failed,
    errors: errors
  };

  Logger.log(JSON.stringify(summary, null, 2));
  return summary;
}


/**
 * 「パック・デッキリンク」の商品行を発売日の新しい順に整列。
 * 日付が読み取れない商品は最後に配置する。
 * 一時的な補助列で行全体を並べ替え、補助列の値は最後に消去する。
 */
function opiSortPackLinkRowsByReleaseDate_(sheet, columnByHeader) {
  const releaseDateIndex = columnByHeader["発売日"];
  if (releaseDateIndex === undefined) {
    throw new Error("パック・デッキリンクに「発売日」列がありません。");
  }

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow <= 2 || lastColumn < 1) return 0;

  const dateValues = sheet
    .getRange(2, releaseDateIndex + 1, lastRow - 1, 1)
    .getDisplayValues();

  const sortValues = dateValues.map(function(row) {
    const timestamp = opiParseReleaseDateSortTimestamp_(row[0]);
    // 発売日不明の商品は既知の日付より古い値として末尾へ送る。
    return [timestamp ? new Date(timestamp) : new Date(0)];
  });

  const helperColumn = lastColumn + 1;
  sheet.getRange(2, helperColumn, lastRow - 1, 1).setValues(sortValues);

  try {
    // ヘッダー行は除外し、商品行全体を一緒に並べ替える。
    sheet.getRange(2, 1, lastRow - 1, helperColumn)
      .sort({ column: helperColumn, ascending: false });
  } finally {
    // 一時列の値は残さない。元のデータ列には変更を加えない。
    sheet.getRange(2, helperColumn, lastRow - 1, 1).clearContent();
  }

  return lastRow - 1;
}


/**
 * 日本語表記・スラッシュ・ハイフン等の日付を並び替え用の時刻へ変換。
 * 年月だけの場合はその月の1日として扱う。
 */
function opiParseReleaseDateSortTimestamp_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.getTime();
  }

  const text = String(value || "").trim();
  if (!text) return 0;

  const match = text.match(
    /(\d{4})\s*(?:年|[/.－-])\s*(\d{1,2})\s*(?:月|[/.－-])?\s*(\d{1,2})?\s*日?/
  );
  if (!match) return 0;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;

  if (
    year < 1900 || year > 2200 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31
  ) {
    return 0;
  }

  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return 0;
  }

  return timestamp;
}


/**
 * 商品一覧から products_数字.html のリンクを抽出。
 */
function opiExtractProductUrls_(html) {
  const source = String(html || "");
  const hrefRegex = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>/gi;
  const urls = [];
  let match;

  while ((match = hrefRegex.exec(source)) !== null) {
    const href = String(match[1] || match[2] || "").trim();
    const url = opiAbsoluteUrl_(href);

    if (!url) continue;
    if (!/^https:\/\/acgtcg\.com\/products_\d+\.html$/i.test(url)) continue;

    if (urls.indexOf(url) === -1) urls.push(url);
  }

  return urls;
}


/**
 * 公式商品ページから商品名・発売日・価格・コンセプトを抽出。
 */
function opiParseProductPage_(html, url, masterItems) {
  const source = String(html || "");
  const plain = opiHtmlToText_(source);
  const name = opiExtractProductName_(source, url);
  const releaseDate = opiFindFirstLineValue_(
    plain,
    /発売日\s*[：:]\s*([^\n]+)/i
  );

  const prices = [];
  const priceRegex = /希望小売価格\s*[：:]\s*([^\n]+)/gi;
  let priceMatch;
  while ((priceMatch = priceRegex.exec(plain)) !== null) {
    const value = String(priceMatch[1] || "").trim();
    if (value && prices.indexOf(value) === -1) prices.push(value);
  }

  const concept = opiFindFirstLineValue_(
    plain,
    /デッキコンセプト\s*[：:]\s*([^\n]+)/i
  );

  const type = opiClassifyProduct_(name, plain);
  const cardIds = opiFindCardIds_(source, plain, masterItems);

  return {
    name: name,
    type: type,
    releaseDate: releaseDate,
    price: prices.join(" / "),
    concept: concept,
    cardIds: cardIds
  };
}


/**
 * 商品タイトル候補を見出しから取得。
 * 「商品情報」などの共通見出しは除外する。
 */
function opiExtractProductName_(html, url) {
  const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi;
  const skip = /^(商品情報|アニマルカードゲーム|トップ|ホーム|メニュー|お知らせ)$/;
  let match;

  while ((match = headingRegex.exec(String(html || ""))) !== null) {
    const heading = opiHtmlToText_(match[2]).trim();
    if (heading && !skip.test(heading) && heading.length <= 120) {
      return heading;
    }
  }

  const ogTitle = String(html || "").match(
    /<meta\b[^>]*(?:property|name)\s*=\s*["'](?:og:title|twitter:title)["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i
  );
  if (ogTitle) {
    const value = opiHtmlToText_(ogTitle[1]).trim();
    if (value && !skip.test(value)) return value;
  }

  const fileMatch = String(url || "").match(/products_(\d+)\.html/i);
  return fileMatch ? "公式商品（ページ番号 " + fileMatch[1] + "）" : "";
}


/**
 * 公式ページの記載から商品種別をざっくり分類。
 */
function opiClassifyProduct_(name, plainText) {
  const text = String(name || "") + "\n" + String(plainText || "");

  if (/プレイマット|スリーブ|サプライ|周辺グッズ/i.test(text)) {
    return "サプライ";
  }
  if (/領土セット/.test(text)) {
    return "セット";
  }
  if (/ブースターパック/.test(text)) {
    return "ブースターパック";
  }
  if (/デッキ|構築済み/.test(text)) {
    return "デッキ";
  }
  if (/パック/.test(text)) {
    return "パック";
  }

  return "その他";
}


/**
 * HTMLのリンク・画像属性に現れるカードIDや画像のalt/title、
 * 明示的に固定収録と書かれたカード名から、確認できるIDを抽出。
 * 画像だけで名前を確認できないカードは無理に推測しない。
 */
function opiFindCardIds_(html, plainText, masterItems) {
  const source = String(html || "");
  const found = [];
  const allIds = [];
  const cardNameToId = {};

  (masterItems || []).forEach(item => {
    const id = String(item.id || "").trim();
    const name = String(item.name || "").trim();
    if (id && allIds.indexOf(id) === -1) allIds.push(id);
    if (id && name) cardNameToId[name] = id;
  });

  /*
   * Official pages contain links/images with filenames such as
   * /img/ACG-001.png and /img/ACG-001F.png.
   * Match attribute values against IDs already present in the Cards
   * and Territories sheets.
   */
  const tagRegex = /<(?:a|img)\b[^>]*>/gi;
  let tagMatch;

  while ((tagMatch = tagRegex.exec(source)) !== null) {
    const tag = tagMatch[0];
    const attributeValues = [];
    const attributeRegex =
      /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    let attributeMatch;

    while ((attributeMatch = attributeRegex.exec(tag)) !== null) {
      const attributeName = String(attributeMatch[1] || "").toLowerCase();
      const value = String(
        attributeMatch[2] || attributeMatch[3] ||
        attributeMatch[4] || ""
      ).trim();

      if (!value) continue;

      if (
        /^(href|src|srcset|alt|title|data-src|data-original|data-lazy-src|data-image|content)$/i.test(attributeName)
      ) {
        attributeValues.push(value);
      }
    }

    allIds.forEach(id => {
      const escapedId = id.split("").map(character =>
        "\\^$.*+?()[]{}|".indexOf(character) !== -1
          ? "\\" + character
          : character
      ).join("");

      /*
       * Do not match a different alphanumeric ID such as ACG-0010
       * when searching ACG-001. Allow trailing F in image names
       * such as ACG-001F.png for foil variants.
       */
      const idPattern = new RegExp(
        "(^|[^A-Za-z0-9])" +
        escapedId +
        "(?:F(?=\\.(?:png|jpe?g|webp|gif)(?:[?#]|$)))?" +
        "(?=$|[^A-Za-z0-9])",
        "i"
      );

      if (
        attributeValues.some(value => idPattern.test(value)) &&
        found.indexOf(id) === -1
      ) {
        found.push(id);
      }
    });

    Object.keys(cardNameToId).forEach(name => {
      if (name.length < 2) return;
      if (
        attributeValues.some(value => value.indexOf(name) !== -1)
      ) {
        const id = cardNameToId[name];
        if (found.indexOf(id) === -1) found.push(id);
      }
    });
  }

  /*
   * Also use card names explicitly listed in a fixed-card note.
   */
  const fixedMatch = String(plainText || "").match(
    /固定(?:です|されています)[。！!]?([\s\S]{0,500})/i
  );

  if (fixedMatch) {
    const fixedText = fixedMatch[1];

    Object.keys(cardNameToId).forEach(name => {
      if (name.length >= 2 && fixedText.indexOf(name) !== -1) {
        const id = cardNameToId[name];
        if (found.indexOf(id) === -1) found.push(id);
      }
    });
  }

  return found;
}

/**
 * 指定ラベルの後ろから行末までを取り出す。
 */
function opiFindFirstLineValue_(text, regex) {
  const match = String(text || "").match(regex);
  return match ? String(match[1] || "").trim() : "";
}


/**
 * HTMLを見出し・ラベル解析用のテキストへ変換。
 */
function opiHtmlToText_(html) {
  let text = String(html || "");

  text = text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<\/div\s*>/gi, "\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return opiDecodeEntities_(text)
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}


/**
 * 商品ページの文字列に含まれるHTMLエンティティをデコード。
 */
function opiDecodeEntities_(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, function(_, code) {
      return String.fromCodePoint(Number(code));
    })
    .replace(/&#x([0-9a-f]+);/gi, function(_, code) {
      return String.fromCodePoint(parseInt(code, 16));
    });
}


/**
 * 相対リンクを公式サイトの絶対URLへ変換。
 */
function opiAbsoluteUrl_(href) {
  let value = String(href || "").trim();
  if (!value || /^(#|mailto:|javascript:|tel:)/i.test(value)) return "";

  if (/^https?:\/\//i.test(value)) {
    value = value.replace(
      /^https?:\/\/(?:www\.)?acgtcg\.com/i,
      "https://acgtcg.com"
    );
  } else if (value.indexOf("//") === 0) {
    value = "https:" + value;
  } else if (value.charAt(0) === "/") {
    value = "https://acgtcg.com" + value;
  } else {
    value = "https://acgtcg.com/" + value.replace(/^\.\//, "");
  }

  value = value.split("#")[0].split("?")[0];
  return value;
}


/**
 * URLの比較用形式。wwwや末尾のスラッシュの違いを吸収。
 */
function opiNormalizeUrl_(url) {
  let value = opiAbsoluteUrl_(String(url || ""));
  if (!value) return "";

  value = value.replace(/\/$/, "");
  return value.toLowerCase();
}


/**
 * 公式ページを取得し、HTTPエラーを明示する。
 */
function opiFetchHtml_(url) {
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AnimalCardGameCatalogImporter/1.0)"
    }
  });

  const status = response.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error("公式ページの取得に失敗しました（HTTP " + status + "）");
  }

  return response.getContentText("UTF-8");
}


/**
 * 配列の指定列へ値を設定する。
 */
function opiSetCell_(row, columnByHeader, header, value) {
  const index = columnByHeader[header];
  if (index === undefined) return;
  row[index] = value === undefined || value === null ? "" : String(value);
}


/**
 * 週1回、公式商品情報を同期するトリガーを設定。
 * 必要な場合だけ手動で一度実行してください。
 */
function installOfficialProductCatalogWeeklySync() {
  const handler = "importOfficialProductCatalog";

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(handler)
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(4)
    .create();

  return "公式商品情報の週次同期を設定しました。";
}


/**
 * 週次同期を停止。
 */
function removeOfficialProductCatalogWeeklySync() {
  const handler = "importOfficialProductCatalog";
  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === handler) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  return "週次同期トリガーを " + removed + " 件削除しました。";
}
