/* Screen and deck-building interactions. Card search remains handled by the existing scripts. */
(() => {
  const $ = id => document.getElementById(id);
  const state = { screen: "search", tab: "mine", decks: [], deck: null, builderQuery: "", publicView: false, previewText: false, compact: false, addItem: null, pendingCard: null, cardLimit: 120, pile: "main", registeredTags: [], normalFilterState: null, builderFilterState: null, dragItemId: null, dragPile: null, ignoreRemoveUntil: 0 };
  const app = () => window.animalDeckApp;
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const allCards = () => [...(window.appState?.allCards || []), ...(window.appState?.allTerritories || [])];
  const byItemId = id => {
    const raw = String(id);
    if (raw.startsWith("card:") || raw.startsWith("territory:")) {
      const [kind, value] = [raw.slice(0, raw.indexOf(":")), raw.slice(raw.indexOf(":") + 1)];
      return allCards().find(item => String(kind === "territory" ? item.territory_id : item.card_id) === value);
    }
    return allCards().find(item => String(item.card_id || item.territory_id) === raw);
  };
  const cardName = card => card.card_name || card.territory_name || card.name || "カード";
  const deckCards = deck => Array.isArray(deck?.cards) ? deck.cards : [];
  const territoryCards = deck => Array.isArray(deck?.territoryCards) ? deck.territoryCards : [];
  const pileCards = (deck, pile = state.pile) => pile === "territory" ? territoryCards(deck) : deckCards(deck);
  const allPileCards = deck => [...deckCards(deck), ...territoryCards(deck)];
  const count = deck => allPileCards(deck).reduce((sum, card) => sum + Number(card.quantity || 1), 0);
  function captureSearchFilters() {
    const root = $("search-modal-content");
    if (!root) return [];
    return Array.from(root.querySelectorAll("input, select")).map(element => ({
      type: element.type,
      value: element.value,
      checked: element.type === "checkbox" ? element.checked : undefined
    }));
  }

  function applySearchFilters(snapshot) {
    if (!Array.isArray(snapshot)) return;
    const root = $("search-modal-content");
    if (!root) return;
    const controls = Array.from(root.querySelectorAll("input, select"));
    snapshot.forEach((saved, index) => {
      const element = controls[index];
      if (!element) return;
      if (saved.type === "checkbox") element.checked = Boolean(saved.checked);
      else element.value = saved.value;
    });
  }

  function clearSearchFilters() {
    const root = $("search-modal-content");
    if (!root) return;
    root.querySelectorAll("input, select").forEach(element => {
      if (element.type === "checkbox" || element.type === "radio") {
        element.checked = false;
      } else {
        element.value = "";
      }
    });
  }

  function setBuilderPile(pile) {
    state.pile = pile === "territory" ? "territory" : "main";
    const territory = state.pile === "territory";
    $("main-pile-tab").classList.toggle("active", !territory);
    $("territory-pile-tab").classList.toggle("active", territory);
    $("main-pile-tab").setAttribute("aria-selected", String(!territory));
    $("territory-pile-tab").setAttribute("aria-selected", String(territory));
    renderBuilder();
  }

  function setScreen(name) {
    const previousScreen = state.screen;
    if (previousScreen !== "builder" && name === "builder") {
      state.normalFilterState = captureSearchFilters();
      if (state.builderFilterState) {
        applySearchFilters(state.builderFilterState);
      } else {
        clearSearchFilters();
        state.builderFilterState = captureSearchFilters();
      }
    } else if (previousScreen === "builder" && name !== "builder") {
      state.builderFilterState = captureSearchFilters();
      if (state.normalFilterState) applySearchFilters(state.normalFilterState);
    }
    state.screen = name;
    window.animalDeckBuilderSearchActive = name === "builder";
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
    if (name === "builder") { renderBuilder(); }
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
      const first = allPileCards(deck).map(card => byItemId(card.itemId)?.image_url).find(Boolean);
      tile.innerHTML = `<div class="deck-cover" ${first ? `style="background:linear-gradient(#0003,#0007),url('${escapeHTML(first)}') center/cover"` : ""}>${first ? "" : "DECK"}</div><div class="deck-tile-top"><h2>${escapeHTML(deck.name || "名前のないデッキ")}</h2><span class="visibility-badge ${deck.isPublic ? "public" : ""}">${deck.isPublic ? "公開" : "非公開"}</span></div><p>${count(deck)}枚 · ${allPileCards(deck).length}種類${deck.tags?.length ? ` · ${deck.tags.map(escapeHTML).join(" / ")}` : ""}</p>`;
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
    renderTagOptions("builder-deck-tag-options", deck.tags || [], state.publicView);
    $("public-deck-readonly-note").hidden = !state.publicView;
    $("builder-tools").hidden = state.publicView;
    $("builder-card-list").hidden = state.publicView;
    $("builder-load-more").hidden = true;
    const typeCounts = {};
    allPileCards(deck).forEach(card => { const item = byItemId(card.itemId); const type = item?.card_type || item?.territory_type || "その他"; typeCounts[type] = (typeCounts[type] || 0) + Number(card.quantity || 1); });
    $("deck-type-stats").innerHTML = Object.entries(typeCounts).map(([type, number]) => `<span class="stat-chip">${escapeHTML(type)}<strong>${number}</strong></span>`).join("");
    const strip = $("selected-cards-strip"); strip.replaceChildren();
    if (!strip.dataset.dropEndReady) {
      strip.dataset.dropEndReady = "true";
      strip.addEventListener("dragover", event => {
        if (event.target === strip && state.dragItemId != null) event.preventDefault();
      });
      strip.addEventListener("drop", event => {
        if (event.target !== strip || state.dragItemId == null) return;
        event.preventDefault();
        const sourceId = state.dragItemId;
        const sourcePile = state.dragPile || state.pile;
        state.ignoreRemoveUntil = Date.now() + 500;
        void moveCardTo(sourceId, null, sourcePile);
      });
    }
    const activeCards = pileCards(deck);
    $("selected-pile-count").textContent = `${state.pile === "main" ? "メインデッキ" : "領地デッキ"}：${activeCards.reduce((sum, card) => sum + Number(card.quantity || 1), 0)}枚`;
    if (!activeCards.length) strip.innerHTML = `<div class="empty-state">このデッキにはまだカードがありません。</div>`;
    activeCards.forEach((card, index) => {
      const item = byItemId(card.itemId);
      const mini = document.createElement("div");
      mini.className = "selected-card-mini";
      if (!state.publicView) {
        mini.draggable = true;
        mini.title = `${card.name}：ドラッグして並び替え`;
        mini.addEventListener("dragstart", event => {
          state.dragItemId = card.itemId;
          state.dragPile = state.pile;
          mini.classList.add("is-dragging");
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(card.itemId));
          }
        });
        mini.addEventListener("dragover", event => {
          if (state.dragItemId == null || String(state.dragItemId) === String(card.itemId) || state.dragPile !== state.pile) return;
          event.preventDefault();
          if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
          mini.classList.add("is-drag-over");
        });
        mini.addEventListener("dragleave", event => {
          if (!mini.contains(event.relatedTarget)) mini.classList.remove("is-drag-over");
        });
        mini.addEventListener("drop", event => {
          event.preventDefault();
          mini.classList.remove("is-drag-over");
          const sourceId = state.dragItemId ?? event.dataTransfer?.getData("text/plain");
          const sourcePile = state.dragPile || state.pile;
          state.ignoreRemoveUntil = Date.now() + 500;
          if (sourceId != null && String(sourceId) !== String(card.itemId)) {
            void moveCardTo(sourceId, card.itemId, sourcePile);
          }
        });
        mini.addEventListener("dragend", () => {
          state.dragItemId = null;
          state.dragPile = null;
          strip.querySelectorAll(".is-dragging, .is-drag-over").forEach(element => element.classList.remove("is-dragging", "is-drag-over"));
        });
      }

      const imageButton = document.createElement(state.publicView ? "div" : "button");
      imageButton.className = "selected-card-mini-image";
      if (!state.publicView) {
        imageButton.classList.add("has-controls");
        imageButton.type = "button";
        imageButton.draggable = true;
        imageButton.title = `${card.name}：ドラッグで順番変更／クリックで1枚減らす`;
        imageButton.setAttribute("aria-label", `${card.name}をドラッグして並べ替え、クリックで1枚減らす`);
        imageButton.addEventListener("click", () => {
          if (Date.now() < state.ignoreRemoveUntil) return;
          changeQty(card.itemId, -1);
        });
      }
      imageButton.innerHTML = item?.image_url
        ? `<img src="${escapeHTML(item.image_url)}" alt="${escapeHTML(card.name)}">`
        : `<span class="mini-empty">${escapeHTML(card.name)}</span>`;

      const quantityMark = document.createElement("span");
      quantityMark.className = "selected-card-quantity";
      quantityMark.textContent = `×${Number(card.quantity || 1)}`;

      mini.append(imageButton, quantityMark);

      if (!state.publicView) {
        const reorder = document.createElement("div");
        reorder.className = "selected-card-mini-reorder";

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "selected-card-move-button";
        previous.textContent = "←";
        previous.title = "前の位置へ移動";
        previous.setAttribute("aria-label", `${card.name}を前の位置へ移動`);
        previous.disabled = index === 0;
        previous.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          moveCard(card.itemId, -1);
        });

        const next = document.createElement("button");
        next.type = "button";
        next.className = "selected-card-move-button";
        next.textContent = "→";
        next.title = "次の位置へ移動";
        next.setAttribute("aria-label", `${card.name}を次の位置へ移動`);
        next.disabled = index === activeCards.length - 1;
        next.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();
          moveCard(card.itemId, 1);
        });

        reorder.append(previous, next);
        mini.append(reorder);
      }

      strip.append(mini);
    });
    renderBuilderCards();
  }
  function renderBuilderCards() {
    if (state.publicView) { $("builder-card-list").replaceChildren(); $("builder-load-more").hidden = true; return; }
    const source = state.pile === "territory"
      ? (window.appState?.allTerritories || [])
      : (window.appState?.allCards || []);
    const result = window.searchCards
      ? (window.searchCards({
          data: source,
          keywordInputId: "builder-search",
          builderInternal: true
        }) || [])
      : source;
    const list = $("builder-card-list"); list.classList.toggle("compact", state.compact); list.replaceChildren();
    if (!result.length) { $("builder-load-more").hidden = true; list.innerHTML = `<div class="empty-state">該当するカードがありません。</div>`; return; }
    const visible = result.slice(0, state.cardLimit);
    const activeCards = pileCards(state.deck);
    const itemKeyForCard = card => {
      const raw = String(card.itemId || "");
      if (raw.startsWith("card:") || raw.startsWith("territory:")) return raw;
      return `${state.pile === "territory" ? "territory" : "card"}:${raw}`;
    };
    const selected = new Map(activeCards.map(card => [itemKeyForCard(card), card]));

    visible.forEach(item => {
      const territory = (window.appState?.allTerritories || []).includes(item) || Boolean(item.territory_id);
      const id = territory ? `territory:${item.territory_id}` : `card:${item.card_id}`;
      const name = cardName(item);
      const selectedCard = selected.get(String(id));
      const quantity = Number(selectedCard?.quantity || 0);
      const tile = document.createElement("div");
      tile.className = "builder-card";

      const detailButton = document.createElement("button");
      detailButton.type = "button";
      detailButton.className = "builder-card-detail";
      detailButton.title = `${name}の詳細を表示`;
      detailButton.setAttribute("aria-label", `${name}の詳細を表示`);
      detailButton.innerHTML = `${item.image_url ? `<img loading="lazy" src="${escapeHTML(item.image_url)}" alt="">` : `<div class="no-card-image">${escapeHTML(name)}</div>`}<div class="builder-card-name">${escapeHTML(name)}</div>`;
      detailButton.addEventListener("click", () => {
        state.pendingCard = item;
        if (typeof window.showCardDetail === "function") {
          window.showCardDetail(item, { deckBuilder: !state.publicView });
        }
      });

      if (quantity > 0) {
        const quantityMark = document.createElement("span");
        quantityMark.className = "quantity-mark";
        quantityMark.textContent = `×${quantity}`;
        tile.append(quantityMark);
      }

      const actions = document.createElement("div");
      actions.className = "builder-card-actions";

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "builder-card-remove";
      removeButton.textContent = "−";
      removeButton.title = quantity > 0 ? `${name}を1枚減らす` : "デッキに入っていません";
      removeButton.setAttribute("aria-label", `${name}を1枚減らす`);
      removeButton.disabled = !selectedCard || state.publicView;
      removeButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (selectedCard && !state.publicView) changeQty(selectedCard.itemId, -1);
      });

      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "builder-card-add";
      addButton.textContent = "＋";
      addButton.title = `${name}をデッキに1枚追加`;
      addButton.setAttribute("aria-label", `${name}をデッキに1枚追加`);
      addButton.disabled = state.publicView;
      addButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (!state.publicView) addCard(item);
      });

      actions.append(removeButton, addButton);
      tile.append(detailButton, actions);
      list.append(tile);
    });
    $("builder-load-more").hidden = result.length <= state.cardLimit;
    $("builder-load-more").textContent = `さらに表示（残り ${result.length - state.cardLimit} 件）`;
  }
  window.animalDeckBuilderSearch = () => {
    if (state.screen === "builder") renderBuilderCards();
  };

  async function addCard(item) {
    if (state.publicView || !item) return;
    try {
      state.deck = await app().addCard(item, state.pile);
      state.pendingCard = null;
      if (typeof window.closeCardDetail === "function") window.closeCardDetail();
      renderBuilder();
    } catch (error) {
      alert(error.message || "カードを追加できませんでした。");
    }
  }
  async function changeQty(id, delta) {
    try { state.deck = await app().changeQuantity(id, delta, state.pile); renderBuilder(); }
    catch (error) { alert(error.message || "枚数を変更できませんでした。"); }
  }

  async function moveCard(itemId, direction) {
    if (state.publicView) return;
    try {
      const pile = state.pile;
      const field = pile === "territory" ? "territoryCards" : "cards";
      const cards = [...(state.deck?.[field] || [])];
      const fromIndex = cards.findIndex(card => String(card.itemId) === String(itemId));
      const toIndex = fromIndex + Number(direction || 0);
      if (fromIndex < 0 || toIndex < 0 || toIndex >= cards.length) return;

      [cards[fromIndex], cards[toIndex]] = [cards[toIndex], cards[fromIndex]];
      state.deck = await app().saveCards(cards, pile);
      renderBuilder();
    } catch (error) {
      alert(error.message || "カードの順番を変更できませんでした。");
    }
  }
  async function moveCardTo(itemId, targetItemId, pile = state.pile) {
    if (state.publicView) return;
    try {
      const field = pile === "territory" ? "territoryCards" : "cards";
      const cards = [...(state.deck?.[field] || [])];
      const fromIndex = cards.findIndex(card => String(card.itemId) === String(itemId));
      const targetIndex = targetItemId == null
        ? cards.length
        : cards.findIndex(card => String(card.itemId) === String(targetItemId));
      if (fromIndex < 0 || targetIndex < 0 || targetIndex > cards.length) return;
      if (targetItemId == null && fromIndex === cards.length - 1) return;

      const [moving] = cards.splice(fromIndex, 1);
      const insertIndex = targetItemId == null ? cards.length : (fromIndex < targetIndex ? targetIndex - 1 : targetIndex);
      cards.splice(insertIndex, 0, moving);
      state.deck = await app().saveCards(cards, pile);
      renderBuilder();
    } catch (error) {
      alert(error.message || "カードの順番を変更できませんでした。");
    } finally {
      state.dragItemId = null;
      state.dragPile = null;
      document.querySelectorAll(".is-dragging, .is-drag-over").forEach(element => element.classList.remove("is-dragging", "is-drag-over"));
    }
  }

  function renderPreview() {
    const deck = state.deck; if (!deck) return;
    $("preview-deck-name").textContent = deck.name || "デッキ";
    $("preview-total-count").textContent = `${count(deck)}枚`;
    const stamp = deck.updatedAt?.toDate?.(); $("preview-updated-at").textContent = `${stamp ? `更新日：${stamp.toLocaleDateString("ja-JP")}　` : ""}${deck.isPublic ? "公開デッキ" : "非公開デッキ"}`;
    const cards = [...deckCards(deck), ...territoryCards(deck)]; const grid = $("preview-card-list"); grid.replaceChildren();
    if (!cards.length) grid.innerHTML = `<div class="empty-state">デッキにカードがありません。</div>`;
    cards.forEach(card => { const item = byItemId(card.itemId); const el = document.createElement("div"); el.className = "preview-card"; el.innerHTML = `${item?.image_url ? `<img loading="lazy" src="${escapeHTML(item.image_url)}" alt="${escapeHTML(card.name)}">` : ""}<span>${escapeHTML(card.name || "カード")}</span><b>×${Number(card.quantity || 1)}</b>`; grid.append(el); });
    $("preview-text-list").innerHTML = `<h2>${escapeHTML(deck.name)}</h2><p>合計 ${count(deck)}枚 / ${cards.length}種類</p><ol>${cards.map(card => `<li>${escapeHTML(card.name)} × ${Number(card.quantity || 1)}</li>`).join("")}</ol>`;
    $("preview-text-list").hidden = !state.previewText; grid.hidden = state.previewText;
  }
  function openModal(id) { const modal = $(id); if (modal) modal.style.display = "block"; }
  function readTags(text) { return [...new Set(String(text || "").split(/[、,，]/).map(tag => tag.trim()).filter(Boolean))].slice(0, 12).map(tag => tag.slice(0, 24)); }
  function exportDeck(deck) {
    const data = { format: "animal-card-game-deck", version: 1, name: deck.name || "デッキ", tags: deck.tags || [], exportedAt: new Date().toISOString(), mainCards: deckCards(deck).map(card => ({ itemId: String(card.itemId).startsWith("card:") ? String(card.itemId).slice(5) : String(card.itemId), name: card.name || "カード", quantity: Number(card.quantity || 1) })), territoryCards: territoryCards(deck).map(card => ({ itemId: String(card.itemId).startsWith("territory:") ? String(card.itemId).slice(10) : String(card.itemId), name: card.name || "領地", quantity: Number(card.quantity || 1) })) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${(deck.name || "deck").replace(/[\\/:*?"<>|]/g, "_")}.animaldeck.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function renderTagOptions(containerId, selected = [], disabled = false) {
    const container = $(containerId); if (!container) return;
    const selectedSet = new Set(selected);
    container.replaceChildren();
    if (!state.registeredTags.length) { container.textContent = "メニューから先にデッキタグを登録してください。"; return; }
    state.registeredTags.forEach(tag => {
      const label = document.createElement("label"); const input = document.createElement("input");
      input.type = "checkbox"; input.value = tag; input.checked = selectedSet.has(tag); input.disabled = disabled;
      input.addEventListener("change", () => { if (containerId === "builder-deck-tag-options") state.deck.tags = readTagChecks(containerId); });
      label.append(input, document.createTextNode(tag)); container.append(label);
    });
  }
  function readTagChecks(containerId) { return Array.from($(containerId)?.querySelectorAll("input:checked") || []).map(input => input.value); }
  async function refreshTagOptions() {
    state.registeredTags = app()?.isSignedIn() ? await app().listDeckTags() : [];
    renderTagOptions("new-deck-tag-options");
    renderTagOptions("builder-deck-tag-options", state.deck?.tags || [], state.publicView);
    const list = $("deck-tag-list"); if (list) { list.replaceChildren(); state.registeredTags.forEach(tag => { const item = document.createElement("li"); item.textContent = tag; list.append(item); }); if (!state.registeredTags.length) list.textContent = "登録済みタグはありません。"; }
  }
  async function importDeckFile(file) {
    try {
      const data = JSON.parse(await file.text());
      state.deck = await app().importDeck(data); state.publicView = false; setStatus("デッキを読み込み、コピーを作成しました。"); setScreen("builder");
    } catch (error) { setStatus(error.message || "デッキファイルを読み込めませんでした。"); }
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
    $("new-deck-panel").addEventListener("submit", async event => { event.preventDefault(); try { state.deck = await app().create($("new-deck-screen-name").value, readTagChecks("new-deck-tag-options")); state.publicView = false; $("new-deck-screen-name").value = ""; $("new-deck-panel").hidden = true; setScreen("builder"); } catch (error) { setStatus(error.message || "デッキを作成できませんでした。"); } });
    $("deck-tags-open-button").addEventListener("click", async () => { $("menu-panel").hidden = true; openModal("deck-tags-modal"); await refreshTagOptions(); });
    $("deck-tag-form").addEventListener("submit", async event => { event.preventDefault(); try { state.registeredTags = await app().addDeckTag($("deck-tag-name").value); $("deck-tag-name").value = ""; $("deck-tag-status").textContent = "タグを登録しました。"; await refreshTagOptions(); } catch (error) { $("deck-tag-status").textContent = error.message || "タグを登録できませんでした。"; } });
    $("import-deck-button").addEventListener("click", () => { if (!app()?.isSignedIn()) { setStatus("デッキを読み込むにはログインしてください。"); return; } $("import-deck-file").click(); });
    $("import-deck-file").addEventListener("change", event => { const file = event.target.files?.[0]; if (file) importDeckFile(file); event.target.value = ""; });
    $("my-decks-tab").addEventListener("click", () => { state.tab = "mine"; state.publicView = false; $("my-decks-tab").classList.add("active"); $("public-decks-tab").classList.remove("active"); $("my-decks-tab").setAttribute("aria-selected", "true"); $("public-decks-tab").setAttribute("aria-selected", "false"); refreshDecks(); });
    $("public-decks-tab").addEventListener("click", () => { state.tab = "public"; $("public-decks-tab").classList.add("active"); $("my-decks-tab").classList.remove("active"); $("my-decks-tab").setAttribute("aria-selected", "false"); $("public-decks-tab").setAttribute("aria-selected", "true"); refreshDecks(); });
    $("deck-search").addEventListener("input", () => renderDeckTiles(state.decks)); $("deck-sort-select").addEventListener("change", () => renderDeckTiles(state.decks));
    $("deck-list-view-toggle").addEventListener("click", () => { state.compact = !state.compact; renderDeckTiles(state.decks); });
    document.querySelectorAll("[data-back]").forEach(button => button.addEventListener("click", () => setScreen(button.dataset.back === "builder" ? "builder" : "decks")));
    const applyBuilderSearch = () => { state.builderQuery = $("builder-search").value; renderBuilderCards(); };
    $("builder-search").addEventListener("input", applyBuilderSearch);
    $("reset-button").addEventListener("click", () => {
      if (state.screen === "builder") {
        state.builderQuery = "";
        $("builder-search").value = "";
      }
    }, true);
    window.addEventListener("animaldeck:searchresultschange", () => { if (state.screen === "builder") renderBuilderCards(); });
    $("builder-load-more").addEventListener("click", () => { state.cardLimit += 120; renderBuilderCards(); });
    $("builder-filter-button").addEventListener("click", () => openModal("search-modal"));
    $("builder-grid-button").addEventListener("click", () => { state.compact = !state.compact; renderBuilderCards(); });
    $("detail-add-to-deck-button").addEventListener("click", () => {
      if (state.screen === "builder" && !state.publicView && state.pendingCard) {
        addCard(state.pendingCard);
      }
    });
    const selectedDeckTags = () => readTagChecks("builder-deck-tag-options");
    $("main-pile-tab").addEventListener("click", () => setBuilderPile("main"));
    $("territory-pile-tab").addEventListener("click", () => setBuilderPile("territory"));
    $("builder-save-settings-button").addEventListener("click", async () => { try { state.deck = await app().updateSettings($("builder-deck-name").value, state.deck.isPublic, selectedDeckTags()); setScreen("decks"); } catch (error) { alert(error.message); } });
    $("builder-visibility-button").addEventListener("click", async () => { const makePublic = !state.deck.isPublic; if (makePublic && !confirm("このデッキとカード一覧を、ほかの利用者に公開しますか？")) return; try { state.deck = await app().updateSettings($("builder-deck-name").value, makePublic, selectedDeckTags()); renderBuilder(); } catch (error) { alert(error.message); } });
    $("save-deck-button").addEventListener("click", async () => { try { state.deck = await app().updateSettings($("builder-deck-name").value, state.deck.isPublic, selectedDeckTags()); setScreen("decks"); } catch (error) { alert(error.message); } });
    $("delete-current-deck").addEventListener("click", async () => { if (!confirm(`「${state.deck?.name}」を削除します。この操作は取り消せません。`)) return; try { await app().deleteCurrent(); state.deck = null; setScreen("decks"); } catch (error) { alert(error.message); } });
    $("preview-deck-button").addEventListener("click", () => setScreen("preview")); $("print-deck-button").addEventListener("click", () => window.print());
    $("export-deck-button").addEventListener("click", () => exportDeck(state.deck)); $("preview-export-button").addEventListener("click", () => exportDeck(state.deck));
    $("preview-view-toggle").addEventListener("click", () => { state.previewText = !state.previewText; $("preview-view-toggle").textContent = state.previewText ? "カード表示" : "文字一覧"; renderPreview(); });
    window.addEventListener("animaldeck:authchange", () => { refreshTagOptions(); if (state.screen === "decks") refreshDecks(); });
  });
})();
