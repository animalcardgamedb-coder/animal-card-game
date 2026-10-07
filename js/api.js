/*
  Google Apps Script のAPI URL
*/

const API_URL =
  "https://script.google.com/macros/s/AKfycbwvFRsrFEnoZOE2GAEtv6Ihf51tb61B8Uqk_VaolPgkcH0nHC8dqY3436h7Y5L8EoRd/exec";


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
