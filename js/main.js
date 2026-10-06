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
