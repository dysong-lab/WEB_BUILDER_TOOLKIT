# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `RTU2`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `RTU2` — **Mesh Node 이름** (장비명 `RTU`와 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('RTU2')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, Pump(meshName `Pump`)·BATT(meshName `BATT`)처럼 **장비명과 meshName이 일치하는 컴포넌트와 달리** RTU는 장비 폴더명(`RTU`)과 Mesh Node 이름(`RTU2`)이 다른 **비대칭 명명** 케이스다. |

## 장비 개요

RTU(Roof Top Unit)는 건물 옥상에 설치되는 패키지형 공조 장비를 표현하는 3D 컴포넌트이다. 외장 케이싱과 흡·토출 그릴이 일체화된 **세로로 긴 직육면체** 형상으로, 단일 Mesh Node `RTU2`(mesh 0, material `Material #342540168`)에 외형 전체를 담는다. 단일 GLTF(`models/RTU/01_default/RTU.gltf`)의 scene은 루트에서 바로 Mesh Node `RTU2`를 배치하며, 중간 Group Node 없이 **scene → RTU2** 의 최단 깊이 구조다. Node는 Y축 기준 180° 회전(`rotation [0, -1, 0, ~0]` ≒ 쿼터니언 [x,y,z,w] 기준 Y축 π 회전)만 가진다.

GLTF 구조:
```
scene → RTU2 (Mesh Node, mesh 0, rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
               material "Material #342540168")
```

모델의 원본 bound는 X ∈ [-0.3999, 0.3999] · Y ∈ [-1.4750, 1.4750] · Z ∈ [-0.5000, 0.5000] — **약 0.8 × 2.95 × 1.0 단위의 세로로 긴 직육면체** 프로포션. Y축이 가장 긴 축이며(높이), X가 가장 짧은 축(폭), Z가 중간(깊이) 수준이다. Pump(1.86 × 3.23 × 1.54, 세 축 균등 부피체)나 BATT(소형 정육면체성)와는 달리 **얇은 수직 패널형 캐비닛** 느낌에 가깝고, Partition_small(0.18 × 3.79 × 13.5, 매우 길쭉한 판재)보다는 **세 축이 보다 균형적**이다. 루트 노드에 scale 업스케일이 없어(1:1 스케일) 장면 단위 자체가 원본 단위와 동일하다 — Partition·Pump·OHU103 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 대비되는 **원본 미터 유닛 그대로** 사용 케이스.

**Mesh 속성**:
- **`RTU2`** (mesh 0): POSITION 36개·인덱스 54개(SCALAR, `componentType: 5123` = unsigned short) — Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 **정점 수 약 170배 적은 저해상도 형상**. 사실상 "**박스형 캐비닛을 몇 장의 쿼드로 표현한 최소 지오메트리**" 수준(36 vertices ≒ 12 삼각형 = 6면 × 2 삼각형, 단 인덱스가 54이므로 일부 면은 분할되어 있음). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #342540168` 적용.

**Material 구조**:
- `Material #342540168` — baseColorTexture `maps/RTU02.jpg`(케이싱 텍스처, JPG 불투명, `images[0].uri: maps/RTU02.jpg`), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(완전 매끈 — 기본값과 명시적으로 다름). `doubleSided: true`(양면 렌더 — 얇은 패널 내부도 보이게 함, Pump의 `doubleSided` 미지정과 대비). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540168`이라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, BATT 계열과 같은 자동 생성 패턴이며 Pump(`Pump`)·Partition 시리즈(`#25192003`)와 대비된다.

**babylon.js glTF exporter for 3dsmax 2025 v20250127.3**으로 생성되었으며, Pump의 `3dsmax 2023 v20240312.5`보다 한 단계 더 최신 빌드다(3ds Max 2025 + babylon exporter 2025년 1월 빌드). sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). `extras`에 babylon 전용 힌트(`babylonSeparateCullingPass: false` 등)가 선언되어 있고, 표준 core glTF 2.0 외 확장 선언은 없다.

**MeshStateMixin 동작 경로**: `getObjectByName('RTU2')`는 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small과 동일한 최단 경로 패턴. material이 **baseColorTexture를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). `doubleSided: true`는 clone 후에도 유지되므로 양면 렌더 특성도 그대로 보존된다. 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'RTU2'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명은 `RTU`지만 구독 데이터의 meshName은 GLTF 원본 Node 이름인 `RTU2`를 사용해야 한다는 **비대칭 명명 규약**에 주의(BATT·Pump의 "장비명 = meshName" 일치 규약과 대비).

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
