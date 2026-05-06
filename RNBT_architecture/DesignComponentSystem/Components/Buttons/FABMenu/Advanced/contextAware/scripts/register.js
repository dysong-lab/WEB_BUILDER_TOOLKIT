const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    menu: ".fab-menu",
    trigger: ".fab-menu__trigger",
    container: ".fab-menu__list",
    template: "#fab-menu-item-template",
    item: ".fab-menu__item",
    actionId: ".fab-menu__item",
    icon: ".fab-menu__item-icon",
    label: ".fab-menu__item-label",
  },
  itemKey: "actionId",
  datasetAttrs: {
    actionId: "actionId",
  },
});

this._currentContextKey = null;

this._renderByContext = function ({ response } = {}) {
  const contextKey = response?.contextKey == null ? "" : String(response.contextKey);
  const items = Array.isArray(response?.items) ? response.items : [];

  this.listRender.renderData({
    response: items.map((item) => ({
      actionId: item.actionId == null ? String(item.id ?? "") : String(item.actionId),
      icon: item.icon == null ? "" : String(item.icon),
      label: item.label == null ? "" : String(item.label),
    })),
  });

  const menu = this.appendElement.querySelector(this.listRender.cssSelectors.menu);
  if (menu) {
    menu.dataset.contextKey = contextKey;
  }
  this._currentContextKey = contextKey;
};

this.subscriptions = {
  menuByContext: [this._renderByContext],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  click: {
    [this.listRender.cssSelectors.trigger]: "@fabMenuToggled",
    [this.listRender.cssSelectors.item]: "@fabMenuActionClicked",
  },
};
bindEvents(this, this.customEvents);
