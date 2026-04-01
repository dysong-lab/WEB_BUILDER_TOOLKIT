/**
 * BATT — 01_status / component / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "BATT" 메시 색상 변경
 */

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
