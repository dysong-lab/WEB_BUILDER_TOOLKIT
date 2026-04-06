/**
 * InfoDialog 컴포넌트
 *
 * 목적: 정보를 다이얼로그로 표시한다
 * 기능: ShadowPopupMixin으로 Shadow DOM 팝업을 관리하고,
 *       onCreated에서 FieldRenderMixin으로 제목/본문/아이콘을 매핑한다
 *
 * Mixin: ShadowPopupMixin + FieldRenderMixin (팝업 내부)
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

this._popupScope = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template:  '#info-dialog-popup-template',
        closeBtn:  '.dialog-close',
        overlay:   '.dialog-overlay',
        confirm:   '.dialog-confirm'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyFieldRenderMixin(this._popupScope, {
            cssSelectors: {
                icon:  '.dialog-icon',
                title: '.dialog-title',
                body:  '.dialog-body'
            }
        });
    }
});

// Shadow DOM 내부 이벤트
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@dialogClose',
        [this.shadowPopup.cssSelectors.confirm]: '@dialogConfirm'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
