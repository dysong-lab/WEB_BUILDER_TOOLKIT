/**
 * SC_02 — 01_status / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "SC-U1" 메시 색상 변경
 *
 * 장비 폴더명(SC_02)과 GLTF Mesh Node 이름(SC-U1)이 다른 비대칭 명명 케이스.
 * SC_01의 'SC-2U1', RTU의 'RTU2', RoomCage의 'cage01', RoomCageSmall의 'cage02' 패턴과 동류로,
 * 구독 데이터의 meshName은 'SC-U1'(하이픈 포함, 2U가 아닌 U)을 사용한다.
 *
 * material은 단일 객체 + baseColorTexture(JPG 불투명) + doubleSided:true + alphaMode 미선언(OPAQUE).
 * MeshStateMixin이 material을 clone한 뒤 color만 setHex하면,
 * 텍스처 색에 상태색이 곱해져 전체 외장이 단일 상태색으로 균일하게 착색된다.
 * (RoomCage/RoomCageSmall의 BLEND 반투명 착색과 달리 OPAQUE 균일 착색)
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
