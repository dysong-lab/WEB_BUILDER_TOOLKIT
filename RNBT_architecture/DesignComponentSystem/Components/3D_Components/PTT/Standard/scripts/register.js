/**
 * PTT — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Group Node 'PTT_033'의 자식 Mesh(PTT_034, PTT_035) material 색상 일괄 변경
 *
 * GLTF 구조:
 *   scene → PTT_033 (Group Node, rotation Y=-90°, children [1, 2])
 *           ├─ PTT_034 (Mesh Node, mesh 0, translation [0.035, 0, 0], material "etc11")
 *           └─ PTT_035 (Mesh Node, mesh 1, material "MetalNoReflecred")
 *
 * **Group-traverse 단일 참조** 규약 — 부모 Group 이름 하나(`PTT_033`)로 자식 2개
 * Mesh 전체를 관리한다. `getObjectByName('PTT_033')`이 Group Node를 반환하면
 * MeshStateMixin은 `obj.material`이 없으므로 Group 브랜치로 진입해
 * `obj.traverse(child => child.material && applyColor(child, color))` 경로로
 * 자식 Mesh들(PTT_034·PTT_035)의 material을 각각 clone하고 color만 setHex로 치환.
 * Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴 대신
 * 부모 Group 이름 하나면 충분한 **단일 참조 Group-traverse** 패턴이다. PCS의
 * "4-이름 일치 단일 Mesh" 패턴(`getObjectByName`이 Mesh 직접 반환 → Mesh 브랜치)과도
 * 구분된다.
 *
 * 자식 material 차이:
 *   - etc11 (→ PTT_034): baseColorTexture textures/PTT.jpg, roughnessFactor 0.5,
 *       doubleSided=true. 순수 텍스처 + 양면 + 중간 거칠기(얇은 평면 쿼드).
 *   - MetalNoReflecred (→ PTT_035): baseColorFactor [0.2227, 0.0415, 0.0317, 1.0](적갈색),
 *       roughnessFactor 0.3, metallicRoughnessTexture textures/76MetalCladdingFrame002_REFL_2K.jpg,
 *       normalTexture textures/MetalCladdingFrame002_NRM_2K.jpg. 이름이 "NoReflecred"(reflection
 *       없음 오타)임에도 MR/normal 맵이 활성 — 명명과 채널이 불일치(모델러 주석 수준).
 *   두 material 모두 단일 객체(배열 아님)이므로 Array.isArray 분기 미발동.
 *   etc11은 baseColorTexture가 주 색상이라 color setHex가 텍스처에 곱해지고,
 *   MetalNoReflecred는 baseColorTexture가 없어 color setHex가 baseColorFactor 역할을
 *   대체해 색 반영이 더 강하게 나타난다(각 자식의 시각적 색조가 상태색으로 일괄 변경되되
 *   최종 렌더 색은 텍스처 여부에 따라 달라짐).
 *
 * 루트 scale 보정 없음 — P300C·P2400CH와 동일한 "원본 유닛 유지" 케이스.
 * Earthquake·OHU103·ElecPad·PCS의 root(scale [1000, 1000, 1000]) 업스케일 패턴과 대비.
 * 자식 bound 합산 기준 장면 크기 약 0.07 × 0.04 × 0.07 단위의 초소형 장비.
 * MeshStateMixin은 material.color만 갱신하므로 스케일과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2023 v20220628.14 (PCS·OHU103의 v20240312.5보다 구 빌드).
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
