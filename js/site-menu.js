/*
 * メニュー内のガイドライン・お問い合わせ導線。
 * Googleフォームを作成したら CONTACT_FORM_URL に回答用URLを設定してください。
 */
(() => {
  "use strict";
  const CONTACT_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfLKJHIxJAL2eYq76iYS5BmuF2wbr8dOyTiJs8I77O2Lnym5Q/viewform?usp=publish-editor";

  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "block";
    const menu = document.getElementById("menu-panel");
    if (menu) menu.hidden = true;
    document.body.style.overflow = "hidden";
  }

  function safeFormUrl(raw) {
    try {
      const url = new URL(raw);
      const allowedHost = /(^|\.)forms\.gle$|(^|\.)docs\.google\.com$/.test(url.hostname);
      return url.protocol === "https:" && allowedHost ? url.href : "";
    } catch (_) {
      return "";
    }
  }

  document.getElementById("copyright-guidelines-open-button")?.addEventListener("click", () => {
    openModal("copyright-guidelines-modal");
  });

  document.getElementById("contact-form-open-button")?.addEventListener("click", () => {
    const formUrl = safeFormUrl(CONTACT_FORM_URL);
    if (formUrl) {
      window.open(formUrl, "_blank", "noopener,noreferrer");
      const menu = document.getElementById("menu-panel");
      if (menu) menu.hidden = true;
      return;
    }
    openModal("contact-form-modal");
  });

  const refreshButton = document.getElementById("refresh-card-data-button");
  const refreshStatus = document.getElementById("data-refresh-status");
  refreshButton?.addEventListener("click", () => {
    if (typeof window.loadCards !== "function") {
      if (refreshStatus) refreshStatus.textContent = "更新機能を読み込めませんでした。ページを再読み込みしてください。";
      return;
    }
    refreshButton.disabled = true;
    if (refreshStatus) refreshStatus.textContent = "最新データを取得しています……";
    window.loadCards(true, result => {
      refreshButton.disabled = false;
      if (!refreshStatus) return;
      refreshStatus.textContent = result?.success
        ? "データを更新しました。"
        : "更新できませんでした。保存済みデータがある場合は、そのデータを表示しています。時間をおいて再度お試しください。";
    });
  });
})();