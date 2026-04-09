const { bindEvents } = Wkit;

this.cssSelectors = {
  button: ".extended-fab",
  icon: ".extended-fab__icon",
  label: ".extended-fab__label",
};

this.renderExtendedFabInfo = function (data = {}) {
  const button = this.appendElement.querySelector(this.cssSelectors.button);
  const icon = this.appendElement.querySelector(this.cssSelectors.icon);
  const label = this.appendElement.querySelector(this.cssSelectors.label);
  if (!button || !icon || !label) return;

  const nextIcon =
    data?.icon === null || data?.icon === undefined ? "" : String(data.icon);
  const nextLabel =
    data?.label === null || data?.label === undefined ? "" : String(data.label);
  const nextAria =
    data?.ariaLabel === null || data?.ariaLabel === undefined
      ? nextLabel
      : String(data.ariaLabel);
  const nextSize =
    data?.size === "small" || data?.size === "large" ? data.size : "medium";

  icon.textContent = nextIcon;
  label.textContent = nextLabel;
  button.setAttribute("aria-label", nextAria);
  button.dataset.size = nextSize;
};

this.customEvents = {
  click: {
    [this.cssSelectors.button]: "@extendedFabClicked",
  },
};
bindEvents(this, this.customEvents);
