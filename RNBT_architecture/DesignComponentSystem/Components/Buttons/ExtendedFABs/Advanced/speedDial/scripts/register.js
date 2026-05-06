const { subscribe } = GlobalDataPublisher;
const { bindEvents, applySemanticStatus } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
  cssSelectors: {
    extendedFab: ".extended-fab",
    icon: ".extended-fab__icon",
    label: ".extended-fab__label",
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
this._outsideClickHandler = null;
this._escKeyHandler = null;
this._mainClickHandler = null;
this._itemClickHandler = null;

this.renderExtendedFabInfo = function ({ response: data } = {}) {
  const fab = this.appendElement.querySelector(this.fieldRender.cssSelectors.extendedFab);
  if (!fab || !data) return;

  this.fieldRender.renderData({
    response: {
      icon: data.icon == null ? "" : String(data.icon),
      label: data.label == null ? "" : String(data.label),
    },
  });

  const nextAria =
    data.ariaLabel == null
      ? data.label == null
        ? ""
        : String(data.label)
      : String(data.ariaLabel);
  const nextSize =
    data.size === "small" || data.size === "large" ? data.size : "medium";

  fab.setAttribute("aria-label", nextAria);
  fab.dataset.size = nextSize;
  applySemanticStatus(fab, data);
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

this._handleMainClick = function (event) {
  const fab = event.target.closest(this.fieldRender.cssSelectors.extendedFab);
  if (!fab) return;
  event.preventDefault();
  if (this._isOpen) {
    this._close();
    return;
  }
  this._open();
};

this._handleItemClick = function (event) {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item) return;
  queueMicrotask(() => this._close());
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
  extendedFabInfo: [this.renderExtendedFabInfo],
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
    [this.listRender.cssSelectors.item]: "@speedDialActionClicked",
  },
};
bindEvents(this, this.customEvents);

this._mainClickHandler = this._handleMainClick.bind(this);
this._itemClickHandler = this._handleItemClick.bind(this);
this._outsideClickHandler = this._handleOutsideClick.bind(this);
this._escKeyHandler = this._handleEscKey.bind(this);

this.appendElement.addEventListener("click", this._mainClickHandler);
this.appendElement.addEventListener("click", this._itemClickHandler);
document.addEventListener("click", this._outsideClickHandler, true);
document.addEventListener("keydown", this._escKeyHandler);

this._close();
