/*
  Google Apps Script のAPI URL
*/

const API_URL =
  "https://script.google.com/macros/s/AKfycbwvFRsrFEnoZOE2GAEtv6Ihf51tb61B8Uqk_VaolPgkcH0nHC8dqY3436h7Y5L8EoRd/exec";


/*
  スプレッドシートのCondition/条件列をまとめて取り出す
*/
function getCardConditionText(item) {
  if (!item || typeof item !== "object") return "";

  return Object.entries(item)
    .filter(([key]) => /condition|条件|コンディション/i.test(key))
    .map(([, value]) => {
      if (Array.isArray(value)) return value.join("、");
      if (value && typeof value === "object") return JSON.stringify(value);
      return String(value ?? "").trim();
    })
    .filter(Boolean)
    .join("、");
}


/*
  カード・領地データを読み込む
  通常はブラウザー内の保存データを利用し、月次同期後または手動更新時にGASから再取得します。
*/
const CARD_DATA_CACHE_KEY = "acgCardDataCache:v2";
const CARD_DATA_REQUEST_TIMEOUT_MS = 30000;
let activeCardDataRequest = null;

function readCardDataCache_() {
  try {
    const raw = localStorage.getItem(CARD_DATA_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const data = cache && cache.data;
    if (!cache || !Number.isFinite(cache.savedAt) ||
        !data || !Array.isArray(data.cards) || !Array.isArray(data.territories)) {
      return null;
    }
    return cache;
  } catch (_) {
    return null;
  }
}

function writeCardDataCache_(data) {
  try {
    localStorage.setItem(CARD_DATA_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      data
    }));
  } catch (_) {
    // 容量制限・プライベートブラウズ等で保存できなくても、サイトの表示は続行します。
  }
}

/*
  GASの定期同期は毎月第4金曜日の早朝。
  4〜5時台の処理が終わる時間を考慮し、6:30（日本時間）以降に更新対象とします。
*/
function latestScheduledCardSyncAt_() {
  const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const nowJst = new Date(Date.now() + JST_OFFSET_MS);
  let year = nowJst.getUTCFullYear();
  let month = nowJst.getUTCMonth();

  function fourthFridayUtcMs_(y, m) {
    const firstWeekday = new Date(Date.UTC(y, m, 1)).getUTCDay();
    const day = 1 + ((5 - firstWeekday + 7) % 7) + 21;
    // 06:30 JSTをUTCに変換
    return Date.UTC(y, m, day, 6, 30) - JST_OFFSET_MS;
  }

  let scheduledAt = fourthFridayUtcMs_(year, month);
  if (Date.now() < scheduledAt) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
    scheduledAt = fourthFridayUtcMs_(year, month);
  }
  return scheduledAt;
}

function applyCardData_(data) {
  appState.allCards = data.cards || [];
  appState.allTerritories = data.territories || [];
  appState.allData = [...appState.allCards, ...appState.allTerritories];
  appState.userTags = Array.isArray(data.userTags) ? data.userTags : [];
  appState.cardUserTags = Array.isArray(data.cardUserTags) ? data.cardUserTags : [];
  appState.productLinks = Array.isArray(data.productLinks) ? data.productLinks : [];
  appState.affiliateLinks = Array.isArray(data.affiliateLinks) ? data.affiliateLinks : [];
  appState.packLinks = Array.isArray(data.packLinks) ? data.packLinks : [];
  window.applyUserTagsToData?.();
  appState.currentSearchResults = appState.allData;
  createFilterOptions();
  window.renderUserTagFilter?.();
  displayCards(appState.allData);
}

/*
  ユーザータグは随時変更されるため、タグ操作の成功時にローカル保存分も更新します。
*/
window.updateCachedUserTagData = function(userTags, cardUserTags) {
  const cache = readCardDataCache_();
  if (!cache) return;
  if (Array.isArray(userTags)) cache.data.userTags = userTags;
  if (Array.isArray(cardUserTags)) cache.data.cardUserTags = cardUserTags;
  try {
    localStorage.setItem(CARD_DATA_CACHE_KEY, JSON.stringify(cache));
  } catch (_) {}
};

function loadCards(forceRefresh = false, onComplete) {
  const cache = readCardDataCache_();
  const shouldRefreshForSchedule = !cache || cache.savedAt < latestScheduledCardSyncAt_();

  if (cache && !forceRefresh) {
    applyCardData_(cache.data);
    if (!shouldRefreshForSchedule) {
      if (typeof onComplete === "function") onComplete({ success: true, cached: true });
      return;
    }
  }

  if (activeCardDataRequest) {
    if (typeof onComplete === "function") activeCardDataRequest.callbacks.push(onComplete);
    return;
  }

  const script = document.createElement("script");
  const request = { script, callbacks: [], timer: null, finished: false };
  if (typeof onComplete === "function") request.callbacks.push(onComplete);
  activeCardDataRequest = request;

  function finish(success, result = {}) {
    if (request.finished) return;
    request.finished = true;
    clearTimeout(request.timer);
    script.onerror = null;
    script.remove();
    if (activeCardDataRequest === request) activeCardDataRequest = null;
    request.callbacks.forEach(callback => {
      try { callback({ success, ...result }); } catch (_) {}
    });
  }

  window.loadCardData = function(data) {
    if (!data || !Array.isArray(data.cards) || !Array.isArray(data.territories)) {
      finish(false, { error: "取得したデータの形式が正しくありません。" });
      return;
    }
    writeCardDataCache_(data);
    applyCardData_(data);
    finish(true, { cached: false });
  };

  script.onerror = function() {
    finish(false, { error: "GASとの通信に失敗しました。" });
  };
  request.timer = setTimeout(() => {
    finish(false, { error: "データ取得がタイムアウトしました。" });
  }, CARD_DATA_REQUEST_TIMEOUT_MS);

  const separator = API_URL.includes("?") ? "&" : "?";
  script.src = API_URL + separator + "prefix=loadCardData&_=" + Date.now();
  document.body.appendChild(script);
}

window.loadCards = loadCards;
