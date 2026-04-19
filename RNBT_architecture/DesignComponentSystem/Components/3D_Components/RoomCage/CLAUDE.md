# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `cage01`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `cage01` — **Mesh Node 이름** (장비 폴더명 `RoomCage`와 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('cage01')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RoadBlock의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·RoadBlock(meshName `RoadBlock`)처럼 **장비명과 meshName이 일치하는 컴포넌트와 달리** RoomCage는 장비 폴더명(`RoomCage`)과 Mesh Node 이름(`cage01`)이 다른 **비대칭 명명** 케이스다(RTU의 `RTU` ≠ `RTU2` 패턴과 동류). |

## 장비 개요

RoomCage는 실내 영역(서버룸·장비실·통제실)을 구획하거나 경계선을 **반투명 케이지 장식(텍스처 기반 펜스/케이지 패턴)**으로 표현하는 3D 컴포넌트이다. 단일 Mesh Node `cage01`(mesh 0, material `cage01`)에 외형 전체를 담는 **1 Mesh = 1 Material 구조**로, 단일 GLTF(`models/RoomCage/01_default/RoomCage.gltf`)의 scene은 루트 Group(`root`, scale `[1000, 1000, 1000]`)의 자식으로 Mesh Node `cage01`을 배치한다 — **scene → root(Group) → cage01(Mesh)** 의 2단 깊이 구조(RoadBlock과 동일한 2단 구조).

GLTF 구조:
```
scene → root (Group Node, scale [1000, 1000, 1000])
          └── cage01 (Mesh Node, mesh 0, material "cage01")
```

모델의 원본 bound는 X ∈ [-0.0125, 0.0125] · Y ∈ [-0.0125, 0.0125] · Z ∈ [-0.00025, 0.00025] — **X와 Y가 거의 동일한 정사각형, Z축은 극단적으로 얇은(약 2500:1 비율) 판재/데칼 형태**. 원본 약 0.025 × 0.025 × 0.0005 단위이며, 루트 Group의 `scale [1000, 1000, 1000]` 업스케일이 적용되면 최종 장면 단위로 **약 25 × 25 × 0.5 단위의 정사각형 얇은 판**이 된다. RoadBlock(28.8 × 5.7 × 7.4, 가로로 긴 바)·RTU(0.8 × 2.95 × 1.0, 세로형 캐비닛)·Pump(1.86 × 3.23 × 1.54, 부피형)와 달리 **두 축(X, Y)이 동등한 정사각형이면서 Z축 두께가 사실상 평면에 가까운** 특이 프로포션으로, 실내 공간 경계를 표현하는 **케이지/펜스 데칼 판재** 특성이 뚜렷하다. `scale [1000, 1000, 1000]` 업스케일은 Partition·Pump·OHU103·RoadBlock과 공통되는 babylon exporter의 표준 mm→m 변환 패턴이다.

**Mesh 속성**:
- **`cage01`** (mesh 0): POSITION 20개·인덱스 30개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 **약 1.8배 더 적은 최소 정점**으로, RoadBlock(POSITION 216)·Pump(POSITION 6090)보다 훨씬 단순한 **사실상 평면에 가까운 최저 해상도 지오메트리**(20 vertices ≒ 4~5개 쿼드 = 8~10 삼각형, 인덱스 30으로 10 삼각형 기준). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `cage01` 적용.

**Material 구조**:
- `cage01` — baseColorTexture `textures/cage01_A.png`(케이지/펜스 패턴 텍스처, **PNG with alpha**, `images[0].uri: textures/cage01_A.png`), `metallicFactor` 0.0(비금속), `alphaMode: BLEND`(**반투명 알파 블렌딩 — 판재 위에 투명 영역을 포함한 케이지 패턴을 적용하는 데칼 방식**), `roughnessFactor`·`baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`doubleSided` 없음 → **순수 알파 텍스처 + 비금속 + 기본 단면 렌더 + BLEND 합성**의 투명 PBR 셰이딩. RoadBlock(`Material #37`)·RTU(`Material #342540168`)·Partition 시리즈(`#25192003`) 같은 "Material #숫자" 패턴과 달리 **meshName과 동일한 `cage01` 명칭** 사용(3ds Max 원본에서 material 이름을 수동 지정한 케이스, Pump의 `Pump` material 명명과 유사). 텍스처 파일명의 `_A` suffix는 **Alpha 채널이 있는 텍스처**임을 나타내는 babylon/3ds Max 규약.

**babylon.js glTF exporter for 3dsmax 2023 v20240312.5**로 생성되었으며, Pump와 동일한 빌드(RoadBlock의 `2023 v20221031.2`보다 한 단계 최신, RTU의 `2025 v20250127.3`보다 한 단계 이전). sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). material에 `extras.babylonSeparateCullingPass: false` 선언이 있으며, 표준 core glTF 2.0 외 확장 선언은 없다. 텍스처 폴더는 `textures/`(BATT/Pump/RoadBlock 규약과 공통, RTU의 `maps/` 규약과 대비).

**MeshStateMixin 동작 경로**: `getObjectByName('cage01')`은 리프 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock과 동일한 최단 경로 패턴. material이 **baseColorTexture(알파 PNG)를 가지므로** color setHex가 텍스처 색에 곱해지며(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture), `alphaMode: BLEND`와 알파 채널은 clone 후에도 유지되므로 **투명 영역은 그대로 투명하게 유지되고 불투명 영역만 상태색으로 착색되는 특수한 시각적 결과**를 만든다. 원본 속성(baseColorTexture·metallicFactor·alphaMode)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. `doubleSided`가 선언되지 않았으므로 기본 단면 렌더(THREE.FrontSide) 특성이 유지된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'cage01'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명은 `RoomCage`지만 구독 데이터의 meshName은 GLTF 원본 Node 이름인 `cage01`을 사용해야 한다는 **비대칭 명명 규약**에 주의(RTU의 `RTU` ≠ `RTU2` 패턴과 동류, BATT·Pump·RoadBlock의 "장비명 = meshName" 일치 규약과 대비).

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
