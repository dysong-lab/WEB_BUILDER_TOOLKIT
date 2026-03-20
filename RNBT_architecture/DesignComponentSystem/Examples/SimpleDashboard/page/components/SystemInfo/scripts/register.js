/**
 * SystemInfo — 조립 코드
 *
 * FieldRenderMixin을 적용하여 시스템 정보를 표시한다.
 * 도메인 로직 없음. Mixin 적용 + 구독 연결 + 이벤트 매핑만.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        name:        '.system-info__name',
        statusLabel: '.system-info__status',
        version:     '.system-info__version',
        uptime:      '.system-info__uptime'
    },
    datasetSelectors: {
        status:      'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
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
