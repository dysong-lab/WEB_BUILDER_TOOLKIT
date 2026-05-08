const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list-swipedel__items",
    template: "#list-swipedel-item-template",
    itemid: ".list-swipedel__item",
    leading: ".list-swipedel__leading",
    headline: ".list-swipedel__headline",
    supporting: ".list-swipedel__supporting",
  },
  itemKey: "itemid",
  datasetAttrs: {
    itemid: "itemid",
  },
});

this._currentItems = [];
this._dragState = null;
this._isDraggingDetected = false;
this._swipeDirection = "both";
this._deleteThreshold = 120;
this._lastDeletedAt = null;

this._renderItems = ({ response } = {}) => {
  this._currentItems = Array.isArray(response) ? response.slice() : [];
  this.listRender.renderData({ response: this._currentItems });
};

this._setSwipeDirection = ({ response } = {}) => {
  const value = typeof response === "string" ? response : response?.direction;
  this._swipeDirection =
    value === "left" || value === "right" || value === "both" ? value : "both";
};

this._restoreItem = ({ response } = {}) => {
  const item = response?.item;
  const atIndex = Number.isFinite(response?.atIndex) ? response.atIndex : this._currentItems.length;
  if (!item || item.itemid == null) return;
  if (this._currentItems.some((entry) => String(entry.itemid) === String(item.itemid))) return;
  this._currentItems.splice(Math.max(0, atIndex), 0, item);
  this.listRender.renderData({ response: this._currentItems });
};

this._isDirectionAllowed = (direction) =>
  this._swipeDirection === "both" || this._swipeDirection === direction;

this._getItemElement = (itemId) =>
  this.appendElement.querySelector(`.list-swipedel__item[data-itemid="${String(itemId)}"]`);

this._applyOffset = (faceEl, dx) => {
  if (!faceEl) return;
  faceEl.style.transform = `translate3d(${dx}px, 0, 0)`;
};

this._springBack = () => {
  const itemEl = this._getItemElement(this._dragState?.itemId);
  const faceEl = itemEl?.querySelector(".list-swipedel__face");
  if (itemEl) itemEl.dataset.swiping = "false";
  if (faceEl) {
    faceEl.style.transition = "transform 180ms ease";
    this._applyOffset(faceEl, 0);
    requestAnimationFrame(() => {
      faceEl.style.transition = "";
    });
  }
  this._dragState = null;
  this._isDraggingDetected = false;
};

this._emitSwipeDelete = (itemId, item) => {
  const deletedAt = new Date().toISOString();
  this._lastDeletedAt = deletedAt;
  Weventbus.emit("@itemSwipeDelete", {
    targetInstance: this,
    itemId,
    item,
    deletedAt,
    remainingItemIds: this._currentItems.map((entry) => String(entry.itemid)),
  });
};

this._finishDelete = () => {
  const dragState = this._dragState;
  if (!dragState) return;

  const itemEl = this._getItemElement(dragState.itemId);
  const faceEl = itemEl?.querySelector(".list-swipedel__face");
  const item = this._currentItems.find((entry) => String(entry.itemid) === String(dragState.itemId));
  if (!itemEl || !faceEl || !item) {
    this._springBack();
    return;
  }

  const width = itemEl.offsetWidth || 420;
  const sign = dragState.direction === "right" ? 1 : -1;
  faceEl.style.transition = "transform 120ms ease-out";
  this._applyOffset(faceEl, sign * width);

  setTimeout(() => {
    this._currentItems = this._currentItems.filter(
      (entry) => String(entry.itemid) !== String(dragState.itemId),
    );
    this.listRender.renderData({ response: this._currentItems });
    this._emitSwipeDelete(dragState.itemId, item);
    this._dragState = null;
    this._isDraggingDetected = false;
  }, 130);
};

this._emitSwipeStart = (itemId, direction) => {
  Weventbus.emit("@itemSwipeStart", { targetInstance: this, itemId, direction });
};

this._emitSwipeProgress = (itemId, dx, direction) => {
  Weventbus.emit("@itemSwipeProgress", {
    targetInstance: this,
    itemId,
    dx,
    direction,
    ratio: dx / this._deleteThreshold,
  });
};

this._handlePointerDown = (event) => {
  const faceEl = event.target.closest(".list-swipedel__face");
  const itemEl = event.target.closest(".list-swipedel__item");
  if (!faceEl || !itemEl) return;
  this._dragState = {
    itemId: itemEl.dataset.itemid,
    pointerId: event.pointerId,
    startX: event.clientX,
    currentX: event.clientX,
    direction: "left",
    started: false,
  };
  this._isDraggingDetected = false;
  faceEl.setPointerCapture?.(event.pointerId);
};

this._handlePointerMove = (event) => {
  if (!this._dragState || this._dragState.pointerId !== event.pointerId) return;
  const itemEl = this._getItemElement(this._dragState.itemId);
  const faceEl = itemEl?.querySelector(".list-swipedel__face");
  if (!itemEl || !faceEl) return;

  const rawDx = event.clientX - this._dragState.startX;
  const direction = rawDx >= 0 ? "right" : "left";
  const allowed = this._isDirectionAllowed(direction);
  const dx = allowed ? rawDx : 0;

  this._dragState.currentX = event.clientX;
  this._dragState.direction = direction;

  if (Math.abs(rawDx) < 5) return;

  if (!this._dragState.started) {
    this._dragState.started = true;
    this._isDraggingDetected = true;
    this._emitSwipeStart(this._dragState.itemId, direction);
  }

  itemEl.dataset.swiping = "true";
  this._applyOffset(faceEl, dx);
  this._emitSwipeProgress(this._dragState.itemId, dx, direction);
};

this._handlePointerUp = (event) => {
  if (!this._dragState || this._dragState.pointerId !== event.pointerId) return;
  const dx = this._dragState.currentX - this._dragState.startX;
  const allowed = this._isDirectionAllowed(this._dragState.direction);
  if (this._isDraggingDetected && allowed && Math.abs(dx) >= this._deleteThreshold) {
    this._finishDelete();
    return;
  }
  this._springBack();
};

this._handlePointerCancel = () => {
  this._springBack();
};

this._handleClickCapture = (event) => {
  if (!this._isDraggingDetected) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  this._isDraggingDetected = false;
};

this._clickHandler = (event) => {
  const itemEl = event.target.closest(".list-swipedel__item");
  if (!itemEl) return;
  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
};

this.appendElement.addEventListener("pointerdown", this._handlePointerDown);
this.appendElement.addEventListener("pointermove", this._handlePointerMove);
this.appendElement.addEventListener("pointerup", this._handlePointerUp);
this.appendElement.addEventListener("pointercancel", this._handlePointerCancel);
this.appendElement.addEventListener("click", this._handleClickCapture, true);
this.appendElement.addEventListener("click", this._clickHandler);

this.subscriptions = {
  listItems: [this._renderItems],
  setSwipeDirection: [this._setSwipeDirection],
  restoreItem: [this._restoreItem],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this.customEvents = null;
