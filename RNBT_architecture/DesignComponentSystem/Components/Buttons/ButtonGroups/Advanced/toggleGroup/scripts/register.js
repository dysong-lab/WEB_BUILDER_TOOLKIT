const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    group: ".button-group-toggle",
    container: ".button-group-toggle__list",
    template: "#button-group-toggle-item-template",
    item: ".button-group-toggle__item",
    id: ".button-group-toggle__item",
    label: ".button-group-toggle__label",
  },
  itemKey: "id",
  datasetAttrs: {
    id: "id",
    selected: "selected",
    status: "status",
    tone: "tone",
  },
});

this._selectedId = null;
this._groupClickHandler = null;

this._renderChoices = function ({ response } = {}) {
  const items = Array.isArray(response) ? response : [];
  this.listRender.renderData({ response: items });
  const initial =
    items.find((item) => String(item?.selected) === "true" || item?.selected === true)
      ?.id ?? items[0]?.id ?? null;
  this._selectedId = initial === null || initial === undefined ? null : String(initial);
  this._applySelection();
};

this._applySelection = function () {
  const group = this.appendElement.querySelector(this.listRender.cssSelectors.group);
  const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);

  items.forEach((item) => {
    const isSelected = item.dataset.id === this._selectedId;
    item.dataset.selected = isSelected ? "true" : "false";
    item.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  if (group) {
    group.dataset.selectedId = this._selectedId || "";
  }
};

this._setSelected = function (nextId) {
  const normalizedId =
    nextId === null || nextId === undefined ? null : String(nextId);
  if (!normalizedId || normalizedId === this._selectedId) return;

  const items = Array.from(
    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
  );
  const exists = items.some((item) => item.dataset.id === normalizedId);
  if (!exists) return;

  const previousId = this._selectedId;
  this._selectedId = normalizedId;
  this._applySelection();

  Weventbus.emit("@buttonGroupToggled", {
    targetInstance: this,
    selectedId: normalizedId,
    previousId,
  });
};

this._handleSelect = function (event) {
  const target = event.target.closest(this.listRender.cssSelectors.item);
  if (!target) return;
  this._setSelected(target.dataset.id);
};

this._setSelectedFromTopic = function ({ response } = {}) {
  this._setSelected(response?.id);
};

this.subscriptions = {
  buttonGroupChoiceItems: [this._renderChoices],
  setSelectedButtonGroupChoice: [this._setSelectedFromTopic],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._groupClickHandler = this._handleSelect.bind(this);
this.appendElement.addEventListener("click", this._groupClickHandler, true);
