/* Screen and deck-building interactions. Card search remains handled by the existing scripts. */
(() => {
  const $ = id => document.getElementById(id);
  const state = { screen: "search", tab: "mine", decks: [], deck: null, builderQuery: "", publicView: false, previewText: false, compact: false, addItem: null, cardLimit: 120 };
  const app = () => window.animalDeckApp;
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const allCards = () => [...(window.appState?.allCards || []), ...(window.appState?.allTerritories || [])];
  const byItemId = id => allCards().find(item => String(item.card_id || item.territory_id) === String(id));
  const cardName = card => card.card_name || card.territory_name || card.name || "カード";
  const deckCards = deck => Array.isArray(deck?.cards) ? deck.cards : [];
  const count = deck => deckCards(deck).reduce((sum, card) => sum + Number(card.quantity || 1), 0);
  function setScreen(name) {
    state.screen = name;
    ["card-modal", "search-modal"].forEach(id => { if ($(id)) $(id).style.display = "none"; });
    $("card-search").hidden = name !== "search";
    $("deck-library-screen").hidden = name !== "decks";
    $("deck-builder-screen").hidden = name !== "builder";
    $("deck-preview-screen").hidden = name !== "preview";
    document.querySelectorAll("[data-screen]").forEach(button => button.classList.toggle("active", button.dataset.screen === (name === "search" ? "search" : "decks")));
    $("search-mode-button").classList.toggle("active", name === "search");
    $("deck-mode-button").classList.toggle("active", name !== "search");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (name === "decks") refreshDecks();
    if (name === "builder") renderBuilder();
    if (name === "preview") renderPreview();
  }
  function setStatus(message) { $("deck-library-status").textContent = message || ""; }
  async function refreshDecks() {
    const list = $("deck-library-list");
    list.innerHTML = "";
    if (state.tab === "mine" && !app()?.isSignedIn()) {
      setStatus("デッキを使うには、右上のメニューからログインしてください。");
      renderDeckTiles([]); return;
    }
    setStatus("デッキを読み込んでいます…");
    try {
      state.decks = state.tab === "mine" ? await app().listOwned() : await app().listPublic();
      renderDeckTiles(state.decks);
      setStatus(state.decks.length ? `${state.decks.length}件のデッキ` : (state.tab === "mine" ? "デッキはまだありません。「新しいデッキ」から作成できます。" : "公開デッキはまだありません。"));
    } catch (error) { setStatus(error.message || "デッキを読み込めませんでした。ログイン状態や通信を確認してください。"); }
  }
  function renderDeckTiles(decks) {
    const list = $("deck-library-list"); list.replaceChildren();
    const queryText = $("deck-search").value.trim().toLowerCase();
    const sort = $("deck-sort-select").value;
    let filtered = decks.filter(deck => !queryText || `${deck.name} ${(deck.tags || []).join(" ")}`.toLowerCase().includes(queryText));
    if (sort === "name") filtered.sort((a,b) => String(a.name).localeCompare(String(b.name), "ja"));
    if (sort === "count") filtered.sort((a,b) => count(b)-count(a));
    if (state.compact) list.classList.add("compact"); else list.classList.remove("compact");
    if (!filtered.length) { list.innerHTML = `<div class="empty-state">${queryText ? "条件に合うデッキはありません。" : (state.tab === "mine" ? "ここに作成したデッキが表示されます。" : "公開されているデッキがここに表示されます。")}</div>`; return; }
    filtered.forEach(deck => {
      const tile = document.createElement("button"); tile.type = "button"; tile.className = "deck-tile";
      const first = deckCards(deck).map(card => byItemId(card.itemId)?.image_url).find(Boolean);
      tile.innerHTML = `<div class="deck-cover" ${first ? `style="background:linear-gradient(#0003,#0007),url('${escapeHTML(first)}') center/cover"` : ""}>${first ? "" : "DECK"}</div><div class="deck-tile-top"><h2>${escapeHTML(deck.name || "名前のないデッキ")}</h2><span class="visibility-badge ${deck.isPublic ? "public" : ""}">${deck.isPublic ? "公開" : "非公開"}</span></div><p>${count(deck)}枚 · ${deckCards(deck).length}種類${deck.tags?.length ? ` · ${deck.tags.map(escapeHTML).join(" / ")}` : ""}</p>`;
      tile.addEventListener("click", () => openDeck(deck)); list.append(tile);
    });
  }
  async function openDeck(deck) {
    try { state.deck = state.tab === "mine" ? await app().select(deck.id) : app().viewPublic(deck); state.publicView = state.tab !== "mine"; setScreen("builder"); }
    catch (error) { setStatus(error.message || "デッキを開けませんでした。"); }
  }
  function renderBuilder() {
    const deck = state.deck || app()?.current(); if (!deck) { setScreen("decks"); return; }
    state.deck = deck; $("builder-deck-name").value = deck.name || "";
    $("deck-total-count").textContent = count(deck);
    $("deck-visibility-badge").textContent = deck.isPublic ? "公開" : "非公開";
    $("deck-visibility-badge").classList.toggle("public", !!deck.isPublic);
    $("builder-visibility-button").hidden = state.publicView;
    $("builder-save-settings-button").hidden = state.publicView;
    $("delete-current-deck").hidden = state.publicView;
    $("save-deck-button").hidden = state.publicView;
    $("builder-deck-name").disabled = state.publicView;
    $("builder-deck-tags").value = (deck.tags || []).join(", ");
    $("builder-deck-tags").disabled = state.publicView;
    $("public-deck-readonly-note").hidden = !state.publicView;
    $("builder-tools").hidden = state.publicView;
    $("builder-category-controls").hidden = state.publicView;
    $("builder-card-list").hidden = state.publicView;
    $("builder-load-more").hidden = true;
    const typeCounts = {};
    deckCards(deck).forEach(card => { const item = byItemId(card.itemId); const type = item?.card_type || item?.territory_type || "その他"; typeCounts[type] = (typeCounts[type] || 0) + Number(card.quantity || 1); });
    $("deck-type-stats").innerHTML = Object.entries(typeCounts).map(([type, number]) => `<span class="stat-chip">${escapeHTML(type)}<strong>${number}</strong></span>`).join("");
    const strip = $("selected-cards-strip"); strip.replaceChildren();
    if (!deckCards(deck).length) strip.innerHTML = `<div class="empty-state">カードがありません。下の一覧からカードを選んでください。</div>`;
    deckCards(deck).forEach(card => { const item = byItemId(card.itemId); const mini = document.createElement(state.publicView ? "div" : "button"); mini.className = "selected-card-mini"; if (!state.publicView) { mini.type = "button"; mini.title = `${card.name}：−1枚`; mini.addEventListener("click", () => changeQty(card.itemId, -1)); } mini.innerHTML = item?.image_url ? `<img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(card.name)}"><span>×${Number(card.quantity || 1)}</span>` : `<span class="mini-empty">${escapeHTML(card.name)} × ${Number(card.quantity || 1)}</span>`; strip.append(mini); });
    renderBuilderCards();
  }
  function renderBuilderCards() {
    if (state.publicView) { $("builder-card-list").replaceChildren(); $("builder-load-more").hidden = true; return; }
    const result = (window.appState?.currentSearchResults || allCards()).filter(item => !state.builderQuery || JSON.stringify(item).toLowerCase().includes(state.builderQuery.toLowerCase()));
    const list = $("builder-card-list"); list.classList.toggle("compact", state.compact); list.replaceChildren();
    if (!result.length) { $("builder-load-more").hidden = true; list.innerHTML = `<div class="empty-state">該当するカードがありません。</div>`; return; }
    const visible = result.slice(0, state.cardLimit);
    const selected = new Map(deckCards(state.deck).map(card => [String(card.itemId), Number(card.quantity || 1)]));
    visible.forEach(item => {
      const id = item.card_id || item.territory_id; const name = cardName(item); const tile = document.createElement("button"); tile.type = "button"; tile.className = "builder-card"; tile.title = `${name}をデッキに追加`;
      tile.innerHTML = `${item.image_url ? `<img loading="lazy" src="${escapeHTML(item.image_url)}" alt="${escapeHTML(name)}">` : `<div class="no-card-image">${escapeHTML(name)}</div>`}<span class="add-mark">＋</span>${selected.has(String(id)) ? `<span class="quantity-mark">×${selected.get(String(id))}</span>` : ""}<div class="builder-card-name">${escapeHTML(name)}</div>`;
      tile.addEventListener("click", () => state.publicView ? null : addCard(item)); list.append(tile);
    });
    $("builder-load-more").hidden = result.length <= state.cardLimit;
    $("builder-load-more").textContent = `さらに表示（残り ${result.length - state.cardLimit} 件）`;
  }
  async function addCard(item) {
    if (state.publicView) return;
    try { state.deck = await app().addCard(item); renderBuilder(); }
    catch (error) { alert(error.message || "カードを追加できませんでした。"); }
  }
  async function changeQty(id, delta) {
    try { state.deck = await app().changeQuantity(id, delta); renderBuilder(); }
    catch (error) { alert(error.message || "枚数を変更できませんでした。"); }
  }
  function renderPreview() {
    const deck = state.deck; if (!deck) return;
    $("preview-deck-name").textContent = deck.name || "デッキ";
    $("preview-total-count").textContent = `${count(deck)}枚`;
    const stamp = deck.updatedAt?.toDate?.(); $("preview-updated-at").textContent = `${stamp ? `更新日：${stamp.toLocaleDateString("ja-JP")}　` : ""}${deck.isPublic ? "公開デッキ" : "非公開デッキ"}`;
    const cards = deckCards(deck); const grid = $("preview-card-list"); grid.replaceChildren();
    if (!cards.length) grid.innerHTML = `<div class="empty-state">デッキにカードがありません。</div>`;
    cards.forEach(card => { const item = byItemId(card.itemId); const el = document.createElement("div"); el.className = "preview-card"; el.innerHTML = `${item?.image_url ? `<img loading="lazy" src="${escapeHTML(item.image_url)}" alt="${escapeHTML(card.name)}">` : ""}<span>${escapeHTML(card.name || "カード")}</span><b>×${Number(card.quantity || 1)}</b>`; grid.append(el); });
    $("preview-text-list").innerHTML = `<h2>${escapeHTML(deck.name)}</h2><p>合計 ${count(deck)}枚 / ${cards.length}種類</p><ol>${cards.map(card => `<li>${escapeHTML(card.name)} × ${Number(card.quantity || 1)}</li>`).join("")}</ol>`;
    $("preview-text-list").hidden = !state.previewText; grid.hidden = state.previewText;
  }
  function openModal(id) { const modal = $(id); if (modal) modal.style.display = "block"; }
  function readTags(text) { return [...new Set(String(text || "").split(/[、,，]/).map(tag => tag.trim()).filter(Boolean))].slice(0, 12).map(tag => tag.slice(0, 24)); }
  function exportDeck(deck) {
    const lines = [`${deck.name || "デッキ"}`, `タグ：${(deck.tags || []).join("、") || "なし"}`, `合計：${count(deck)}枚`, "", ...deckCards(deck).map(card => `${card.name || "カード"} × ${Number(card.quantity || 1)}`)];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(deck.name || "deck").replace(/[\\/:*?"<>|]/g, "_")}.txt`; link.click(); URL.revokeObjectURL(url);
  }
  function prepareSearchPanel() {
    const modal = $("search-modal-content");
    modal.querySelectorAll(".filter").forEach(filter => {
      const details = document.createElement("details"); details.className = "filter";
      const title = filter.querySelector(".filter-title");
      if (!title) return;
      const summary = document.createElement("summary"); summary.className = "filter-title"; summary.textContent = title.textContent.trim(); details.append(summary);
      const body = document.createElement("div"); body.className = "filter-body";
      while (filter.firstChild) { const child = filter.firstChild; filter.removeChild(child); if (child !== title) body.append(child); }
      details.append(body); filter.replaceWith(details);
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    prepareSearchPanel();
    document.querySelectorAll("[data-close-modal]").forEach(button => {
      button.addEventListener("click", () => {
        const modal = $(button.dataset.closeModal);
        if (modal) modal.style.display = "none";
        document.body.style.overflow = "";
      });
    });
    document.querySelectorAll("[data-screen]").forEach(button => button.addEventListener("click", () => setScreen(button.dataset.screen === "search" ? "search" : "decks")));
    $("deck-mode-button").addEventListener("click", () => setScreen("decks"));
    $("search-mode-button").addEventListener("click", () => setScreen("search"));
    $("home-button").addEventListener("click", () => setScreen("search"));
    $("display-toggle-button").addEventListener("click", () => { const next = window.appState.currentDisplayMode === "list" ? "icon" : "list"; if (window.setDisplayMode) window.setDisplayMode(next); $("icon-column-input").hidden = next !== "icon"; });
    $("icon-column-input").addEventListener("change", event => { const value = Math.max(1, Math.min(12, Number(event.target.value) || 1)); event.target.value = value; window.appState.currentIconColumns = value; if (window.applyIconGrid) window.applyIconGrid(); });
    $("menu-open-button").addEventListener("click", () => { const panel = $("menu-panel"); panel.hidden = !panel.hidden; $("menu-open-button").setAttribute("aria-expanded", String(!panel.hidden)); });
    $("account-open-button").addEventListener("click", () => {
      $("menu-panel").hidden = true;
      openModal("account-modal");
      if (location.protocol === "file:") {
        $("local-auth-notice").hidden = false;
        ["google-signin-button", "email-signin-button", "email-signup-button"].forEach(id => { const button = $(id); if (button) button.disabled = true; });
      }
    });
    $("new-deck-open-button").addEventListener("click", () => { if (!app()?.isSignedIn()) { $("menu-panel").hidden = false; openModal("account-modal"); if (location.protocol === "file:") { $("local-auth-notice").hidden = false; ["google-signin-button", "email-signin-button", "email-signup-button"].forEach(id => { const button = $(id); if (button) button.disabled = true; }); } return; } $("new-deck-panel").hidden = false; $("new-deck-screen-name").focus(); });
    $("new-deck-cancel-button").addEventListener("click", () => { $("new-deck-panel").hidden = true; });
    $("new-deck-panel").addEventListener("submit", async event => { event.preventDefault(); try { if (!readTags($("new-deck-tags").value).length) throw new Error("検索に使うデッキタグを1つ以上入力してください。"); state.deck = await app().create($("new-deck-screen-name").value, readTags($("new-deck-tags").value)); state.publicView = false; $("new-deck-screen-name").value = ""; $("new-deck-tags").value = ""; $("new-deck-panel").hidden = true; setScreen("builder"); } catch (error) { setStatus(error.message || "デッキを作成できませんでした。"); } });
    $("my-decks-tab").addEventListener("click", () => { state.tab = "mine"; state.publicView = false; $("my-decks-tab").classList.add("active"); $("public-decks-tab").classList.remove("active"); $("my-decks-tab").setAttribute("aria-selected", "true"); $("public-decks-tab").setAttribute("aria-selected", "false"); refreshDecks(); });
    $("public-decks-tab").addEventListener("click", () => { state.tab = "public"; $("public-decks-tab").classList.add("active"); $("my-decks-tab").classList.remove("active"); $("my-decks-tab").setAttribute("aria-selected", "false"); $("public-decks-tab").setAttribute("aria-selected", "true"); refreshDecks(); });
    $("deck-search").addEventListener("input", () => renderDeckTiles(state.decks)); $("deck-sort-select").addEventListener("change", () => renderDeckTiles(state.decks));
    $("deck-list-view-toggle").addEventListener("click", () => { state.compact = !state.compact; renderDeckTiles(state.decks); });
    document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => setScreen(button.dataset.back === "builder" ? "builder" : "decks")));
    $("builder-search").addEventListener("input", event => { state.builderQuery = event.target.value; renderBuilderCards(); });
    $("builder-load-more").addEventListener("click", () => { state.cardLimit += 120; renderBuilderCards(); });
    $("builder-filter-button").addEventListener("click", () => openModal("search-modal"));
    $("builder-grid-button").addEventListener("click", () => { state.compact = !state.compact; renderBuilderCards(); });
    $("builder-category-controls").innerHTML = `<button class="active" type="button" data-category="all">すべて</button><button type="button" data-category="card">カード</button><button type="button" data-category="territory">領地</button>`;
    $("builder-category-controls").addEventListener("click", event => { const button = event.target.closest("[data-category]"); if (!button) return; $("builder-category-controls").querySelectorAll("button").forEach(item => item.classList.toggle("active", item === button)); const category = button.dataset.category; $(`category-${category}-button`)?.click(); renderBuilderCards(); });
    $("builder-save-settings-button").addEventListener("click", async () => { try { state.deck = await app().updateSettings($("builder-deck-name").value, state.deck.isPublic, readTags($("builder-deck-tags").value)); setScreen("decks"); } catch (error) { alert(error.message); } });
    $("builder-visibility-button").addEventListener("click", async () => { const makePublic = !state.deck.isPublic; if (makePublic && !confirm("このデッキとカード一覧を、ほかの利用者に公開しますか？")) return; try { state.deck = await app().updateSettings($("builder-deck-name").value, makePublic, readTags($("builder-deck-tags").value)); renderBuilder(); } catch (error) { alert(error.message); } });
    $("save-deck-button").addEventListener("click", async () => { try { state.deck = await app().updateSettings($("builder-deck-name").value, state.deck.isPublic, readTags($("builder-deck-tags").value)); setScreen("decks"); } catch (error) { alert(error.message); } });
    $("delete-current-deck").addEventListener("click", async () => { if (!confirm(`「${state.deck?.name}」を削除します。この操作は取り消せません。`)) return; try { await app().deleteCurrent(); state.deck = null; setScreen("decks"); } catch (error) { alert(error.message); } });
    $("preview-deck-button").addEventListener("click", () => setScreen("preview")); $("print-deck-button").addEventListener("click", () => window.print());
    $("export-deck-button").addEventListener("click", () => exportDeck(state.deck)); $("preview-export-button").addEventListener("click", () => exportDeck(state.deck));
    $("preview-view-toggle").addEventListener("click", () => { state.previewText = !state.previewText; $("preview-view-toggle").textContent = state.previewText ? "カード表示" : "文字一覧"; renderPreview(); });
    window.addEventListener("animaldeck:authchange", () => { if (state.screen === "decks") refreshDecks(); });
  });
})();
