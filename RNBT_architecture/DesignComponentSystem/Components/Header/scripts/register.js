/**
 * Header 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: FieldRenderMixin으로 페이지 타이틀, 사용자명, 현재 시간을 표시한다
 *
 * Mixin: FieldRenderMixin
 */


// ── 1. Mixin 적용 ──
applyFieldRenderMixin(this, {
    cssSelectors: {
        title:    '.header__title',
        userName: '.header__user-name',
        time:     '.header__time'
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    headerInfo: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
