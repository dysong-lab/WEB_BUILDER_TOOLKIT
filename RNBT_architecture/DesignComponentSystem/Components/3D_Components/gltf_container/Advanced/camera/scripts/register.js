/**
 * gltf_container — 02_status_camera / scripts / register
 *
 * MeshStateMixin + CameraFocusMixin
 * 컨테이너 GLTF 내 Mesh의 상태 색상 변경 + 클릭 시 카메라 포커스 이동
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

// ── CameraFocusMixin ──────────────────────────────────────────

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
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

// ── 3D 클릭 이벤트 ────────────────────────────────────────────

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
