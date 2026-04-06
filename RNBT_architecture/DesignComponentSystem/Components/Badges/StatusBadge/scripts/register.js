/**
 * StatusBadge 컴포넌트
 *
 * 목적: 온라인/오프라인/경고/에러 등 상태를 뱃지로 표시한다
 * 기능: FieldRenderMixin으로 상태 라벨과 data-status 속성을 매핑한다
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        status: '.status-badge',
        label:  '.status-badge__label'
    },
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    badgeStatus: [this.fieldRender.renderData]
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

this.customEvents = {};
bindEvents(this, this.customEvents);
