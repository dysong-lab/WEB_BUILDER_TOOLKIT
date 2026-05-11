const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;
applyListRenderMixin(this, {
  cssSelectors: {
    group: ".segmented-button-multi",
    container: ".segmented-button-multi__list",
    template: "#segmented-button-multi-item-template",
    item: ".segmented-button-multi__item",
    actionId: ".segmented-button-multi__item",
    icon: ".segmented-button-multi__icon",
    label: ".segmented-button-multi__label",
  },
  itemKey: "actionId",
  datasetAttrs: { actionId: "actionId" },
});
this._selectedIds = new Set();
this._applySelection = () => {
  const group = this.appendElement.querySelector(
    this.listRender.cssSelectors.group,
  );
  const items = [
    ...this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
  ];
  items.forEach((item) => {
    const selected = this._selectedIds.has(item.dataset.actionId);
    item.dataset.selected = selected ? "true" : "false";
    item.setAttribute("aria-pressed", selected ? "true" : "false");
  });
  if (group) group.dataset.selectedCount = String(this._selectedIds.size);
};
this._emit = (changedId, changedTo) => {
  Weventbus.emit("@segmentMultiSelected", {
    targetInstance: this,
    selectedIds: [...this._selectedIds],
    changedId,
    changedTo,
  });
};
this._setSelected = (id, action = "toggle") => {
  if (!id) return;
  const has = this._selectedIds.has(id);
  let changedTo = null;
  if (action === "on" && !has) {
    this._selectedIds.add(id);
    changedTo = "on";
  } else if (action === "off" && has) {
    this._selectedIds.delete(id);
    changedTo = "off";
  } else if (action === "toggle") {
    if (has) {
      this._selectedIds.delete(id);
      changedTo = "off";
    } else {
      this._selectedIds.add(id);
      changedTo = "on";
    }
  }
  if (!changedTo) return;
  this._applySelection();
  this._emit(id, changedTo);
};
this._renderSegments = ({ response } = {}) => {
  const source = Array.isArray(response) ? response : [];
  const items = source.map((item) => ({
    actionId: String(item.id ?? item.actionId ?? ""),
    icon: item.icon == null ? "" : String(item.icon),
    label: item.label == null ? "" : String(item.label),
  }));
  this.listRender.renderData({ response: items });
  this._selectedIds = new Set(
    source
      .filter((item) => item.selected)
      .map((item) => String(item.id ?? item.actionId ?? "")),
  );
  this._applySelection();
};
this._setSelectedFromTopic = ({ response } = {}) => {
  const ids = Array.isArray(response?.ids) ? response.ids.map(String) : [];
  this._selectedIds = new Set(ids);
  this._applySelection();
  this._emit(null, "bulk");
};
this._handleSelect = (event) => {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item) return;
  this._setSelected(item.dataset.actionId, "toggle");
};
this.subscriptions = {
  segmentInfo: [this._renderSegments],
  setSelectedSegments: [this._setSelectedFromTopic],
};
go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);
this._groupClickHandler = this._handleSelect.bind(this);
this.appendElement.addEventListener("click", this._groupClickHandler);
