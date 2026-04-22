const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".segmented-button__list",
    template: "#segmented-button-item-template",
    segmentid: ".segmented-button__item",
    selected: ".segmented-button__item",
    icon: ".segmented-button__icon",
    label: ".segmented-button__label",
  },
  itemKey: "segmentid",
  datasetAttrs: {
    segmentid: "segmentid",
    selected: "selected",
  },
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  segmentedButtonItems: [this.listRender.renderData],
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
    [this.listRender.cssSelectors.segmentid]: "@segmentClicked",
  },
};
bindEvents(this, this.customEvents);
