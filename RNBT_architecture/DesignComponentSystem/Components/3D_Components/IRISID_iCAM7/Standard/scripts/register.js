/**
 * IRISID_iCAM7 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 'icam7' Mesh의 material 색상 변경
 *
 * GLTF 내부 구조: root(scale 1000x) → icam7 Mesh (단일)
 * 주의: 폴더명은 'IRISID_iCAM7'이지만 GLTF Node/Mesh 이름은 'icam7'이다.
 *       페이지의 equipmentStatus 데이터에서 meshName을 'icam7'으로 지정해야 한다.
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
