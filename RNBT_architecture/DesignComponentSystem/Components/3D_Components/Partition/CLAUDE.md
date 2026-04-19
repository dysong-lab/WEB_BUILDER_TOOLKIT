# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Group Node** `Group003` → 2 자식 Mesh `partition`, `glass_A`) — 루트 Group 이름 하나로 자식 Mesh 일괄 착색 |
| 기본 Mixin | MeshStateMixin |
| meshName | `Group003` — **Group Node 이름**. `getObjectByName('Group003')`는 두 자식 Mesh(`partition`, `glass_A`)를 가진 Group을 반환하고, MeshStateMixin은 `obj.material`이 없으므로 traverse 분기로 진입해 자식 Mesh들의 material을 일괄 clone+setHex. PTT의 "부모 Group 이름 하나로 자식 전체를 관리하는 **Group-traverse 단일 참조**" 패턴과 동일하며, Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 대비된다. |

## 장비 개요

Partition은 건축/내장 계열의 **2-Mesh Group 장비**를 표현하는 3D 컴포넌트이다. 사무공간의 유리 파티션 패널과 그 프레임/베이스 요소를 한 장비로 묶는다. 단일 GLTF(`models/Partition/01_default/Partition.gltf`)의 scene은 `root`(scale [1000, 1000, 1000]) 노드 아래에 Group Node `Group003`(children [2, 3])을 두고, 그 자식으로 두 Mesh Node `partition`(mesh 0, material "Material #25192003")과 `glass_A`(mesh 1, material "Material #25192004")가 배치된다. 두 자식은 각자 고유한 translation `[0, 0.010350001, ~0]`과 `rotation` quaternion(Z축 ~180° 뒤집힘) + `scale [1, -1, 1]`(Y축 미러)로 배치되며, 서로 다른 mesh·material(프레임/베이스 vs 유리 패널)을 가진 복합 구조이므로 Group 이름 하나(`Group003`)로 자식 전체를 참조하는 것이 가장 단순한 접근이다.

GLTF 구조:
```
scene → root (scale [1000, 1000, 1000])
        └─ Group003 (Group Node, children [2, 3])
            ├─ partition (Mesh Node, mesh 0, material "Material #25192003")
            └─ glass_A  (Mesh Node, mesh 1, material "Material #25192004")
```

루트 `root`는 `scale [1000, 1000, 1000]` 업스케일 패턴으로, Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 케이스다. PTT·P300C·P2400CH의 "root scale 없음 → 초소형 좌표 원본 유지" 패턴과 대비된다. 원본 mesh 바운드(두 자식의 POSITION min/max 합산): 대략 X ∈ ±0.008 · Y ∈ [-0.01035, 0.00165] · Z ≈ 0(거의 평면) — 장면 단위로 업스케일 후 약 **16 × 12 × 0.0003 (단위 없음)** 수준의 얇은 평면 장비이며, preview 카메라는 평면에 수직한 방향을 중심으로 배치한다.

**자식 Mesh별 속성**:
- **`partition`** (mesh 0): POSITION 124개·인덱스 240개(프레임/베이스 메시, 상대적으로 복합 형상), 바운드 X ∈ [-0.008, 0.008] · Y ∈ [-0.01035, 0.00165] · Z ∈ [-0.00015, 0.00015] (얇은 판재 형상). TEXCOORD_0 있음, material `Material #25192003`(baseColorTexture `textures/partition.jpg`) 적용.
- **`glass_A`** (mesh 1): POSITION 8개·인덱스 12개(단순 쿼드 박스 — 사각 유리 패널 2면 또는 6면 근사), 바운드 X ∈ [-0.0078, 0.0078] · Y ∈ [-0.00015, 0.00155] · Z ∈ [-0.000032, 0.000032] (매우 얇은 패널). TEXCOORD_0 있음, material `Material #25192004`(baseColorTexture `textures/glass_A.png`) 적용.

**두 material의 차이**:
- `Material #25192003` — baseColorTexture `textures/partition.jpg`(파티션 프레임/베이스 텍스처, JPG 불투명), `metallicFactor` 0.0, `roughnessFactor` 0.450053632(중간 거칠기). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기**의 프레임 셰이딩.
- `Material #25192004` — baseColorTexture `textures/glass_A.png`(유리 패널 텍스처, PNG — 알파 채널 가능성 있음), `metallicFactor` 0.0, `roughnessFactor` 0.450053632(동일). 나머지 속성 동일 → **순수 텍스처 + 비금속 + 중간 거칠기**의 유리 셰이딩. PNG 포맷 자체만으로는 three.js에서 자동 알파 블렌딩이 활성화되지 않으며, glTF material은 `alphaMode` 미지정 시 OPAQUE로 해석된다 — 명시적 투명 처리는 없음.

두 material이 이름·factor·roughness가 거의 동일하고 baseColorTexture와 이름 suffix(`#25192003` vs `#25192004`)만 다른 **쌍(pair) material** 구조이다. 모델러가 같은 MAX 머티리얼 슬롯을 복제해 텍스처만 교체한 전형적인 건축 내장 에셋의 명명 패턴이다.

**babylon.js glTF exporter for 3dsmax 2020 v20221031.2**로 생성되었으며(PTT의 3dsmax 2023 v20220628.14와 동일한 2022년대 babylon 계열 빌드), `extras`·확장 선언 없이 표준 core glTF 2.0만 사용한다.

**MeshStateMixin 동작 경로**: `getObjectByName('Group003')`는 Group Node(`material` 미지정)를 반환 → `obj.material`이 undefined이므로 `else` 분기의 `obj.traverse(child => child.material && applyColor(child, color))` 경로로 진입 → 자식 `partition`·`glass_A`의 `material`을 각각 clone하여 color만 setHex 치환. 두 material 모두 단일 객체(배열 아님)이므로 `Array.isArray(material)` 분기는 발동하지 않고 각각 직접 clone 경로. 두 material이 **모두 baseColorTexture를 가지므로** color setHex가 전체 색을 완전히 치환하지 않고 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). PTT의 "한쪽은 texture, 다른 쪽은 factor" 혼합 케이스와 달리 Partition은 **두 자식 모두 텍스처 주도**라 상태색 반영이 두 자식에서 균일한 강도로 나타난다. 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'Group003'` 한 개만 보내도 자식 2개가 함께 착색된다(Group-traverse 일괄 적용). Earthquake가 `['Earthquake','Earthquake_A']`를 배열로 열거한 것과 달리 Partition은 부모 Group 이름 하나면 충분하다. Group 이름이 `Group003`이라는 **모델러 자동 생성 범용명**이라는 점이 PTT(`PTT_033` — 장비명 기반)와의 차이이며, 같은 GLTF 내에 Group 노드가 하나뿐이므로 충돌 가능성은 없다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
