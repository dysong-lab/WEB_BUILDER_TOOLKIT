const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".suggestion-chips",
    template: "#suggestion-chip-item-template",
    item: ".suggestion-chip",
    id: ".suggestion-chip",
    selected: ".suggestion-chip",
    disabled: ".suggestion-chip",
    leadingIcon: ".suggestion-chip__icon",
    label: ".suggestion-chip__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    disabled: "disabled",
  },
});

this.acceptSuggestion = function (id) {
  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
  items.forEach((item) => {
    if (item.dataset.disabled === "true") return;
    item.setAttribute(
      "data-selected",
      item.dataset.id === String(id) ? "true" : "false",
    );
  });
};

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
    [this.listRender.cssSelectors.item]: "@suggestionChipClicked",
  },
};
bindEvents(this, this.customEvents);
