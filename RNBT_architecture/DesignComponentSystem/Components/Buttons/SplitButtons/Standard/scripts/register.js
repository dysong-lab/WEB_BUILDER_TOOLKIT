const { bindEvents, applySemanticStatus } = Wkit;

applyListRenderMixin(this, {
  cssSelectors: {
    root: ".split-button",
    primary: ".split-button__primary",
    toggle: ".split-button__toggle",
    primaryLabel: ".split-button__label",
    container: ".split-button__menu",
    template: "#split-button-item-template",
    item: ".split-button__menu-item",
    id: ".split-button__menu-item",
    label: ".split-button__menu-label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    status: "status",
    tone: "tone",
  },
});

this.renderSplitButton = function (data = {}) {
  const root = this.appendElement.querySelector(
    this.listRender.cssSelectors.root,
  );
  const primary = this.appendElement.querySelector(
    this.listRender.cssSelectors.primary,
  );
  const label = this.appendElement.querySelector(
    this.listRender.cssSelectors.primaryLabel,
  );
  const toggle = this.appendElement.querySelector(
    this.listRender.cssSelectors.toggle,
  );
  if (!root || !primary || !label || !toggle) return;

  const nextLabel =
    data?.label === null || data?.label === undefined
      ? "Action"
      : String(data.label);
  label.textContent = nextLabel;
  primary.setAttribute("aria-label", nextLabel);
  applySemanticStatus(primary, data);
  applySemanticStatus(toggle, data);
  root.dataset.open = "false";
  this.listRender.renderData({
    response: Array.isArray(data?.menuItems) ? data.menuItems : [],
  });
};

this.toggleMenu = function (force) {
  const root = this.appendElement.querySelector(
    this.listRender.cssSelectors.root,
  );
  if (!root) return;
  const nextOpen =
    typeof force === "boolean" ? force : root.dataset.open !== "true";
  root.dataset.open = nextOpen ? "true" : "false";
};

this.customEvents = {
  click: {
    [this.listRender.cssSelectors.primary]: "@splitPrimaryClicked",
    [this.listRender.cssSelectors.toggle]: "@splitMenuToggled",
    [this.listRender.cssSelectors.item]: "@splitMenuItemClicked",
  },
};
bindEvents(this, this.customEvents);
