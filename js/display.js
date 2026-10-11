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
 * Card-text glossary based on the official ACG Comprehensive Rules v6.0
 * (2026-07-23). Definitions are concise summaries, not substitutes for the full rules.
 */
const RULE_GLOSSARY = {
  "《平野》": "カードをプレイする時、このカード／トークンを平野条件の1つとして数えられます（総合ルール1602-1）。",
  "《山岳》": "カードをプレイする時、このカード／トークンを山岳条件の1つとして数えられます（総合ルール1602-2）。",
  "《水生》": "カードをプレイする時、このカード／トークンを水生条件の1つとして数えられます（総合ルール1602-3）。",
  "《森林》": "カードをプレイする時、このカード／トークンを森林条件の1つとして数えられます（総合ルール1602-4）。",
  "《夜》": "カードをプレイする時、このカード／トークンを夜条件の1つとして数えられます（総合ルール1602-5）。",
  "《敏捷》": "あなたが優先権を持っているなら、このカードをいつでもプレイできる能力です（総合ルール1603）。",
  "《唯一》": "同名の存在・領土が指定領域に複数存在する場合などに、ルール処理で整理する能力です。詳細は総合ルール1604を参照してください。",
  "《装備（対象）》": "指定された対象を装備するキーワード能力です。対象や装備の条件は総合ルール1605を参照してください。",
  "《鉄壁》": "指定されたタイプ・種属などの条件に関係するキーワード能力です。詳細な適用条件は総合ルール1606を参照してください。",
  "《突破》": "攻撃動物が1点以上の戦闘ダメージを与え、その量が防御動物の許容ダメージ量を超えた場合、超過分に等しい戦闘ダメージを相手に与えます（総合ルール1607）。",
  "領土デッキ": "領土カードのみで構築するデッキです。公式ルールでは10枚ちょうどで、同名カードは原則最大4枚、種属「基礎」は例外です（総合ルール503）。",
  "基礎デッキ": "動物・縄張り・道具・場面・特技カードで構築するデッキです。公式ルールでは40枚以上で、上限はありません（総合ルール502）。",
  "予備デッキ": "原則としてゲーム中には使用せず、デッキ調整に使用するカードの束です（総合ルール504）。",
  "基礎": "種属が「基礎」の領土カードは、領土デッキと予備デッキに同名カードを4枚より多く入れられる例外です（総合ルール503.3a）。",
  "戦闘ダメージ": "戦闘の処理で発生するダメージです。効果ダメージとは区別して扱います（総合ルール207-7）。",
  "効果ダメージ": "効果によって発生するダメージです。戦闘ダメージとは区別して扱います（総合ルール207-8）。",
  "夜状態": "戦場・領地にあるカードが裏面を上にして置かれている状態です（総合ルール204-1）。",
  "ウェイク状態": "カードがウェイク状態として扱われている状態です。移動やコスト支払いなどの処理に関係します（総合ルール204-4）。",
  "ムーブ状態": "カードがムーブ状態として扱われている状態です。詳細は総合ルール204-6、204-7を参照してください。",
  "行動待機": "カードが行動待機として扱われる状態・ルール用語です（総合ルール204-8）。",
  "生贄に捧げる": "指定されたカードなどを、生贄に捧げる処理によって領域移動させることです（総合ルール205-12）。",
  "能力を失う": "カード・トークンが持つ能力を失わせる処理です。元の能力か得た能力かで扱いが異なる場合があります（総合ルール206-9）。",
  "対象にする": "効果などで、処理の対象となるカード・プレイヤーなどを指定することです（総合ルール206-4）。",
  "発動する": "カードが持つ能力から効果を生成することです（総合ルール206-2）。",
  "妨害する": "プレイや処理を妨害することです。妨害されたプレイは原則として解決されません（総合ルール206-3、903）。",
  "追加のターン": "通常の進行に加えて行うターンです（総合ルール206-14）。",
  "条件域": "戦場・領地の存在・領土が持つ条件キーワード能力の数を表します（総合ルール207-16）。",
  "記憶": "指定された情報・数値などを参照するためのルール用語です（総合ルール207-17）。",
  "コントローラー": "カード・トークン・効果をコントロールしているプレイヤーです（総合ルール202-6）。",
  "コントロール": "カード・トークン・効果を、どのプレイヤーがコントロールしているかを示す概念です（総合ルール202-5）。",
  "持ち主": "カードを所有しているプレイヤーです（総合ルール202-4）。",
  "自身": "効果などの文章から参照される対象自身を示す用語です（総合ルール202-7）。",
  "あなた": "その能力・効果を参照しているプレイヤーを指します（総合ルール202-2）。",
  "相手": "その文章で指定される、あなたに対する相手プレイヤーです（総合ルール202-3）。",
  "元の能力": "カード・トークンが元から持つ能力です（総合ルール203-2）。",
  "得た能力": "効果やルールによってカード・トークンが一時的に得た能力です（総合ルール203-3）。",
  "能力": "カード・トークンが持つルール上の機能です（総合ルール203-1）。",
  "効果": "プレイや能力によってパイルに置かれるものです。カードそのものとは区別して扱います（総合ルール203-4）。",
  "引く": "基礎デッキの上からカードを手札に移動することです（総合ルール205-2）。",
  "捨てる": "カードを「捨てる」処理によって領域移動させることです。特に指定がなければ墓地に置かれます（総合ルール205-3）。",
  "加える": "カードを指定の領域から別の指定領域へ移動することです（総合ルール205-4）。",
  "探す": "指定された領域から条件に合うカードを探す処理です（総合ルール205-5）。",
  "見る": "指定されたカードの内容を確認する処理です。公開する処理とは区別されます（総合ルール205-6）。",
  "公開する": "指定のカードを、すべてのプレイヤーが確認できる状態にすることです（総合ルール205-7）。",
  "置く": "カードを指定された領域や位置に配置する処理です（総合ルール205-8）。",
  "出す": "カードを指定された領域などへ移動させる処理です（総合ルール205-9）。",
  "離れる": "カードが現在置かれている領域から別の領域へ移動することです（総合ルール205-10）。",
  "破壊する": "カードを破壊する処理です。特に指定がなければ、そのカードは墓地へ移動します（総合ルール205-11）。",
  "除外する": "カードを除外領域へ移動させる処理です（総合ルール205-13）。",
  "戻す": "カードを指定された領域へ戻す処理です（総合ルール205-16）。",
  "複製する": "指定されたカード・効果などを複製する処理です（総合ルール205-17）。",
  "移す": "カードをあるプレイヤーの領域などから別の領域へ移動させる処理です（総合ルール205-18）。",
  "選ぶ": "指定された条件に合うものなどから、プレイヤーが選択する処理です（総合ルール206-5）。",
  "取り除く": "指定されたカード・効果・カウンターなどを現在の場所から取り除く処理です（総合ルール206-7）。",
  "得る": "カード・トークンが指定された能力や情報などを得る処理です（総合ルール206-8）。",
  "装備する": "カードなどを指定された対象に装備させる処理です（総合ルール206-12）。",
  "宣言する": "指定された名称などを宣言する処理です（総合ルール206-13）。",
  "解決する": "パイルに置かれたプレイ・効果の処理を実行することです（総合ルール901、904）。",
  "回復する": "現在のライフを、指定された値だけ増加させる処理です（総合ルール207-5）。",
  "ダメージ": "プレイヤー・存在が受ける値です。ライフを支払うことやライフを失うこととは区別します（総合ルール207-6）。",
  "ライフ": "プレイヤーのライフ値です。ダメージ・ライフを支払う・ライフを失うは別の処理として扱います（総合ルール207-4、207-12、207-13）。",
  "トークン": "効果などによって生成される、ルール上カードに準じて扱われるものです（総合ルール208-1）。",
  "カウンター": "カードなどの上に置かれ、数や効果を記録するものです（総合ルール208-2）。"
};

function applyRulesTooltips(element) {
  if (!element) return;
  const text = element.textContent || "";
  if (!text) return;
  const terms = Object.keys(RULE_GLOSSARY).sort((a, b) => b.length - a.length);
  const escapeRegExp = value => value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\function applyIconGrid() {
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
");
  const pattern = new RegExp("(" + terms.map(escapeRegExp).join("|") + ")", "g");
  element.replaceChildren();
  text.split(pattern).forEach(part => {
    if (!Object.prototype.hasOwnProperty.call(RULE_GLOSSARY, part)) {
      element.append(document.createTextNode(part));
      return;
    }
    const term = document.createElement("span");
    term.className = "rules-term";
    term.textContent = part;
    term.dataset.tooltip = RULE_GLOSSARY[part];
    term.title = RULE_GLOSSARY[part];
    term.tabIndex = 0;
    term.setAttribute("role", "button");
    term.setAttribute("aria-label", part + "：ルールの解説を表示");
    term.addEventListener("click", event => {
      event.stopPropagation();
      const wasOpen = term.classList.contains("is-open");
      document.querySelectorAll(".rules-term.is-open").forEach(openTerm => openTerm.classList.remove("is-open"));
      if (!wasOpen) term.classList.add("is-open");
    });
    term.addEventListener("keydown", event => {
      if (event.key === "Escape") term.classList.remove("is-open");
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        term.click();
      }
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
