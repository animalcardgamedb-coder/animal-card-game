/*
 * Shared user-defined tags for cards and territories.
 * The tag catalogue and card assignments are stored in GAS-backed Sheets.
 */
(() => {
  const $ = id => document.getElementById(id);
  let currentItem = null;

  const itemId = item => String(item?.card_id || item?.territory_id || item?.id || "").trim();
  const itemType = item => item?.territory_id ? "territory" : "card";
  const tags = () => Array.isArray(window.appState?.userTags) ? window.appState.userTags : [];
  const assignments = () => Array.isArray(window.appState?.cardUserTags) ? window.appState.cardUserTags : [];
  const tagId = tag => String(tag?.tag_id || "");
  const tagName = tag => String(tag?.tag_name || "");

  window.applyUserTagsToData = function() {
    const lookup = new Map();
    assignments().forEach(row => {
      const id = String(row?.item_id || "").trim();
      const tId = String(row?.tag_id || "").trim();
      if (!id || !tId) return;
      if (!lookup.has(id)) lookup.set(id, []);
      if (!lookup.get(id).includes(tId)) lookup.get(id).push(tId);
    });

    const tagNames = new Map(tags().map(tag => [tagId(tag), tagName(tag)]));
    const all = [
      ...(window.appState?.allCards || []),
      ...(window.appState?.allTerritories || [])
    ];
    all.forEach(item => {
      const ids = lookup.get(itemId(item)) || [];
      item.user_tag_ids = ids.slice();
      item.user_tags = ids.map(id => tagNames.get(id)).filter(Boolean);
    });
    if (window.appState) {
      window.appState.allData = all;
      window.appState.cardUserTags = assignments();
    }
  };

  function selectedFilterIds() {
    return Array.from($("user-tag-filter")?.querySelectorAll("input[type=checkbox]:checked") || [])
      .map(input => input.value);
  }

  window.renderUserTagFilter = function() {
    const container = $("user-tag-filter");
    if (!container) return;
    const selected = new Set(selectedFilterIds());
    container.replaceChildren();
    const catalog = [...tags()].sort((a, b) => tagName(a).localeCompare(tagName(b), "ja"));
    catalog.forEach(tag => {
      const id = tagId(tag);
      const name = tagName(tag);
      if (!id || !name) return;
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = id;
      checkbox.checked = selected.has(id);
      checkbox.addEventListener("change", () => window.searchCards?.());
      label.append(checkbox, document.createTextNode(name));
      container.append(label);
    });
    if (!catalog.length) {
      container.textContent = "タグはまだありません。メニューから作成できます。";
    }
  };

  function renderUserTagList() {
    const list = $("user-tag-list");
    if (!list) return;
    list.replaceChildren();
    const catalog = [...tags()].sort((a, b) => tagName(a).localeCompare(tagName(b), "ja"));
    catalog.forEach(tag => {
      const li = document.createElement("li");
      li.className = "user-tag-list-item";
      const name = document.createElement("span");
      name.textContent = tagName(tag);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "danger-button user-tag-delete-button";
      remove.textContent = "削除";
      remove.setAttribute("aria-label", tagName(tag) + "を削除");
      remove.addEventListener("click", async () => {
        if (!window.confirm("ユーザータグ「" + tagName(tag) + "」を削除しますか？\nこのタグが付いたカード・領地からも外れます。")) return;
        setStatus("user-tag-status", "タグを削除しています……");
        try {
          const data = await postAction({ action: "deleteUserTag", tagId: tagId(tag) });
          applyTagResponse(data);
          setStatus("user-tag-status", "「" + tagName(tag) + "」を削除しました。");
        } catch (error) {
          setStatus("user-tag-status", error.message || "タグを削除できませんでした。");
        }
      });
      li.append(name, remove);
      list.append(li);
    });
    if (!catalog.length) {
      const li = document.createElement("li");
      li.textContent = "タグはまだ登録されていません。";
      list.append(li);
    }
  }

  function setStatus(id, message) {
    const element = $(id);
    if (element) element.textContent = message;
  }

  async function postAction(payload) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok || !data || data.success !== true) {
      throw new Error(data?.error || "GASとの通信に失敗しました。");
    }
    return data;
  }

  function applyTagResponse(data) {
    if (!window.appState) return;
    if (Array.isArray(data.userTags)) window.appState.userTags = data.userTags;
    if (Array.isArray(data.cardUserTags)) window.appState.cardUserTags = data.cardUserTags;
    window.applyUserTagsToData?.();
    window.renderUserTagFilter?.();
    renderUserTagList();
    if (currentItem) window.renderCardUserTagEditor?.(currentItem);
    if (window.appState.allData?.length) window.searchCards?.();
  }

  window.renderCardUserTagEditor = function(item) {
    currentItem = item || null;
    const container = $("detail-user-tag-options");
    const saveButton = $("save-card-user-tags-button");
    if (!container || !item) return;
    const selected = new Set((item.user_tag_ids || []).map(String));
    container.replaceChildren();
    const catalog = [...tags()].sort((a, b) => tagName(a).localeCompare(tagName(b), "ja"));
    catalog.forEach(tag => {
      const id = tagId(tag);
      const name = tagName(tag);
      if (!id || !name) return;
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = id;
      checkbox.checked = selected.has(id);
      label.append(checkbox, document.createTextNode(name));
      container.append(label);
    });
    if (!catalog.length) {
      container.textContent = "タグはまだありません。先にメニューの「ユーザータグ一覧」から登録してください。";
    }
    setStatus("detail-user-tag-status", "");
    if (saveButton) saveButton.disabled = false;
  };

  async function saveCardUserTags() {
    if (!currentItem) return;
    const saveButton = $("save-card-user-tags-button");
    const selected = Array.from($("detail-user-tag-options")?.querySelectorAll("input[type=checkbox]:checked") || [])
      .map(input => input.value);
    if (saveButton) saveButton.disabled = true;
    setStatus("detail-user-tag-status", "タグを保存しています……");
    try {
      const data = await postAction({
        action: "setCardUserTags",
        itemId: itemId(currentItem),
        itemType: itemType(currentItem),
        tagIds: selected
      });
      applyTagResponse(data);
      setStatus("detail-user-tag-status", "タグを保存しました。");
    } catch (error) {
      setStatus("detail-user-tag-status", error.message || "タグを保存できませんでした。");
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  }

  async function addUserTag(event) {
    event.preventDefault();
    const input = $("user-tag-name");
    const value = String(input?.value || "").trim();
    if (!value) {
      setStatus("user-tag-status", "タグ名を入力してください。");
      return;
    }
    const submit = $("user-tag-form")?.querySelector("button[type=submit]");
    if (submit) submit.disabled = true;
    setStatus("user-tag-status", "タグを登録しています……");
    try {
      const data = await postAction({ action: "addUserTag", tagName: value });
      applyTagResponse(data);
      if (input) input.value = "";
      setStatus("user-tag-status", "「" + value + "」を登録しました。");
    } catch (error) {
      setStatus("user-tag-status", error.message || "タグを登録できませんでした。");
    } finally {
      if (submit) submit.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("user-tags-open-button")?.addEventListener("click", () => {
      renderUserTagList();
      setStatus("user-tag-status", "");
      $("user-tags-modal").style.display = "block";
      document.body.style.overflow = "hidden";
    });
    $("user-tags-close-button")?.addEventListener("click", () => {
      $("user-tags-modal").style.display = "none";
      if ($("card-modal")?.style.display !== "block") document.body.style.overflow = "";
    });
    $("user-tags-modal")?.addEventListener("click", event => {
      if (event.target.id !== "user-tags-modal") return;
      $("user-tags-modal").style.display = "none";
      if ($("card-modal")?.style.display !== "block") document.body.style.overflow = "";
    });
    $("user-tag-form")?.addEventListener("submit", addUserTag);
    $("save-card-user-tags-button")?.addEventListener("click", saveCardUserTags);
  });
})();
