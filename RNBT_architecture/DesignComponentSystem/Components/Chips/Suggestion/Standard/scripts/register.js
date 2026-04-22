const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".suggestion-chip__list",
    template: "#suggestion-chip-item-template",
    chipid: ".suggestion-chip__item",
    icon: ".suggestion-chip__icon",
    label: ".suggestion-chip__label",
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
  suggestionChipItems: [this.listRender.renderData],
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
    [this.listRender.cssSelectors.chipid]: "@suggestionChipClicked",
  },
};
bindEvents(this, this.customEvents);
