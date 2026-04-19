# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `partitionSmall`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `partitionSmall` — **Mesh Node 이름**. `getObjectByName('partitionSmall')`은 단일 Mesh를 반환하고, MeshStateMixin은 `obj.material`이 존재하므로(단일 객체) Mesh 브랜치의 `Array.isArray(material)` 미발동 경로로 진입해 material을 clone 후 color만 setHex로 치환. FLIREx·BATT 등의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003`)·Earthquake(자식 배열 열거)와는 대비된다. |

## 장비 개요

Partition_small은 건축/내장 계열의 **단일 Mesh 장비**를 표현하는 3D 컴포넌트이다. Partition(2-Mesh Group) 시리즈의 축소판으로, 유리 패널 없이 프레임/베이스만을 가지는 좁은 폭의 파티션 구조물이다. 단일 GLTF(`models/Partition_small/01_default/Partition_small.gltf`)의 scene은 `root`(scale [1000, 1000, 1000]) 노드 아래에 직접 Mesh Node `partitionSmall`(mesh 0, material "Material #25192005")을 배치한다 — **중간 Group Node 없이 루트 → 자식 Mesh 1개**의 최단 깊이 구조.

GLTF 구조:
```
scene → root (scale [1000, 1000, 1000])
        └─ partitionSmall (Mesh Node, mesh 0, rotation [0, 0.7071068, 0, 0.7071067], material "Material #25192005")
```

루트 `root`는 `scale [1000, 1000, 1000]` 업스케일 패턴으로, Partition·Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 케이스다. Mesh Node `partitionSmall` 자신은 `rotation [0, 0.7071068, 0, 0.7071067]` (Y축 +90° quaternion)만 가지고 scale은 가지지 않는다. 원본 mesh 바운드: X ∈ [-9.19e-05, 9.19e-05] · Y ∈ [9.54e-10, 0.003789] · Z ∈ [-0.00675, 0.00675] — 매우 얇고 좁은 판재(Z축이 길이 방향). 장면 단위로 업스케일 후 약 **0.18 × 3.79 × 13.5 (단위 없음)** 수준의 세로로 길쭉한 얇은 파티션이며, Partition의 16 × 12 × 0.3 "가로로 넓은 얇은 평면"과 비교해 **훨씬 작고(폭 축 기준 1/90) 프로포션이 세로로 긴** 축소판 지오메트리다.

**Mesh 속성**:
- **`partitionSmall`** (mesh 0): POSITION 128개·인덱스 294개 — Partition의 `partition` 자식(POSITION 124·인덱스 240)과 비슷한 복잡도의 프레임/베이스 메시로, 정점 수는 유사하나 인덱스(삼각형) 수가 약간 더 많다(54개 추가). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #25192005` 적용(Partition의 `Material #25192003`·`#25192004` 쌍 구조와 달리 **단일 material**).

**Material 구조**:
- `Material #25192005` — baseColorTexture `textures/partitionSmall.jpg`(파티션 프레임 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.450053632(Partition의 두 material과 정확히 동일한 roughness). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기**의 프레임 셰이딩. 이름 suffix(`#25192005`)는 Partition의 `#25192003`·`#25192004`를 잇는 연속 번호로, 모델러가 **같은 3ds Max 씬에서 동일한 MAX 머티리얼 슬롯 그룹에서 파생**했음을 시사한다.

**babylon.js glTF exporter for 3dsmax 2020 v20221031.2**로 생성되었으며(Partition과 정확히 동일한 exporter 빌드 — 동일 씬 또는 연속 씬에서 export), `extras`·확장 선언 없이 표준 core glTF 2.0만 사용한다.

**MeshStateMixin 동작 경로**: `getObjectByName('partitionSmall')`는 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller 등 "단일 Mesh + 단일 material" 패턴과 동일한 최단 경로이며, Partition의 "Group-traverse 분기 → 자식 2개 순회" 경로와는 대비된다. material이 **baseColorTexture를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'partitionSmall'` 한 개만 보내면 단일 Mesh가 착색된다. Partition이 `Group003` 부모 이름 하나로 자식 2개를 Group-traverse로 관리한 것과 달리, Partition_small은 자식이 없는 **리프 Mesh 직접 참조**이므로 더 단순한 경로로 동작한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
