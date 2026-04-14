this.cssSelectors = {
  root: ".loading-indicator",
  track: ".loading-indicator__track",
  label: ".loading-indicator__label",
};

this.renderLoadingInfo = function (data = {}) {
  const root = this.appendElement.querySelector(this.cssSelectors.root);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  const track = this.appendElement.querySelector(this.cssSelectors.track);
  if (!root || !label || !track) return;

  const nextLabel =
    data?.label === null || data?.label === undefined ? "" : String(data.label);
  const nextSize =
    data?.size === "sm" || data?.size === "lg" ? data.size : "md";
  const nextTone =
    data?.tone === "neutral" ||
    data?.tone === "success" ||
    data?.tone === "warning"
      ? data.tone
      : "accent";
  const isActive = data?.active !== false;

  root.dataset.size = nextSize;
  root.dataset.tone = nextTone;
  root.dataset.active = isActive ? "true" : "false";
  root.setAttribute("aria-busy", isActive ? "true" : "false");
  root.setAttribute("aria-label", nextLabel);
  label.textContent = nextLabel;
  label.hidden = nextLabel.length === 0;
  track.setAttribute("aria-hidden", "true");
};

this.renderLoadingInfo();
this.subscriptions = null;
this.customEvents = null;
