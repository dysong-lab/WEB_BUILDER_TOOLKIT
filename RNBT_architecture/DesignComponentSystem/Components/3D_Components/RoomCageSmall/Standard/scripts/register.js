/**
 * RoomCageSmall — 01_status / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "cage02" 메시 색상 변경
 *
 * 장비 폴더명(RoomCageSmall)과 GLTF Mesh Node 이름(cage02)이 다른 비대칭 명명 케이스.
 * RoomCage의 'cage01', RTU의 'RTU2' 패턴과 동류로, 구독 데이터의 meshName은 'cage02'를 사용한다.
 * material은 alphaMode: BLEND + 알파 PNG 텍스처를 사용하므로,
 * MeshStateMixin이 material을 clone한 뒤 color만 setHex하면
 * 투명 영역은 유지되고 불투명 영역(케이지 패턴)만 상태색으로 착색된다.
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
