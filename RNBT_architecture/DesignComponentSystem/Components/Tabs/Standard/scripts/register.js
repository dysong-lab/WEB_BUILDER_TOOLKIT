const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    list: ".tabs__list",
    template: "#tab-item-template",
    item: ".tabs__tab",
    id: ".tabs__tab",
    selected: ".tabs__tab",
    disabled: ".tabs__tab",
    label: ".tabs__label",
    badge: ".tabs__badge",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    disabled: "disabled",
  },
});

this.cssSelectors = {
  root: ".tabs",
  panel: ".tabs__panel",
  panelEyebrow: ".tabs__panel-eyebrow",
  panelTitle: ".tabs__panel-title",
  panelBody: ".tabs__panel-body",
};

this._tabKeydownHandler = null;
this._tabClickHandler = null;
this._tabsData = [];

this.getItemElement = function (id) {
  return this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
};

this.normalizeItems = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];
  const normalized = items.map((item = {}) => ({
    id: item.id == null ? "" : String(item.id),
    label: item.label == null ? "" : String(item.label),
    badge: item.badge == null ? "" : String(item.badge),
    selected: item.selected === "true" ? "true" : "false",
    disabled: item.disabled === "true" ? "true" : "false",
    panelEyebrow:
      item.panelEyebrow == null ? "" : String(item.panelEyebrow),
    panelTitle: item.panelTitle == null ? "" : String(item.panelTitle),
    panelBody: item.panelBody == null ? "" : String(item.panelBody),
  }));

  const hasSelected = normalized.some((item) => item.selected === "true");
  if (!hasSelected) {
    const firstEnabled = normalized.find((item) => item.disabled !== "true");
    if (firstEnabled) firstEnabled.selected = "true";
  }

  return normalized;
};

this.syncAccessibility = function () {
  const root = this.appendElement.querySelector(this.cssSelectors.root);
  const list = this.appendElement.querySelector(this.listRender.cssSelectors.list);
  const items = Array.from(
    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
  );
  const selectedItem =
    items.find((item) => item.dataset.selected === "true") || null;

  if (root) root.dataset.hasSelection = selectedItem ? "true" : "false";
  if (list) {
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-label", list.getAttribute("aria-label") || "Tabs");
  }

  items.forEach((item) => {
    const isSelected = item.dataset.selected === "true";
    const isDisabled = item.dataset.disabled === "true";
    const panelId = `${this.id || "tabs"}-panel`;
    const tabId = `${this.id || "tabs"}-tab-${item.dataset.id || "item"}`;

    item.setAttribute("id", tabId);
    item.setAttribute("role", "tab");
    item.setAttribute("aria-selected", isSelected ? "true" : "false");
    item.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    item.setAttribute("aria-controls", panelId);
    item.setAttribute(
      "tabindex",
      !isDisabled && item === selectedItem ? "0" : "-1",
    );
  });

  const panel = this.appendElement.querySelector(this.cssSelectors.panel);
  if (panel) {
    panel.setAttribute("id", `${this.id || "tabs"}-panel`);
    panel.setAttribute("role", "tabpanel");
    if (selectedItem) panel.setAttribute("aria-labelledby", selectedItem.id);
  }
};

this.renderPanel = function (item = {}) {
  const eyebrow = this.appendElement.querySelector(this.cssSelectors.panelEyebrow);
  const title = this.appendElement.querySelector(this.cssSelectors.panelTitle);
  const body = this.appendElement.querySelector(this.cssSelectors.panelBody);
  const panel = this.appendElement.querySelector(this.cssSelectors.panel);
  if (!eyebrow || !title || !body || !panel) return;

  eyebrow.textContent = item.panelEyebrow || "";
  title.textContent = item.panelTitle || "";
  body.textContent = item.panelBody || "";
  eyebrow.hidden = !item.panelEyebrow;
  panel.dataset.empty = item.panelTitle || item.panelBody ? "false" : "true";
};

this.selectItem = function (id) {
  const target = this.getItemElement(id);
  if (!target || target.dataset.disabled === "true") return null;

  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
  items.forEach((item) => {
    item.setAttribute(
      "data-selected",
      item.dataset.id === String(id) ? "true" : "false",
    );
  });

  const nextItem =
    this._tabsData.find((item) => item.id === String(id)) || null;
  if (nextItem) this.renderPanel(nextItem);
  this.syncAccessibility();
  return nextItem;
};

this.selectAdjacent = function (step) {
  const items = Array.from(
    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
  ).filter((item) => item.dataset.disabled !== "true");

  if (!items.length) return null;

  const currentIndex = items.findIndex((item) => item.dataset.selected === "true");
  const startIndex = currentIndex >= 0 ? currentIndex : 0;
  const nextIndex = (startIndex + step + items.length) % items.length;
  const target = items[nextIndex];
  if (!target?.dataset.id) return null;

  const nextItem = this.selectItem(target.dataset.id);
  target.focus();
  return nextItem;
};

this.renderTabItems = function (payload = {}) {
  const normalized = this.normalizeItems(payload);
  this._tabsData = normalized;

  this.listRender.renderData({ response: normalized });

  const selectedItem =
    normalized.find((item) => item.selected === "true") || normalized[0] || null;
  this.renderPanel(selectedItem || {});
  this.syncAccessibility();
};

this.subscriptions = {
  tabItems: [this.renderTabItems],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._tabClickHandler = (event) => {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item || !this.appendElement.contains(item)) return;
  if (item.dataset.disabled === "true") return;

  const changed = this.selectItem(item.dataset.id);
  if (!changed) return;

  Weventbus.emit("@tabChanged", {
    event,
    targetInstance: this,
    itemId: changed.id,
    response: changed,
  });
};

this._tabKeydownHandler = (event) => {
  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item || !this.appendElement.contains(item)) return;
  if (item.dataset.disabled === "true") return;

  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    const changed = this.selectAdjacent(1);
    if (changed) {
      Weventbus.emit("@tabChanged", {
        event,
        targetInstance: this,
        itemId: changed.id,
        response: changed,
      });
    }
    return;
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    const changed = this.selectAdjacent(-1);
    if (changed) {
      Weventbus.emit("@tabChanged", {
        event,
        targetInstance: this,
        itemId: changed.id,
        response: changed,
      });
    }
    return;
  }

  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const items = Array.from(
      this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
    ).filter((tab) => tab.dataset.disabled !== "true");
    const target = event.key === "Home" ? items[0] : items[items.length - 1];
    if (!target?.dataset.id) return;
    const changed = this.selectItem(target.dataset.id);
    target.focus();
    if (changed) {
      Weventbus.emit("@tabChanged", {
        event,
        targetInstance: this,
        itemId: changed.id,
        response: changed,
      });
    }
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    const changed = this.selectItem(item.dataset.id);
    if (changed) {
      Weventbus.emit("@tabChanged", {
        event,
        targetInstance: this,
        itemId: changed.id,
        response: changed,
      });
    }
  }
};

this.appendElement.addEventListener("click", this._tabClickHandler);
this.appendElement.addEventListener("keydown", this._tabKeydownHandler);
