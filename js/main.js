 /*
  アプリケーション状態
  */

const appState = {

  /*
    カードだけ
  */

  allCards: [],


  /*
    領地だけ
  */

  allTerritories: [],


  /*
    カード＋領地
  */

  allData: [],


  /*
    現在の検索結果
  */

  currentSearchResults: [],


  /*
    現在のカテゴリ

    all       = すべて
    card      = カード
    territory = 領地
  */

  currentCategory: "all",


  /*
    現在の表示方法
  */

  currentDisplayMode: "list",


  /*
    アイコン表示の列数
  */

  currentIconColumns: 5

};


/*
  DOMコンテンツロード時の初期化
  */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      ======================================
      検索ボタン
      ======================================
    */

    document.getElementById(
      "search-open-button"
    )?.addEventListener(
      "click",
      openSearchModal
    );


    document.getElementById(
      "search-close-button"
    )?.addEventListener(
      "click",
      closeSearchModal
    );


    document.getElementById(
      "modal-close-button"
    )?.addEventListener(
      "click",
      closeCardDetail
    );


    /*
      ======================================
      カテゴリ切り替え
      ======================================
    */

    document.getElementById(
      "category-all-button"
    )?.addEventListener(
      "click",
      () =>
        setCategory("all")
    );


    document.getElementById(
      "category-card-button"
    )?.addEventListener(
      "click",
      () =>
        setCategory("card")
    );


    document.getElementById(
      "category-territory-button"
    )?.addEventListener(
      "click",
      () =>
        setCategory("territory")
    );


    /*
      ======================================
      文字検索
      ======================================
    */

    document.getElementById(
      "search-box"
    )?.addEventListener(
      "input",
      searchCards
    );


    /*
      ======================================
      ATK
      ======================================
    */

    document.getElementById(
      "atk-condition"
    )?.addEventListener(
      "change",
      searchCards
    );


    document.getElementById(
      "atk-value"
    )?.addEventListener(
      "input",
      searchCards
    );


    /*
      ======================================
      DEF
      ======================================
    */

    document.getElementById(
      "def-condition"
    )?.addEventListener(
      "change",
      searchCards
    );


    document.getElementById(
      "def-value"
    )?.addEventListener(
      "input",
      searchCards
    );


    /*
      ======================================
      モーダル背景クリック
      ======================================
    */

    document.getElementById(
      "search-modal"
    )?.addEventListener(
      "click",
      event => {

        if (
          event.target.id !==
          "search-modal"
        ) {
          return;
        }

        closeSearchModal();

      }
    );


    document.getElementById(
      "card-modal"
    )?.addEventListener(
      "click",
      event => {

        if (
          event.target.id !==
          "card-modal"
        ) {
          return;
        }

        closeCardDetail();

      }
    );


    /*
      ======================================
      リスト／アイコン
      ======================================
    */

    document.getElementById(
      "list-mode-button"
    )?.addEventListener(
      "click",
      () =>
        setDisplayMode(
          "list"
        )
    );


    document.getElementById(
      "icon-mode-button"
    )?.addEventListener(
      "click",
      () =>
        setDisplayMode(
          "icon"
        )
    );


    /*
      ======================================
      アイコン列数
      ======================================
    */

    document.getElementById(
      "icon-3-button"
    )?.addEventListener(
      "click",
      () =>
        setIconColumns(3)
    );


    document.getElementById(
      "icon-5-button"
    )?.addEventListener(
      "click",
      () =>
        setIconColumns(5)
    );


    document.getElementById(
      "icon-7-button"
    )?.addEventListener(
      "click",
      () =>
        setIconColumns(7)
    );


    document.getElementById(
      "icon-9-button"
    )?.addEventListener(
      "click",
      () =>
        setIconColumns(9)
    );


    document.getElementById(
      "icon-10-button"
    )?.addEventListener(
      "click",
      () =>
        setIconColumns(10)
    );


    /*
      ======================================
      検索条件リセット
      ======================================
    */

    document.getElementById(
      "reset-button"
    )?.addEventListener(
      "click",
      () => {

        document.getElementById(
          "search-box"
        ).value = "";


        document.querySelectorAll(
          ".multi-select input[type='checkbox']"
        ).forEach(
          checkbox => {

            checkbox.checked =
              false;

          }
        );


        document.getElementById(
          "atk-condition"
        ).value = "";


        document.getElementById(
          "atk-value"
        ).value = "";


        document.getElementById(
          "def-condition"
        ).value = "";


        document.getElementById(
          "def-value"
        ).value = "";


        /*
          現在のカテゴリに合わせて
          初期データを表示します。
        */

        setCategory(
          appState.currentCategory
        );

      }
    );


    /*
      ======================================
      Escapeキー
      ======================================
    */

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key !== "Escape"
        ) {
          return;
        }


        const searchModal =
          document.getElementById(
            "search-modal"
          );


        const cardModal =
          document.getElementById(
            "card-modal"
          );


        if (
          searchModal?.style.display ===
          "block"
        ) {

          closeSearchModal();

          return;

        }


        if (
          cardModal?.style.display ===
          "block"
        ) {

          closeCardDetail();

        }

      }
    );


    /*
      ======================================
      カードデータを読み込む
      ======================================
    */

    loadCards();

  }
);


/*
  ======================================
  カテゴリ変更
  ======================================
*/

function setCategory(
  category
) {

  /*
    現在のカテゴリを保存
  */

  appState.currentCategory =
    category;


  /*
    カテゴリボタンの一覧
  */

  const buttons = [

    {
      id: "category-all-button",
      category: "all"
    },

    {
      id: "category-card-button",
      category: "card"
    },

    {
      id: "category-territory-button",
      category: "territory"
    }

  ];


  /*
    選択中のボタンだけ
    activeにします。
  */

  buttons.forEach(
    item => {

      const button =
        document.getElementById(
          item.id
        );


      if (!button) {
        return;
      }


      button.classList.toggle(
        "active",
        item.category === category
      );

    }
  );


  /*
    カテゴリに応じて
    使用するデータを決定します。
  */

  let data = [];


  if (
    category === "card"
  ) {

    data =
      appState.allCards || [];

  } else if (
    category === "territory"
  ) {

    data =
      appState.allTerritories || [];

  } else {

    data =
      appState.allData || [];

  }


  /*
    現在の検索結果を更新します。
  */

  appState.currentSearchResults =
    data;


  /*
    画面に表示します。
  */

  displayCards(
    data
  );

}
