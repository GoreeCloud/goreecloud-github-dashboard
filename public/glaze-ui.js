export const GLAZE_UI_VERSION = "1.1.0";
export const GLAZE_UI_ACCEPTANCE = "pending";

function installGlazeStyle() {
  if (document.querySelector('link[data-glaze-ui-version="1.1.0"]')) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/glaze-v1.1.css";
  link.dataset.glazeUiVersion = GLAZE_UI_VERSION;
  document.head.append(link);
}

function synchronizeGlazeStatus() {
  document.documentElement.dataset.glazeUiVersion = GLAZE_UI_VERSION;
  document.documentElement.dataset.glazeUiAcceptance = GLAZE_UI_ACCEPTANCE;

  const footerItems = document.querySelectorAll(".page-footer span");
  if (footerItems.length >= 2) {
    footerItems[1].textContent = `Glaze UI ${GLAZE_UI_VERSION} · acceptance pending · read-only GitHub integration`;
  }
}

installGlazeStyle();
synchronizeGlazeStatus();
