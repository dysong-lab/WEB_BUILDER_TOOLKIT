/**
 * LV_R — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'LV-2R1'의 material 색상 변경
 *
 * GLTF 구조: scene → "LV-2R1"(mesh 0) — 단일 Node, 단일 Mesh.
 * (LV_BAT·LV_2P_02·LV_2P_09·LV_2P_10·LV_2P_11과 동일한 순수 1-Node 패턴. LV_2P_01·LV_2P_07·LV_2P_08과 달리 VRayLight001 보조 Node 없음)
 * 폴더/컴포넌트 이름(LV_R)과 GLTF Node/Mesh 이름(LV-2R1)이 다르므로
 * 구독 데이터의 meshName은 반드시 'LV-2R1' 이어야 한다.
 * MeshStateMixin이 getObjectByName('LV-2R1')으로 해석한다.
 * LV-2R# 고유 접두 패밀리 (LV_BAT의 LV-BAT#, LV_2P 시리즈의 LV-H1-D###/LV-2C1-U/LV-2D13/LV-2F3/LV-2J7/LV-B1-U/LV-D2-U/LV-F1-U 어디에도 속하지 않음; `2-` 계열의 `2D`·`2F`·`2J`에 이어지는 `2R` 슬롯).
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
