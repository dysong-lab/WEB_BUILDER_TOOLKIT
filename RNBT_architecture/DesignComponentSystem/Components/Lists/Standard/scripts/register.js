const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list",
    template: "#list-item-template",
    item: ".list-item",
    id: ".list-item",
    selected: ".list-item",
    disabled: ".list-item",
    selectable: ".list-item",
    leading: ".list-item__leading",
    leadingType: ".list-item__leading",
    overline: ".list-item__overline",
    headline: ".list-item__headline",
    supporting: ".list-item__supporting",
    trailingText: ".list-item__trailing-text",
    trailingAction: ".list-item__trailing-action",
    trailingActionLabel: ".list-item__trailing-action",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    disabled: "disabled",
    selectable: "selectable",
    leadingType: "leading-type",
  },
  elementAttrs: {
    trailingActionLabel: "aria-label",
  },
});

this._listClickHandler = null;
this._listKeydownHandler = null;

this.getItemElement = function (id) {
  return this.appendElement.querySelector(
    `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
  );
};

this.setSelected = function (id, selected) {
  const target = this.getItemElement(id);
  if (!target || target.dataset.disabled === "true") return;

  target.setAttribute("data-selected", selected ? "true" : "false");
};

this.toggleSelection = function (id) {
  const target = this.getItemElement(id);
  if (!target || target.dataset.disabled === "true") return;
  if (target.dataset.selectable === "false") return;

  target.setAttribute(
    "data-selected",
    target.dataset.selected === "true" ? "false" : "true",
  );
};

this.renderListItems = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];

  this.listRender.renderData({
    response: items.map((item = {}) => ({
      id: item.id == null ? "" : String(item.id),
      selected: item.selected === "true" ? "true" : "false",
      disabled: item.disabled === "true" ? "true" : "false",
      selectable: item.selectable === "false" ? "false" : "true",
      leading: item.leading || "",
      leadingType: item.leadingType || (item.leading ? "icon" : "none"),
      overline: item.overline || "",
      headline: item.headline || "",
      supporting: item.supporting || "",
      trailingText: item.trailingText || "",
      trailingAction: item.trailingAction || "",
      trailingActionLabel:
        item.trailingActionLabel || item.headline || String(item.id || ""),
    })),
  });
};

this._listClickHandler = (event) => {
  const trailingAction = event.target.closest(
    this.listRender.cssSelectors.trailingAction,
  );
  if (trailingAction) {
    const item = trailingAction.closest(this.listRender.cssSelectors.item);
    if (!item || item.dataset.disabled === "true") return;

    event.stopPropagation();
    Weventbus.emit("@listTrailingActionClicked", { event, targetInstance: this });
    return;
  }

  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item || !this.appendElement.contains(item)) return;
  if (item.dataset.disabled === "true") return;

  if (item.dataset.selectable !== "false" && item.dataset.id) {
    this.toggleSelection(item.dataset.id);
  }

  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
};

this._listKeydownHandler = (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest(this.listRender.cssSelectors.trailingAction)) return;

  const item = event.target.closest(this.listRender.cssSelectors.item);
  if (!item || !this.appendElement.contains(item)) return;

  event.preventDefault();
  item.click();
};

this.appendElement.addEventListener("click", this._listClickHandler);
this.appendElement.addEventListener("keydown", this._listKeydownHandler);

this.subscriptions = {
  listItems: [this.renderListItems],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this.customEvents = null;
