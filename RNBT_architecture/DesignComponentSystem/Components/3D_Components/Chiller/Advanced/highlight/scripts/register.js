/**
 * Chiller — Advanced/highlight / scripts / register
 *
 * MeshStateMixin + MeshHighlightMixin
 * 상태 색상 변경 + 클릭 시 emissive 강조
 *
 * MeshState는 material.color, MeshHighlight는 material.emissive를
 * 사용하므로 두 Mixin이 동시 적용되어도 충돌하지 않는다.
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

// ── MeshHighlightMixin ────────────────────────────────────────

applyMeshHighlightMixin(this, {
    highlightColor:     0xffaa00,
    highlightIntensity: 0.4
});

// ── 구독 연결 ────────────────────────────────────────────────

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

// ── 3D 이벤트 → 외부 전파 ─────────────────────────────────────
// `@chillerClicked`를 수신한 쪽(페이지)이 meshHighlight.clearAll() →
// meshHighlight.highlight('chiller')를 호출하여 강조를 토글한다.

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@chillerClicked'
};
bind3DEvents(this, this.customEvents);
