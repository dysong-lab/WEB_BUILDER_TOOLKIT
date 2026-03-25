/**
 * DeviceList — 조립 코드
 *
 * ListRenderMixin으로 장치 목록을 표시하고,
 * PopupMixin으로 클릭한 장치의 상세 정보를 팝업으로 표시한다.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

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

applyPopupMixin(this, {
    cssSelectors: {
        template:  '#device-detail-popup-template',
        closeBtn:  '.popup-close-btn',
        title:     '.popup-title',
        type:      '.popup-detail-type',
        status:    '.popup-detail-status',
        location:  '.popup-detail-location',
        lastSeen:  '.popup-detail-lastSeen',
        ip:        '.popup-detail-ip'
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
bindEvents(this, this.customEvents);

// Shadow DOM 내부 이벤트 (bindEvents로는 shadow boundary를 넘을 수 없음)
// '@eventName' 문자열을 넘기면 Weventbus로 전파된다 (customEvents와 동일한 패턴).
this.popup.bindPopupEvents({
    click: {
        [this.popup.cssSelectors.closeBtn]: '@devicePopupClose'
    }
});
