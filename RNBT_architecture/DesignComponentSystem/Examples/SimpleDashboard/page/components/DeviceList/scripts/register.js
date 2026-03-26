/**
 * DeviceList — 조립 코드
 *
 * ListRenderMixin으로 장치 목록을 표시하고,
 * ShadowPopupMixin + ListRenderMixin으로 클릭한 장치의 상세 정보를 팝업으로 표시한다.
 *
 * 팝업 내부에서도 ListRenderMixin을 사용한다.
 * appendElement를 shadowRoot로 지정하면 Shadow DOM 안에서 동작한다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

// 장치 목록 (일반 DOM)
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.device-list__body',
        item:      '.device-list__item',
        template:  '#device-list-item-template',
        name:      '.device-list__name',
        type:      '.device-list__type',
        status:    '.device-list__status'
    },
    datasetAttrs: {
        status: 'status'
    }
});

// 상세 팝업 (Shadow DOM)
// onCreated에서 팝업 내부용 ListRenderMixin을 적용한다.
this._popupScope = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#device-detail-popup-template',
        closeBtn: '.popup-close-btn',
        title:    '.popup-title'
    },
    onCreated: (shadowRoot) => {
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

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    devices: [this.listRender.renderData]
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

// 일반 DOM 이벤트 (instance.appendElement 안)
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@deviceClicked'
    }
};
Wkit.bindEvents(this, this.customEvents);

// Shadow DOM 내부 이벤트 → Weventbus로 전파
this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@devicePopupClose'
    }
});
