const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    group: ".button-group-multi",
    container: ".button-group-multi__list",
    template: "#button-group-multi-item-template",
    item: ".button-group-multi__item",
    id: ".button-group-multi__item",
    label: ".button-group-multi__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    status: "status",
    tone: "tone",
  },
});

this._selectedIds = new Set();
this._groupClickHandler = null;

this._renderChoices = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];
  this.listRender.renderData({ response: items });
  this._selectedIds = new Set(
    items
      .filter((item) => String(item?.selected) === "true" || item?.selected === true)
      .map((item) => String(item.id)),
  );
  this._applySelection();
};

this._applySelection = function () {
  const group = this.appendElement.querySelector(this.listRender.cssSelectors.group);
  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);

  items.forEach((item) => {
    const isSelected = this._selectedIds.has(String(item.dataset.id));
    item.dataset.selected = isSelected ? "true" : "false";
    item.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  if (group) {
    group.dataset.selectedCount = String(this._selectedIds.size);
  }
};

this._setSelected = function (id, action = "toggle") {
  const normalizedId = id === null || id === undefined ? null : String(id);
  if (!normalizedId) return;

  const exists = Array.from(
    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
  ).some((item) => item.dataset.id === normalizedId);
  if (!exists) return;

  const isSelected = this._selectedIds.has(normalizedId);
  let changedTo = null;

  if (action === "on" && !isSelected) {
    this._selectedIds.add(normalizedId);
    changedTo = "on";
  } else if (action === "off" && isSelected) {
    this._selectedIds.delete(normalizedId);
    changedTo = "off";
  } else if (action === "toggle") {
    if (isSelected) {
      this._selectedIds.delete(normalizedId);
      changedTo = "off";
    } else {
      this._selectedIds.add(normalizedId);
      changedTo = "on";
    }
  }

  if (!changedTo) return;

  this._applySelection();
  Weventbus.emit("@buttonGroupMultiSelected", {
    targetInstance: this,
    selectedIds: Array.from(this._selectedIds),
    changedId: normalizedId,
    changedTo,
  });
};

this._handleSelect = function (event) {
  const target = event.target.closest(this.listRender.cssSelectors.item);
  if (!target) return;
  this._setSelected(target.dataset.id, "toggle");
};

this._setSelectedFromTopic = function ({ response } = {}) {
  const ids = Array.isArray(response?.ids) ? response.ids.map(String) : [];
  this._selectedIds = new Set(ids);
  this._applySelection();
  Weventbus.emit("@buttonGroupMultiSelected", {
    targetInstance: this,
    selectedIds: Array.from(this._selectedIds),
    changedId: null,
    changedTo: "bulk",
  });
};

this.subscriptions = {
  buttonGroupMultiItems: [this._renderChoices],
  setSelectedButtonGroupChoices: [this._setSelectedFromTopic],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._groupClickHandler = this._handleSelect.bind(this);
this.appendElement.addEventListener("click", this._groupClickHandler, true);
