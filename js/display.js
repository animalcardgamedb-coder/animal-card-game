/*
  ========================================
  アイコンの列数を計算
  ========================================

  PCとスマートフォンで、
  アイコンの列数が違います。
*/

function calculateIconColumns() {

  const width =
    window.innerWidth;

  const currentSize =
    appState.currentIconSize;

  /*
    ======================================
    スマートフォン（600px以下）
    ======================================
  */

  if (width <= 600) {

    if (currentSize === "small") {
      return 3;
    }

    if (currentSize === "large") {
      return 2;
    }

    return 3;

  }

  /*
    ======================================
    タブレット（600px～900px）
    ======================================
  */

  if (width <= 900) {

    if (currentSize === "small") {
      return 4;
    }

    if (currentSize === "large") {
      return 3;
    }

    return 4;

  }

  /*
    ======================================
    PC（900px以上）
    ======================================
  */

  if (currentSize === "small") {
    return 7;
  }

  if (currentSize === "large") {
    return 4;
  }

  return 5;

}


/*
  ========================================
  アイコングリッドを適用
  ========================================

  アイコン表示で、
  列数を決めます。
*/

function applyIconGrid() {

  const cardList =
    document.getElementById(
      "card-list"
    );

  /*
    現在アイコン表示でなければ、
    この処理は必要ありません。
  */

  if (
    !cardList ||
    !cardList.classList.contains(
      "icon-mode"
    )
  ) {
    return;
  }

  const columns =
    calculateIconColumns();

  cardList.style.gridTemplateColumns =
    `repeat(${columns}, minmax(0, 1fr))`;

}


/*
  ========================================
  カード一覧を表示する
  ========================================

  検索結果を画面に表示します。
*/

function displayCards(
  cards
) {

  const cardList =
    document.getElementById(
      "card-list"
    );

  const resultCount =
    document.getElementById(
      "result-count"
    );

  if (
    !cardList ||
    !resultCount
  ) {
    return;
  }

  cardList.innerHTML = "";

  resultCount.textContent =
    `検索結果：${cards.length}件`;

  if (cards.length === 0) {

    cardList.innerHTML =
      "<p>該当するカードがありません。</p>";

    return;

  }


  /*
    ======================================
    リスト表示
    ======================================
  */

  if (
    appState.currentDisplayMode ===
    "list"
  ) {

    cardList.className =
      "list-mode";

    cardList.style.gridTemplateColumns =
      "";

    cards.forEach(
      card => {

        const cardElement =
          document.createElement(
            "div"
          );

        cardElement.className =
          "card list-card";

        cardElement.innerHTML = `

          ${
            card.image_url
              ? `
                <img
                  src="${card.image_url}"
                  alt="${card.card_name}"
                  class="list-card-image"
                >
              `
              : ""
          }

          <div class="list-card-info">

            <h2>
              ${card.card_name}
            </h2>

            <p>
              読み：
              ${card.reading}
            </p>

            <p>
              コスト：
              ${card.cost}
            </p>

            <p>
              タイプ：
              ${card.card_type}
            </p>

            <p>
              種属：
              ${card.species}
            </p>

            <p>
              ATK：
              ${card.atk}
              ／
              DEF：
              ${card.def}
            </p>

            <p>
              ${card.effect_text}
            </p>

          </div>

        `;

        cardElement.addEventListener(
          "click",
          () =>
            showCardDetail(
              card
            )
        );

        cardList.appendChild(
          cardElement
        );

      }
    );

  } else {

    /*
      ====================================
      アイコン表示
      ====================================
    */

    cardList.className =
      "icon-mode";

    cards.forEach(
      card => {

        const cardElement =
          document.createElement(
            "div"
          );

        cardElement.className =
          "card icon-card";

        if (
          card.image_url
        ) {

          cardElement.innerHTML = `

            <img
              src="${card.image_url}"
              alt="${card.card_name}"
              class="icon-card-image"
            >

          `;

        } else {

          cardElement.innerHTML =
            "<div>画像なし</div>";

        }

        cardElement.addEventListener(
          "click",
          () =>
            showCardDetail(
              card
            )
        );

        cardList.appendChild(
          cardElement
        );

      }
    );

    applyIconGrid();

  }

}


/*
  ========================================
  カード詳細を表示
  ========================================
*/

function showCardDetail(
  card
) {

  const modal =
    document.getElementById(
      "card-modal"
    );

  const image =
    document.getElementById(
      "detail-image"
    );

  if (
    !modal ||
    !image
  ) {
    return;
  }

  if (
    card.image_url
  ) {

    image.src =
      card.image_url;

    image.alt =
      card.card_name;

    image.style.display =
      "block";

  } else {

    image.style.display =
      "none";

  }

  document.getElementById(
    "detail-name"
  ).textContent =
    card.card_name || "";

  document.getElementById(
    "detail-id"
  ).textContent =
    card.card_id || "";

  document.getElementById(
    "detail-reading"
  ).textContent =
    card.reading || "";

  document.getElementById(
    "detail-cost"
  ).textContent =
    card.cost || "";

  document.getElementById(
    "detail-type"
  ).textContent =
    card.card_type || "";

  document.getElementById(
    "detail-species"
  ).textContent =
    card.species || "";

  document.getElementById(
    "detail-atk"
  ).textContent =
    card.atk || "";

  document.getElementById(
    "detail-def"
  ).textContent =
    card.def || "";

  document.getElementById(
    "detail-effect"
  ).textContent =
    card.effect_text || "";

  document.getElementById(
    "detail-keywords"
  ).textContent =
    card.official_keywords ||
    "なし";

  document.getElementById(
    "detail-effects"
  ).textContent =
    card.official_effects ||
    "なし";

  const source =
    document.getElementById(
      "detail-source"
    );

  if (
    card.source_url
  ) {

    source.href =
      card.source_url;

    source.style.display =
      "inline";

  } else {

    source.style.display =
      "none";

  }

  modal.style.display =
    "block";

  document.body.style.overflow =
    "hidden";

}


/*
  ========================================
  カード詳細を閉じる
  ========================================
*/

function closeCardDetail() {

  const modal =
    document.getElementById(
      "card-modal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "none";

  document.body.style.overflow =
    "";

}


/*
  ========================================
  検索モーダルを開く
  ========================================
*/

function openSearchModal() {

  const modal =
    document.getElementById(
      "search-modal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "block";

  document.body.style.overflow =
    "hidden";

}


/*
  ========================================
  検索モーダルを閉じる
  ========================================
*/

function closeSearchModal() {

  const modal =
    document.getElementById(
      "search-modal"
    );

  if (!modal) {
    return;
  }

  modal.style.display =
    "none";

  /*
    カード詳細が開いていなければ、
    スクロールを復帰させます。
  */

  if (
    document.getElementById(
      "card-modal"
    )?.style.display !== "block"
  ) {

    document.body.style.overflow =
      "";

  }

}


/*
  ========================================
  表示方法を変更
  ========================================
*/

function setDisplayMode(
  mode
) {

  appState.currentDisplayMode =
    mode;

  const listButton =
    document.getElementById(
      "list-mode-button"
    );

  const iconButton =
    document.getElementById(
      "icon-mode-button"
    );

  const sizeControls =
    document.getElementById(
      "icon-size-controls"
    );

  /*
    ボタンの「active」状態を切り替え。
  */

  listButton?.classList.toggle(
    "active",
    mode === "list"
  );

  iconButton?.classList.toggle(
    "active",
    mode === "icon"
  );

  /*
    サイズ選択を表示・非表示。
  */

  if (sizeControls) {

    sizeControls.style.display =
      mode === "icon"
        ? "flex"
        : "none";

  }

  displayCards(
    appState.currentSearchResults ||
    appState.allCards ||
    []
  );

}


/*
  ========================================
  アイコンサイズを変更
  ========================================
*/

function setIconSize(
  size
) {

  appState.currentIconSize =
    size;

  const buttons = [
    document.getElementById(
      "icon-small-button"
    ),
    document.getElementById(
      "icon-medium-button"
    ),
    document.getElementById(
      "icon-large-button"
    )
  ];

  buttons.forEach(
    button => {

      if (!button) {
        return;
      }

      const buttonSize =
        button.id
          .replace("icon-", "")
          .replace("-button", "");

      button.classList.toggle(
        "active",
        buttonSize === size
      );

    }
  );

  if (
    appState.currentDisplayMode ===
    "icon"
  ) {

    applyIconGrid();

  }

}
