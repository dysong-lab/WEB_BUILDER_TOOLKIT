/**
 * SideSheets — Standard
 *
 * 목적: 화면 측면에 보조 콘텐츠와 액션을 표시하는 시트를 제공한다
 * 기능: ShadowPopupMixin으로 표시/숨김 관리 + popup 내부 FieldRenderMixin으로 텍스트 반영
 *
 * Mixin: ShadowPopupMixin, FieldRenderMixin
 */

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

this._popupScope = null;
this._closeTimer = null;
this._sheetMotionDuration = 260;

applyShadowPopupMixin(this, {
  cssSelectors: {
    template: "#side-sheet-popup-template",
    overlay: ".side-sheet__overlay",
    surface: ".side-sheet__surface",
    headline: ".side-sheet__headline",
    supportingText: ".side-sheet__supporting-text",
    body: ".side-sheet__body",
    closeBtn: ".side-sheet__close",
    secondaryBtn: ".side-sheet__secondary",
    primaryBtn: ".side-sheet__primary",
  },
  onCreated: (shadowRoot) => {
    this._popupScope = { appendElement: shadowRoot };

    applyFieldRenderMixin(this._popupScope, {
      cssSelectors: {
        headline: ".side-sheet__headline",
        supportingText: ".side-sheet__supporting-text",
        body: ".side-sheet__body",
        primaryLabel: ".side-sheet__primary-label",
        secondaryLabel: ".side-sheet__secondary-label",
      },
    });
  },
});

this.renderSideSheetContent = function (payload = {}) {
  const { response = {} } = payload;

  if (!this._popupScope || !this._popupScope.fieldRender) return;

  this._popupScope.fieldRender.renderData({
    response: {
      headline: response.headline ?? "",
      supportingText: response.supportingText ?? "",
      body: response.body ?? "",
      primaryLabel: response.primaryLabel ?? "Inspect",
      secondaryLabel: response.secondaryLabel ?? "Close",
    },
  });

  const supportingText = this.shadowPopup.query(this.shadowPopup.cssSelectors.supportingText);
  const body = this.shadowPopup.query(this.shadowPopup.cssSelectors.body);

  if (supportingText) {
    supportingText.hidden = !String(response.supportingText ?? "").trim();
  }

  if (body) {
    body.hidden = !String(response.body ?? "").trim();
  }
};

this.openSideSheet = function (payload = {}) {
  if (this._closeTimer) {
    clearTimeout(this._closeTimer);
    this._closeTimer = null;
  }

  this.shadowPopup.show();
  this.renderSideSheetContent(payload);

  const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
  if (!overlay) return;

  overlay.dataset.state = "closed";
  void overlay.offsetWidth;
  requestAnimationFrame(() => {
    overlay.dataset.state = "open";
  });
};

this.closeSideSheet = function () {
  const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
  if (!overlay) {
    this.shadowPopup.hide();
    return;
  }

  if (this._closeTimer) {
    clearTimeout(this._closeTimer);
  }

  overlay.dataset.state = "closing";
  this._closeTimer = setTimeout(() => {
    this.shadowPopup.hide();
    overlay.dataset.state = "closed";
    this._closeTimer = null;
  }, this._sheetMotionDuration);
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.shadowPopup.bindPopupEvents({
  click: {
    [this.shadowPopup.cssSelectors.overlay]: (event) => {
      if (event.target.closest(this.shadowPopup.cssSelectors.surface)) return;
      Weventbus.emit("@sideSheetDismissed", { event, targetInstance: this });
    },
    [this.shadowPopup.cssSelectors.closeBtn]: "@sideSheetClosed",
    [this.shadowPopup.cssSelectors.secondaryBtn]: "@sideSheetSecondaryAction",
    [this.shadowPopup.cssSelectors.primaryBtn]: "@sideSheetPrimaryAction",
  },
});
