/**
 * BATT (Battery Cabinet) — register
 *
 * 전제: selectItem으로 모델이 이미 바인딩되어 있다.
 * 이 스크립트는 모델 로드 이후 시점(register)에서 실행된다.
 *
 * - MeshStateMixin: 상태에 따라 "BATT" 메시 색상 변경
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
