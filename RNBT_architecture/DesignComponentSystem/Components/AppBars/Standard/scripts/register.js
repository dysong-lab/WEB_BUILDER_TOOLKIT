/**
 * AppBars — Standard
 *
 * 목적: 페이지 상단에 제목과 네비게이션을 표시한다
 * 기능: FieldRenderMixin으로 제목을 렌더링 + 스크롤 시 배경색 전환
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        title:   '.top-app-bar__title',
        bar:     '.top-app-bar',
        navIcon: '.top-app-bar__nav-icon',
        action:  '.top-app-bar__action'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    appBarInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.navIcon]: '@navigationClicked',
        [this.fieldRender.cssSelectors.action]:  '@actionClicked'
    }
};
bindEvents(this, this.customEvents);
