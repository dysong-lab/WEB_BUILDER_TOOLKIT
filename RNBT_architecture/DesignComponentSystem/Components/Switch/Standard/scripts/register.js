const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".switch-group",
    template: "#switch-item-template",
    item: ".switch-item",
    id: ".switch-item",
    checked: ".switch-item",
    disabled: ".switch-item",
    label: ".switch-item__label",
    supportingText: ".switch-item__supporting",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    checked: "checked",
    disabled: "disabled",
  },
});

this._keyHandler = null;

this.getItemElement = function (id) {
  return this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
};

this.syncAccessibility = function () {
  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
  items.forEach((item, index) => {
    const checked = item.dataset.checked === "true";
    const disabled = item.dataset.disabled === "true";

    item.setAttribute("role", "switch");
    item.setAttribute("aria-checked", checked ? "true" : "false");
    item.setAttribute("aria-disabled", disabled ? "true" : "false");
    item.setAttribute("tabindex", disabled ? "-1" : index === 0 ? "0" : "0");
  });
};

this.toggleItem = function (id) {
  const target = this.getItemElement(id);
  if (!target || target.dataset.disabled === "true") return false;

  target.dataset.checked = target.dataset.checked === "true" ? "false" : "true";
  target.setAttribute("data-checked", target.dataset.checked);
  this.syncAccessibility();
  return true;
};

this.renderSwitchItems = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];
  const normalized = items.map((item) => ({
    id: item?.id ?? "",
    label: item?.label ?? "",
    supportingText: item?.supportingText ?? "",
    checked: item?.checked === true || item?.checked === "true" ? "true" : "false",
    disabled: item?.disabled === true || item?.disabled === "true" ? "true" : "false",
  }));

  this.listRender.renderData({ response: normalized });
  this.syncAccessibility();
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  switchItems: [this.renderSwitchItems],
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
    [this.listRender.cssSelectors.item]: "@switchChanged",
  },
};
bindEvents(this, this.customEvents);

this._keyHandler = (event) => {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item || !this.appendElement.contains(item)) return;
  if (item.dataset.disabled === "true") return;
  if (event.key !== " " && event.key !== "Enter") return;

  event.preventDefault();
  const changed = this.toggleItem(item.dataset.id);
  if (changed) {
    Weventbus.emit("@switchChanged", { event, targetInstance: this });
  }
};

this.appendElement.addEventListener("keydown", this._keyHandler);
