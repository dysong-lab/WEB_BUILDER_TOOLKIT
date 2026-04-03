/**
 * gltf_container — 01_status / component / register
 *
 * MeshStateMixin 단독 적용
 * 컨테이너 GLTF 내 Mesh의 상태 색상 변경
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
