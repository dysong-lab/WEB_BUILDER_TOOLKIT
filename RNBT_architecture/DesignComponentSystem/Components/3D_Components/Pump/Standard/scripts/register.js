/**
 * Pump — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'Pump' material 색상 변경
 *
 * GLTF 구조:
 *   scene → root (scale [1000, 1000, 1000])
 *           └─ Pump (Mesh Node, mesh 0,
 *                    translation [0, 2.98e-08, 0],
 *                    material "Pump")
 *
 * **단일 Mesh 직접 참조** 규약 — 자식이 없는 리프 Mesh 하나(`Pump`)를
 * 이름 한 개로 참조한다. `getObjectByName('Pump')`이 Mesh Node를 반환하면
 * MeshStateMixin은 `obj.material`이 존재(단일 객체)하므로 Mesh 브랜치로 진입,
 * `Array.isArray(material)` 미발동 경로로 material을 clone하고 color만 setHex로 치환.
 * FLIREx·BATT·Chiller·Partition_small 등과 동일한 최단 경로 패턴이며,
 * Partition(부모 `Group003` Group-traverse)·Earthquake(자식 배열 열거)와는 대비된다.
 *
 * Material 구성(단일):
 *   - Material "Pump" (→ Pump Mesh): baseColorTexture textures/Pump.jpg,
 *       metallicFactor 0.0, roughnessFactor 미지정(glTF 기본 1.0 해석).
 *       `extras.babylonSeparateCullingPass: false`는 babylon 전용 힌트로 three.js는 무시.
 *   material이 단일 객체(배열 아님)이므로 Array.isArray 분기 미발동 → 직접 clone.
 *   material이 baseColorTexture 주도이므로 color setHex가 텍스처에 곱해진다(three.js 기본).
 *   material 이름이 숫자 suffix(`#...`)가 아닌 장비명 그대로 'Pump'인 점이
 *   Partition 시리즈의 연번 suffix 규약(#25192003·#25192004·#25192005)과 대비.
 *
 * 루트 scale [1000, 1000, 1000] 업스케일 — Partition·Partition_small·Earthquake·OHU103·
 * ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 케이스. Mesh Node 자체는
 * Y축으로 극소량(2.98e-08) translation만 가지며 rotation·scale 없음(사실상 원점).
 * 원본 bound 0.00186 × 0.00323 × 0.00154 → 업스케일 후 1.86 × 3.23 × 1.54
 * (Y축이 길이 방향, 세 축이 비교적 균등한 부피체). Partition_small의 얇은 판재와 달리
 * 세로로 서 있는 펌프 유닛 프로포션.
 * MeshStateMixin은 material.color만 갱신하므로 스케일과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2023 v20240312.5 (Partition/Partition_small의
 * 3dsmax 2020 v20221031.2보다 더 최신 3ds Max 2023 + 2024년 3월 babylon exporter).
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
