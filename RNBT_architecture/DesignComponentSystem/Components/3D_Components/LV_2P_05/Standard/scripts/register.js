/**
 * LV_2P_05 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'LV-2J7'의 material 색상 변경
 *
 * GLTF 구조: scene → "LV-2J7"(mesh 0) — 단일 Node, 단일 Mesh.
 * (LV_2P_02/LV_2P_03/LV_2P_04와 동일하게 VRayLight001 보조 Node 없음)
 * 폴더/컴포넌트 이름(LV_2P_05)과 GLTF Node/Mesh 이름(LV-2J7)이 다르므로
 * 구독 데이터의 meshName은 반드시 'LV-2J7' 이어야 한다.
 * MeshStateMixin이 getObjectByName('LV-2J7')으로 해석한다.
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
