const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list-ms__items",
    template: "#list-ms-item-template",
    itemid: ".list-ms__item",
    leading: ".list-ms__leading",
    headline: ".list-ms__headline",
    supporting: ".list-ms__supporting",
  },
  itemKey: "itemid",
  datasetAttrs: {
    itemid: "itemid",
  },
});

this._selectedIds = new Set();

this._headerEl = this.appendElement.querySelector(".list-ms__select-all");
this._headerInputEl = this.appendElement.querySelector(".list-ms__select-all-input");
this._countEl = this.appendElement.querySelector(".list-ms__count");
this._groupEl = this.appendElement.querySelector(".list-ms");

this._getItems = () => Array.from(this.appendElement.querySelectorAll(".list-ms__item"));

this._recomputeHeader = () => {
  const itemIds = this._getItems().map((item) => item.dataset.itemid).filter(Boolean);
  const selectedCount = itemIds.filter((id) => this._selectedIds.has(id)).length;
  const totalCount = itemIds.length;
  let state = "unchecked";
  if (selectedCount > 0 && selectedCount === totalCount) state = "checked";
  else if (selectedCount > 0) state = "indeterminate";

  this._headerEl.dataset.state = state;
  this._headerInputEl.indeterminate = state === "indeterminate";
  this._headerInputEl.checked = state === "checked";
  this._headerEl.setAttribute(
    "aria-checked",
    state === "indeterminate" ? "mixed" : state === "checked" ? "true" : "false",
  );
  return state;
};

this._applySelection = () => {
  const itemEls = this._getItems();
  itemEls.forEach((item) => {
    const selected = this._selectedIds.has(item.dataset.itemid);
    item.dataset.selected = selected ? "true" : "false";
    item.setAttribute("aria-selected", selected ? "true" : "false");
  });
  const total = itemEls.length;
  const count = itemEls.filter((item) => this._selectedIds.has(item.dataset.itemid)).length;
  this._groupEl.dataset.selectedCount = String(count);
  this._countEl.textContent = `${count} / ${total}`;
  this._recomputeHeader();
};

this._emitSelection = (changedId, changedTo) => {
  const ids = this._getItems()
    .map((item) => item.dataset.itemid)
    .filter((id) => this._selectedIds.has(id));
  Weventbus.emit("@listMultiSelected", {
    targetInstance: this,
    selectedIds: ids,
    count: ids.length,
    totalCount: this._getItems().length,
    changedId,
    changedTo,
  });
};

this._renderItems = ({ response } = {}) => {
  const items = Array.isArray(response) ? response.slice() : [];
  this._selectedIds = new Set(
    items.filter((item) => item.selected === true || item.selected === "true").map((item) => String(item.itemid)),
  );
  this.listRender.renderData({ response: items });
  this._applySelection();
};

this._setSelected = (id, action) => {
  if (!id) return;
  const has = this._selectedIds.has(id);
  if (action === "toggle") {
    if (has) this._selectedIds.delete(id);
    else this._selectedIds.add(id);
  } else if (action === "on") this._selectedIds.add(id);
  else this._selectedIds.delete(id);
  this._applySelection();
  this._emitSelection(id, this._selectedIds.has(id) ? "on" : "off");
};

this._handleSelectAll = () => {
  const state = this._recomputeHeader();
  const ids = this._getItems().map((item) => item.dataset.itemid).filter(Boolean);
  this._selectedIds = state === "unchecked" ? new Set(ids) : new Set();
  this._applySelection();
  this._emitSelection(null, "bulk");
};

this._setSelectedFromTopic = ({ response } = {}) => {
  const ids = Array.isArray(response?.ids) ? response.ids.map(String) : [];
  this._selectedIds = new Set(ids);
  this._applySelection();
  this._emitSelection(null, "bulk");
};

this._clearSelection = () => {
  this._selectedIds = new Set();
  this._applySelection();
  this._emitSelection(null, "bulk");
};

this._handleSelect = (event) => {
  if (event.target.closest(".list-ms__select-all")) {
    this._handleSelectAll();
    return;
  }
  const itemEl = event.target.closest(".list-ms__item");
  if (!itemEl) return;
  this._setSelected(itemEl.dataset.itemid, "toggle");
  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
};

this.appendElement.addEventListener("click", this._handleSelect);

this.subscriptions = {
  listItems: [this._renderItems],
  setSelectedItems: [this._setSelectedFromTopic],
  clearSelection: [this._clearSelection],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this.customEvents = null;
