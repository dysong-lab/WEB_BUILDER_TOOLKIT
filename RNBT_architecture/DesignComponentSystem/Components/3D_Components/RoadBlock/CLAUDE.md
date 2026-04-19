# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `RoadBlock`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `RoadBlock` — **Mesh Node 이름이 장비명과 일치**하는 대칭 명명 케이스. BATT(`BATT`)·Pump(`Pump`)·Chiller(`Chiller`)의 "장비명 = meshName" 규약과 동일하며, RTU(장비 `RTU` ≠ Mesh `RTU2`)의 비대칭 명명과 대비된다. `getObjectByName('RoadBlock')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 MeshStateMixin의 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. |

## 장비 개요

RoadBlock은 주차장/게이트 진입로를 물리적으로 차단하는 **가로로 긴 납작한 도로 차단기(road block barrier)**를 표현하는 3D 컴포넌트이다. 단일 Mesh Node `RoadBlock`(mesh 0, material `Material #37`)에 외형 전체를 담는 **1 Mesh = 1 Material 구조**로, 단일 GLTF(`models/RoadBlock/01_default/RoadBlock.gltf`)의 scene은 루트 Group(`root`, scale `[1000, 1000, 1000]`)의 자식으로 Mesh Node `RoadBlock`를 배치한다 — **scene → root(Group) → RoadBlock(Mesh)** 의 2단 깊이 구조.

GLTF 구조:
```
scene → root (Group Node, scale [1000, 1000, 1000])
          └── RoadBlock (Mesh Node, mesh 0, material "Material #37")
```

모델의 원본 bound는 X ∈ [-0.0144, 0.0144] · Y ∈ [-0.00285, 0.00285] · Z ∈ [-0.00369, 0.00369] — **약 0.029 × 0.0057 × 0.0074 단위의 극소형 원본 좌표**이며, 루트 Group의 `scale [1000, 1000, 1000]` 업스케일이 적용되면 최종 장면 단위로 **약 28.8 × 5.7 × 7.4 단위의 가로로 긴 납작한 바(bar) 형태**가 된다. X축이 압도적으로 긴(차량 진로를 가로지르는 차단 바의 길이 방향) 형상이며, Y(높이)와 Z(두께)는 상대적으로 작아 전형적인 **수평 차단기 기둥** 프로포션이다. Pump(1.86 × 3.23 × 1.54 업스케일 후, 부피형)·Partition(세로형 격벽)과 달리 **세로가 낮고 가로가 매우 긴 바** 특성이 뚜렷하다. `scale [1000, 1000, 1000]` 업스케일은 Partition·Pump·OHU103과 공통되는 babylon exporter의 표준 mm→m 변환 패턴이다.

**Mesh 속성**:
- **`RoadBlock`** (mesh 0): POSITION 216개·인덱스 582개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 **약 6배 많은 정점**으로 박스형 캐비닛보다 한 단계 더 세분된 지오메트리(바 본체 + 양단 캡/러버 밴드 등의 세부 면을 포함). Pump(POSITION 6090)보다는 훨씬 적어 **중간 해상도의 단순 형상**에 해당. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #37` 적용.

**Material 구조**:
- `Material #37` — baseColorTexture `textures/RoadBlock.jpg`(바 본체 텍스처, JPG 불투명, `images[0].uri: textures/RoadBlock.jpg`), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.450053632(**중간 거칠기** — RTU의 0.0(완전 매끈)과 달리 적당한 무광 표면, 고무/러버/페인트 마감 느낌). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode`·`doubleSided` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기 + 기본 단면 렌더**의 무광 PBR 셰이딩. material 이름이 `Material #37`이라는 **3ds Max 원본 material ID 기반 짧은 숫자 suffix** 형식으로, RTU의 `Material #342540168`(큰 숫자 ID)보다 단순한 네이밍이며, Partition 시리즈(`#25192003`)와 대비된다.

**babylon.js glTF exporter for 3dsmax 2023 v20221031.2**로 생성되었으며, RTU의 `3dsmax 2025 v20250127.3`보다 한 단계 이전 빌드(3ds Max 2023 + babylon exporter 2022년 10월 빌드). sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). 표준 core glTF 2.0 외 확장 선언은 없다. 텍스처 폴더는 `textures/`(BATT/Pump 규약과 공통, RTU의 `maps/` 규약과 대비).

**MeshStateMixin 동작 경로**: `getObjectByName('RoadBlock')`는 리프 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small·RTU와 동일한 최단 경로 패턴. material이 **baseColorTexture를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. `doubleSided`가 선언되지 않았으므로 기본 단면 렌더(THREE.FrontSide) 특성이 유지된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'RoadBlock'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명과 meshName이 **일치**하므로(BATT·Pump 규약) 데이터 전달이 단순하다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
