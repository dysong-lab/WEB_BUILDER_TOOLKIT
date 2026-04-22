const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyFieldRenderMixin(this, {
  cssSelectors: {
    root: ".toolbar",
    title: ".toolbar__title",
    supportingText: ".toolbar__supporting",
    overflowButton: ".toolbar__overflow",
  },
  datasetAttrs: {
    overflowOpen: "overflow-open",
  },
});

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".toolbar__actions",
    template: "#toolbar-action-template",
    item: ".toolbar__action",
    id: ".toolbar__action",
    active: ".toolbar__action",
    emphasis: ".toolbar__action",
    icon: ".toolbar__action-icon",
    label: ".toolbar__action-label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    active: "active",
    emphasis: "emphasis",
  },
});

this._toolbarClickHandler = null;
this._overflowOpen = false;
this._toolbarActions = [];

this.getActionElement = function (id) {
  return this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
};

this.normalizeToolbarInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const actions = Array.isArray(nextData.actions) ? nextData.actions : [];

  return {
    title:
      nextData.title === null || nextData.title === undefined
        ? ""
        : String(nextData.title),
    supportingText:
      nextData.supportingText === null || nextData.supportingText === undefined
        ? ""
        : String(nextData.supportingText),
    actions: actions.map((item = {}) => ({
      id: item.id == null ? "" : String(item.id),
      label: item.label == null ? "" : String(item.label),
      icon: item.icon == null ? "" : String(item.icon),
      active: item.active === "true" ? "true" : "false",
      emphasis: item.emphasis === "true" ? "true" : "false",
    })),
  };
};

this.setActiveAction = function (id) {
  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
  items.forEach((item) => {
    item.setAttribute(
      "data-active",
      item.dataset.id === String(id) ? "true" : "false",
    );
  });

  this._toolbarActions = this._toolbarActions.map((item) => ({
    ...item,
    active: item.id === String(id) ? "true" : "false",
  }));
};

this.toggleOverflow = function () {
  const root = this.appendElement.querySelector(this.fieldRender.cssSelectors.root);
  if (!root) return this._overflowOpen;

  this._overflowOpen = !this._overflowOpen;
  root.dataset.overflowOpen = this._overflowOpen ? "true" : "false";
  return this._overflowOpen;
};

this.renderToolbarInfo = function (payload = {}) {
  const root = this.appendElement.querySelector(this.fieldRender.cssSelectors.root);
  const supportingText = this.appendElement.querySelector(
    this.fieldRender.cssSelectors.supportingText,
  );
  if (!root || !supportingText) return;

  const nextData = this.normalizeToolbarInfo(payload);
  const hasActive = nextData.actions.some((item) => item.active === "true");
  if (!hasActive && nextData.actions[0]) {
    nextData.actions[0].active = "true";
  }
  this._toolbarActions = nextData.actions;

  this.fieldRender.renderData({
    response: {
      title: nextData.title,
      supportingText: nextData.supportingText,
    },
  });
  this.listRender.renderData({ response: nextData.actions });

  root.dataset.overflowOpen = this._overflowOpen ? "true" : "false";
  supportingText.hidden = nextData.supportingText === "";
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  toolbarInfo: [this.renderToolbarInfo],
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

this.customEvents = null;

this._toolbarClickHandler = (event) => {
  const overflowButton = event.target.closest(this.fieldRender.cssSelectors.overflowButton);
  if (overflowButton && this.appendElement.contains(overflowButton)) {
    const overflowOpen = this.toggleOverflow();
    Weventbus.emit("@toolbarOverflowToggled", {
      event,
      targetInstance: this,
      response: { overflowOpen },
    });
    return;
  }

  const action = event.target.closest(this.listRender.cssSelectors.item);
  if (!action || !this.appendElement.contains(action)) return;
  if (action.dataset.id) {
    this.setActiveAction(action.dataset.id);
  }

  Weventbus.emit("@toolbarActionClicked", {
    event,
    targetInstance: this,
    itemId: action.dataset.id || null,
    response: action.dataset.id ? { id: action.dataset.id } : null,
  });
};

this.appendElement.addEventListener("click", this._toolbarClickHandler);
