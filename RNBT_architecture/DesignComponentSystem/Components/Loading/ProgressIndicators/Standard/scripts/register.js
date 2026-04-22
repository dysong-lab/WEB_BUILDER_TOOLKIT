// ======================
// 1. selector + 자체 메서드 정의
// ======================

this.cssSelectors = {
  root: ".progress-indicator",
  label: ".progress-indicator__label",
  value: ".progress-indicator__value",
  linearFill: ".progress-indicator__linear-fill",
  circularMeter: ".progress-indicator__circular-meter",
};

this._progressAnimationTimer = null;

this.animateProgressEntry = function (root, linearFill, circularMeter, percent) {
  if (!root || !linearFill || !circularMeter) return;

  if (this._progressAnimationTimer) {
    clearTimeout(this._progressAnimationTimer);
    this._progressAnimationTimer = null;
  }

  root.dataset.animateOnce = "true";
  linearFill.style.width = "0%";
  circularMeter.style.strokeDashoffset = "100";

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      linearFill.style.width = `${percent}%`;
      circularMeter.style.strokeDashoffset = `${100 - percent}`;
      root.dataset.hasAnimated = "true";
      this._progressAnimationTimer = setTimeout(() => {
        if (root) root.dataset.animateOnce = "false";
        this._progressAnimationTimer = null;
      }, 720);
    });
  });
};

this.renderProgressInfo = function (data = {}) {
  const root = this.appendElement.querySelector(this.cssSelectors.root);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  const value = this.appendElement.querySelector(this.cssSelectors.value);
  const linearFill = this.appendElement.querySelector(this.cssSelectors.linearFill);
  const circularMeter = this.appendElement.querySelector(this.cssSelectors.circularMeter);
  if (!root || !label || !value || !linearFill || !circularMeter) return;

  const kind = data?.kind === "circular" ? "circular" : "linear";
  const tone =
    data?.tone === "neutral" ||
    data?.tone === "success" ||
    data?.tone === "warning"
      ? data.tone
      : "accent";
  const indeterminate = data?.indeterminate === true;
  const maxValue = Number(data?.max);
  const max = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 100;
  const rawValue = Number(data?.value);
  const current = Number.isFinite(rawValue) ? Math.min(Math.max(rawValue, 0), max) : 0;
  const ratio = max === 0 ? 0 : current / max;
  const percent = Math.round(ratio * 100);
  const nextLabel =
    data?.label === null || data?.label === undefined ? "" : String(data.label);

  root.dataset.kind = kind;
  root.dataset.tone = tone;
  root.dataset.indeterminate = indeterminate ? "true" : "false";
  root.style.setProperty("--progress-ratio", String(ratio));
  label.textContent = nextLabel;
  label.hidden = nextLabel.length === 0;
  value.textContent = indeterminate ? "..." : `${percent}%`;
  root.setAttribute("role", "progressbar");
  root.setAttribute("aria-label", nextLabel || "Progress indicator");
  root.setAttribute("aria-valuemin", "0");
  root.setAttribute("aria-valuemax", String(max));

  if (indeterminate) {
    root.removeAttribute("aria-valuenow");
    root.dataset.animateOnce = "false";
    linearFill.style.width = `${percent}%`;
    circularMeter.style.strokeDashoffset = `${100 - percent}`;
  } else {
    root.setAttribute("aria-valuenow", String(current));

    if (root.dataset.hasAnimated !== "true") {
      this.animateProgressEntry(root, linearFill, circularMeter, percent);
    } else {
      root.dataset.animateOnce = "false";
      linearFill.style.width = `${percent}%`;
      circularMeter.style.strokeDashoffset = `${100 - percent}`;
    }
  }
};

this.renderProgressInfo();
// ======================
// 2. 구독 연결
// ======================

this.subscriptions = null;
// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = null;
