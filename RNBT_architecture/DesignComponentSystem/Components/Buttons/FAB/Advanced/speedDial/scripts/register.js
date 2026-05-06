const { subscribe } = GlobalDataPublisher;
const { bindEvents, applySemanticStatus } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
  cssSelectors: {
    fab: ".fab",
    icon: ".fab__icon",
  },
});

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".speed-dial__items",
    template: "#speed-dial-item-template",
    item: ".speed-dial__item",
    actionId: ".speed-dial__item",
    icon: ".speed-dial__item-icon",
    label: ".speed-dial__item-label",
  },
  itemKey: "actionId",
  datasetAttrs: {
    actionId: "actionId",
  },
});

this._isOpen = false;
this._radialOptions = { radius: 110, startAngle: 200, endAngle: 340 };
this._outsideClickHandler = null;
this._escKeyHandler = null;
this._containerClickHandler = null;

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

  const persona = fab.closest(".speed-dial")?.className || "";
  if (persona.includes("editorial")) {
    this._radialOptions = null;
  } else if (persona.includes("material")) {
    this._radialOptions = { radius: 120, startAngle: 200, endAngle: 340 };
  } else if (persona.includes("operational")) {
    this._radialOptions = { radius: 100, startAngle: 205, endAngle: 335 };
  } else {
    this._radialOptions = { radius: 110, startAngle: 200, endAngle: 340 };
  }
};

this.renderSpeedDialItems = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];
  this.listRender.renderData({
    response: items.map((item) => ({
      actionId: item.actionId == null ? String(item.id ?? "") : String(item.actionId),
      icon: item.icon == null ? "" : String(item.icon),
      label: item.label == null ? "" : String(item.label),
    })),
  });
  this._applyRadialAngles();
};

this._open = function () {
  const root = this.appendElement.querySelector(".speed-dial");
  this._isOpen = true;
  if (root) root.dataset.speedDialState = "open";
};

this._close = function () {
  const root = this.appendElement.querySelector(".speed-dial");
  this._isOpen = false;
  if (root) root.dataset.speedDialState = "closed";
};

this._applyRadialAngles = function () {
  if (!this._radialOptions) return;

  const items = [...this.appendElement.querySelectorAll(this.listRender.cssSelectors.item)];
  if (items.length === 0) return;

  const { radius, startAngle, endAngle } = this._radialOptions;
  const range = endAngle - startAngle;

  items.forEach((item, index) => {
    const angle = items.length === 1 ? startAngle + range / 2 : startAngle + (range * index) / (items.length - 1);
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;
    item.style.setProperty("--x", `${x}px`);
    item.style.setProperty("--y", `${y}px`);
  });
};

this._handleContainerClick = function (event) {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (item) {
    queueMicrotask(() => this._close());
    return;
  }

  const fab = event.target.closest(this.fieldRender.cssSelectors.fab);
  if (!fab) return;

  event.preventDefault();
  if (this._isOpen) {
    this._close();
    return;
  }
  this._open();
};

this._handleOutsideClick = function (event) {
  if (!this._isOpen) return;
  if (this.appendElement.contains(event.target)) return;
  this._close();
};

this._handleEscKey = function (event) {
  if (!this._isOpen) return;
  if (event.key !== "Escape") return;
  this._close();
};

this.subscriptions = {
  fabInfo: [this.renderFabInfo],
  speedDialItems: [this.renderSpeedDialItems],
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
    [this.listRender.cssSelectors.item]: "@speedDialActionClicked",
  },
};
bindEvents(this, this.customEvents);

this._containerClickHandler = this._handleContainerClick.bind(this);
this._outsideClickHandler = this._handleOutsideClick.bind(this);
this._escKeyHandler = this._handleEscKey.bind(this);

this.appendElement.addEventListener("click", this._containerClickHandler);
document.addEventListener("click", this._outsideClickHandler, true);
document.addEventListener("keydown", this._escKeyHandler);

this._close();
