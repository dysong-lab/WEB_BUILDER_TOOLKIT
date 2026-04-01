/**
 * StatusCard 컴포넌트
 *
 * 목적: 시스템 상태 정보를 카드 형태로 표시한다
 * 기능: FieldRenderMixin으로 상태 데이터를 렌더링한다
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
        title:   '.status-card__title',
        status:  '.status-card__status',
        version: '.status-card__version',
        uptime:  '.status-card__uptime'
    },
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    systemStatus: [this.fieldRender.renderData]
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
