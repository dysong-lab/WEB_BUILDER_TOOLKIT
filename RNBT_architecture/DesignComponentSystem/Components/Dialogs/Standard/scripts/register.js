/**
 * Dialogs — Standard
 *
 * 목적: 사용자 흐름에서 중요한 프롬프트를 제공하여 정보에 따라 행동하도록 한다
 * 기능: ShadowPopupMixin으로 오버레이 관리 + FieldRenderMixin으로 콘텐츠 렌더링 + ListRenderMixin으로 액션 버튼 렌더링
 *
 * Mixin: ShadowPopupMixin + FieldRenderMixin + ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

this._popupScope = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#dialog-popup-template',
        closeBtn: '.dialog__close-btn'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };

        applyFieldRenderMixin(this._popupScope, {
            cssSelectors: {
                icon:       '.dialog__icon',
                headline:   '.dialog__headline',
                supporting: '.dialog__supporting'
            }
        });

        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container:   '.dialog__actions',
                template:    '#dialog-action-template',
                actionid:    '.dialog__action',
                actionLabel: '.dialog__action-label'
            },
            itemKey: 'actionid',
            datasetAttrs: {
                actionid: 'actionid'
            }
        });
    }
});

// Shadow DOM 내부 이벤트 — show() 전에 호출해도 지연 바인딩됨
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@dialogClose',
        '.dialog__action': '@dialogActionClicked'
    }
});

// ======================
// 2. 구독 연결 — _popupScope 내부 Mixin은 show() 이후 생성되므로 래퍼 사용
// ======================

this._renderDialogInfo = function({ response: data }) {
    if (this._popupScope && this._popupScope.fieldRender) {
        this._popupScope.fieldRender.renderData({ response: data });
    }
};

this._renderDialogActions = function({ response: data }) {
    if (this._popupScope && this._popupScope.listRender) {
        this._popupScope.listRender.renderData({ response: data });
    }
};

this.subscriptions = {
    dialogInfo:    [this._renderDialogInfo],
    dialogActions: [this._renderDialogActions]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — 일반 DOM 이벤트는 없음 (Shadow DOM 내부만)
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
