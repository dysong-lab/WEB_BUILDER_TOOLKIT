const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".assist-chip__list",
    template: "#assist-chip-item-template",
    chipid: ".assist-chip__item",
    icon: ".assist-chip__icon",
    label: ".assist-chip__label",
  },
  itemKey: "chipid",
  datasetAttrs: {
    chipid: "chipid",
  },
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  assistChipItems: [this.listRender.renderData],
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
    [this.listRender.cssSelectors.chipid]: "@assistChipClicked",
  },
};
bindEvents(this, this.customEvents);
