/**
 * Toolbars — Standard
 *
 * 목적: 현재 페이지와 관련된 자주 사용하는 액션을 그룹으로 표시하고 클릭 이벤트를 발행한다
 * 기능: ListRenderMixin으로 액션 항목 렌더링 + 클릭 이벤트
 *       (각 액션은 독립적 커맨드 — selected/active 상태 없음)
 *
 * Mixin: ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.toolbar__list',
        template:  '#toolbar-action-template',
        actionid:  '.toolbar__action',
        disabled:  '.toolbar__action',
        icon:      '.toolbar__icon',
        label:     '.toolbar__label'
    },
    itemKey: 'actionid',
    datasetAttrs: {
        actionid: 'actionid',
        disabled: 'disabled'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    toolbarActions: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.actionid]: '@toolbarActionClicked'
    }
};

bindEvents(this, this.customEvents);
