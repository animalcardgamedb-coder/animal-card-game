/*
  ========================================
  テキスト正規化
  ========================================

  検索処理で使う、
  テキストの正規化関数です。
*/

function normalize(value) {

  /*
    テキストを小文字に統一し、
    空白を削除します。
  */

  return String(value || "")
    .toLowerCase()
    .trim();

}


function normalizeWithFullWidth(value) {

  /*
    テキストを小文字に統一し、
    全角スペースを半角スペースに変換します。
  */

  return normalize(value)
    .replace(/\u3000/g, " ");

}


/*
  ========================================
  複数の値を分割
  ========================================

  スプレッドシートのセルに、

  A,B,C

  のように複数の値が入っている場合、
  A・B・Cに分けます。

  「、」
  「|」
  「｜」
  「改行」

  による区切りにも対応しています。
*/

function splitValues(value) {

  return String(value || "")
    .split(/[,、|｜\n]/)
    .map(
      value =>
        value.trim()
    )
    .filter(
      value =>
        value !== ""
    );

}


/*
  ========================================
  フィルターの選択肢を作る
  ========================================

  カードデータから、

  カードタイプ
  種属
  コスト
  公式キーワード
  公式効果

  の重複しない一覧を作ります。
*/

function getUniqueValues(
  cards,
  field
) {

  const values = [];

  cards.forEach(
    card => {

      splitValues(
        card[field]
      ).forEach(
        item => {

          if (
            !values.includes(
              item
            )
          ) {

            values.push(
              item
            );

          }

        }
      );

    }
  );

  return values.sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ja"
      )
  );

}


/*
  ========================================
  フィルターの選択肢を表示
  ========================================
*/

function createMultiFilter(
  elementId,
  values
) {

  const container =
    document.getElementById(
      elementId
    );

  if (!container) {
    return;
  }

  container.innerHTML = "";

  values.forEach(
    value => {

      const label =
        document.createElement(
          "label"
        );

      const checkbox =
        document.createElement(
          "input"
        );

      checkbox.type =
        "checkbox";

      checkbox.value =
        value;

      checkbox.addEventListener(
        "change",
        searchCards
      );

      label.appendChild(
        checkbox
      );

      label.appendChild(
        document.createTextNode(
          value
        )
      );

      container.appendChild(
        label
      );

    }
  );

}


/*
  ========================================
  フィルターの検索条件を作る
  ========================================
*/

function createFilterOptions() {

  const cards =
    appState.allCards;

  if (
    !cards ||
    cards.length === 0
  ) {
    return;
  }

  createMultiFilter(
    "card-type-filter",
    getUniqueValues(
      cards,
      "card_type"
    )
  );

  createMultiFilter(
    "species-filter",
    getUniqueValues(
      cards,
      "species"
    )
  );

  const costs =
    [...new Set(
      cards
        .map(
          card =>
            String(
              card.cost
            )
        )
        .filter(
          cost =>
            cost !== ""
        )
    )]
    .sort(
      (a, b) =>
        Number(a) -
        Number(b)
    );

  createMultiFilter(
    "cost-filter",
    costs
  );

  createMultiFilter(
    "official-keyword-filter",
    getUniqueValues(
      cards,
      "official_keywords"
    )
  );

  createMultiFilter(
    "official-effect-filter",
    getUniqueValues(
      cards,
      "official_effects"
    )
  );

}


/*
  ========================================
  選択されたフィルター値を取得
  ========================================
*/

function getSelectedValues(
  elementId
) {

  const container =
    document.getElementById(
      elementId
    );

  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll(
      "input[type='checkbox']:checked"
    )
  ).map(
    item => item.value
  );

}


/*
  ========================================
  カード検索
  ========================================
*/

function searchCards() {

  const cards =
    appState.allCards;

  if (
    !cards ||
    cards.length === 0
  ) {
    return;
  }

  /*
    ======================================
    文字検索の入力を取得
    ======================================

    全角スペースを半角スペースに変換します。

    これによって、

    猫　犬

    と入力しても、

    猫 犬

    と同じように検索できます。
  */

  const keywordInput =
    document.getElementById(
      "search-box"
    );

  const rawKeyword =
    keywordInput.value.trim()
      .replace(/\u3000/g, " ");

  const searchTerms =
    rawKeyword.split(/\s+/)
      .filter(
        term =>
          term !== ""
      );

  /*
    ======================================
    プラス検索とマイナス検索を分ける
    ======================================

    マイナス検索は、
    先頭が「-」の検索語です。
  */

  const includeTerms =
    searchTerms
      .filter(
        term =>
          !term.startsWith("-")
      )
      .map(
        term =>
          normalizeWithFullWidth(
            term
          )
      );

  const excludeTerms =
    searchTerms
      .filter(
        term =>
          term.startsWith("-")
      )
      .map(
        term =>
          normalizeWithFullWidth(
            term.slice(1)
          )
      );


  /*
    ======================================
    複数選択フィルターの値を取得
    ======================================
  */

  const selectedCardTypes =
    getSelectedValues(
      "card-type-filter"
    );

  const selectedSpecies =
    getSelectedValues(
      "species-filter"
    );

  const selectedCosts =
    getSelectedValues(
      "cost-filter"
    );

  const selectedOfficialKeywords =
    getSelectedValues(
      "official-keyword-filter"
    );

  const selectedOfficialEffects =
    getSelectedValues(
      "official-effect-filter"
    );


  /*
    ======================================
    ATK・DEFの条件を取得
    ======================================
  */

  const atkCondition =
    document.getElementById(
      "atk-condition"
    ).value;

  const atkValue =
    document.getElementById(
      "atk-value"
    ).value;

  const defCondition =
    document.getElementById(
      "def-condition"
    ).value;

  const defValue =
    document.getElementById(
      "def-value"
    ).value;


  /*
    ======================================
    カードを1枚ずつ調べる
    ======================================
  */

  const filteredCards =
    cards.filter(
      card => {

        /*
          =================================
          文字検索
          =================================

          検索対象は、

          カード名
          読み
          効果テキスト

          です。
        */

        const cardName =
          normalizeWithFullWidth(
            card.card_name
          );

        const reading =
          normalizeWithFullWidth(
            card.reading
          );

        const effectText =
          normalizeWithFullWidth(
            card.effect_text
          );

        const searchableText =
          cardName +
          " " +
          reading +
          " " +
          effectText;

        /*
          プラス検索。
          すべての検索語を含む必要があります。
        */

        const matchesInclude =
          includeTerms.every(
            term =>
              searchableText.includes(
                term
              )
          );

        /*
          マイナス検索。
          マイナス検索の単語を含まない必要があります。
        */

        const matchesExclude =
          excludeTerms.every(
            term =>
              !searchableText.includes(
                term
              )
          );


        /*
          =================================
          各フィルターの条件をチェック
          =================================
        */

        const matchesCardType =
          selectedCardTypes.length === 0 ||
          selectedCardTypes.includes(
            String(
              card.card_type
            )
          );

        const matchesSpecies =
          selectedSpecies.length === 0 ||
          selectedSpecies.some(
            selected =>
              splitValues(
                card.species
              ).includes(
                selected
              )
          );

        const matchesCost =
          selectedCosts.length === 0 ||
          selectedCosts.includes(
            String(
              card.cost
            )
          );

        const matchesOfficialKeyword =
          selectedOfficialKeywords.length === 0 ||
          selectedOfficialKeywords.some(
            selected =>
              splitValues(
                card.official_keywords
              ).includes(
                selected
              )
          );

        const matchesOfficialEffect =
          selectedOfficialEffects.length === 0 ||
          selectedOfficialEffects.some(
            selected =>
              splitValues(
                card.official_effects
              ).includes(
                selected
              )
          );

        /*
          =================================
          ATK・DEFの条件をチェック
          =================================
        */

        let matchesAtk = true;

        if (
          atkCondition &&
          atkValue !== ""
        ) {

          const atk =
            Number(
              card.atk || 0
            );

          const compareValue =
            Number(atkValue);

          if (
            atkCondition === "gte"
          ) {

            matchesAtk =
              atk >= compareValue;

          } else if (
            atkCondition === "lte"
          ) {

            matchesAtk =
              atk <= compareValue;

          }

        }

        let matchesDef = true;

        if (
          defCondition &&
          defValue !== ""
        ) {

          const def =
            Number(
              card.def || 0
            );

          const compareValue =
            Number(defValue);

          if (
            defCondition === "gte"
          ) {

            matchesDef =
              def >= compareValue;

          } else if (
            defCondition === "lte"
          ) {

            matchesDef =
              def <= compareValue;

          }

        }

        /*
          =================================
          すべての条件をANDで結合
          =================================
        */

        return matchesInclude &&
          matchesExclude &&
          matchesCardType &&
          matchesSpecies &&
          matchesCost &&
          matchesOfficialKeyword &&
          matchesOfficialEffect &&
          matchesAtk &&
          matchesDef;

      }
    );

  /*
    ======================================
    検索結果を保存して表示
    ======================================
  */

  appState.currentSearchResults =
    filteredCards;

  displayCards(
    filteredCards
  );

}
