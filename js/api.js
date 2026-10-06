/*
  ========================================
  GAS API
  ========================================

  Google Apps Scriptから
  カードデータを取得するための処理です。
*/

const API_URL =
  "https://script.google.com/macros/s/AKfycbwvFRsrFEnoZOE2GAEtv6Ihf51tb61B8Uqk_VaolPgkcH0nHC8dqY3436h7Y5L8EoRd/exec";

/*
  ========================================
  GASからカードデータを取得
  ========================================
*/

function loadCards() {

  /*
    GASから返ってきたデータを受け取る
    関数を作ります。

    GAS側では、

    loadCardData({...});

    という形で返してもらいます。
  */

  window.loadCardData =
    function(data) {

      /*
        カード一覧を保存します。
      */

      appState.allCards =
        data.cards;

      appState.currentSearchResults =
        data.cards;

      /*
        検索条件の選択肢を作ります。
      */

      createFilterOptions();

      /*
        最初は全カードを表示します。
      */

      displayCards(
        appState.allCards
      );

    };


  /*
    JavaScriptファイルとして
    GASを読み込みます。

    これがJSONPを使った
    データ取得処理です。
  */

  const script =
    document.createElement(
      "script"
    );


  script.src =
    API_URL +
    "?prefix=loadCardData";


  document.body.appendChild(
    script
  );

}
