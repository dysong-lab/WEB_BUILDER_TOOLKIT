/**
 * Panel — 03_status_popup / component / register
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
    getStyles: () => cssCode || ''
});

// ── 3D 이벤트 → 외부 전파 ─────────────────────────────────────
// `@panelClicked`를 수신한 쪽(페이지/다른 컴포넌트)이 직접
// `instance.shadowPopup.show()`를 호출하여 팝업을 띄운다.
// 팝업 콘텐츠는 publishCode HTML/CSS 자체로 결정된다.

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@panelClicked'
};
bind3DEvents(this, this.customEvents);
