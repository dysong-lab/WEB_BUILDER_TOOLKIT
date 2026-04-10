/**
 * UPS — 03_status_popup / component / register
 *
 * MeshStateMixin + 3DShadowPopupMixin
 * 상태 색상 변경 + 클릭 시 상세 팝업 표시
 */

// ── MeshStateMixin ────────────────────────────────────────────

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ── 3DShadowPopupMixin ────────────────────────────────────────

const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: (shadowRoot) => {
        this.shadowPopup.bindPopupEvents({
            click: {
                '.popup-close': () => this.shadowPopup.hide()
            }
        });
    }
});

// ── 3D 이벤트 → 팝업 표시 ─────────────────────────────────────

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@upsClicked'
};
bind3DEvents(this, this.customEvents);

this.showDetail = () => {
    this.shadowPopup.show();

    const statusEl = this.shadowPopup.query('.popup-status');
    const nameEl = this.shadowPopup.query('.popup-name');

    if (nameEl) nameEl.textContent = this.name || 'UPS';
    if (statusEl) {
        const currentStatus = this.meshState.getMeshState('UPS') || 'normal';
        statusEl.textContent = currentStatus;
        statusEl.dataset.status = currentStatus;
    }
};
