const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".filter-chips",
    template: "#filter-chip-item-template",
    item: ".filter-chip",
    id: ".filter-chip",
    selected: ".filter-chip",
    disabled: ".filter-chip",
    leadingIcon: ".filter-chip__icon",
    label: ".filter-chip__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    disabled: "disabled",
  },
});

this.toggleItem = function (id) {
  const target = this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
  if (!target || target.dataset.disabled === "true") return;

  target.setAttribute(
    "data-selected",
    target.dataset.selected === "true" ? "false" : "true",
  );
};

this.subscriptions = {
  filterChipItems: [this.listRender.renderData],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  click: {
    [this.listRender.cssSelectors.item]: "@filterChipClicked",
  },
};
bindEvents(this, this.customEvents);

