# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `SC-2U1`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `SC-2U1` — **Mesh Node 이름** (장비 폴더명 `SC_01`과 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('SC-2U1')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·RoadBlock(meshName `RoadBlock`)처럼 **장비명과 meshName이 일치하는 컴포넌트와 달리** SC_01은 장비 폴더명(`SC_01`)과 Mesh Node 이름(`SC-2U1`)이 다른 **비대칭 명명** 케이스다(RTU의 `RTU` ≠ `RTU2`, RoomCage의 `RoomCage` ≠ `cage01`, RoomCageSmall의 `RoomCageSmall` ≠ `cage02` 패턴과 동류). 명명 규약상 폴더명은 시리즈 번호(`SC_01`)를 따르고 Mesh Node 이름은 3ds Max 원본 객체명(`SC-2U1`, `2U` 프로덕트 규격 suffix 포함)을 따르는 이원화 명명 패턴. |

## 장비 개요

SC_01(Server Cabinet / Standing Cabinet 계열의 첫 번째 변종)은 데이터센터·서버룸·전기실 등에 설치되는 **2U 규격 수직 캐비닛**을 표현하는 3D 컴포넌트이다. `SC-2U1`의 `2U`는 19인치 랙 마운트 규격 단위(1U ≒ 44.45mm)에서 2U 높이 프로필을 시사하며, 네이밍 suffix `1`은 **동일 시리즈의 첫 번째 변종**임을 나타낸다(SC_02·SC_03 등 향후 시리즈 확장 가능성). 외장 케이싱이 일체화된 **세로로 긴 직육면체** 형상으로, 단일 Mesh Node `SC-2U1`(mesh 0, material `Material #342540189`)에 외형 전체를 담는 **1 Mesh = 1 Material 구조**로, 단일 GLTF(`models/SC_01/01_default/SC_01.gltf`)의 scene은 루트에서 바로 Mesh Node `SC-2U1`을 배치하며, 중간 Group Node 없이 **scene → SC-2U1** 의 최단 깊이 구조다(RTU의 `scene → RTU2` 패턴과 동일한 플랫 1단 구조). Node는 Y축 기준 180° 회전(`rotation [0, -1, 0, 1.19e-08]` ≒ 쿼터니언 [x,y,z,w] 기준 Y축 π 회전)만 가지며 scale은 없다 — RTU와 완전히 동일한 Node 변환 규약.

GLTF 구조:
```
scene → SC-2U1 (Mesh Node, mesh 0, rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
                 material "Material #342540189")
```

모델의 원본 bound는 X ∈ [-0.399998844, 0.399998844] · Y ∈ [-1.4750011, 1.4750011] · Z ∈ [-1.0999999, 1.1] — **약 0.8 × 2.95 × 2.2 단위의 세로로 긴 직육면체** 프로포션. Y축이 가장 긴 축이며(높이, 약 2.95 단위), Z축이 중간(깊이, 약 2.2 단위), X축이 가장 짧음(폭, 약 0.8 단위). RTU(0.8 × 2.95 × 1.0, **X·Y 동일 / Z 약 2.2배 더 깊음**)와 **X·Y 프로포션이 거의 동일**하면서 **Z축 깊이가 약 2배 더 깊은** 변종 관계 — RTU가 옥상 설치형 얇은 패널 캐비닛이라면 SC_01은 실내 설치형 **두꺼운 서버 캐비닛** 특성이 명확하다. Pump(1.86 × 3.23 × 1.54, 세 축 균등 부피체)·BATT(소형 정육면체성)와는 달리 **Y축 중심 수직 캐비닛형**에 Z축 깊이가 가산된 형태. Partition_small(0.18 × 3.79 × 13.5, 매우 길쭉한 판재)과 달리 **세 축이 보다 균형적**이다. 루트 노드에 scale 업스케일이 없어(1:1 스케일) 장면 단위 자체가 원본 단위와 동일하다 — Partition·Pump·OHU103·RoomCage·RoomCageSmall·RoadBlock의 `scale [1000, 1000, 1000]` 업스케일 패턴과 대비되는 **원본 미터 유닛 그대로** 사용 케이스(RTU와 동일한 규약).

**Mesh 속성**:
- **`SC-2U1`** (mesh 0): POSITION 46개·인덱스 84개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 정점 약 1.28배, 인덱스 약 1.56배 **약간 더 조밀한 박스형 캐비닛 지오메트리**(46 vertices ≒ 14 삼각형, 인덱스 84 → 28 삼각형 기준). 사실상 "**박스형 캐비닛을 몇 장의 쿼드로 표현한 최소 지오메트리**" 수준으로, 6면체 기본 구조에 몇 장의 면 분할이 추가된 형태. Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 약 132배 적은 **저해상도 지오메트리**이며, RoomCage/RoomCageSmall의 `cage01`/`cage02`(POSITION 20·인덱스 30)보다는 약 2.3배 많은 정점 — **박스형 캐비닛(6면 × 입체) vs 평면 판재(2차원)**의 위상 차이가 그대로 반영된다. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #342540189` 적용.

**Material 구조**:
- `Material #342540189` — baseColorTexture `maps/SC04.jpg`(케이싱 텍스처, JPG 불투명, `images[0].uri: maps/SC04.jpg`), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(완전 매끈 — 기본값과 명시적으로 다름). `doubleSided: true`(양면 렌더 — 얇은 패널 내부도 보이게 함, Pump의 `doubleSided` 미지정과 대비, RTU와 동일한 양면 렌더 규약). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 양면 렌더 + 완전 매끈**의 광택성 PBR 셰이딩. material 이름이 `Material #342540189`라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, RTU의 `Material #342540168`(숫자 ID `...168`)과 **유사 범위의 ID**(차이 21)를 가져 **같은 3ds Max 씬 또는 같은 exporter 배치 빌드에서 생성된 동일 시기 자산**임을 시사한다. BATT 계열의 자동 생성 material 명명 패턴과 유사하며 Pump(`Pump`)·Partition 시리즈(`#25192003`)·RoadBlock(`Material #37`)와 대비된다. 텍스처 파일명 `SC04.jpg`의 `04` suffix는 meshName(`SC-2U1`)의 번호(`1`)와 다르며, 원본 3ds Max 씬에서 **텍스처 라이브러리 내 4번째 SC 계열 텍스처**로 관리되던 자산을 참조한 것으로 보인다(메시 번호 ≠ 텍스처 번호의 비대칭 명명).

**babylon.js glTF exporter for 3dsmax 2025 v20250127.3**으로 생성되었으며, RTU와 **완전히 동일한 빌드**(3ds Max 2025 + babylon exporter 2025년 1월 빌드). Pump/RoomCage/RoomCageSmall의 `3dsmax 2023 v20240312.5`보다 한 단계 더 최신 빌드로, RTU와 **같은 시기·같은 toolchain에서 export된 형제 자산**임이 명확하다. sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). material에 `extras`로 babylon 전용 힌트(`babylonSeparateCullingPass: false`·`subsurface_type: ""`·`caustics: false`·`internal_reflections: true`·`exit_to_background: false`·`indirect_diffuse: 1.0`·`indirect_specular: 1.0`·`dielectric_priority: 0`·`transmit_aovs: false`·`aov_id1~8: ""`)이 다수 선언되어 있고, 이는 **Arnold 렌더러 호환 extras**(3ds Max + Arnold 조합의 표준 출력)로 RTU의 단일 `babylonSeparateCullingPass` 선언보다 훨씬 풍부하다. 표준 core glTF 2.0 외 확장 선언은 없다. 텍스처 폴더는 `maps/`(BATT/Pump/RoadBlock/RoomCage 규약의 `textures/`와 달리 RTU의 `maps/` 규약과 공통 — 2025년 빌드 babylon exporter의 기본 출력 폴더 규약).

**MeshStateMixin 동작 경로**: `getObjectByName('SC-2U1')`은 리프 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall와 동일한 최단 경로 패턴. material이 **baseColorTexture(불투명 JPG)를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). `doubleSided: true`는 clone 후에도 유지되므로 양면 렌더 특성도 그대로 보존된다(RTU와 동일한 보존 규약). 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. `alphaMode` 미선언이므로 OPAQUE 기본값이 유지되어 RoomCage/RoomCageSmall의 BLEND 반투명 착색과 달리 **단일 상태색이 전체 외장에 균일하게 착색**되는 특성을 보인다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'SC-2U1'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명은 `SC_01`이지만 구독 데이터의 meshName은 GLTF 원본 Node 이름인 `SC-2U1`을 사용해야 한다는 **비대칭 명명 규약**에 주의(RTU의 `RTU2`, RoomCage의 `cage01`, RoomCageSmall의 `cage02` 패턴과 동류, BATT·Pump·RoadBlock의 "장비명 = meshName" 일치 규약과 대비). 특히 meshName에 **하이픈(`-`)이 포함된 특수 케이스**라는 점에서 다른 컴포넌트(영문자·숫자만 사용)와 구분되며, `getObjectByName`에 전달 시 문자열 정확히 `'SC-2U1'`(하이픈 포함)으로 지정해야 한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
