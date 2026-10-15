/*
 * 購入先検索と収録パック・デッキの表示。
 * 商品リンクの行がGASから返ってきた場合は、そのURLを優先します。
 * アフィリエイトURLが登録されていれば、カード詳細でそのURLを優先します。
 */
(() => {
  "use strict";

  const AFFILIATE_LINKS_ENABLED = true;
  const STORES = [
    { key: "amazon", label: "Amazon", build: (_, combined) => "https://www.amazon.co.jp/s?k=" + combined, affiliate: true },
    { key: "rakuten", label: "楽天市場", build: (_, combined) => "https://search.rakuten.co.jp/search/mall/" + combined + "/", affiliate: true },
    { key: "mercari", label: "メルカリ", build: (_, combined) => "https://jp.mercari.com/search?keyword=" + combined, affiliate: true },
    { key: "yellow_submarine", label: "イエローサブマリン", build: () => "https://shop.yellowsubmarine.co.jp/products/list?category_id=702040884" },
    { key: "dragonstar", label: "ドラゴンスター", build: name => "https://dorasuta.jp/acgtcg/product-list?kw=" + name },
    { key: "ajito", label: "カードショップアジト", build: name => "https://shop.tcg-ajito.com/search/animal_card/list?free_word=" + name },
    { key: "cardlabo", label: "カードラボ", build: name => "https://www.c-labo-online.jp/product-list?keyword=" + name + "&Submit=" },
    { key: "gamers", label: "ゲーマーズ", build: name => "https://www.gamers.co.jp/products/list.php?mode=search&smt=" + name, affiliate: true },
    { key: "realize", label: "REALiZE", build: (name, combined) => "https://realize-tcg.com/?mode=srh&cid=2956432%2C0&keyword=" + encodeURIComponent((String(combined).match(/ACG-[A-Z0-9-]+/i) || [String(combined)])[0]).replace(/%20/g, "+") + "&encode=EUC-JP" },
    { key: "surugaya", label: "駿河屋", build: (name, combined) => "https://www.suruga-ya.jp/search?category=&search_word=" + encodeURIComponent(combined).replace(/%20/g, "+"), affiliate: true }
  ];

  function readValue(row, keys) {
    if (!row || typeof row !== "object") return "";
    for (const key of keys) {
      const raw = row[key];
      if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw).trim();
    }
    return "";
  }

  function storeUrl(row, store) {
    const keys = [store.key + "_url", store.key, store.label, store.label + "リンク"];
    if (store.key === "rakuten") keys.push("楽天");
    if (store.key === "yellow_submarine") keys.push("イエローサブマリンリンク");
    if (store.key === "dragonstar") keys.push("ドラゴンスターリンク");
    if (store.key === "ajito") keys.push("カードショップアジト");
    if (store.key === "cardlabo") keys.push("カードラボリンク");
    if (store.key === "gamers") keys.push("ゲーマーズリンク");
    if (store.key === "realize") keys.push("REALiZEリンク");
    if (store.key === "surugaya") keys.push("駿河屋リンク");
    return readValue(row, keys);
  }

  function safeHttpUrl(raw) {
    const text = String(raw || "").trim();
    if (!text) return "";
    try {
      const parsed = new URL(text);
      return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : "";
    } catch (_) {
      return "";
    }
  }

  function currentItem(item) {
    const territory = Boolean(item && item.territory_id);
    return {
      type: territory ? "territory" : "card",
      id: String(territory ? item.territory_id : (item && item.card_id) || "").trim(),
      name: String(territory ? item.territory_name : (item && item.card_name) || "").trim()
    };
  }

  function typeMatches(raw, type) {
    const value = String(raw || "").trim().toLowerCase();
    if (!value) return true;
    if (type === "territory") return ["territory", "領土", "領地"].includes(value);
    return ["card", "カード", "基礎"].includes(value);
  }

  function findProductRow(item) {
    const rows = Array.isArray(window.appState && window.appState.productLinks) ? window.appState.productLinks : [];
    const current = currentItem(item);
    return rows.find(row =>
      readValue(row, ["item_id", "カードID/領土ID", "カードID", "領土ID", "ID"]) === current.id &&
      typeMatches(readValue(row, ["item_type", "種別", "種類", "商品種別"]), current.type)
    ) || null;
  }

  function findAffiliateRow(item) {
    if (!AFFILIATE_LINKS_ENABLED || !item || item.territory_id) return null;
    const id = String(item.card_id || "").trim();
    const rows = Array.isArray(window.appState && window.appState.affiliateLinks) ? window.appState.affiliateLinks : [];
    return rows.find(row => readValue(row, ["card_id", "カードID"]) === id) || null;
  }

  // 旧版が自動生成した4店舗の検索URLは、新しい指定フォーマットへ読み替えます。
  // 商品リンクシートに手入力されたURLのうち、通常の商品・販売ページURLはそのまま保持します。
  function legacyGeneratedSearchUrl(storeKey, cardName) {
    const query = encodeURIComponent("アニマルカードゲーム " + String(cardName || "").trim());
    const knownPrefixes = {
      dragonstar: "https://dorasuta.jp/search?keyword=",
      ajito: "https://cardshop-ajito.jp/?s=",
      cardlabo: "https://www.c-labo-online.jp/products/list.php?name=",
      gamers: "https://www.gamers.co.jp/products/list.php?name="
    };
    return knownPrefixes[storeKey] ? knownPrefixes[storeKey] + query : "";
  }

  function isLegacyGeneratedSearchUrl(url, store, cardName) {
    const current = safeHttpUrl(url);
    const legacy = safeHttpUrl(legacyGeneratedSearchUrl(store.key, cardName));
    return Boolean(current && legacy && current === legacy);
  }

  function makeAnchor(label, href, className) {
    const url = safeHttpUrl(href);
    if (!url) return null;
    const anchor = document.createElement("a");
    anchor.className = className || "detail-link";
    anchor.href = url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = label;
    return anchor;
  }

  function showEmpty(node, text) {
    if (!node) return;
    node.replaceChildren();
    const message = document.createElement("p");
    message.className = "related-pack-empty";
    message.textContent = text;
    node.append(message);
  }

  function renderPurchaseLinks(item) {
    const root = document.getElementById("detail-purchase-links");
    if (!root || !item) return;
    root.replaceChildren();

    const current = currentItem(item);
    const nameQuery = encodeURIComponent(current.name);
    const combinedQuery = encodeURIComponent("アニマルカードゲーム " + current.name);
    const productRow = findProductRow(item);
    const affiliateRow = findAffiliateRow(item);

    STORES.forEach(store => {
      const affiliateUrl = store.affiliate ? safeHttpUrl(storeUrl(affiliateRow, store)) : "";
      let registeredUrl = safeHttpUrl(storeUrl(productRow, store));
      if (store.key === "yellow_submarine") registeredUrl = store.build(nameQuery, combinedQuery);
      if (isLegacyGeneratedSearchUrl(registeredUrl, store, current.name)) registeredUrl = "";
      const searchHref = store.build(nameQuery, combinedQuery);
      const href = affiliateUrl || registeredUrl || searchHref;
      // アフィリエイトURLが実際に採用されるボタンにはPR表記を付けます。
      const buttonLabel = (affiliateUrl ? "【PR】" : "") + store.label;
      const anchor = makeAnchor(buttonLabel, href);
      if (anchor) {
        anchor.dataset.store = store.key;
        if (affiliateUrl) anchor.dataset.linkType = "affiliate";
        root.append(anchor);
      }
    });
  }

  function renderRelatedPackLinks(item) {
    const root = document.getElementById("detail-pack-links");
    if (!root || !item) return;
    const current = currentItem(item);
    const rows = Array.isArray(window.appState && window.appState.packLinks) ? window.appState.packLinks : [];
    const related = rows.filter(row => {
      const text = readValue(row, ["card_ids", "収録カードID", "収録カードID（カンマ区切り）", "カードID一覧"]);
      const ids = text.split(/[,，、;；\s]+/).map(value => value.trim()).filter(Boolean);
      return ids.includes(current.id);
    });

    root.replaceChildren();
    if (!related.length) {
      showEmpty(root, "収録パック・デッキ情報はまだ登録されていません。");
      return;
    }

    related.forEach(row => {
      const card = document.createElement("div");
      card.className = "related-pack-item";
      const title = document.createElement("strong");
      title.textContent = readValue(row, ["product_name", "商品名", "パック名", "デッキ名"]) || "名称未登録の商品";
      card.append(title);

      const links = document.createElement("div");
      links.className = "detail-link-list";
      const official = makeAnchor("公式商品ページ", readValue(row, ["official_url", "公式商品URL", "公式URL"]));
      if (official) links.append(official);
      STORES.forEach(store => {
        const anchor = makeAnchor(store.label, storeUrl(row, store));
        if (anchor) links.append(anchor);
      });

      if (links.childElementCount) card.append(links);
      else {
        const empty = document.createElement("p");
        empty.className = "related-pack-empty";
        empty.textContent = "販売リンク未登録";
        card.append(empty);
      }
      root.append(card);
    });
  }

  window.renderPurchaseLinks = renderPurchaseLinks;
  window.renderRelatedPackLinks = renderRelatedPackLinks;
})();