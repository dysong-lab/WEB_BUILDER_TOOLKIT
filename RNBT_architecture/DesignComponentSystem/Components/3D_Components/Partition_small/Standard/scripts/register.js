/**
 * Partition_small — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'partitionSmall' material 색상 변경
 *
 * GLTF 구조:
 *   scene → root (scale [1000, 1000, 1000])
 *           └─ partitionSmall (Mesh Node, mesh 0,
 *                              rotation [0, 0.7071068, 0, 0.7071067],
 *                              material "Material #25192005")
 *
 * **단일 Mesh 직접 참조** 규약 — 자식이 없는 리프 Mesh 하나(`partitionSmall`)를
 * 이름 한 개로 참조한다. `getObjectByName('partitionSmall')`이 Mesh Node를 반환하면
 * MeshStateMixin은 `obj.material`이 존재(단일 객체)하므로 Mesh 브랜치로 진입,
 * `Array.isArray(material)` 미발동 경로로 material을 clone하고 color만 setHex로 치환.
 * FLIREx·BATT·Chiller 등과 동일한 최단 경로 패턴이며,
 * Partition(부모 `Group003` Group-traverse)·Earthquake(자식 배열 열거)와는 대비된다.
 *
 * Material 구성(단일):
 *   - Material #25192005 (→ partitionSmall): baseColorTexture textures/partitionSmall.jpg,
 *       metallicFactor 0.0, roughnessFactor 0.450053632. 프레임/베이스 셰이딩.
 *   material이 단일 객체(배열 아님)이므로 Array.isArray 분기 미발동 → 직접 clone.
 *   material이 baseColorTexture 주도이므로 color setHex가 텍스처에 곱해진다(three.js 기본).
 *   이름 suffix #25192005는 Partition의 #25192003·#25192004를 잇는 연속 번호 —
 *   동일 3ds Max 씬 또는 연속 씬에서 export된 Partition 시리즈 자산.
 *
 * 루트 scale [1000, 1000, 1000] 업스케일 — Partition·Earthquake·OHU103·ElecPad·PCS와
 * 동일한 "원본 mm 유닛 → 장면 m 유닛" 케이스. Mesh Node 자체는 Y축 +90° 회전
 * quaternion만 가지며 scale 없음. 원본 bound 0.00018 × 0.00379 × 0.0135
 * → 업스케일 후 0.18 × 3.79 × 13.5 (Z축이 길이 방향, 세로로 길쭉한 얇은 판재).
 * Partition의 16 × 12 × 0.3 "가로로 넓은 얇은 평면"보다 훨씬 작고 프로포션이 세로로 길다.
 * MeshStateMixin은 material.color만 갱신하므로 스케일과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2020 v20221031.2 (Partition과 정확히 동일한 exporter 빌드).
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
