/*
  アイコンの列数を適用
*/
function applyIconGrid() {
  const cardList =
    document.getElementById(
      "card-list"
    );

  if (
    !cardList ||
    !cardList.classList.contains(
      "icon-mode"
    )
  ) {
    return;
  }

  const columns =
    appState.currentIconColumns;

  cardList.style.gridTemplateColumns =
    `repeat(${columns}, minmax(0, 1fr))`;
}


/*
  カード・領地一覧を表示する
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
      "<p>該当するデータがありません。</p>";
    return;
  }


  /*
    リスト表示
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
      item => {

        /*
          領地かどうかを判定
        */
        const territory =
          Boolean(
            item.territory_id
          );

        /*
          表示する名前
        */
        const name =
          territory
            ? item.territory_name
            : item.card_name;

        /*
          表示するタイプ
        */
        const type =
          territory
            ? item.territory_type
            : item.card_type;

        /*
          ATK・DEFはカードだけ表示
        */
        const statsHtml =
          territory
            ? ""
            : `
              <p>
                ATK：
                ${item.atk}
                ／
                DEF：
                ${item.def}
              </p>
            `;

        const cardElement =
          document.createElement(
            "div"
          );

        cardElement.className =
          "card list-card";

        cardElement.innerHTML = `
          ${
            item.image_url
              ? `
                <img
                  src="${item.image_url}"
                  alt="${name}"
                  class="list-card-image"
                >
              `
              : ""
          }

          <div class="list-card-info">

            <h2>
              ${name}
            </h2>

            <p>
              読み：
              ${item.reading || ""}
            </p>

            <p>
              コスト：
              ${item.cost || ""}
            </p>

            <p>
              タイプ：
              ${type || ""}
            </p>

            <p>
              種属：
              ${item.species || ""}
            </p>

            ${statsHtml}

            <p>
              ${item.effect_text || ""}
            </p>

          </div>
        `;

        cardElement.addEventListener(
          "click",
          () =>
            showCardDetail(
              item
            )
        );

        cardList.appendChild(
          cardElement
        );

      }
    );

  } else {

    /*
      アイコン表示
    */
    cardList.className =
      "icon-mode";

    cards.forEach(
      item => {

        const territory =
          Boolean(
            item.territory_id
          );

        const name =
          territory
            ? item.territory_name
            : item.card_name;

        const cardElement =
          document.createElement(
            "div"
          );

        cardElement.className =
          "card icon-card";

        if (
          item.image_url
        ) {
          cardElement.innerHTML = `
            <img
              src="${item.image_url}"
              alt="${name}"
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
              item
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
  カード・領地の詳細を表示
*/
function showCardDetail(
  item
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


  /*
    領地かどうかを判定
  */
  const territory =
    Boolean(
      item.territory_id
    );


  /*
    名前
  */
  const name =
    territory
      ? item.territory_name
      : item.card_name;


  /*
    画像
  */
  if (
    item.image_url
  ) {
    image.src =
      item.image_url;

    image.alt =
      name || "";

    image.style.display =
      "block";
  } else {
    image.style.display =
      "none";
  }


  /*
    名前
  */
  document.getElementById(
    "detail-name"
  ).textContent =
    name || "";


  /*
    ID
  */
  document.getElementById(
    "detail-id"
  ).textContent =
    territory
      ? item.territory_id || ""
      : item.card_id || "";


  /*
    読み
  */
  document.getElementById(
    "detail-reading"
  ).textContent =
    item.reading || "";


  /*
    コスト
  */
  document.getElementById(
    "detail-cost"
  ).textContent =
    item.cost || "";


  /*
    タイプ
  */
  document.getElementById(
    "detail-type"
  ).textContent =
    territory
      ? item.territory_type || ""
      : item.card_type || "";


  /*
    種属
  */
  document.getElementById(
    "detail-species"
  ).textContent =
    item.species || "";


  /*
    ATK
  */
  document.getElementById(
    "detail-atk"
  ).textContent =
    territory
      ? ""
      : item.atk || "";


  /*
    DEF
  */
  document.getElementById(
    "detail-def"
  ).textContent =
    territory
      ? ""
      : item.def || "";


  /*
    効果
  */
  document.getElementById(
    "detail-effect"
  ).textContent =
    item.effect_text || "";


  /*
    公式キーワード
  */
  document.getElementById(
    "detail-keywords"
  ).textContent =
    item.official_keywords ||
    "なし";


  /*
    公式効果
  */
  document.getElementById(
    "detail-effects"
  ).textContent =
    item.official_effects ||
    "なし";


  /*
    ID欄のラベルを変更
  */
  const detailId =
    document.getElementById(
      "detail-id"
    );

  const detailIdRow =
    detailId?.closest(
      ".detail-row"
    );

  if (detailIdRow) {

    const label =
      detailIdRow.querySelector(
        ".detail-label"
      );

    if (label) {
      label.textContent =
        territory
          ? "領地ID："
          : "カードID：";
    }

  }


  /*
    タイプ欄のラベルを変更
  */
  const detailType =
    document.getElementById(
      "detail-type"
    );

  const detailTypeRow =
    detailType?.closest(
      ".detail-row"
    );

  if (detailTypeRow) {

    const label =
      detailTypeRow.querySelector(
        ".detail-label"
      );

    if (label) {
      label.textContent =
        territory
          ? "領地タイプ："
          : "カードタイプ：";
    }

  }


  /*
    ATK・DEF欄は領地では非表示
  */
  const detailAtk =
    document.getElementById(
      "detail-atk"
    );

  const detailDef =
    document.getElementById(
      "detail-def"
    );

  const detailAtkRow =
    detailAtk?.closest(
      ".detail-row"
    );

  const detailDefRow =
    detailDef?.closest(
      ".detail-row"
    );

  if (detailAtkRow) {
    detailAtkRow.style.display =
      territory
        ? "none"
        : "";
  }

  if (detailDefRow) {
    detailDefRow.style.display =
      territory
        ? "none"
        : "";
  }


  /*
    公式ページ
  */
  const source =
    document.getElementById(
      "detail-source"
    );

  if (
    item.source_url
  ) {
    source.href =
      item.source_url;

    source.style.display =
      "inline";
  } else {
    source.style.display =
      "none";
  }


  /*
    モーダルを表示
  */
  modal.style.display =
    "block";

  document.body.style.overflow =
    "hidden";
}


/*
  詳細モーダルを閉じる
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
  検索モーダルを開く
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
  検索モーダルを閉じる
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

  if (
    document.getElementById(
      "card-modal"
    )?.style.display !==
    "block"
  ) {
    document.body.style.overflow =
      "";
  }
}


/*
  表示方法を変更
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

  listButton?.classList.toggle(
    "active",
    mode === "list"
  );

  iconButton?.classList.toggle(
    "active",
    mode === "icon"
  );

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
  アイコンの列数を変更
*/
function setIconColumns(
  columns
) {
  appState.currentIconColumns =
    columns;

  const buttons = [
    {
      id: "icon-3-button",
      columns: 3
    },
    {
      id: "icon-5-button",
      columns: 5
    },
    {
      id: "icon-7-button",
      columns: 7
    },
    {
      id: "icon-9-button",
      columns: 9
    },
    {
      id: "icon-10-button",
      columns: 10
    }
  ];

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
        item.columns === columns
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
