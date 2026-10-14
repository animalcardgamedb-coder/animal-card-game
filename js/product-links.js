/*
 * 購入先検索と収録パック・デッキの表示。
 * 商品リンクの行がGASから返ってきた場合は、そのURLを優先します。
 * アフィリエイト表示は、公式ガイドラインとの整合性が確認できるまで無効です。
 */
(() => {
  "use strict";

  const AFFILIATE_LINKS_ENABLED = false;
  const STORES = [
    { key: "amazon", label: "Amazon", build: q => "https://www.amazon.co.jp/s?k=" + q, affiliate: true },
    { key: "rakuten", label: "楽天市場", build: q => "https://search.rakuten.co.jp/search/mall/" + q + "/", affiliate: true },
    { key: "mercari", label: "メルカリ", build: q => "https://jp.mercari.com/search?keyword=" + q, affiliate: true },
    { key: "yellow_submarine", label: "イエローサブマリン", build: q => "https://shop.yellowsubmarine.co.jp/?mode=srh&keyword=" + q },
    { key: "dragonstar", label: "ドラゴンスター", build: q => "https://dorasuta.jp/search?keyword=" + q },
    { key: "ajito", label: "カードショップアジト", build: q => "https://cardshop-ajito.jp/?s=" + q },
    { key: "cardlabo", label: "カードラボ", build: q => "https://www.c-labo-online.jp/products/list.php?name=" + q },
    { key: "gamers", label: "ゲーマーズ", build: q => "https://www.gamers.co.jp/products/list.php?name=" + q, affiliate: true }
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
    const query = encodeURIComponent("アニマルカードゲーム " + current.name);
    const productRow = findProductRow(item);
    const affiliateRow = findAffiliateRow(item);

    STORES.forEach(store => {
      const affiliateUrl = store.affiliate ? safeHttpUrl(storeUrl(affiliateRow, store)) : "";
      const registeredUrl = safeHttpUrl(storeUrl(productRow, store));
      const href = affiliateUrl || registeredUrl || store.build(query);
      const anchor = makeAnchor(store.label, href);
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