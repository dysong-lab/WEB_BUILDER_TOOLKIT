const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".input-chip__list",
    template: "#input-chip-item-template",
    chipid: ".input-chip__item",
    label: ".input-chip__label",
    removeBtn: ".input-chip__remove",
  },
  itemKey: "chipid",
  datasetAttrs: {
    chipid: "chipid",
  },
});

this._chipClickHandler = null;

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  inputChipItems: [this.listRender.renderData],
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

this._chipClickHandler = (event) => {
  const removeButton = event.target.closest(this.listRender.cssSelectors.removeBtn);
  if (removeButton && this.appendElement.contains(removeButton)) {
    Weventbus.emit("@inputChipRemoved", {
      event,
      targetInstance: this,
    });
    return;
  }

  const chip = event.target.closest(this.listRender.cssSelectors.chipid);
  if (chip && this.appendElement.contains(chip)) {
    Weventbus.emit("@inputChipClicked", {
      event,
      targetInstance: this,
    });
  }
};

this.appendElement.addEventListener("click", this._chipClickHandler);
