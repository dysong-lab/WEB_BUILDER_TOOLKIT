const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    menu: ".fab-menu",
    trigger: ".fab-menu__trigger",
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

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  fabMenuItems: [this.listRender.renderData],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
  click: {
    [this.listRender.cssSelectors.trigger]: "@fabMenuToggled",
    [this.listRender.cssSelectors.item]: "@fabMenuItemClicked",
  },
};
bindEvents(this, this.customEvents);
