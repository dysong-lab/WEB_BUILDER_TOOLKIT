/**
 * RoadBlock — 01_status / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "RoadBlock" 메시 색상 변경
 *
 * 장비 폴더명과 GLTF Mesh Node 이름이 일치하는 대칭 명명 케이스(BATT·Pump 규약).
 * 구독 데이터의 meshName은 'RoadBlock'을 사용한다.
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
