const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

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

this._triggerElement = null;
this._triggerEnterHandler = null;
this._triggerLeaveHandler = null;
this._outsidePointerHandler = null;

this.ensureTooltipPopup = function () {
  if (!this._popupScope || !this._popupScope.fieldRender) {
    this.shadowPopup.show();
    this.shadowPopup.hide();
  }
};

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

  this.ensureTooltipPopup();

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

  this.ensureTooltipPopup();
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

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
  tooltipInfo: [this.renderTooltipInfo],
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

this._triggerEnterHandler = (event) => {
  this.openTooltip();
};

this._triggerLeaveHandler = (event) => {
  this.closeTooltip(event.type);
};

this._triggerElement = this.appendElement.querySelector(this.cssSelectors.trigger);
if (this._triggerElement) {
  this._triggerElement.addEventListener("mouseenter", this._triggerEnterHandler);
  this._triggerElement.addEventListener("focus", this._triggerEnterHandler);
  this._triggerElement.addEventListener("mouseleave", this._triggerLeaveHandler);
  this._triggerElement.addEventListener("blur", this._triggerLeaveHandler);
}

this._outsidePointerHandler = (event) => {
  if (!this._triggerElement) return;
  if (this._triggerElement.contains(event.target)) return;
  this.closeTooltip("outside");
};

document.addEventListener("pointerdown", this._outsidePointerHandler);
