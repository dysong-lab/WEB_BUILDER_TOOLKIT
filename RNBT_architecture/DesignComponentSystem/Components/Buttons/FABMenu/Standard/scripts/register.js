const { bindEvents } = Wkit;

applyListRenderMixin(this, {
  cssSelectors: {
    root: ".fab-menu",
    trigger: ".fab-menu__trigger",
    triggerIcon: ".fab-menu__trigger-icon",
    triggerLabel: ".fab-menu__trigger-label",
    container: ".fab-menu__list",
    template: "#fab-menu-item-template",
    item: ".fab-menu__item",
    id: ".fab-menu__item",
    icon: ".fab-menu__item-icon",
    label: ".fab-menu__item-label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
  },
});

this.renderFabMenu = function (data = {}) {
  const root = this.appendElement.querySelector(
    this.listRender.cssSelectors.root,
  );
  const trigger = this.appendElement.querySelector(
    this.listRender.cssSelectors.trigger,
  );
  const triggerIcon = this.appendElement.querySelector(
    this.listRender.cssSelectors.triggerIcon,
  );
  const triggerLabel = this.appendElement.querySelector(
    this.listRender.cssSelectors.triggerLabel,
  );
  if (!root || !trigger || !triggerIcon || !triggerLabel) return;

  const nextIcon =
    data?.triggerIcon === null || data?.triggerIcon === undefined
      ? "add"
      : String(data.triggerIcon);
  const nextLabel =
    data?.triggerLabel === null || data?.triggerLabel === undefined
      ? "Create"
      : String(data.triggerLabel);

  triggerIcon.textContent = nextIcon;
  triggerLabel.textContent = nextLabel;
  trigger.setAttribute("aria-label", nextLabel);
  root.dataset.open = "false";
  this.listRender.renderData({
    response: Array.isArray(data?.items) ? data.items : [],
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
    [this.listRender.cssSelectors.trigger]: "@fabMenuToggled",
    [this.listRender.cssSelectors.item]: "@fabMenuItemClicked",
  },
};
bindEvents(this, this.customEvents);
