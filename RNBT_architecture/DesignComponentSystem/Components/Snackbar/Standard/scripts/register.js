/**
 * Snackbar — Standard
 *
 * 목적: 화면 하단에 앱 프로세스에 대한 짧은 업데이트 메시지를 표시한다
 * 기능: FieldRenderMixin으로 본문 메시지 렌더링 + ListRenderMixin으로 액션 버튼 렌더링 + 닫기/액션 클릭 이벤트
 *
 * Mixin: FieldRenderMixin + ListRenderMixin
 * 표시/숨김과 자동 dismiss 타이머는 페이지가 data-open 속성으로 제어한다 (ShadowPopup 불필요).
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        snackbar:   '.snackbar',
        supporting: '.snackbar__supporting'
    }
});

applyListRenderMixin(this, {
    cssSelectors: {
        container:   '.snackbar__actions',
        template:    '#snackbar-action-template',
        actionid:    '.snackbar__action',
        actionLabel: '.snackbar__action-label'
    },
    itemKey: 'actionid',
    datasetAttrs: {
        actionid: 'actionid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    snackbarInfo:    [this.fieldRender.renderData],
    snackbarActions: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.actionid]: '@snackbarActionClicked',
        '.snackbar__close-btn':                  '@snackbarClose'
    }
};

bindEvents(this, this.customEvents);
