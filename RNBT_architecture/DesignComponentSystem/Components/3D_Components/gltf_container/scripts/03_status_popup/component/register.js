/**
 * gltf_container — 03_status_popup / component / register
 *
 * MeshStateMixin + 3DShadowPopupMixin
 * 컨테이너 GLTF 내 Mesh의 상태 색상 변경 + 클릭 시 상세 팝업 표시
 *
 * 하나의 팝업을 공유하며, 클릭된 Mesh에 따라 콘텐츠를 동적으로 교체한다.
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

// ── 3DShadowPopupMixin ────────────────────────────────────────

const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: () => {
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
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * Raycasting intersects에서 클릭된 Mesh 이름 추출
 * 이름이 있는 가장 가까운 object를 반환한다.
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};

/**
 * 클릭된 Mesh의 상세 팝업 표시
 *
 * @param {string} meshName - Mesh 이름
 * @param {Object} data - fetchAndPublish로 조회된 데이터
 */
this.showDetail = (meshName, data) => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    const statusEl = this.shadowPopup.query('.popup-status');

    if (nameEl) nameEl.textContent = meshName;
    if (statusEl) {
        const currentStatus = (data && data.status) || this.meshState.getMeshState(meshName) || 'normal';
        statusEl.textContent = currentStatus;
        statusEl.dataset.status = currentStatus;
    }
};
