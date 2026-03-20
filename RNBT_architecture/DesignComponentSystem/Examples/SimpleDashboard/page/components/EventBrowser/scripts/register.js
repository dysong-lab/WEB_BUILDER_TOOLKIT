/**
 * EventBrowser — 조립 코드
 *
 * EventListMixin을 적용하여 이벤트 목록 + Ack 기능을 제공한다.
 * Ack API 호출은 페이지가 담당, Mixin은 DOM 상태 변경만.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyEventListMixin(this, {
    cssSelectors: {
        container: '.event-browser__list',
        item:      '.event-browser__item',
        template:  '#event-browser-item-template',
        severity:  '.event-browser__severity-label',
        time:      '.event-browser__time',
        source:    '.event-browser__source',
        message:   '.event-browser__message',
        ackBtn:    '.event-browser__ack-btn'
    },
    datasetSelectors: {
        itemKey:  'id',
        severity: 'severity',
        ack:      'ack'
    }
});

// ======================
// 2. 데이터 변환 + 구독 연결
// ======================

this.dataFormats = {
    eventBrowser: (data) => data.events.map(event => ({
        itemKey:  String(event.id),
        severity: event.severity,
        time:     new Date(event.timestamp).toLocaleTimeString('ko-KR', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }),
        source:   event.source,
        message:  event.message,
        ack:      String(event.acknowledged)
    }))
};

this.subscriptions = {
    eventBrowser: [({ response }) => {
        this.eventList.renderData({
            response: { data: this.dataFormats.eventBrowser(response.data) }
        });
    }]
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
        [this.eventList.cssSelectors.ackBtn]: '@ackClicked',
        [this.eventList.cssSelectors.item]:    '@eventSelected'
    }
};
bindEvents(this, this.customEvents);
