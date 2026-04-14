/**
 * AppBars — Advanced / searchEmbedded
 *
 * 목적: 제목 영역을 검색 input으로 대체한 AppBar 변형
 * 기능: FieldRenderMixin으로 placeholder/결과 개수를 렌더 + input/click 이벤트를 버스로 릴레이
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
        bar:         '.top-app-bar',
        placeholder: '.top-app-bar__search-input',
        count:       '.top-app-bar__count',
        navIcon:     '.top-app-bar__nav-icon',
        clearIcon:   '.top-app-bar__clear'
    },
    elementAttrs: {
        placeholder: 'placeholder'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    searchInfo: [this.fieldRender.renderData]
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
    input: {
        [this.fieldRender.cssSelectors.placeholder]: '@searchInputChanged'
    },
    click: {
        [this.fieldRender.cssSelectors.navIcon]:   '@navigationClicked',
        [this.fieldRender.cssSelectors.clearIcon]: '@searchCleared'
    }
};
bindEvents(this, this.customEvents);
