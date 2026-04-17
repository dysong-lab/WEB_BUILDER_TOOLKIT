/**
 * area_01 — Advanced/popup / scripts / register
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
    getStyles: () => cssCode || ''
});

// ── 3D 이벤트 → 외부 전파 ─────────────────────────────────────
// `@meshClicked`를 수신한 쪽(페이지/다른 컴포넌트)이 직접
// `instance.shadowPopup.show()`를 호출하여 팝업을 띄운다.
// 클릭된 Mesh 이름은 `resolveMeshName(event)`로 추출하여 활용한다.
// 팝업 콘텐츠는 publishCode HTML/CSS 자체로 결정된다.

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
