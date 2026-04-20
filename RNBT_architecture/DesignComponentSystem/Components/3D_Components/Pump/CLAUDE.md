# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `Pump`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `Pump` — **Mesh Node 이름**. `getObjectByName('Pump')`는 자식이 없는 리프 Mesh를 반환하고, MeshStateMixin은 `obj.material`이 존재(단일 객체)하므로 Mesh 브랜치로 진입해 `Array.isArray(material)` 미발동 경로로 material을 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Partition_small 등의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 Group `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거)와는 대비된다. |

## 장비 개요

Pump는 기계/유체 계열의 **단일 Mesh 장비**를 표현하는 3D 컴포넌트이다. 유체 이송 장치(수배관·냉각수·연료 등)를 하나의 Mesh Node로 통합한 형상으로, 펌프 본체·모터·배관 연결부 등 외형 전체가 하나의 Mesh `Pump`(mesh 0, material "Pump")에 포함된다. 단일 GLTF(`models/Pump/01_default/Pump.gltf`)의 scene은 `root`(scale [1000, 1000, 1000]) 노드 아래에 직접 Mesh Node `Pump`(mesh 0, translation `[0, 2.98e-08, 0]`, material "Pump")를 배치한다 — **중간 Group Node 없이 루트 → 자식 Mesh 1개**의 최단 깊이 구조.

GLTF 구조:
```
scene → root (scale [1000, 1000, 1000])
        └─ Pump (Mesh Node, mesh 0, translation [0, 2.98e-08, 0], material "Pump")
```

루트 `root`는 `scale [1000, 1000, 1000]` 업스케일 패턴으로, Partition·Partition_small·Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 케이스다. Mesh Node `Pump` 자신은 Y축으로 극소량(`2.98e-08`) translation만 가지며 rotation·scale은 가지지 않는다(사실상 원점 배치). 원본 mesh 바운드: X ∈ [-0.00093, 0.00093] · Y ∈ [-0.00161, 0.00161] · Z ∈ [-0.00077, 0.00077] — 약간 세로로 긴 직육면체성 형상(Y축이 가장 긴 축). 장면 단위로 업스케일 후 약 **1.86 × 3.23 × 1.54 (단위 없음)** 수준의 "세로로 서 있는 펌프 유닛" 프로포션이며, Partition_small의 "세로로 매우 길쭉한 얇은 판재(0.18 × 3.79 × 13.5)"와 달리 **세 축이 비교적 균등한 부피체**다.

**Mesh 속성**:
- **`Pump`** (mesh 0): POSITION 6090개·인덱스 6090개(SCALAR) — Partition_small의 `partitionSmall`(POSITION 128·인덱스 294)보다 **정점 수 약 48배, 삼각형 수 약 20배 더 복잡**한 고해상도 형상. 단일 GLTF 내 장비로는 상대적으로 정밀한 지오메트리(펌프 본체·모터·배관 연결부·볼트 등 외형 디테일을 한 Mesh에 포함). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Pump` 적용.

**Material 구조**:
- `Material "Pump"` — baseColorTexture `textures/Pump.jpg`(펌프 외형 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속 — glTF 2.0 기본 `roughnessFactor`는 미지정 시 1.0으로 해석). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속**의 기본 PBR 셰이딩. `extras.babylonSeparateCullingPass: false`는 babylon 전용 힌트로 three.js는 무시한다(렌더 경로에 영향 없음). material 이름이 Partition 시리즈(`#25192003`·`#25192004`·`#25192005`)처럼 숫자 suffix가 아닌 **장비명 그대로 `Pump`**인 점이 BATT(`Material #...` 패턴)와 Partition_small의 **연번 suffix 계열**과 대비된다 — 3ds Max 씬에서 머티리얼 이름을 수동 지정한 흔적이다.

**babylon.js glTF exporter for 3dsmax 2023 v20240312.5**로 생성되었으며, Partition/Partition_small의 `3dsmax 2020 v20221031.2`보다 **더 최신 3ds Max(2023) + 최신 babylon exporter 빌드(2024년 3월)**에서 export되었다. `extras`에 babylon 전용 힌트(`babylonSeparateCullingPass: false`)만 선언되어 있고, 표준 core glTF 2.0 외 확장 선언은 없다.

**MeshStateMixin 동작 경로**: `getObjectByName('Pump')`는 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Partition_small과 동일한 최단 경로 패턴이며, Partition의 "Group-traverse 분기 → 자식 2개 순회" 경로와는 대비된다. material이 **baseColorTexture를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). 원본 속성(baseColorTexture·metallicFactor)은 clone 후에도 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'Pump'` 한 개만 보내면 단일 Mesh가 착색된다. meshName이 장비명과 동일한 `Pump`라는 점이 편집자 직관에 가장 부합하며(BATT·Chiller·FLIREx와 동일 규약), Partition_small의 카멜케이스 `partitionSmall`과도 구분된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
