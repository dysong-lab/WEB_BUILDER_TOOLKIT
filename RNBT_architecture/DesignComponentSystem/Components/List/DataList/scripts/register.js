/**
 * DataList — 조립 코드
 *
 * ListRenderMixin을 적용하여 데이터 목록을 표시한다.
 * 배열 데이터를 template 기반으로 반복 렌더링하는 범용 리스트.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.data-list__container',
        item:      '.data-list__item',
        template:  '.data-list__template',
        title:     '.data-list__title',
        desc:      '.data-list__desc',
        time:      '.data-list__time'
    },
    datasetSelectors: {
        level: 'level'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@itemClicked'
    }
};
bindEvents(this, this.customEvents);
