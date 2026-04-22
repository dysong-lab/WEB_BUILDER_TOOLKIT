const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".filter-chip__list",
    template: "#filter-chip-item-template",
    chipid: ".filter-chip__item",
    selected: ".filter-chip__item",
    label: ".filter-chip__label",
  },
  itemKey: "chipid",
  datasetAttrs: {
    chipid: "chipid",
    selected: "selected",
  },
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  filterChipItems: [this.listRender.renderData],
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
    [this.listRender.cssSelectors.chipid]: "@filterChipClicked",
  },
};
bindEvents(this, this.customEvents);
