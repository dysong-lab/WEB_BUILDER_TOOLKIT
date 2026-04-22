const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".assist-chips",
    template: "#assist-chip-item-template",
    item: ".assist-chip",
    id: ".assist-chip",
    disabled: ".assist-chip",
    leadingIcon: ".assist-chip__icon",
    label: ".assist-chip__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    disabled: "disabled",
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
    [this.listRender.cssSelectors.item]: "@assistChipClicked",
  },
};
bindEvents(this, this.customEvents);
