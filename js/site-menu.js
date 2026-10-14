/*
 * メニュー内のガイドライン・お問い合わせ導線。
 * Googleフォームを作成したら CONTACT_FORM_URL に回答用URLを設定してください。
 */
(() => {
  "use strict";
  const CONTACT_FORM_URL = "";

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
})();