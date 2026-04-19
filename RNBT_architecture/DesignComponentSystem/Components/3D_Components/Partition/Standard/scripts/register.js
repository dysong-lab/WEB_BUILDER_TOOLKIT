/**
 * Partition — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Group Node 'Group003'의 자식 Mesh(partition, glass_A) material 색상 일괄 변경
 *
 * GLTF 구조:
 *   scene → root (scale [1000, 1000, 1000])
 *           └─ Group003 (Group Node, children [2, 3])
 *               ├─ partition (Mesh Node, mesh 0, material "Material #25192003")
 *               └─ glass_A  (Mesh Node, mesh 1, material "Material #25192004")
 *
 * **Group-traverse 단일 참조** 규약 — 부모 Group 이름 하나(`Group003`)로 자식 2개
 * Mesh 전체를 관리한다. `getObjectByName('Group003')`이 Group Node를 반환하면
 * MeshStateMixin은 `obj.material`이 없으므로 Group 브랜치로 진입해
 * `obj.traverse(child => child.material && applyColor(child, color))` 경로로
 * 자식 Mesh들(partition·glass_A)의 material을 각각 clone하고 color만 setHex로 치환.
 * PTT(`PTT_033`)의 Group-traverse 단일 참조 패턴과 동일하며,
 * Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 대비된다.
 * Group 이름이 `Group003`이라는 모델러 자동 생성 범용명이라는 점이 PTT(`PTT_033` —
 * 장비명 기반)와의 차이이나, GLTF 내에 Group 노드가 하나뿐이므로 이름 충돌은 없다.
 *
 * 자식 material 차이(쌍 구조):
 *   - Material #25192003 (→ partition): baseColorTexture textures/partition.jpg,
 *       metallicFactor 0.0, roughnessFactor 0.450053632. 프레임/베이스 셰이딩.
 *   - Material #25192004 (→ glass_A): baseColorTexture textures/glass_A.png,
 *       metallicFactor 0.0, roughnessFactor 0.450053632. 유리 패널 셰이딩.
 *   두 material 모두 단일 객체(배열 아님)이므로 Array.isArray 분기 미발동.
 *   두 material 모두 baseColorTexture 주도이므로 color setHex가 텍스처에 곱해지며,
 *   PTT의 "한쪽 texture / 한쪽 factor → 반영도 불일치" 케이스와 달리
 *   Partition은 두 자식에서 상태색이 균일한 강도로 반영된다.
 *   glass_A는 PNG지만 alphaMode 미지정이라 OPAQUE로 해석(명시적 투명 처리 없음).
 *
 * 루트 scale [1000, 1000, 1000] 업스케일 — Earthquake·OHU103·ElecPad·PCS와 동일한
 * "원본 mm 유닛 → 장면 m 유닛" 케이스. PTT·P300C·P2400CH의 "root scale 없음" 원본 유지와 대비.
 * 자식 bound 합산 기준 원본 장면 크기 약 0.016 × 0.012 × 0.0003 → 업스케일 후 16 × 12 × 0.3.
 * MeshStateMixin은 material.color만 갱신하므로 스케일과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2020 v20221031.2 (PTT의 3dsmax 2023 v20220628.14와 동일한 계열).
 * extras·확장 선언 없이 표준 core glTF 2.0만 사용.
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
