/*
  ========================================
  アプリケーション状態
  ========================================
*/

const appState = {

  allCards: [],

  currentSearchResults: [],

  currentDisplayMode: "list",

  currentIconSize: "medium"

};


/*
  ========================================
  DOMコンテンツロード時の初期化
  ========================================
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /*
      ======================================
      各ボタンのイベントリスナー
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
      文字検索の入力イベント
      ======================================

      入力時に即座に検索を実行します。
    */

    document.getElementById(
      "search-box"
    )?.addEventListener(
      "input",
      searchCards
    );


    /*
      ======================================
      ATK フィルターのイベント
      ======================================

      条件選択時と数値入力時に検索を実行します。
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
      DEF フィルターのイベント
      ======================================

      条件選択時と数値入力時に検索を実行します。
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
      モーダル背景クリックで閉じる
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
      表示方法のボタン
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
      アイコンサイズのボタン
      ======================================
    */

    document.getElementById(
      "icon-small-button"
    )?.addEventListener(
      "click",
      () =>
        setIconSize(
          "small"
        )
    );

    document.getElementById(
      "icon-medium-button"
    )?.addEventListener(
      "click",
      () =>
        setIconSize(
          "medium"
        )
    );

    document.getElementById(
      "icon-large-button"
    )?.addEventListener(
      "click",
      () =>
        setIconSize(
          "large"
        )
    );


    /*
      ======================================
      検索条件のリセット
      ======================================
    */

    document.getElementById(
      "reset-button"
    )?.addEventListener(
      "click",
      () => {

        document.getElementById(
          "search-box"
        ).value =
          "";

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
        ).value =
          "";

        document.getElementById(
          "atk-value"
        ).value =
          "";

        document.getElementById(
          "def-condition"
        ).value =
          "";

        document.getElementById(
          "def-value"
        ).value =
          "";

        displayCards(
          appState.allCards
        );

      }
    );


    /*
      ======================================
      Escapeキーでモーダルを閉じる
      ======================================

      検索モーダルが開いていれば検索モーダルを閉じる。
      そうでなければカード詳細が開いていれば
      カード詳細を閉じる。

      という動きです。
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
      ウィンドウサイズ変更時のアイコン列数調整
      ======================================

      スマホを横向きにしたり、
      PCのブラウザ幅を変更した場合に
      アイコンの列数を計算し直します。
    */

    window.addEventListener(
      "resize",
      () => {

        applyIconGrid();

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
