const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".input-chips",
    template: "#input-chip-item-template",
    item: ".input-chip",
    id: ".input-chip",
    selected: ".input-chip",
    disabled: ".input-chip",
    avatar: ".input-chip__avatar",
    label: ".input-chip__label",
    removeBtn: ".input-chip__remove",
    removeId: ".input-chip__remove",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    removeId: "id",
    selected: "selected",
    disabled: "disabled",
  },
});

this.toggleSelection = function (id) {
  const target = this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
  if (!target || target.dataset.disabled === "true") return;
  target.setAttribute(
    "data-selected",
    target.dataset.selected === "true" ? "false" : "true",
  );
};

this.removeItem = function (id) {
  const target = this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
  if (!target || target.dataset.disabled === "true") return;
  target.remove();
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  inputChipItems: [this.listRender.renderData],
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
    [this.listRender.cssSelectors.item]: "@inputChipClicked",
    [this.listRender.cssSelectors.removeBtn]: "@inputChipRemoveClicked",
  },
};
bindEvents(this, this.customEvents);
