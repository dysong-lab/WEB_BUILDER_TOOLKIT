/**
 * SDC500 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Group Node 'SDC500'의 자식 Mesh(sdc500_003, sdc500_004) material 색상 일괄 변경
 *
 * GLTF 구조:
 *   scene → SDC500 (Group Node, children [1, 2])
 *           ├─ sdc500_003 (Mesh Node, mesh 0,
 *           │              translation [0, 0, 0.08337501],
 *           │              rotation [0.7071068, ~0, ~0, 0.7071067] ≒ X축 π/2 회전,
 *           │              scale [1.1935, 1.1935, 1.1935],
 *           │              material "SDC500")
 *           └─ sdc500_004 (Mesh Node, mesh 1,
 *                          rotation [0.7071068, ~0, ~0, 0.7071067] ≒ X축 π/2 회전,
 *                          scale [1.1935, 1.1935, 1.1935],
 *                          material "plastic01")
 *
 * **Group-traverse 단일 참조** 규약 — 부모 Group 이름 하나(`SDC500`)로 자식 2개
 * Mesh 전체를 관리한다. `getObjectByName('SDC500')`이 Group Node를 반환하면
 * MeshStateMixin은 `obj.material`이 없으므로 Group 브랜치로 진입해
 * `obj.traverse(child => child.material && applyColor(child, color))` 경로로
 * 자식 Mesh들(sdc500_003·sdc500_004)의 material을 각각 clone하고 color만 setHex로 치환.
 * Partition(`Group003`)·PTT(`PTT_033`)의 Group-traverse 단일 참조 패턴과 동일하며,
 * Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 대비된다.
 *
 * **장비명 = Group 이름** 대칭 명명(BATT·Pump·RoadBlock·FLIREx 계열) —
 * Partition(`Group003` 모델러 자동 생성 범용명)·SC_02(`SC-U1` 비대칭)·RTU(`RTU2` 비대칭)와 구분.
 *
 * 자식 material 차이(**타입 혼합 쌍 구조** — 텍스처 주도 + factor 주도):
 *   - SDC500 (→ sdc500_003): baseColorTexture textures/SDC500.jpg,
 *       metallicFactor 0.0, roughnessFactor 0.0(완전 매끈), doubleSided true.
 *       본체 외장 텍스처 주도 광택성 셰이딩. 이름이 장비명 그대로.
 *   - plastic01 (→ sdc500_004): baseColorFactor [0.692, 0.661, 0.610, 1.0] 베이지 톤,
 *       metallicRoughnessTexture textures/TexturesCom_Plastic_Polymer_1K_roughness255.jpg,
 *       roughnessFactor 0.5, doubleSided true.
 *       baseColorFactor 주도 플라스틱 커버 셰이딩. UV 부재(TEXCOORD_0 없음).
 *
 *   두 material 모두 단일 객체(배열 아님)이므로 Array.isArray 분기 미발동.
 *   SDC500 material: color setHex가 baseColorTexture 색에 곱해져 텍스처 원색 부분 유지 +
 *     상태색 가미(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture).
 *   plastic01 material: color setHex가 baseColorFactor를 직접 치환 → 상태색이 전체 커버를
 *     균일하게 치환(texture에 곱해지는 것이 아닌 색 전체 치환).
 *   → 두 자식의 **상태색 반영 강도가 다르다**(PTT와 동일한 "반영도 불일치" 패턴,
 *     Partition의 "두 자식 모두 텍스처 → 균일 반영"과 대비).
 *   glass_A 류의 alphaMode 없음 → 두 material 모두 OPAQUE 기본값(반투명 처리 없음).
 *   doubleSided:true는 두 material 모두 clone 후에도 유지(양면 렌더 보존).
 *
 * 루트 Group `SDC500` scale 업스케일 **없음(1:1)** — Partition(`scale [1000,1000,1000]`)·
 * Earthquake·OHU103·ElecPad·PCS의 "원본 mm → 장면 m 업스케일" 케이스와 대비되는 원본 단위 유지
 * 패턴(BATT·SC_01·SC_02·RTU 동류). 단, 자식 노드에 `scale [1.1935,1.1935,1.1935]` **비정수 배율**이
 * 부여되어 bound 약 19% 확대. 자식 bound 합산 원본 ~0.312 × 0.14 × 0.212 → scale 적용 후 ~0.37 × 0.17 × 0.25.
 * MeshStateMixin은 material.color만 갱신하므로 스케일/회전/translation과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2023 v20220628.14 (PTT와 완전히 동일한 2022년 빌드).
 * SC_01/SC_02/RTU의 2025년 빌드와는 구분되는 별도 시기 배치. extras는 첫 번째 material에만
 * `babylonSeparateCullingPass: false` 단일 항목만 선언(SC_02의 Arnold 호환 다중 extras보다 단순).
 * 확장 선언 없이 표준 core glTF 2.0. 텍스처 폴더 `textures/` (BATT·Pump 규약, SC_02의 `maps/` 규약과 대비).
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
