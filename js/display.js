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
 * 用語リンクは「アニマルカードゲーム@ウィキ」の用語集に実際に掲載されている語のみ。
 * リンク先は各用語の個別ページ。定義をここで再記述せず、更新された記事を直接参照する。
 */
const WIKI_GLOSSARY_URLS = {
  "○○域": "https://w.atwiki.jp/animalcardgame/pages/242.html",
  "ウェイク": "https://w.atwiki.jp/animalcardgame/pages/197.html",
  "裏向き除外": "https://w.atwiki.jp/animalcardgame/pages/526.html",
  "カウンター": "https://w.atwiki.jp/animalcardgame/pages/275.html",
  "狩りフェイズ": "https://w.atwiki.jp/animalcardgame/pages/110.html",
  "カードタイプ": "https://w.atwiki.jp/animalcardgame/pages/57.html",
  "キーワード能力": "https://w.atwiki.jp/animalcardgame/pages/56.html",
  "ゲーム": "https://w.atwiki.jp/animalcardgame/pages/104.html",
  "効果": "https://w.atwiki.jp/animalcardgame/pages/169.html",
  "攻撃": "https://w.atwiki.jp/animalcardgame/pages/119.html",
  "攻撃ステップ": "https://w.atwiki.jp/animalcardgame/pages/116.html",
  "行動待機": "https://w.atwiki.jp/animalcardgame/pages/183.html",
  "コスト": "https://w.atwiki.jp/animalcardgame/pages/194.html",
  "コントローラー": "https://w.atwiki.jp/animalcardgame/pages/203.html",
  "山岳領土": "https://w.atwiki.jp/animalcardgame/pages/204.html",
  "集団攻撃": "https://w.atwiki.jp/animalcardgame/pages/297.html",
  "種族": "https://w.atwiki.jp/animalcardgame/pages/201.html",
  "所有者": "https://w.atwiki.jp/animalcardgame/pages/202.html",
  "種別": "https://w.atwiki.jp/animalcardgame/pages/59.html",
  "種別のない領土": "https://w.atwiki.jp/animalcardgame/pages/195.html",
  "マッチ": "https://w.atwiki.jp/animalcardgame/pages/181.html",
  "準備フェイズ": "https://w.atwiki.jp/animalcardgame/pages/108.html",
  "除外": "https://w.atwiki.jp/animalcardgame/pages/208.html",
  "森林領土": "https://w.atwiki.jp/animalcardgame/pages/205.html",
  "水生領土": "https://w.atwiki.jp/animalcardgame/pages/206.html",
  "ステップ": "https://w.atwiki.jp/animalcardgame/pages/114.html",
  "戦闘準備ステップ": "https://w.atwiki.jp/animalcardgame/pages/115.html",
  "戦闘宣言": "https://w.atwiki.jp/animalcardgame/pages/239.html",
  "戦闘フェイズ": "https://w.atwiki.jp/animalcardgame/pages/113.html",
  "存在": "https://w.atwiki.jp/animalcardgame/pages/175.html",
  "存在カード": "https://w.atwiki.jp/animalcardgame/pages/175.html",
  "存在プレイ": "https://w.atwiki.jp/animalcardgame/pages/175.html",
  "ターン": "https://w.atwiki.jp/animalcardgame/pages/58.html",
  "起床フェイズ": "https://w.atwiki.jp/animalcardgame/pages/107.html",
  "日没フェイズ": "https://w.atwiki.jp/animalcardgame/pages/111.html",
  "夜警フェイズ": "https://w.atwiki.jp/animalcardgame/pages/112.html",
  "ターンプレイヤー": "https://w.atwiki.jp/animalcardgame/pages/210.html",
  "脱出カウンター": "https://w.atwiki.jp/animalcardgame/pages/96.html",
  "ダメージ判定": "https://w.atwiki.jp/animalcardgame/pages/121.html",
  "ダメージ判定ステップ": "https://w.atwiki.jp/animalcardgame/pages/118.html",
  "デッキ": "https://w.atwiki.jp/animalcardgame/pages/91.html",
  "手札": "https://w.atwiki.jp/animalcardgame/pages/209.html",
  "道具": "https://w.atwiki.jp/animalcardgame/pages/189.html",
  "動物": "https://w.atwiki.jp/animalcardgame/pages/191.html",
  "トークン": "https://w.atwiki.jp/animalcardgame/pages/268.html",
  "特技": "https://w.atwiki.jp/animalcardgame/pages/187.html",
  "能力": "https://w.atwiki.jp/animalcardgame/pages/105.html",
  "夜牢カウンター": "https://w.atwiki.jp/animalcardgame/pages/159.html",
  "縄張り": "https://w.atwiki.jp/animalcardgame/pages/190.html",
  "パイル": "https://w.atwiki.jp/animalcardgame/pages/199.html",
  "場面": "https://w.atwiki.jp/animalcardgame/pages/188.html",
  "場": "https://w.atwiki.jp/animalcardgame/pages/192.html",
  "非存在": "https://w.atwiki.jp/animalcardgame/pages/176.html",
  "非存在カード": "https://w.atwiki.jp/animalcardgame/pages/176.html",
  "非存在プレイ": "https://w.atwiki.jp/animalcardgame/pages/176.html",
  "プレイ": "https://w.atwiki.jp/animalcardgame/pages/140.html",
  "フェイズ": "https://w.atwiki.jp/animalcardgame/pages/106.html",
  "平野領土": "https://w.atwiki.jp/animalcardgame/pages/207.html",
  "妨害": "https://w.atwiki.jp/animalcardgame/pages/99.html",
  "防御": "https://w.atwiki.jp/animalcardgame/pages/120.html",
  "防御ステップ": "https://w.atwiki.jp/animalcardgame/pages/117.html",
  "補充フェイズ": "https://w.atwiki.jp/animalcardgame/pages/109.html",
  "墓地": "https://w.atwiki.jp/animalcardgame/pages/193.html",
  "ムーブ": "https://w.atwiki.jp/animalcardgame/pages/196.html",
  "優先権": "https://w.atwiki.jp/animalcardgame/pages/200.html",
  "予備デッキ": "https://w.atwiki.jp/animalcardgame/pages/92.html",
  "夜状態": "https://w.atwiki.jp/animalcardgame/pages/180.html",
  "夜領土": "https://w.atwiki.jp/animalcardgame/pages/182.html",
  "ライフ": "https://w.atwiki.jp/animalcardgame/pages/211.html",
  "領地": "https://w.atwiki.jp/animalcardgame/pages/100.html",
  "領土カード": "https://w.atwiki.jp/animalcardgame/pages/101.html",
  "領土条件": "https://w.atwiki.jp/animalcardgame/pages/98.html",
  "領土デッキ": "https://w.atwiki.jp/animalcardgame/pages/93.html",
  "ルール処理": "https://w.atwiki.jp/animalcardgame/pages/198.html",
  "ATK": "https://w.atwiki.jp/animalcardgame/pages/212.html",
  "BO1,BO3,ABO1": "https://w.atwiki.jp/animalcardgame/pages/511.html",
  "DEF": "https://w.atwiki.jp/animalcardgame/pages/213.html"
};

function applyRulesTooltips(element) {
  if (!element) return;
  const text = element.textContent || "";
  if (!text) return;
  const terms = Object.keys(WIKI_GLOSSARY_URLS).sort((a, b) => b.length - a.length);
  const pattern = new RegExp("(" + terms.join("|") + ")", "g");
  element.replaceChildren();
  let textCursor = 0;
  text.split(pattern).forEach(part => {
    const partIndex = text.indexOf(part, textCursor);
    textCursor = partIndex + part.length;
    const url = WIKI_GLOSSARY_URLS[part];
    if (!url) {
      element.append(document.createTextNode(part));
      return;
    }

    // 「場」は1文字なので「場合」「戦場」などの一部を用語と誤判定しない。
    if (part === "場") {
      const previous = text[partIndex - 1] || "";
      const next = text[partIndex + part.length] || "";
      const isKanji = character => /[一-龯々〆ヵヶ]/.test(character);
      if (isKanji(previous) || isKanji(next)) {
        element.append(document.createTextNode(part));
        return;
      }
    }

    const term = document.createElement("a");
    term.className = "rules-term";
    term.textContent = part;
    term.href = url;
    term.target = "_blank";
    term.rel = "noopener noreferrer";
    term.title = "アニマルカードゲーム@ウィキの「" + part + "」を開く";
    term.setAttribute("aria-label", part + "：用語集ページを小窓で開く");
    term.addEventListener("click", event => {
      event.stopPropagation();
      // Open the actual wiki article in a small window. If pop-ups are blocked,
      // the anchor's normal target=_blank behavior remains as a fallback.
      const popup = window.open(url, "animalCardGameWikiGlossary",
        "popup=yes,width=760,height=720,resizable=yes,scrollbars=yes");
      if (popup) event.preventDefault();
    });
    element.append(term);
  });
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
  item,
  options = {}
) {
  const addToDeckButton = document.getElementById("detail-add-to-deck-button");
  if (addToDeckButton) {
    addToDeckButton.hidden = !options.deckBuilder;
    addToDeckButton.textContent = item?.territory_id
      ? "この領地をデッキに追加"
      : "このカードをデッキに追加";
  }

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
    Condition（スプレッドシートの列）
  */
  document.getElementById(
    "detail-condition"
  ).textContent =
    getCardConditionText(item);


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

  ["detail-condition", "detail-effect", "detail-keywords", "detail-effects"].forEach(id => {
    applyRulesTooltips(document.getElementById(id));
  });


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
    ユーザータグ編集欄
  */
  window.renderCardUserTagEditor?.(item);

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
