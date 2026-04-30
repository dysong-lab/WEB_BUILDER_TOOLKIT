/**
 * AppBars — Advanced / contextual
 *
 * 목적: 선택 모드 AppBar — 목록/갤러리에서 항목을 선택한 맥락에서 AppBar가 전환되어
 *       선택 카운트와 선택 전용 액션(delete/archive/share 등)을 노출한다.
 * 기능: FieldRenderMixin으로 count 렌더 + ListRenderMixin으로 actions[] 반복 렌더 +
 *       close/액션 클릭 이벤트를 버스로 릴레이
 *
 * Mixin: FieldRenderMixin + ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        bar:       '.top-app-bar',
        count:     '.top-app-bar__count',
        closeIcon: '.top-app-bar__close'
    }
});

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.top-app-bar__action-list',
        template:  '#top-app-bar-action-template',
        item:      '.top-app-bar__action-item',
        id:        '.top-app-bar__action-item',
        actionLabel: '.top-app-bar__action-item',
        icon:      '.top-app-bar__action-icon',
        label:     '.top-app-bar__action-label'
    },
    datasetAttrs: {
        id: 'id'
    },
    elementAttrs: {
        actionLabel: 'aria-label'
    }
});

// ======================
// 2. 데이터 변환 — selectionInfo 페이로드를 두 Mixin으로 분배
// ======================

this.renderSelection = ({ response }) => {
    this.fieldRender.renderData({ response: { count: response.count } });
    this.listRender.renderData({
        response: Array.isArray(response?.actions)
            ? response.actions.map((action) => ({
                ...action,
                actionLabel: action.label || ''
            }))
            : []
    });
};

// ======================
// 3. 구독 연결
// ======================

this.subscriptions = {
    selectionInfo: [this.renderSelection]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 4. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.closeIcon]: '@selectionCleared',
        [this.listRender.cssSelectors.item]:       '@selectionActionClicked'
    }
};
bindEvents(this, this.customEvents);
