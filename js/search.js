/*
  テキスト正規化

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

  カード・領地データから、
  重複しない一覧を作ります。
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
    カードタイプ
  */

  createMultiFilter(
    "card-type-filter",
    getUniqueValues(
      cards,
      "card_type"
    )
  );


  /*
    領地タイプ
  */

  createMultiFilter(
    "territory-type-filter",
    getUniqueValues(
      territories,
      "territory_type"
    )
  );


  /*
    種属

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
    コスト

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
    公式キーワード
  */

  createMultiFilter(
    "official-keyword-filter",
    getUniqueValues(
      allData,
      "official_keywords"
    )
  );


  /*
    公式効果
  */

  createMultiFilter(
    "official-effect-filter",
    getUniqueValues(
      allData,
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
    文字検索の入力を取得
    ======================================

    全角スペースを半角スペースに
    変換します。

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

  const selectedTerritoryTypes =
    getSelectedValues(
      "territory-type-filter"
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

          カード：
          カード名・読み・効果テキスト

          領地：
          領地名・読み・効果テキスト
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
          マイナス検索の単語を
          含まない必要があります。
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
          カードタイプ・領地タイプ
          =================================

          カードタイプはカードにだけ適用。

          領地タイプは領地にだけ適用。
        */

        let matchesType = true;

        if (territory) {

          matchesType =
            selectedTerritoryTypes.length === 0 ||
            selectedTerritoryTypes.includes(
              String(
                item.territory_type
              )
            );

        } else {

          matchesType =
            selectedCardTypes.length === 0 ||
            selectedCardTypes.includes(
              String(
                item.card_type
              )
            );

        }


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
          公式キーワード
          =================================
        */

        const matchesOfficialKeyword =
          selectedOfficialKeywords.length === 0 ||
          selectedOfficialKeywords.some(
            selected =>
              splitValues(
                item.official_keywords
              ).includes(
                selected
              )
          );


        /*
          =================================
          公式効果
          =================================
        */

        const matchesOfficialEffect =
          selectedOfficialEffects.length === 0 ||
          selectedOfficialEffects.some(
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

          ATK・DEFはカードにだけ存在します。

          「すべて」でATK/DEFを指定した場合、
          ATK/DEFを持たない領地は
          検索結果から除外します。
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
          matchesOfficialKeyword &&
          matchesOfficialEffect &&
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
