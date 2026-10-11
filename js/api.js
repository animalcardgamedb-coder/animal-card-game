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
*/

function loadCards() {

  /*
    Google Apps Scriptから
    JSONP形式でデータを受け取ります。
  */

  window.loadCardData =
    function(data) {

      /*
        カードデータを保存
      */

      appState.allCards =
        data.cards || [];


      /*
        領地データを保存
      */

      appState.allTerritories =
        data.territories || [];


      /*
        初期状態では
        「すべて」を表示します。

        そのため、カードと領地を
        まとめたデータを作ります。
      */

      appState.allData = [
        ...appState.allCards,
        ...appState.allTerritories
      ];


      /*
        現在の検索結果も
        初期状態では全データです。
      */

      appState.currentSearchResults =
        appState.allData;


      /*
        検索フィルターを作成します。
      */

      createFilterOptions();


      /*
        初期表示
      */

      displayCards(
        appState.allData
      );

      // User-tag API is deployed separately with the connected Apps Script.
      window.loadUserTagData?.()
        .then(() => window.refreshUserTagFilter?.())
        .catch(() => { /* Keep ordinary card search available if the optional tag API is not installed yet. */ });

    };


  /*
    JSONP用のscript要素を作成します。
  */

  const script =
    document.createElement(
      "script"
    );


  /*
    Google Apps ScriptのURLに
    JSONP用のcallback名を付けます。
  */

  script.src =
    API_URL +
    "?prefix=loadCardData";


  /*
    ページにscriptを追加して
    データ取得を開始します。
  */

  document.body.appendChild(
    script
  );

}


/*
 * User-tag API adapter.
 * The connected Apps Script must include gas/user-tags-addon.gs and route
 * user-tag actions through handleUserTagAction_(e) in doGet(e).
 */
window.registeredUserTags = window.registeredUserTags || [];
window.userTagAssignments = window.userTagAssignments || {};

function requestUserTagApi(action, params = {}) {
  return new Promise((resolve, reject) => {
    const callbackName = "__animalUserTag_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const script = document.createElement("script");
    let finished = false;
    const cleanup = () => {
      if (finished) return;
      finished = true;
      delete window[callbackName];
      script.remove();
    };
    window[callbackName] = result => {
      cleanup();
      resolve(result || {});
    };
    script.onerror = () => {
      cleanup();
      reject(new Error("ユーザータグAPIに接続できません。GASの変更を保存・デプロイしてください。"));
    };
    const url = new URL(API_URL);
    url.searchParams.set("action", action);
    url.searchParams.set("prefix", callbackName);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value ?? "")));
    script.src = url.toString();
    document.body.appendChild(script);
    window.setTimeout(() => {
      if (finished) return;
      cleanup();
      reject(new Error("ユーザータグAPIの応答がありません。GAS側への追加と再デプロイを確認してください。"));
    }, 15000);
  });
}

function requireUserTagApiSuccess(result) {
  if (!result?.ok) {
    throw new Error(result?.error || "GAS側のユーザータグ機能がまだ有効ではありません。gas/user-tags-addon.gsを既存のGASプロジェクトに追加して再デプロイしてください。");
  }
  return result;
}

window.loadUserTagData = async function() {
  const result = requireUserTagApiSuccess(await requestUserTagApi("listUserTags"));
  window.registeredUserTags = Array.isArray(result.tags) ? result.tags : [];
  window.userTagAssignments = result.assignments && typeof result.assignments === "object" ? result.assignments : {};
  return result;
};

window.addUserTag = async function(value) {
  const tag = String(value || "").trim().slice(0, 24);
  if (!tag) throw new Error("タグ名を入力してください。");
  return requireUserTagApiSuccess(await requestUserTagApi("addUserTag", { tag }));
};

window.deleteUserTag = async function(value) {
  const tag = String(value || "").trim().slice(0, 24);
  if (!tag) throw new Error("削除するタグ名を確認できません。");
  return requireUserTagApiSuccess(await requestUserTagApi("deleteUserTag", { tag }));
};

window.setCardUserTags = async function(item, tags) {
  const isTerritory = Boolean(item?.territory_id);
  const cardId = String(isTerritory ? item.territory_id : item?.card_id || "").trim();
  if (!cardId) throw new Error("カードIDを取得できませんでした。");
  const tagList = Array.from(new Set((Array.isArray(tags) ? tags : []).map(tag => String(tag).trim()).filter(Boolean))).slice(0, 50);
  const result = requireUserTagApiSuccess(await requestUserTagApi("setCardTags", {
    cardType: isTerritory ? "territory" : "card",
    cardId,
    cardName: isTerritory ? item.territory_name || "" : item.card_name || "",
    tags: JSON.stringify(tagList)
  }));
  return result;
};
