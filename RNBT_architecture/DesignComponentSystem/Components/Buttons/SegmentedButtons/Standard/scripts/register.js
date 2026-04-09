const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".segmented-buttons",
    template: "#segmented-button-item-template",
    item: ".segmented-button",
    id: ".segmented-button",
    selected: ".segmented-button",
    icon: ".segmented-button__icon",
    label: ".segmented-button__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
  },
});

this.selectItem = function (id) {
  const items = this.appendElement.querySelectorAll(
    this.listRender.cssSelectors.item,
  );
  items.forEach((item) =>
    item.setAttribute(
      "data-selected",
      item.dataset.id === String(id) ? "true" : "false",
    ),
  );
};

this.subscriptions = {
  segmentedButtonItems: [this.listRender.renderData],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  click: {
    [this.listRender.cssSelectors.item]: "@segmentedButtonClicked",
  },
};
bindEvents(this, this.customEvents);
