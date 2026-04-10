/**
 * Dialogs — Standard
 *
 * 목적: 중요한 사용자 결정을 위한 모달 대화상자를 제공한다
 * 기능: ShadowPopupMixin으로 표시/숨김 관리 + popup 내부 FieldRenderMixin으로 텍스트 반영
 *
 * Mixin: ShadowPopupMixin, FieldRenderMixin
 */

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

this._popupScope = null;
this._closeTimer = null;
this._dialogMotionDuration = 280;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template:       '#dialog-popup-template',
        overlay:        '.dialog__overlay',
        surface:        '.dialog__surface',
        headline:       '.dialog__headline',
        supportingText: '.dialog__supporting-text',
        closeBtn:       '.dialog__close',
        cancelBtn:      '.dialog__cancel',
        confirmBtn:     '.dialog__confirm'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };

        applyFieldRenderMixin(this._popupScope, {
            cssSelectors: {
                headline:       '.dialog__headline',
                supportingText: '.dialog__supporting-text',
                confirmLabel:   '.dialog__confirm-label',
                cancelLabel:    '.dialog__cancel-label'
            }
        });
    }
});

this.openDialog = function(payload = {}) {
    const { response = {} } = payload;

    if (this._closeTimer) {
        clearTimeout(this._closeTimer);
        this._closeTimer = null;
    }

    this.shadowPopup.show();

    const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
    if (overlay) {
        overlay.dataset.state = 'closed';
        void overlay.offsetWidth;
        requestAnimationFrame(() => {
            overlay.dataset.state = 'open';
        });
    }

    if (this._popupScope && this._popupScope.fieldRender) {
        this._popupScope.fieldRender.renderData({
            response: {
                headline:       response.headline ?? '',
                supportingText: response.supportingText ?? '',
                confirmLabel:   response.confirmLabel ?? 'Confirm',
                cancelLabel:    response.cancelLabel ?? 'Cancel'
            }
        });
    }
};

this.closeDialog = function() {
    const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
    if (!overlay) {
        this.shadowPopup.hide();
        return;
    }

    if (this._closeTimer) {
        clearTimeout(this._closeTimer);
    }

    overlay.dataset.state = 'closing';
    this._closeTimer = setTimeout(() => {
        this.shadowPopup.hide();
        overlay.dataset.state = 'closed';
        this._closeTimer = null;
    }, this._dialogMotionDuration);
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
            Weventbus.emit('@dialogDismissed', { event, targetInstance: this });
        },
        [this.shadowPopup.cssSelectors.closeBtn]: '@dialogClosed',
        [this.shadowPopup.cssSelectors.cancelBtn]: '@dialogCancelled',
        [this.shadowPopup.cssSelectors.confirmBtn]: '@dialogConfirmed'
    }
});
