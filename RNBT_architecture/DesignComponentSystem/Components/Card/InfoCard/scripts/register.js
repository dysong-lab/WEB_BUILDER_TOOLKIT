/**
 * InfoCard — 조립 코드
 *
 * FieldRenderMixin을 적용하여 정보 카드를 표시한다.
 * 이름, 상태, 값, 설명을 표시하는 범용 정보 카드.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        title: '.info-card__title',
        value: '.info-card__value',
        desc:  '.info-card__desc'
    },
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
