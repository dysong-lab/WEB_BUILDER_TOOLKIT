/**
 * EventBrowser 컴포넌트
 *
 * 목적: 데이터를 보여준다 + 콘텐츠를 별도 레이어에 표시한다
 * 기능: ListRenderMixin으로 이벤트 목록을 표시하고,
 *       ShadowPopupMixin으로 선택한 이벤트의 상세 정보를 팝업으로 보여준다
 *
 * Mixin: ListRenderMixin, ShadowPopupMixin
 */


// ── 1. Mixin 적용 ──

// 1-1. 이벤트 목록
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-browser__list',
        template:  '#event-browser-item-template',
        time:      '.event-browser__item-time',
        level:     '.event-browser__item-level',
        message:   '.event-browser__item-message',
        source:    '.event-browser__item-source'
    }
});

// 1-2. 상세 팝업
applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#event-detail-popup-template',
        closeBtn: '.popup-close-btn'
    },
    onCreated: (shadowRoot) => {
        // 팝업 내부에서 ListRenderMixin으로 상세 필드 렌더링
        this._popupScope = { appendElement: shadowRoot };

        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.popup-detail-list',
                template:  '#popup-detail-item-template',
                label:     '.popup-field__label',
                value:     '.popup-field__value'
            }
        });
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    events: [this.listRender.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);

// ── 3. 이벤트 ──
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.template]: '@eventItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@eventPopupClose'
    }
});
