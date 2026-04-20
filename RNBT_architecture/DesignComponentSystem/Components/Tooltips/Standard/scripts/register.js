const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._popupScope = null;
this._hideTimer = null;
this._tooltipInfo = {
  label: "",
  supportingText: "",
  placement: "top",
};

applyShadowPopupMixin(this, {
  cssSelectors: {
    template: "#tooltip-popup-template",
    overlay: ".tooltip__overlay",
    surface: ".tooltip__surface",
    label: ".tooltip__label",
    supportingText: ".tooltip__supporting",
  },
  onCreated: (shadowRoot) => {
    this._popupScope = { appendElement: shadowRoot };
    applyFieldRenderMixin(this._popupScope, {
      cssSelectors: {
        label: ".tooltip__label",
        supportingText: ".tooltip__supporting",
      },
    });
  },
});

this.cssSelectors = {
  root: ".tooltip-host",
  trigger: ".tooltip-host__trigger",
};

this._triggerEnterHandler = null;
this._triggerLeaveHandler = null;

this.normalizeTooltipInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const placement =
    nextData.placement === "top" ||
    nextData.placement === "right" ||
    nextData.placement === "bottom" ||
    nextData.placement === "left"
      ? nextData.placement
      : "top";

  return {
    label:
      nextData.label === null || nextData.label === undefined
        ? ""
        : String(nextData.label),
    supportingText:
      nextData.supportingText === null || nextData.supportingText === undefined
        ? ""
        : String(nextData.supportingText),
    placement,
  };
};

this.renderTooltipInfo = function (payload = {}) {
  const nextData = this.normalizeTooltipInfo(payload);
  this._tooltipInfo = nextData;

  if (!this._popupScope || !this._popupScope.fieldRender) {
    this.shadowPopup.show();
    this.shadowPopup.hide();
  }

  if (!this._popupScope || !this._popupScope.fieldRender) return;

  this._popupScope.fieldRender.renderData({
    response: {
      label: nextData.label,
      supportingText: nextData.supportingText,
    },
  });

  const surface = this.shadowPopup.query(this.shadowPopup.cssSelectors.surface);
  const supportingText = this.shadowPopup.query(
    this.shadowPopup.cssSelectors.supportingText,
  );
  if (surface) {
    surface.dataset.placement = nextData.placement;
  }
  if (supportingText) {
    supportingText.hidden = nextData.supportingText === "";
  }
};

this.openTooltip = function () {
  if (!this._tooltipInfo.label) return;

  if (this._hideTimer) {
    clearTimeout(this._hideTimer);
    this._hideTimer = null;
  }

  this.renderTooltipInfo({ response: this._tooltipInfo });
  this.shadowPopup.show();

  const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
  const surface = this.shadowPopup.query(this.shadowPopup.cssSelectors.surface);
  if (overlay) {
    overlay.dataset.state = "open";
  }
  if (surface) {
    surface.dataset.open = "true";
  }

  Weventbus.emit("@tooltipShown", {
    targetInstance: this,
    response: this._tooltipInfo,
  });
};

this.closeTooltip = function (reason = "manual") {
  const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
  const surface = this.shadowPopup.query(this.shadowPopup.cssSelectors.surface);

  if (overlay) {
    overlay.dataset.state = "closed";
  }
  if (surface) {
    surface.dataset.open = "false";
  }

  this._hideTimer = setTimeout(() => {
    this.shadowPopup.hide();
    this._hideTimer = null;
  }, 120);

  Weventbus.emit("@tooltipHidden", {
    targetInstance: this,
    response: { reason },
  });
};

this.subscriptions = {
  tooltipInfo: [this.renderTooltipInfo],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) =>
    each((handler) => subscribe(topic, this, handler), handlers),
  ),
);

this._triggerEnterHandler = (event) => {
  const trigger = event.target.closest(this.cssSelectors.trigger);
  if (!trigger || !this.appendElement.contains(trigger)) return;
  this.openTooltip();
};

this._triggerLeaveHandler = (event) => {
  const trigger = event.target.closest(this.cssSelectors.trigger);
  if (!trigger || !this.appendElement.contains(trigger)) return;
  this.closeTooltip(event.type);
};

this.appendElement.addEventListener("mouseenter", this._triggerEnterHandler, true);
this.appendElement.addEventListener("focusin", this._triggerEnterHandler);
this.appendElement.addEventListener("mouseleave", this._triggerLeaveHandler, true);
this.appendElement.addEventListener("focusout", this._triggerLeaveHandler);
