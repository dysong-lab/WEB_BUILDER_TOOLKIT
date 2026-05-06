const { subscribe } = GlobalDataPublisher;
const { bindEvents, applySemanticStatus } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
  cssSelectors: {
    fab: ".fab",
    icon: ".fab__icon",
  },
});

this._dragThreshold = 5;
this._x = 0;
this._y = 0;
this._startX = 0;
this._startY = 0;
this._originX = 0;
this._originY = 0;
this._isPointerDown = false;
this._isDraggingDetected = false;
this._fabEl = null;

this.renderFabInfo = function ({ response: data } = {}) {
  const fab = this.appendElement.querySelector(this.fieldRender.cssSelectors.fab);
  if (!fab || !data) return;

  this.fieldRender.renderData({
    response: {
      icon: data.icon == null ? "" : String(data.icon),
    },
  });

  const nextAria =
    data.ariaLabel == null
      ? data.icon == null
        ? ""
        : String(data.icon)
      : String(data.ariaLabel);
  const nextSize = data.size === "medium" || data.size === "large" ? data.size : "fab";

  fab.setAttribute("aria-label", nextAria);
  fab.dataset.size = nextSize;
  applySemanticStatus(fab, data);
};

this._applyTransform = function () {
  if (!this._fabEl) return;
  this._fabEl.style.transform = `translate3d(${this._x}px, ${this._y}px, 0)`;
};

this._clampPosition = function (nextX, nextY) {
  if (!this._fabEl || !this._fabEl.parentElement) {
    return { x: nextX, y: nextY };
  }

  const parent = this._fabEl.parentElement;
  const maxX = Math.max(0, parent.clientWidth - this._fabEl.offsetWidth);
  const maxY = Math.max(0, parent.clientHeight - this._fabEl.offsetHeight);

  return {
    x: Math.min(Math.max(0, nextX), maxX),
    y: Math.min(Math.max(0, nextY), maxY),
  };
};

this._handlePointerDown = function (event) {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  if (this._isPointerDown) return;

  this._fabEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.fab);
  if (!this._fabEl) return;

  this._isPointerDown = true;
  this._isDraggingDetected = false;
  this._startX = event.clientX;
  this._startY = event.clientY;
  this._originX = this._x;
  this._originY = this._y;
  this._fabEl.dataset.dragState = "idle";

  if (typeof this._fabEl.setPointerCapture === "function") {
    try {
      this._fabEl.setPointerCapture(event.pointerId);
    } catch (_) {}
  }
};

this._handlePointerMove = function (event) {
  if (!this._isPointerDown || !this._fabEl) return;

  const dx = event.clientX - this._startX;
  const dy = event.clientY - this._startY;
  const distance = Math.hypot(dx, dy);

  if (distance >= this._dragThreshold) {
    this._isDraggingDetected = true;
    this._fabEl.dataset.dragState = "dragging";
  }

  const nextPosition = this._clampPosition(this._originX + dx, this._originY + dy);
  this._x = nextPosition.x;
  this._y = nextPosition.y;
  this._applyTransform();
};

this._handlePointerUp = function () {
  if (!this._isPointerDown) return;
  this._isPointerDown = false;

  if (!this._fabEl) return;
  this._fabEl.dataset.dragState = "idle";

  if (this._isDraggingDetected) {
    Weventbus.emit("@positionChanged", {
      targetInstance: this,
      x: this._x,
      y: this._y,
    });
  }
};

this._handlePointerCancel = function () {
  if (!this._isPointerDown) return;
  this._isPointerDown = false;

  if (!this._fabEl) return;
  this._fabEl.dataset.dragState = "idle";

  if (this._isDraggingDetected) {
    Weventbus.emit("@positionChanged", {
      targetInstance: this,
      x: this._x,
      y: this._y,
    });
    this._isDraggingDetected = false;
  }
};

this._handleClickCapture = function (event) {
  if (!this._isDraggingDetected) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  this._isDraggingDetected = false;
};

this.subscriptions = {
  fabInfo: [this.renderFabInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = {
  click: {
    [this.fieldRender.cssSelectors.fab]: "@fabClicked",
  },
};
bindEvents(this, this.customEvents);

this._fabEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.fab);
this._pointerDownHandler = this._handlePointerDown.bind(this);
this._pointerMoveHandler = this._handlePointerMove.bind(this);
this._pointerUpHandler = this._handlePointerUp.bind(this);
this._pointerCancelHandler = this._handlePointerCancel.bind(this);
this._clickCaptureHandler = this._handleClickCapture.bind(this);

if (this._fabEl) {
  this._fabEl.dataset.dragState = "idle";
  this._fabEl.addEventListener("pointerdown", this._pointerDownHandler);
  this._fabEl.addEventListener("pointermove", this._pointerMoveHandler);
  this._fabEl.addEventListener("pointerup", this._pointerUpHandler);
  this._fabEl.addEventListener("pointercancel", this._pointerCancelHandler);
  this._fabEl.addEventListener("click", this._clickCaptureHandler, true);
}
