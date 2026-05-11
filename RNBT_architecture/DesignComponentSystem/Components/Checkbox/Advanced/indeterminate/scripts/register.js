const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    group: ".checkbox-group",
    parent: ".checkbox-group__parent",
    parentInput: ".checkbox-group__parent-input",
    parentLabel: ".checkbox-group__parent-label",
    container: ".checkbox-group__children",
    template: "#checkbox-group-child-template",
    childItem: ".checkbox-group__child",
    checkid: ".checkbox-group__child",
    label: ".checkbox-group__child-label",
  },
  itemKey: "checkid",
  datasetAttrs: {
    checkid: "checkid",
  },
});

this._childrenStates = new Map();
this._parentId = null;
this._parentLabel = "";

this._applyChildDom = function (id, selected) {
  const child = this.appendElement.querySelector(
    `${this.listRender.cssSelectors.childItem}[data-checkid="${String(id)}"]`,
  );
  if (!child) return;
  child.dataset.checked = selected ? "true" : "false";
  child.setAttribute("aria-checked", selected ? "true" : "false");
};

this._renderChildren = function (children) {
  const safeChildren = Array.isArray(children) ? children : [];
  this._childrenStates = new Map(
    safeChildren.map((child) => [
      String(child?.id ?? ""),
      Boolean(child?.selected),
    ]),
  );

  this.listRender.renderData({
    response: safeChildren.map((child) => ({
      checkid: String(child?.id ?? ""),
      label: String(child?.label ?? ""),
    })),
  });

  this._childrenStates.forEach((selected, id) =>
    this._applyChildDom(id, selected),
  );
};

this._recomputeParentState = function () {
  const parent = this.appendElement.querySelector(
    this.listRender.cssSelectors.parent,
  );
  const group = this.appendElement.querySelector(
    this.listRender.cssSelectors.group,
  );
  const input = this.appendElement.querySelector(
    this.listRender.cssSelectors.parentInput,
  );
  if (!parent || !group || !input) return "unchecked";

  const values = [...this._childrenStates.values()];
  let nextState = "unchecked";

  if (!values.length) {
    nextState = parent.dataset.state === "checked" ? "checked" : "unchecked";
  } else if (values.every(Boolean)) {
    nextState = "checked";
  } else if (values.some(Boolean)) {
    nextState = "indeterminate";
  }

  parent.dataset.state = nextState;
  group.dataset.state = nextState;
  input.checked = nextState === "checked";
  input.indeterminate = nextState === "indeterminate";
  input.setAttribute(
    "aria-checked",
    nextState === "indeterminate"
      ? "mixed"
      : nextState === "checked"
        ? "true"
        : "false",
  );

  return nextState;
};

this._emitChange = function () {
  Weventbus.emit("@checkboxGroupChanged", {
    targetInstance: this,
    parentId: this._parentId,
    parentState: this._recomputeParentState(),
    childrenIds: [...this._childrenStates.entries()].map(([id, selected]) => ({
      id,
      selected,
    })),
  });
};

this._renderGroup = function ({ response } = {}) {
  const parentData = response?.parent || {};
  const children = response?.children;
  this._parentId = parentData.id == null ? null : String(parentData.id);
  this._parentLabel = String(parentData.label ?? "");

  const parentLabel = this.appendElement.querySelector(
    this.listRender.cssSelectors.parentLabel,
  );
  if (parentLabel) parentLabel.textContent = this._parentLabel;

  this._renderChildren(children);
  this._recomputeParentState();
};

this._handleParentClick = function () {
  const current = this._recomputeParentState();
  const nextChecked = current !== "checked";
  this._childrenStates.forEach((_, id) => {
    this._childrenStates.set(id, nextChecked);
    this._applyChildDom(id, nextChecked);
  });

  if (!this._childrenStates.size) {
    const parent = this.appendElement.querySelector(
      this.listRender.cssSelectors.parent,
    );
    if (parent) parent.dataset.state = nextChecked ? "checked" : "unchecked";
  }

  this._emitChange();
};

this._handleChildClick = function (childEl) {
  const id = childEl?.dataset.checkid;
  if (!id || !this._childrenStates.has(id)) return;
  const nextChecked = !this._childrenStates.get(id);
  this._childrenStates.set(id, nextChecked);
  this._applyChildDom(id, nextChecked);
  this._emitChange();
};

this.subscriptions = {
  checkboxGroup: [this._renderGroup],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._groupClickHandler = (event) => {
  const parent = event.target.closest(this.listRender.cssSelectors.parent);
  if (parent) {
    event.preventDefault();
    this._handleParentClick();
    return;
  }

  const child = event.target.closest(this.listRender.cssSelectors.childItem);
  if (child) {
    event.preventDefault();
    this._handleChildClick(child);
  }
};

this.appendElement.addEventListener("click", this._groupClickHandler);
