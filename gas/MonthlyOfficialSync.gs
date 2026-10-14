/**
 * 公式サイトのカードリストと商品カタログを定期同期する。
 *
 * 依存する既存ファイル:
 * - Import.gs（importBulkHtml / parseOfficialHtml）
 * - Main.gs（doGet / doPost など）
 * - ProductLinks.gs（商品リンクシート、syncProductLinkSheets）
 * - OfficialProductImport.gs（importOfficialProductCatalog）
 *
 * 初回セットアップ:
 * 1. runMonthlyOfficialSyncNow() を手動実行して権限を承認し、結果を確認
 * 2. installMonthlyOfficialSyncTrigger() を一度実行
 *
 * 定期実行は毎週金曜日の午前4時ごろに日付だけ判定し、
 * 第4金曜日の場合に限り同期を開始する。
 * プロジェクトのタイムゾーンは Asia/Tokyo に設定すること。
 */

const ACG_AUTO_SYNC_HOME_URL_ = "https://acgtcg.com/";
const ACG_AUTO_SYNC_LOG_SHEET_ = "自動同期ログ";
const ACG_AUTO_SYNC_TRIGGER_ = "runMonthlyOfficialSyncIfFourthFriday";
const ACG_AUTO_SYNC_MAX_BP_PROBE_ = 30;


/**
 * 毎週金曜日のトリガーから呼び出される。
 * 第4金曜日以外は外部ページにアクセスせず終了する。
 */
function runMonthlyOfficialSyncIfFourthFriday() {
  const tz = Session.getScriptTimeZone() || "Asia/Tokyo";
  const now = new Date();
  const weekday = Utilities.formatDate(now, tz, "u"); // 月=1 ... 金=5
  const day = Number(Utilities.formatDate(now, tz, "d"));
  const monthKey = Utilities.formatDate(now, tz, "yyyy-MM");

  if (weekday !== "5" || Math.ceil(day / 7) !== 4) {
    return {
      skipped: true,
      message: "第4金曜日ではないため、今回は処理を実行しません。"
    };
  }

  const props = PropertiesService.getScriptProperties();
  const key = "ACG_MONTHLY_AUTO_SYNC_DONE_" + monthKey;

  if (props.getProperty(key)) {
    return {
      skipped: true,
      message: monthKey + " はすでに同期済みです。"
    };
  }

  const result = executeMonthlyOfficialSync_();

  // 完走したら、同じ月に重複実行しないよう記録する。
  props.setProperty(key, new Date().toISOString());
  return result;
}


/**
 * 初回テスト用。日付にかかわらず同期を1回実行する。
 * 定期トリガーの同期済み記録は変更しない。
 */
function runMonthlyOfficialSyncNow() {
  return executeMonthlyOfficialSync_();
}


/**
 * 毎月第4金曜日の同期トリガーを設定する。
 * 既存の単独商品同期トリガーがあれば削除し、
 * 商品カタログだけが週次で二重実行されるのを防ぐ。
 */
function installMonthlyOfficialSyncTrigger() {
  const handlersToReplace = [
    ACG_AUTO_SYNC_TRIGGER_,
    "importOfficialProductCatalog"
  ];

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (handlersToReplace.indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(ACG_AUTO_SYNC_TRIGGER_)
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.FRIDAY)
    .atHour(4)
    .create();

  return "トリガーを設定しました。プロジェクトのタイムゾーンがAsia/Tokyoなら、毎月第4金曜日の午前4時〜5時ごろに同期します。";
}


/**
 * 月次自動同期を停止する。
 * この処理が作成したトリガーと、以前の単独商品同期トリガーを削除する。
 */
function removeMonthlyOfficialSyncTrigger() {
  const handlersToRemove = [
    ACG_AUTO_SYNC_TRIGGER_,
    "importOfficialProductCatalog"
  ];
  let removed = 0;

  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (handlersToRemove.indexOf(trigger.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });

  return "対象トリガーを " + removed + " 件削除しました。";
}


/**
 * メイン処理:
 * 1. 公式カードリストを発見してID単位で追加・更新
 * 2. 商品リンク・アフィリエイトのカード一覧を同期
 * 3. 公式商品一覧から商品情報・収録カードIDを同期
 * 4. 実行結果をログシートへ記録
 */
function executeMonthlyOfficialSync_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    throw new Error("別の同期処理が実行中のため、今回の処理を開始できませんでした。");
  }

  const tz = Session.getScriptTimeZone() || "Asia/Tokyo";
  const startedAt = Utilities.formatDate(
    new Date(), tz, "yyyy-MM-dd HH:mm:ss"
  );

  const summary = {
    startedAt: startedAt,
    cardListUrlsFound: 0,
    cardListPagesImported: 0,
    parsedCardsAndTerritories: 0,
    addedCards: 0,
    updatedCards: 0,
    addedTerritories: 0,
    updatedTerritories: 0,
    cardParseErrors: 0,
    cardPageFailures: [],
    productCatalog: null,
    productLinkSync: "未実行",
    errors: []
  };

  try {
    if (typeof importBulkHtml !== "function" ||
        typeof parseOfficialHtml !== "function") {
      throw new Error(
        "Import.gs の importBulkHtml() / parseOfficialHtml() が見つかりません。"
      );
    }
    if (typeof syncProductLinkSheets !== "function") {
      throw new Error(
        "ProductLinks.gs の syncProductLinkSheets() が見つかりません。"
      );
    }
    if (typeof importOfficialProductCatalog !== "function") {
      throw new Error(
        "OfficialProductImport.gs の importOfficialProductCatalog() が見つかりません。"
      );
    }

    const urls = discoverOfficialCardListUrls_();
    summary.cardListUrlsFound = urls.length;

    urls.forEach(url => {
      try {
        const response = UrlFetchApp.fetch(url, {
          muteHttpExceptions: true,
          followRedirects: true,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AnimalCardGameAutoSync/1.0)"
          }
        });

        const status = response.getResponseCode();
        if (status < 200 || status >= 300) {
          return;
        }

        const html = response.getContentText("UTF-8");
        const parsed = parseOfficialHtml(html);

        // 404テンプレートや、カードがないページは取り込まない。
        if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
          return;
        }

        // importBulkHtml 内でカードIDに基づく追加・更新を行う。
        const importResult = importBulkHtml(html);

        if (!importResult || importResult.success !== true) {
          summary.cardPageFailures.push(url + "：一括登録が成功しませんでした。");
          return;
        }

        // Import.gs は従来の手動取り込み向けに source_url を固定値で作るため、
        // 自動取り込みでは、実際に取得した各カードリストのURLに直す。
        updateImportedSourceUrls_(parsed.items, url);

        summary.cardListPagesImported++;
        summary.parsedCardsAndTerritories += Number(importResult.parsed || 0);
        summary.addedCards += Number(importResult.addedCards || 0);
        summary.updatedCards += Number(importResult.updatedCards || 0);
        summary.addedTerritories += Number(importResult.addedTerritories || 0);
        summary.updatedTerritories += Number(importResult.updatedTerritories || 0);
        summary.cardParseErrors += Number(importResult.totalErrors || 0);

        if (Array.isArray(importResult.parseErrors) && importResult.parseErrors.length) {
          summary.cardPageFailures.push(
            url + "：解析エラー " + importResult.parseErrors.length + " 件"
          );
        }

        Utilities.sleep(200);
      } catch (error) {
        summary.cardPageFailures.push(
          url + "：" + String(error && error.message ? error.message : error)
        );
      }
    });

    // 全カードリストの登録後にカード・領土一覧をまとめて同期する。
    try {
      syncProductLinkSheets();
      summary.productLinkSync = "完了";
    } catch (error) {
      summary.productLinkSync = "失敗";
      summary.errors.push(
        "商品リンクシート同期: " +
        String(error && error.message ? error.message : error)
      );
    }

    // 公式商品ページから商品名、URL、価格、発売日、コンセプト、
    // 画像URL等から照合できたカードIDを取り込む。
    try {
      summary.productCatalog = importOfficialProductCatalog();
      if (!summary.productCatalog || summary.productCatalog.success !== true) {
        summary.errors.push("公式商品カタログに一部取得失敗があります。詳細は実行ログを確認してください。");
      }
    } catch (error) {
      summary.errors.push(
        "公式商品カタログ同期: " +
        String(error && error.message ? error.message : error)
      );
    }

    summary.status = (
      summary.errors.length === 0 &&
      summary.cardPageFailures.length === 0 &&
      summary.cardListPagesImported > 0 &&
      summary.productLinkSync === "完了" &&
      summary.productCatalog &&
      summary.productCatalog.success === true
    ) ? "成功" : "一部失敗";

    summary.finishedAt = Utilities.formatDate(
      new Date(), tz, "yyyy-MM-dd HH:mm:ss"
    );

    writeMonthlyOfficialSyncLog_(summary);
    Logger.log(JSON.stringify(summary, null, 2));
    return summary;

  } catch (error) {
    summary.status = "失敗";
    summary.errors.push(
      String(error && error.message ? error.message : error)
    );
    summary.finishedAt = Utilities.formatDate(
      new Date(), tz, "yyyy-MM-dd HH:mm:ss"
    );
    try {
      writeMonthlyOfficialSyncLog_(summary);
    } catch (logError) {
      Logger.log("ログ保存にも失敗: " + logError);
    }
    throw error;

  } finally {
    lock.releaseLock();
  }
}


/**
 * 公式トップページからカードリストURLを発見し、
 * 念のため既知のSD1 / RYO / PR / BP1〜BP30も候補に含める。
 * 実際にカードデータが解析できるページだけを取り込む。
 */
function discoverOfficialCardListUrls_() {
  const urls = [];
  const addUrl = function(url) {
    const normalized = normalizeOfficialCardListUrl_(url);
    if (normalized && urls.indexOf(normalized) === -1) {
      urls.push(normalized);
    }
  };

  // 公式サイトのトップページに掲載されたカードリストリンクを読む。
  try {
    const response = UrlFetchApp.fetch(ACG_AUTO_SYNC_HOME_URL_, {
      muteHttpExceptions: true,
      followRedirects: true
    });

    if (response.getResponseCode() >= 200 && response.getResponseCode() < 300) {
      const html = response.getContentText("UTF-8");
      const hrefRegex = /href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi;
      let match;

      while ((match = hrefRegex.exec(html)) !== null) {
        const href = String(match[1] || match[2] || match[3] || "").trim();
        if (/cardlist_[A-Za-z0-9_-]+\.html(?:[?#]|$)/i.test(href)) {
          addUrl(href);
        }
      }
    }
  } catch (error) {
    Logger.log("トップページからのリンク取得に失敗: " + error);
  }

  // 既知の公式リストを含め、トップページにリンクされていない場合にも備える。
  addUrl("https://acgtcg.com/cardlist_SD1.html");
  addUrl("https://acgtcg.com/cardlist_RYO.html");
  addUrl("https://acgtcg.com/cardlist_PR.html");

  for (let number = 1; number <= ACG_AUTO_SYNC_MAX_BP_PROBE_; number++) {
    addUrl("https://acgtcg.com/cardlist_BP" + number + ".html");
  }

  return urls;
}


/**
 * 公式サイトのカードリストURLだけを許可し、相対URLも絶対URLへ変換。
 */
function normalizeOfficialCardListUrl_(rawUrl) {
  let value = String(rawUrl || "").trim();
  if (!value || /^(#|mailto:|javascript:|tel:)/i.test(value)) return "";

  if (/^https?:\/\//i.test(value)) {
    if (!/^https?:\/\/(?:www\.)?acgtcg\.com\//i.test(value)) return "";
  } else if (value.indexOf("//") === 0) {
    value = "https:" + value;
  } else if (value.charAt(0) === "/") {
    value = "https://acgtcg.com" + value;
  } else {
    value = "https://acgtcg.com/" + value.replace(/^\.\/|^\//, "");
  }

  value = value.split("#")[0].split("?")[0];
  if (!/^https:\/\/acgtcg\.com\/cardlist_[A-Za-z0-9_-]+\.html$/i.test(value)) {
    return "";
  }
  return value;
}


/**
 * importBulkHtml の結果から対象IDを集め、実際に取得した公式ページURLを
 * Cards / Territories の source_url に保存する。
 */
function updateImportedSourceUrls_(items, sourceUrl) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;

  const cardIds = [];
  const territoryIds = [];

  (items || []).forEach(item => {
    const id = String(
      item.id ||
      item.card_id ||
      item.territory_id ||
      ""
    ).trim();

    if (!id) return;

    if (/^RYO-\d{3}$/i.test(id) || item.territory_id) {
      if (territoryIds.indexOf(id) === -1) territoryIds.push(id);
    } else {
      if (cardIds.indexOf(id) === -1) cardIds.push(id);
    }
  });

  updateSourceUrlColumn_(ss.getSheetByName("Cards"), "card_id", cardIds, sourceUrl);
  updateSourceUrlColumn_(ss.getSheetByName("Territories"), "territory_id", territoryIds, sourceUrl);
}


/**
 * 指定IDの行だけ source_url を更新。他の列には触れない。
 */
function updateSourceUrlColumn_(sheet, idHeader, ids, sourceUrl) {
  if (!sheet || !ids || !ids.length || sheet.getLastRow() < 2) return;

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(value => String(value || "").trim());
  const idIndex = headers.indexOf(idHeader);
  const sourceIndex = headers.indexOf("source_url");

  if (idIndex === -1 || sourceIndex === -1) {
    Logger.log(
      sheet.getName() + " に " + idHeader +
      " または source_url 列がないため、公式URL列は更新しませんでした。"
    );
    return;
  }

  const targetIds = {};
  ids.forEach(id => { targetIds[String(id).trim()] = true; });

  let changed = false;
  for (let i = 1; i < values.length; i++) {
    const id = String(values[i][idIndex] || "").trim();
    if (targetIds[id] && values[i][sourceIndex] !== sourceUrl) {
      values[i][sourceIndex] = sourceUrl;
      changed = true;
    }
  }

  if (changed) {
    sheet.getRange(
      1, sourceIndex + 1, values.length, 1
    ).setValues(values.map(row => [row[sourceIndex]]));
  }
}


/**
 * 実行結果をスプレッドシートに記録する。
 */
function writeMonthlyOfficialSyncLog_(summary) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("同期ログ用のスプレッドシートを取得できません。");

  const headers = [
    "開始日時",
    "終了日時",
    "状態",
    "検出したカードリスト候補数",
    "取り込んだカードリスト数",
    "解析したカード・領土数",
    "カード追加数",
    "カード更新数",
    "領土追加数",
    "領土更新数",
    "解析エラー数",
    "商品リンク同期",
    "商品カタログ検出数",
    "商品追加数",
    "商品更新数",
    "失敗・警告"
  ];

  let sheet = ss.getSheetByName(ACG_AUTO_SYNC_LOG_SHEET_);
  if (!sheet) {
    sheet = ss.insertSheet(ACG_AUTO_SYNC_LOG_SHEET_);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }

  const product = summary.productCatalog || {};
  const failures = []
    .concat(summary.errors || [])
    .concat(summary.cardPageFailures || []);

  if (Array.isArray(product.errors)) {
    failures.push.apply(failures, product.errors);
  }

  sheet.appendRow([
    summary.startedAt || "",
    summary.finishedAt || "",
    summary.status || "",
    Number(summary.cardListUrlsFound || 0),
    Number(summary.cardListPagesImported || 0),
    Number(summary.parsedCardsAndTerritories || 0),
    Number(summary.addedCards || 0),
    Number(summary.updatedCards || 0),
    Number(summary.addedTerritories || 0),
    Number(summary.updatedTerritories || 0),
    Number(summary.cardParseErrors || 0),
    summary.productLinkSync || "",
    Number(product.found || 0),
    Number(product.added || 0),
    Number(product.updated || 0),
    failures.join(" | ").slice(0, 45000)
  ]);
}
