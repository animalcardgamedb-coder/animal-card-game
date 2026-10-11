/*
 * 用語解説は公式「アニマルカードゲーム 総合ルール ver.6.0」（2026-07-23）を参照した短い要約です。
 */
const RULE_GLOSSARY = {
  "《平野》": "条件キーワード能力。カードをプレイする時、平野条件の1つとして数えられます。",
  "《山岳》": "条件キーワード能力。カードをプレイする時、山岳条件の1つとして数えられます。",
  "《水生》": "条件キーワード能力。カードをプレイする時、水生条件の1つとして数えられます。",
  "《森林》": "条件キーワード能力。カードをプレイする時、森林条件の1つとして数えられます。",
  "《夜》": "条件キーワード能力。カードをプレイする時、夜条件の1つとして数えられます。",
  "《敏捷》": "手札にあるこのカードは、自分が優先権を持っていればいつでもプレイできます。",
  "《唯一》": "同じ名前の存在や領土が複数ある場合、ルール処理で1つを残し、それ以外を墓地に置きます。",
  "《装備》": "指定された対象に装備した状態で戦場に出ます。装備状態でない、または対象条件に合わない場合はルール処理で生贄に捧げられます。",
  "《冬毛》": "あなたの戦場に「冬」カードがないなら、このカード／トークンをルール処理で墓地に置きます。",
  "《駿足》": "この動物は行動待機の影響を受けません。",
  "《急造》": "相手のターン中でも、自分が優先権を持つならいつでもこのカードをプレイできます。",
  "《早業》": "この動物は行動待機の影響を受けずに、発動コストでムーブできます。ただし攻撃できなくなる行動待機状態そのものを解除する能力ではありません。",
  "《放浪者》": "特定の効果を持たない常時能力で、《放浪者》を持つカード／トークンとして参照できる印です。",
  "《バッファロー軍》": "特定の効果を持たない常時能力で、《バッファロー軍》を持つカード／トークンとして参照できる印です。",
  "《ライノ軍》": "特定の効果を持たない常時能力で、《ライノ軍》を持つカード／トークンとして参照できる印です。",
  "《駿足》": "この動物は行動待機の影響を受けません。",
  "《鉄壁》": "公式ルールで定義されたキーワード能力です。詳しい適用条件は総合ルールの「キーワード能力」を参照してください。",
  "《突破》": "すべての攻撃動物がこの能力を持つ場合、攻撃動物が防御動物の許容ダメージ量を超える戦闘ダメージを与えた時、その超過分を相手に与えます。",
  "《有翼》": "この能力を持つ動物だけで集団攻撃する場合、防御できる動物に制限が生じます。",
  "《対空》": "《有翼》への防御条件に関わるキーワード能力です。",
  "《隠密》": "この能力を持つ動物だけで集団攻撃する場合、防御できるかどうかに関わる能力です。",
  "《有毒》": "攻撃側／防御側の条件を満たす戦闘で、動物が受ける戦闘ダメージが許容ダメージ量未満なら、その量を許容ダメージ量まで増やします。",
  "《不可侵》": "他のカード・トークンの効果ではパイルや戦場から移動せず、能力を失わず、夜状態になりません（ルール処理などは例外です）。",
  "《不壊》": "この存在はルールでも効果でも破壊されません。",
  "《忌み地》": "特定の効果を持たない常時能力で、この能力を持つカード／トークンとして参照するためのキーワードです。",
  "《孤高》": "自分の戦場に存在が複数ある場合、指定された処理によって1つを選び、それ以外を墓地に置きます。",
  "優先権": "プレイヤーがカードのプレイや能力の発動などを行える権利です。行動やフェイズ進行のルールに関わります。",
  "カードをプレイする": "ルールに従ってカードを使用する手順です。条件の達成やコストの支払いなどを伴います。",
  "発動する": "能力や効果をルールに従って開始することを示す用語です。",
  "妨害する": "プレイや効果の解決を妨げる処理です。",
  "対象にする": "効果の処理対象としてカードや存在などを指定することです。",
  "選ぶ": "指定された範囲の中から処理するものを選択することです。",
  "夜状態": "カード・トークンの状態の一つです。状態の変更や夜を明ける処理が総合ルールで定義されています。",
  "ウェイク状態": "カード・トークンの状態の一つです。ウェイクする処理が総合ルールで定義されています。",
  "ムーブ状態": "カード・トークンの状態の一つです。ムーブする処理が総合ルールで定義されています。",
  "戦闘ダメージ": "戦闘時に攻撃・防御している動物などが与えたり受けたりするダメージです。",
  "効果ダメージ": "効果によって与えられるダメージです。戦闘ダメージとは別に定義されています。",
  "ライフ": "プレイヤーの数値情報です。ライフの増減や支払い、敗北条件などに関わります。",
  "トークン": "カードや効果によって生成されるものです。トークンの情報や領域での扱いが定義されています。",
  "カウンター": "カードやトークンの上に置く目印です。種類ごとにルールや効果が定義されています。",
  "ループ": "特定の処理を複数回、または無限回処理できる状況です。",
  "同形反復": "ゲームの状況が以前と同じ状況まで戻り、際限なく繰り返されることです。",
  "行動待機": "存在が行動を行えない状態に関わるルール用語です。",
  "公開領域": "すべてのプレイヤーが置かれているカード・トークン・効果を確認できる領域です。",
  "非公開領域": "すべてのプレイヤーが置かれているカードを確認できない領域です。",
  "手札": "引いたカードや手札に加えたカードを置く領域です。",
  "戦場": "動物・縄張り・道具タイプのカードやトークンを置く領域です。",
  "領地": "領土タイプのカードやトークンを置く領域です。",
  "墓地": "カードを置く公開領域です。",
  "除外領域": "除外されたカードを置く領域です。裏向きのカードには参照上の制限があります。",
  "パイル": "カードや効果を置き、置かれた順番を管理する領域です。",
  "ルール処理": "ゲームの状態がルールで決められた条件を満たした場合に実行される処理です。",
  "カード名": "カードを識別するための名前です。同じカード名かどうかはデッキ構築や《唯一》などの判定に使われます。",
  "条件": "カードをプレイする際の条件達成や、条件キーワード能力の参照に関わるカード情報です。",
  "優先権": "プレイヤーがカードのプレイや能力の発動などを行える権利です。",
  "カードをプレイする": "カードを使用するためのルール手順です。条件達成やコスト支払いなどが関わります。",
  "発動コスト": "能力や効果を発動する際に支払う／実行するコストです。",
  "基礎デッキ": "40枚以上で構築し、同じカード名は予備デッキを含めて最大4枚まで入れられます。",
  "領土デッキ": "領土カードのみで構築します。公式総合ルールでは10枚ちょうどと定義されています。"
};

const regexpSpecialChars = ".+?^$(){}|[]\\";
const ruleTermPatterns = Object.keys(RULE_GLOSSARY)
  .sort((a, b) => b.length - a.length)
  .map(term => Array.from(term, character => regexpSpecialChars.includes(character) ? "\\" + character : character).join(""));
ruleTermPatterns.push("《装備（[^）]+）》");
const ruleTermPattern = new RegExp(ruleTermPatterns.join("|"), "g");
function setRuleGlossaryText(element, value) {
  if (!element) return;
  const text = String(value ?? "");
  element.replaceChildren();
  let cursor = 0;
  for (const match of text.matchAll(ruleTermPattern)) {
    const term = match[0];
    const index = match.index ?? 0;
    if (index > cursor) element.append(document.createTextNode(text.slice(cursor, index)));
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rule-term";
    button.textContent = term;
    const explanation = RULE_GLOSSARY[term] || RULE_GLOSSARY["《装備》"];
    button.title = explanation;
    button.setAttribute("aria-label", `${term}：${explanation}`);
    button.addEventListener("click", event => {
      event.stopPropagation();
      const next = button.nextElementSibling;
      if (next?.classList.contains("rule-term-tooltip")) {
        next.remove();
        return;
      }
      element.querySelectorAll(".rule-term-tooltip").forEach(node => node.remove());
      const tip = document.createElement("span");
      tip.className = "rule-term-tooltip";
      tip.textContent = explanation;
      button.insertAdjacentElement("afterend", tip);
    });
    element.append(button);
    cursor = index + term.length;
  }
  if (cursor < text.length) element.append(document.createTextNode(text.slice(cursor)));
}

function userTagKeyForCard(item) {
  const territory = Boolean(item?.territory_id);
  return `${territory ? "territory" : "card"}:${territory ? item.territory_id : item.card_id}`;
}

function renderDetailUserTags(item) {
  const container = document.getElementById("detail-user-tag-options");
  const status = document.getElementById("detail-user-tags-status");
  if (!container) return;
  container.replaceChildren();
  const tags = window.registeredUserTags || [];
  const assigned = new Set((window.userTagAssignments || {})[userTagKeyForCard(item)] || []);
  if (!tags.length) {
    container.textContent = "タグはまだありません。メニューの「ユーザータグ」から登録できます。";
    return;
  }
  tags.forEach(tag => {
    const label = document.createElement("label");
    label.className = "detail-user-tag-label";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = assigned.has(tag);
    input.addEventListener("change", async () => {
      const selection = Array.from(container.querySelectorAll("input:checked")).map(control => control.value);
      input.value = tag;
      container.querySelectorAll("input").forEach(control => { control.disabled = true; });
      if (status) status.textContent = "カードのタグを保存しています……";
      try {
        await window.setCardUserTags(item, selection);
        await window.loadUserTagData?.();
        renderDetailUserTags(item);
        if (window.refreshUserTagFilter) window.refreshUserTagFilter();
        if (status) status.textContent = "カードのユーザータグを保存しました。";
      } catch (error) {
        if (status) status.textContent = error.message || "カードのユーザータグを保存できませんでした。";
        await window.loadUserTagData?.().catch(() => undefined);
        renderDetailUserTags(item);
      }
    });
    input.value = tag;
    label.append(input, document.createTextNode(tag));
    container.append(label);
  });
}

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
  item,
  options = {}
) {
  const qtyControls = document.getElementById("detail-deck-qty-controls");
  const addToDeckButton = document.getElementById("detail-add-to-deck-button");
  const removeFromDeckButton = document.getElementById("detail-deck-remove-button");
  if (qtyControls) qtyControls.hidden = !options.deckBuilder;
  if (addToDeckButton) addToDeckButton.textContent = item?.territory_id ? "＋ 領地を追加" : "＋ カードを追加";
  if (removeFromDeckButton) {
    removeFromDeckButton.disabled = !(Number(options.quantity) > 0);
    removeFromDeckButton.title = item?.territory_id ? "領土デッキから1枚減らす" : "メインデッキから1枚減らす";
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
  setRuleGlossaryText(document.getElementById("detail-species"), item.species || "");


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
  setRuleGlossaryText(document.getElementById("detail-condition"), getCardConditionText(item));


  /*
    効果
  */
  setRuleGlossaryText(document.getElementById("detail-effect"), item.effect_text || "");


  /*
    公式キーワード
  */
  setRuleGlossaryText(document.getElementById("detail-keywords"), item.official_keywords || "なし");


  /*
    公式効果
  */
  setRuleGlossaryText(document.getElementById("detail-effects"), item.official_effects || "なし");


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


  renderDetailUserTags(item);
  const userTagLoader = window.loadUserTagData;
  if (typeof userTagLoader === "function") {
    userTagLoader().then(() => renderDetailUserTags(item)).catch(error => {
      const status = document.getElementById("detail-user-tags-status");
      if (status) status.textContent = error.message || "ユーザータグを読み込めませんでした。";
    });
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
