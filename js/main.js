/*
  ======================================
  アプリケーション状態
  ======================================
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

// Allow the separate deck-building screen to reuse the existing search results.
window.appState = appState;


/*
  ======================================
  DOMコンテンツロード時の初期化
  ======================================
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
      一括データ登録
      ======================================
    */

    document.getElementById(
      "bulk-import-open-button"
    )?.addEventListener(
      "click",
      openBulkImportModal
    );


    document.getElementById(
      "bulk-import-close-button"
    )?.addEventListener(
      "click",
      closeBulkImportModal
    );


    document.getElementById(
      "bulk-import-button"
    )?.addEventListener(
      "click",
      bulkImportSelectedFile
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
      検索モーダル背景クリック
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


    /*
      ======================================
      カード詳細モーダル背景クリック
      ======================================
    */

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
      一括登録モーダル背景クリック
      ======================================
    */

    document.getElementById(
      "bulk-import-modal"
    )?.addEventListener(
      "click",
      event => {

        if (
          event.target.id !==
          "bulk-import-modal"
        ) {
          return;
        }

        closeBulkImportModal();

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
          検索をやり直します。
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


        const bulkImportModal =
          document.getElementById(
            "bulk-import-modal"
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

          return;

        }


        if (
          bulkImportModal?.style.display ===
          "block"
        ) {

          closeBulkImportModal();

        }

      }
    );


    /*
      ======================================
      カード・領地データを読み込む
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
    現在の検索条件を維持したまま
    カテゴリに応じて再検索します。
  */

  searchCards();

}


/*
  ======================================
  一括登録モーダルを開く
  ======================================
*/

function openBulkImportModal() {

  const modal =
    document.getElementById(
      "bulk-import-modal"
    );

  if (!modal) {
    return;
  }


  modal.style.display =
    "block";


  document.body.style.overflow =
    "hidden";


  /*
    前回の結果を消す
  */

  clearBulkImportResult();

}


/*
  ======================================
  一括登録モーダルを閉じる
  ======================================
*/

function closeBulkImportModal() {

  const modal =
    document.getElementById(
      "bulk-import-modal"
    );

  if (!modal) {
    return;
  }


  modal.style.display =
    "none";


  document.body.style.overflow =
    "";


  const button =
    document.getElementById(
      "bulk-import-button"
    );


  if (button) {

    button.disabled =
      false;

  }

}


/*
  ======================================
  一括登録結果を消す
  ======================================
*/

function clearBulkImportResult() {

  const status =
    document.getElementById(
      "bulk-import-status"
    );


  const result =
    document.getElementById(
      "bulk-import-result"
    );


  const summary =
    document.getElementById(
      "bulk-import-summary"
    );


  const errors =
    document.getElementById(
      "bulk-import-errors"
    );


  const warnings =
    document.getElementById(
      "bulk-import-warnings"
    );


  if (status) {
    status.textContent =
      "";
  }


  if (summary) {
    summary.textContent =
      "";
  }


  if (errors) {
    errors.textContent =
      "";
  }


  if (warnings) {
    warnings.textContent =
      "";
  }


  if (result) {
    result.style.display =
      "none";
  }

}


/*
  ======================================
  選択したHTMLファイルを一括登録
  ======================================
*/

async function bulkImportSelectedFile() {

  const fileInput =
    document.getElementById(
      "bulk-import-file"
    );


  const button =
    document.getElementById(
      "bulk-import-button"
    );


  const status =
    document.getElementById(
      "bulk-import-status"
    );


  const result =
    document.getElementById(
      "bulk-import-result"
    );


  if (!fileInput) {
    return;
  }


  if (
    !fileInput.files ||
    fileInput.files.length === 0
  ) {

    if (status) {

      status.textContent =
        "HTMLファイルを選択してください。";

    }

    return;

  }


  const file =
    fileInput.files[0];


  /*
    HTML / HTM / TXT以外を拒否
  */

  const fileName =
    String(
      file.name || ""
    ).toLowerCase();


  const isSupported =
    fileName.endsWith(".html") ||
    fileName.endsWith(".htm") ||
    fileName.endsWith(".txt");


  if (!isSupported) {

    if (status) {

      status.textContent =
        "HTMLファイルを選択してください。";

    }

    return;

  }


  try {

    /*
      ======================================
      登録開始
      ======================================
    */

    if (button) {

      button.disabled =
        true;

    }


    if (status) {

      status.textContent =
        "HTMLファイルを読み込んでいます……";

    }


    if (result) {

      result.style.display =
        "none";

    }


    /*
      ======================================
      ファイル内容を取得
      ======================================
    */

    const html =
      await file.text();


    if (!html.trim()) {

      throw new Error(
        "HTMLファイルの内容が空です。"
      );

    }


    /*
      ======================================
      GASへ送信
      ======================================

      text/plain にすることで、
      application/json による
      CORS preflightを避けます。
    */

    if (status) {

      status.textContent =
        "GASへデータを送信しています……";

    }


    const response =
      await fetch(
        API_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },

          body:
            JSON.stringify({
              action:
                "bulkImport",

              html:
                html
            })
        }
      );


    if (!response.ok) {

      throw new Error(
        "GASへの送信に失敗しました。HTTP " +
        response.status
      );

    }


    /*
      ======================================
      GASから結果を取得
      ======================================
    */

    if (status) {

      status.textContent =
        "登録結果を確認しています……";

    }


    const data =
      await response.json();


    if (!data || data.success !== true) {

      throw new Error(
        data?.error ||
        "GAS側で一括登録に失敗しました。"
      );

    }


    /*
      ======================================
      結果表示
      ======================================
    */

    displayBulkImportResult(
      data
    );


    /*
      ======================================
      データを再読み込み
      ======================================

      GAS側への登録が完了したので、
      最新データを取得します。
    */

    if (status) {

      status.textContent =
        "登録完了。データを再読み込みしています……";

    }


    loadCards();


    /*
      loadCards() はJSONPで
      非同期読み込みするため、
      少し待ってから現在の検索条件を
      再適用します。
    */

    window.setTimeout(
      () => {

        searchCards();

      },
      1000
    );


    if (status) {

      status.textContent =
        "登録が完了しました。";

    }

  } catch (error) {

    console.error(
      "一括登録エラー:",
      error
    );


    if (status) {

      status.textContent =
        "登録に失敗しました。";

    }


    if (result) {

      result.style.display =
        "block";

    }


    const summary =
      document.getElementById(
        "bulk-import-summary"
      );


    if (summary) {

      summary.textContent =
        "エラー：" +
        String(error.message || error);

    }

  } finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


/*
  ======================================
  一括登録結果を表示
  ======================================
*/

function displayBulkImportResult(
  data
) {

  const result =
    document.getElementById(
      "bulk-import-result"
    );


  const summary =
    document.getElementById(
      "bulk-import-summary"
    );


  const errors =
    document.getElementById(
      "bulk-import-errors"
    );


  const warnings =
    document.getElementById(
      "bulk-import-warnings"
    );


  if (!result) {
    return;
  }


  /*
    ======================================
    基本結果
    ======================================
  */

  if (summary) {

    summary.textContent =
      [
        "解析件数：" +
          (data.parsed || 0),

        "カード：" +
          (data.cards || 0),

        "領地：" +
          (data.territories || 0),

        "",

        "カード新規追加：" +
          (data.addedCards || 0),

        "カード更新：" +
          (data.updatedCards || 0),

        "領地新規追加：" +
          (data.addedTerritories || 0),

        "領地更新：" +
          (data.updatedTerritories || 0)

      ].join("\n");

  }


  /*
    ======================================
    解析エラー
    ======================================
  */

  if (errors) {

    errors.textContent =
      "";


    const parseErrors =
      Array.isArray(
        data.parseErrors
      )
        ? data.parseErrors
        : [];


    if (parseErrors.length > 0) {

      const title =
        document.createElement(
          "div"
        );


      title.textContent =
        "解析エラー：" +
        parseErrors.length +
        "件";


      errors.appendChild(
        title
      );


      const list =
        document.createElement(
          "ul"
        );


      parseErrors.forEach(
        errorText => {

          const item =
            document.createElement(
              "li"
            );


          item.textContent =
            String(errorText);


          list.appendChild(
            item
          );

        }
      );


      errors.appendChild(
        list
      );

    } else {

      errors.textContent =
        "解析エラー：0件";

    }

  }


  /*
    ======================================
    未登録キーワード・効果
    ======================================
  */

  if (warnings) {

    warnings.textContent =
      "";


    const keywords =
      Array.isArray(
        data.unregisteredKeywords
      )
        ? data.unregisteredKeywords
        : [];


    const effects =
      Array.isArray(
        data.unregisteredEffects
      )
        ? data.unregisteredEffects
        : [];


    if (
      keywords.length === 0 &&
      effects.length === 0
    ) {

      warnings.textContent =
        "未登録キーワード：なし\n" +
        "未登録効果分類：なし";

    } else {

      const title =
        document.createElement(
          "div"
        );


      title.textContent =
        "未登録項目があります。";


      warnings.appendChild(
        title
      );


      if (keywords.length > 0) {

        const keywordText =
          document.createElement(
            "div"
          );


        keywordText.textContent =
          "キーワード：" +
          keywords.join("、");


        warnings.appendChild(
          keywordText
        );

      }


      if (effects.length > 0) {

        const effectText =
          document.createElement(
            "div"
          );


        effectText.textContent =
          "効果分類：" +
          effects.join("、");


        warnings.appendChild(
          effectText
        );

      }

    }

  }


  result.style.display =
    "block";

}


/*
  ======================================
  一括登録モーダルを開いたときの
  ファイル選択状態を監視
  ======================================
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const fileInput =
      document.getElementById(
        "bulk-import-file"
      );


    fileInput?.addEventListener(
      "change",
      () => {

        const status =
          document.getElementById(
            "bulk-import-status"
          );


        const result =
          document.getElementById(
            "bulk-import-result"
          );


        if (result) {

          result.style.display =
            "none";

        }


        if (
          status &&
          fileInput.files &&
          fileInput.files.length > 0
        ) {

          status.textContent =
            "選択中：" +
            fileInput.files[0].name;

        }

      }
    );

  }
);
