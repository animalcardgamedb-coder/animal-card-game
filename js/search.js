/*
  テキスト正規化

  検索処理で使う、
  テキストの正規化関数です。
*/

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .trim();

}


function normalizeWithFullWidth(value) {

  return normalize(value)
    .replace(/\u3000/g, " ");

}


/*
  複数の値を分割

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
  フィルターの選択肢を作る

  指定したデータから、
  重複しない一覧を作ります。
*/

function getUniqueValues(
  data,
  field
) {

  const values = [];

  data.forEach(
    item => {

      splitValues(
        item[field]
      ).forEach(
        value => {

          if (
            !values.includes(
              value
            )
          ) {

            values.push(
              value
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
  フィルターの選択肢を表示
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
  フィルターの選択肢を作る
*/

function createFilterOptions() {

  const cards =
    appState.allCards || [];

  const territories =
    appState.allTerritories || [];

  const allData = [
    ...cards,
    ...territories
  ];

  if (
    allData.length === 0
  ) {
    return;
  }


  /*
    ======================================
    カードタイプ
    ======================================

    カードの「card_type」と
    領地の「territory_type」を
    同じフィルターにまとめます。

    領地タイプは独立したフィルターには
    しません。
  */

  const cardTypes = [
    ...getUniqueValues(
      cards,
      "card_type"
    ),
    ...getUniqueValues(
      territories,
      "territory_type"
    )
  ];

  createMultiFilter(
    "card-type-filter",
    [
      ...new Set(
        cardTypes
      )
    ].sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ja"
        )
    )
  );


  /*
    ======================================
    種属
    ======================================

    カードと領地の両方から作ります。
  */

  createMultiFilter(
    "species-filter",
    getUniqueValues(
      allData,
      "species"
    )
  );


  /*
    ======================================
    コスト
    ======================================

    カードと領地の両方から作ります。
  */

  const costs =
    [
      ...new Set(
        allData
          .map(
            item =>
              String(
                item.cost ?? ""
              )
          )
          .filter(
            cost =>
              cost !== ""
          )
      )
    ].sort(
      (a, b) =>
        Number(a) -
        Number(b)
    );

  createMultiFilter(
    "cost-filter",
    costs
  );


  /*
    ======================================
    カードのキーワード能力
    ======================================
  */

  createMultiFilter(
    "card-keyword-filter",
    getUniqueValues(
      cards,
      "official_keywords"
    )
  );


  /*
    ======================================
    領地のキーワード能力
    ======================================
  */

  createMultiFilter(
    "territory-keyword-filter",
    getUniqueValues(
      territories,
      "official_keywords"
    )
  );


  /*
    ======================================
    カードの効果分類
    ======================================
  */

  createMultiFilter(
    "card-effect-filter",
    getUniqueValues(
      cards,
      "official_effects"
    )
  );


  /*
    ======================================
    領地の効果分類
    ======================================
  */

  createMultiFilter(
    "territory-effect-filter",
    getUniqueValues(
      territories,
      "official_effects"
    )
  );

}


/*
  選択されたフィルター値を取得
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
    item =>
      item.value
  );

}


/*
  検索対象が領地かどうかを判定
*/

function isTerritory(
  item
) {

  return Boolean(
    item &&
    item.territory_id
  );

}


/*
  現在のカテゴリに応じて
  検索対象を取得
*/

function getSearchData() {

  if (
    appState.currentCategory ===
    "card"
  ) {

    return appState.allCards || [];

  }

  if (
    appState.currentCategory ===
    "territory"
  ) {

    return appState.allTerritories || [];

  }

  return appState.allData || [];

}


/*
  カード・領地検索
*/

function searchCards() {

  const data =
    getSearchData();

  if (
    !data ||
    data.length === 0
  ) {

    appState.currentSearchResults =
      [];

    displayCards(
      []
    );

    return;

  }


  /*
    ======================================
    文字検索
    ======================================
  */

  const keywordInput =
    document.getElementById(
      "search-box"
    );

  const rawKeyword =
    keywordInput
      ? keywordInput.value
        .trim()
        .replace(/\u3000/g, " ")
      : "";

  const searchTerms =
    rawKeyword
      .split(/\s+/)
      .filter(
        term =>
          term !== ""
      );


  /*
    プラス検索
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


  /*
    マイナス検索
  */

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
    複数選択フィルター
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


  /*
    カード用キーワード能力
  */

  const selectedCardKeywords =
    getSelectedValues(
      "card-keyword-filter"
    );


  /*
    領地用キーワード能力
  */

  const selectedTerritoryKeywords =
    getSelectedValues(
      "territory-keyword-filter"
    );


  /*
    カード用効果分類
  */

  const selectedCardEffects =
    getSelectedValues(
      "card-effect-filter"
    );


  /*
    領地用効果分類
  */

  const selectedTerritoryEffects =
    getSelectedValues(
      "territory-effect-filter"
    );


  /*
    ======================================
    ATK・DEFの条件
    ======================================
  */

  const atkConditionElement =
    document.getElementById(
      "atk-condition"
    );

  const atkValueElement =
    document.getElementById(
      "atk-value"
    );

  const defConditionElement =
    document.getElementById(
      "def-condition"
    );

  const defValueElement =
    document.getElementById(
      "def-value"
    );

  const atkCondition =
    atkConditionElement
      ? atkConditionElement.value
      : "";

  const atkValue =
    atkValueElement
      ? atkValueElement.value
      : "";

  const defCondition =
    defConditionElement
      ? defConditionElement.value
      : "";

  const defValue =
    defValueElement
      ? defValueElement.value
      : "";


  /*
    ======================================
    カード・領地を1件ずつ調べる
    ======================================
  */

  const filteredData =
    data.filter(
      item => {

        const territory =
          isTerritory(
            item
          );


        /*
          =================================
          文字検索
          =================================
        */

        const name =
          normalizeWithFullWidth(
            territory
              ? item.territory_name
              : item.card_name
          );

        const reading =
          normalizeWithFullWidth(
            item.reading
          );

        const effectText =
          normalizeWithFullWidth(
            item.effect_text
          );

        const searchableText =
          name +
          " " +
          reading +
          " " +
          effectText;


        const matchesInclude =
          includeTerms.every(
            term =>
              searchableText.includes(
                term
              )
          );


        const matchesExclude =
          excludeTerms.every(
            term =>
              !searchableText.includes(
                term
              )
          );


        /*
          =================================
          カードタイプ
          =================================

          カード：
          card_type

          領地：
          territory_type

          のどちらも
          「カードタイプ」として扱います。
        */

        const itemType =
          territory
            ? item.territory_type
            : item.card_type;

        const matchesType =
          selectedCardTypes.length === 0 ||
          selectedCardTypes.includes(
            String(
              itemType
            )
          );


        /*
          =================================
          種属
          =================================
        */

        const matchesSpecies =
          selectedSpecies.length === 0 ||
          selectedSpecies.some(
            selected =>
              splitValues(
                item.species
              ).includes(
                selected
              )
          );


        /*
          =================================
          コスト
          =================================
        */

        const matchesCost =
          selectedCosts.length === 0 ||
          selectedCosts.includes(
            String(
              item.cost
            )
          );


        /*
          =================================
          キーワード能力
          =================================

          カードを検索するときは
          カード用フィルターだけを使用。

          領地を検索するときは
          領地用フィルターだけを使用。

          これによって、
          カードと領地のキーワードが
          混ざりません。
        */

        const selectedKeywords =
          territory
            ? selectedTerritoryKeywords
            : selectedCardKeywords;

        const matchesKeyword =
          selectedKeywords.length === 0 ||
          selectedKeywords.some(
            selected =>
              splitValues(
                item.official_keywords
              ).includes(
                selected
              )
          );


        /*
          =================================
          効果分類
          =================================

          キーワード能力と同様に、
          カードと領地を分けて扱います。
        */

        const selectedEffects =
          territory
            ? selectedTerritoryEffects
            : selectedCardEffects;

        const matchesEffect =
          selectedEffects.length === 0 ||
          selectedEffects.some(
            selected =>
              splitValues(
                item.official_effects
              ).includes(
                selected
              )
          );


        /*
          =================================
          ATK・DEF
          =================================
        */

        let matchesAtk = true;
        let matchesDef = true;

        const hasAtkCondition =
          Boolean(
            atkCondition &&
            atkValue !== ""
          );

        const hasDefCondition =
          Boolean(
            defCondition &&
            defValue !== ""
          );


        if (
          !territory &&
          hasAtkCondition
        ) {

          const atk =
            Number(
              item.atk || 0
            );

          const compareValue =
            Number(
              atkValue
            );

          if (
            atkCondition ===
            "gte"
          ) {

            matchesAtk =
              atk >=
              compareValue;

          } else if (
            atkCondition ===
            "lte"
          ) {

            matchesAtk =
              atk <=
              compareValue;

          }

        } else if (
          territory &&
          hasAtkCondition
        ) {

          matchesAtk =
            false;

        }


        if (
          !territory &&
          hasDefCondition
        ) {

          const def =
            Number(
              item.def || 0
            );

          const compareValue =
            Number(
              defValue
            );

          if (
            defCondition ===
            "gte"
          ) {

            matchesDef =
              def >=
              compareValue;

          } else if (
            defCondition ===
            "lte"
          ) {

            matchesDef =
              def <=
              compareValue;

          }

        } else if (
          territory &&
          hasDefCondition
        ) {

          matchesDef =
            false;

        }


        /*
          =================================
          すべての条件をANDで結合
          =================================
        */

        return (
          matchesInclude &&
          matchesExclude &&
          matchesType &&
          matchesSpecies &&
          matchesCost &&
          matchesKeyword &&
          matchesEffect &&
          matchesAtk &&
          matchesDef
        );

      }
    );


  /*
    ======================================
    検索結果を保存して表示
    ======================================
  */

  appState.currentSearchResults =
    filteredData;

  displayCards(
    filteredData
  );

}
