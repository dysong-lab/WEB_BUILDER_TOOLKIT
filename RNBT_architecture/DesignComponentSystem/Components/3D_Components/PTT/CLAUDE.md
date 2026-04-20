# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Group Node** `PTT_033` → 2 자식 Mesh `PTT_034`, `PTT_035`) — 루트 Group 이름 하나로 자식 Mesh 일괄 착색 |
| 기본 Mixin | MeshStateMixin |
| meshName | `PTT_033` — **Group Node 이름**. `getObjectByName('PTT_033')`는 자식 2개(`PTT_034`, `PTT_035`)를 가진 Group을 반환하고, MeshStateMixin은 `obj.material`이 없으므로 traverse 분기로 진입해 자식 Mesh들의 material을 일괄 clone+setHex. Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과 달리, 부모 Group 이름 하나로 자식 전체를 관리하는 **Group-traverse 단일 참조** 패턴. |

## 장비 개요

PTT는 배전/전력 계열의 **2-Mesh Group 장비**를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/PTT/01_default/PTT.gltf`)의 scene은 루트 Group Node `PTT_033`(children [1, 2], rotation Y=-90° quaternion [0, -0.7071068, 0, 0.7071067])을 최상위로 가지고 그 아래에 두 자식 Mesh Node `PTT_034`(mesh 0, translation [0.035, 0, 0])와 `PTT_035`(mesh 1, translation 없음)가 배치된다. 두 자식이 서로 다른 mesh·material을 가진 복합 구조이므로, Group 이름 하나(`PTT_033`)로 자식 전체를 참조하는 것이 가장 단순한 접근이다.

GLTF 구조:
```
scene → PTT_033 (Group Node, rotation Y=-90°, children [1, 2])
        ├─ PTT_034 (Mesh Node, mesh 0, translation [0.035, 0, 0], material "etc11")
        └─ PTT_035 (Mesh Node, mesh 1, material "MetalNoReflecred")
```

루트 `PTT_033`은 `scale` 보정이 없는 **원본 유닛 유지** 케이스로, P300C·P2400CH와 동일한 "root scale 없음 → 초소형 좌표" 패턴이다. Earthquake·OHU103·ElecPad·PCS의 `root(scale [1000, 1000, 1000])` 업스케일 패턴과 대비된다. 원본 mesh 바운드(두 자식의 POSITION min/max 합산): 대략 X ≈ ±0.035 × Y ≈ ±0.02 × Z ≈ ±0.035 — 장면 단위 약 **0.07 × 0.04 × 0.07**의 초소형 장비이며, preview 카메라는 근접 배치가 필요하다.

**자식 Mesh별 속성**:
- **`PTT_034`** (mesh 0): POSITION 4개·인덱스 6개(사각형 2 삼각형 — 매우 단순한 평면/쿼드 형상), 바운드 X ∈ [0, 0] · Y ∈ [-0.02, 0.02] · Z ∈ [-0.035, 0.035](YZ 평면 사각형, translation [0.035, 0, 0]으로 X축 0.035 오프셋 → 장면상 정면 패널). TEXCOORD_0 있음, material `etc11` 적용.
- **`PTT_035`** (mesh 1): POSITION 44개·인덱스 78개(복합 박스 형상), 바운드 X ∈ [-0.035, 0.035] · Y ∈ [-0.02, 0.02] · Z ∈ [-0.035, 0.035](박스 본체). TEXCOORD_0 있음, material `MetalNoReflecred` 적용.

**두 material의 차이**:
- `etc11` — baseColorTexture `textures/PTT.jpg`(PTT 장비 전면 텍스처), `roughnessFactor` 0.5, **`doubleSided` true**(양면 렌더링 — 얇은 패널에 필수), baseColorFactor·metallicFactor·normalTexture 없음 → **순수 텍스처 + 양면 + 중간 거칠기**의 패널 셰이딩
- `MetalNoReflecred` — baseColorFactor `[0.2227, 0.0415, 0.0317, 1.0]`(어두운 적갈색), `roughnessFactor` 0.3(상대적으로 덜 거친), `metallicRoughnessTexture` `textures/76MetalCladdingFrame002_REFL_2K.jpg`(2K 반사/거칠기 맵), `normalTexture` `textures/MetalCladdingFrame002_NRM_2K.jpg`(2K 노멀 맵) → **baseColorFactor + normal/MR 맵 + 금속 외장** 셰이딩. 이름이 `MetalNoReflecred`("Reflection 없음")임에도 `metallicRoughnessTexture`와 `normalTexture`는 활성(naming과 실제 채널이 불일치 — 모델러 주석 수준).

**babylon.js glTF exporter for 3dsmax 2023 v20220628.14**로 생성되었으며(PCS·OHU103의 v20240312.5보다 구 빌드), `extras`·확장 선언 없이 표준 core glTF 2.0만 사용한다.

**MeshStateMixin 동작 경로**: `getObjectByName('PTT_033')`는 Group Node(`material` 미지정)를 반환 → `obj.material`이 undefined이므로 `else` 분기의 `obj.traverse(child => child.material && applyColor(child, color))` 경로로 진입 → 자식 `PTT_034`·`PTT_035`의 `material`을 각각 clone하여 color만 setHex 치환. `etc11`은 단일 material, `MetalNoReflecred`도 단일 material이므로 `Array.isArray(material)` 분기는 발동하지 않고 각각 직접 clone 경로. 두 material의 baseColorTexture·baseColorFactor·metallicRoughnessTexture·normalTexture·roughnessFactor·doubleSided 등 원본 속성은 clone 후에도 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'PTT_033'` 한 개만 보내도 자식 2개가 함께 착색된다(Group-traverse 일괄 적용). Earthquake가 `['Earthquake','Earthquake_A']`를 배열로 열거한 것과 달리 PTT는 부모 Group 이름 하나면 충분하다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
