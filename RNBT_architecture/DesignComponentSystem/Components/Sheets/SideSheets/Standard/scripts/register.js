/**
 * SideSheets — Standard
 *
 * 목적: 화면 측면에 고정된 보조 콘텐츠와 액션을 모달 형태로 표시한다
 * 기능: ShadowPopupMixin으로 시트 오버레이 관리 + FieldRenderMixin으로 헤더 렌더링 + ListRenderMixin으로 액션 버튼 렌더링
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
        template: '#side-sheet-popup-template',
        closeBtn: '.side-sheet__close-btn',
        scrim:    '.side-sheet__scrim'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };

        applyFieldRenderMixin(this._popupScope, {
            cssSelectors: {
                headline:   '.side-sheet__headline',
                supporting: '.side-sheet__supporting'
            }
        });

        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container:   '.side-sheet__actions',
                template:    '#side-sheet-action-template',
                actionid:    '.side-sheet__action',
                actionLabel: '.side-sheet__action-label',
                actionIcon:  '.side-sheet__action-icon'
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
        [this.shadowPopup.cssSelectors.closeBtn]: '@sideSheetClose',
        [this.shadowPopup.cssSelectors.scrim]:    '@sideSheetClose',
        '.side-sheet__action':                    '@sideSheetActionClicked'
    }
});

// ======================
// 2. 구독 연결 — _popupScope 내부 Mixin은 show() 이후 생성되므로 래퍼 사용
// ======================

this._renderSideSheetInfo = function({ response: data }) {
    if (this._popupScope && this._popupScope.fieldRender) {
        this._popupScope.fieldRender.renderData({ response: data });
    }
};

this._renderSideSheetActions = function({ response: data }) {
    if (this._popupScope && this._popupScope.listRender) {
        this._popupScope.listRender.renderData({ response: data });
    }
};

this.subscriptions = {
    sideSheetInfo:    [this._renderSideSheetInfo],
    sideSheetActions: [this._renderSideSheetActions]
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
