/**
 * Marker_RotationaCCTV — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`MarkerRotationaCCTV_A` (폴더명 `Marker_RotationaCCTV`와 **구분자 위치 불일치** — 폴더는 `Marker_RotationaCCTV`(앞쪽 언더스코어 1개 + 중간 언더스코어 없음), Node는 `MarkerRotationaCCTV_A`(앞쪽 언더스코어 제거 + 뒤쪽 `_A` 접미))" 메시 색상 변경
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

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
