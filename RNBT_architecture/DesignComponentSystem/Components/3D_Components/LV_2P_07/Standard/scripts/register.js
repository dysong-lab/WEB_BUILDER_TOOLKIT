/**
 * LV_2P_07 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'LV-D2-U'의 material 색상 변경
 *
 * GLTF 구조: scene.nodes = [0, 1]
 *   - Node 0: "LV-D2-U" (mesh 0) — 주 장비 Mesh
 *   - Node 1: "VRayLight001" (mesh 없음) — 보조 광원 Node
 * (LV_2P_01과 동일한 2-Node 패턴, VRayLight001 mesh 없음)
 * 폴더/컴포넌트 이름(LV_2P_07)과 GLTF Node/Mesh 이름(LV-D2-U)이 다르므로
 * 구독 데이터의 meshName은 반드시 'LV-D2-U' 이어야 한다.
 * MeshStateMixin이 getObjectByName('LV-D2-U')으로 해석한다.
 * (VRayLight001은 mesh가 없어 색상 변경 대상에서 자동 제외됨)
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
