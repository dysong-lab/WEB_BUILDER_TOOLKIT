/**
 * IconButtons — Standard
 *
 * 목적: 아이콘 버튼의 아이콘을 표시하고 클릭 이벤트를 발행한다
 * 기능: FieldRenderMixin으로 아이콘 렌더링 + 클릭 이벤트
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
        iconButton: '.icon-button',
        icon:       '.icon-button__icon'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    iconButtonInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.iconButton]: '@iconButtonClicked'
    }
};

bindEvents(this, this.customEvents);
