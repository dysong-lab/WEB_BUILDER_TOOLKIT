const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list-reorder__items",
    template: "#list-reorder-item-template",
    itemid: ".list-reorder__item",
    leading: ".list-reorder__leading",
    headline: ".list-reorder__headline",
    supporting: ".list-reorder__supporting",
  },
  itemKey: "itemid",
  datasetAttrs: {
    itemid: "itemid",
  },
});

this._currentItems = [];
this._currentOrder = [];
this._draggingId = null;

this._renderItems = ({ response } = {}) => {
  this._currentItems = Array.isArray(response) ? response.slice() : [];
  this._currentOrder = this._currentItems.map((item) => String(item.itemid));
  this.listRender.renderData({ response: this._currentItems });
};

this._setItemOrder = ({ response } = {}) => {
  if (!Array.isArray(response)) return;
  const map = new Map(this._currentItems.map((item) => [String(item.itemid), item]));
  this._currentItems = response.map((id) => map.get(String(id))).filter(Boolean);
  this._currentOrder = this._currentItems.map((item) => String(item.itemid));
  this.listRender.renderData({ response: this._currentItems });
};

this._clearDragState = () => {
  this.appendElement.querySelectorAll(".list-reorder__item").forEach((item) => {
    delete item.dataset.dragState;
    delete item.dataset.dragTarget;
  });
  this._draggingId = null;
};

this._emitReorder = (itemId, fromIndex, toIndex) => {
  Weventbus.emit("@itemReordered", {
    targetInstance: this,
    fromIndex,
    toIndex,
    itemId,
    allItemIds: this._currentOrder.slice(),
  });
};

this._handleDragStart = (event) => {
  const itemEl = event.target.closest(".list-reorder__item");
  if (!itemEl) return;
  this._draggingId = itemEl.dataset.itemid;
  itemEl.dataset.dragState = "dragging";
  event.dataTransfer?.setData("text/plain", this._draggingId);
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
};

this._handleDragOver = (event) => {
  const itemEl = event.target.closest(".list-reorder__item");
  if (!itemEl || itemEl.dataset.itemid === this._draggingId) return;
  event.preventDefault();
  this.appendElement.querySelectorAll(".list-reorder__item").forEach((item) => {
    delete item.dataset.dragTarget;
  });
  const bounds = itemEl.getBoundingClientRect();
  itemEl.dataset.dragTarget = event.clientY < bounds.top + bounds.height / 2 ? "above" : "below";
};

this._handleDragLeave = (event) => {
  const itemEl = event.target.closest(".list-reorder__item");
  if (itemEl) delete itemEl.dataset.dragTarget;
};

this._handleDrop = (event) => {
  event.preventDefault();
  const targetEl = event.target.closest(".list-reorder__item");
  if (!targetEl || !this._draggingId) return;

  const fromIndex = this._currentOrder.indexOf(this._draggingId);
  const targetIndex = this._currentOrder.indexOf(targetEl.dataset.itemid);
  if (fromIndex === -1 || targetIndex === -1) {
    this._clearDragState();
    return;
  }

  const direction = targetEl.dataset.dragTarget === "below" ? 1 : 0;
  const items = this._currentItems.slice();
  const [moved] = items.splice(fromIndex, 1);
  const insertIndex = Math.max(0, targetIndex + direction - (fromIndex < targetIndex ? 1 : 0));
  items.splice(insertIndex, 0, moved);

  this._currentItems = items;
  this._currentOrder = items.map((item) => String(item.itemid));
  this.listRender.renderData({ response: items });
  if (fromIndex !== insertIndex) {
    this._emitReorder(this._draggingId, fromIndex, insertIndex);
  }
  this._clearDragState();
};

this._handleDragEnd = () => {
  this._clearDragState();
};

this._handleClick = (event) => {
  const itemEl = event.target.closest(".list-reorder__item");
  if (!itemEl) return;
  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
};

this.appendElement.addEventListener("dragstart", this._handleDragStart);
this.appendElement.addEventListener("dragover", this._handleDragOver);
this.appendElement.addEventListener("dragleave", this._handleDragLeave);
this.appendElement.addEventListener("drop", this._handleDrop);
this.appendElement.addEventListener("dragend", this._handleDragEnd);
this.appendElement.addEventListener("click", this._handleClick);

this.subscriptions = {
  listItems: [this._renderItems],
  setItemOrder: [this._setItemOrder],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this.customEvents = null;
