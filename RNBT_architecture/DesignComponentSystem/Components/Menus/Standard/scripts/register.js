/**
 * Menus — Standard
 *
 * 목적: 임시 표면에 선택 항목 목록을 표시하는 컨텍스트 메뉴를 제공한다
 * 기능: ShadowPopupMixin으로 표시/숨김 관리 + popup 내부 ListRenderMixin으로 항목 렌더링
 *
 * Mixin: ShadowPopupMixin, ListRenderMixin
 */

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

this._popupScope = null;
this._motionDuration = 200;
this._motionTimer = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#menu-popup-template',
        overlay:  '.menu__overlay',
        surface:  '.menu__surface',
        item:     '.menu__item'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.menu__list',
                item:      '.menu__item',
                template:  '#menu-item-template',
                id:        '.menu__item',
                disabled:  '.menu__item',
                icon:      '.menu__item-icon',
                label:     '.menu__item-label'
            },
            itemKey:      'id',
            datasetAttrs: {
                id:       'id',
                disabled: 'disabled'
            }
        });
    }
});

this.openMenu = function(payload = {}) {
    const { response = {} } = payload;
    const items = response.items ?? response.data ?? [];

    if (this._motionTimer) {
        clearTimeout(this._motionTimer);
        this._motionTimer = null;
    }

    this.shadowPopup.show();

    const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
    if (overlay) {
        overlay.dataset.state = 'closed';
        void overlay.offsetWidth;
        requestAnimationFrame(() => {
            overlay.dataset.state = 'open';
        });
    }

    if (this._popupScope && this._popupScope.listRender) {
        this._popupScope.listRender.renderData({ response: items });
    }
};

this.closeMenu = function() {
    const overlay = this.shadowPopup.query(this.shadowPopup.cssSelectors.overlay);
    if (!overlay) {
        this.shadowPopup.hide();
        return;
    }

    if (this._motionTimer) {
        clearTimeout(this._motionTimer);
    }

    overlay.dataset.state = 'closing';
    this._motionTimer = setTimeout(() => {
        this.shadowPopup.hide();
        overlay.dataset.state = 'closed';
        this._motionTimer = null;
    }, this._motionDuration);
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.overlay]: (event) => {
            if (event.target.closest(this.shadowPopup.cssSelectors.surface)) return;
            Weventbus.emit('@menuDismissed', { event, targetInstance: this });
        },
        [this.shadowPopup.cssSelectors.item]: (event) => {
            const item = event.target.closest(this.shadowPopup.cssSelectors.item);
            if (!item || item.dataset.disabled === 'true') return;
            const itemId = item.dataset.id;
            Weventbus.emit('@menuItemSelected', { event, targetInstance: this, itemId });
        }
    }
});
