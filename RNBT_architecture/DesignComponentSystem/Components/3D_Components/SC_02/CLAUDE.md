# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `SC-U1`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `SC-U1` — **Mesh Node 이름** (장비 폴더명 `SC_02`와 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('SC-U1')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall·SC_01의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·RoadBlock(meshName `RoadBlock`)처럼 **장비명과 meshName이 일치하는 컴포넌트와 달리** SC_02는 장비 폴더명(`SC_02`)과 Mesh Node 이름(`SC-U1`)이 다른 **비대칭 명명** 케이스다(SC_01의 `SC_01` ≠ `SC-2U1`, RTU의 `RTU` ≠ `RTU2`, RoomCage의 `RoomCage` ≠ `cage01`, RoomCageSmall의 `RoomCageSmall` ≠ `cage02` 패턴과 동류). 명명 규약상 폴더명은 시리즈 번호(`SC_02`)를 따르고 Mesh Node 이름은 3ds Max 원본 객체명(`SC-U1`, `U` 프로덕트 규격 suffix 포함 — SC_01의 `SC-2U1`과 달리 `2U`가 아닌 **단일 `U`** 규격)을 따르는 이원화 명명 패턴. |

## 장비 개요

SC_02(Server Cabinet / Standing Cabinet 계열의 두 번째 변종)는 데이터센터·서버룸·전기실 등에 설치되는 **1U 규격 수직 캐비닛**을 표현하는 3D 컴포넌트이다. `SC-U1`의 `U`는 19인치 랙 마운트 규격 단위(1U ≒ 44.45mm)에서 1U 높이 프로필을 시사하며(SC_01의 `SC-2U1`은 `2U` 규격으로 2U 높이), 네이밍 suffix `1`은 **동일 시리즈의 첫 번째 변종**임을 나타낸다. 외장 케이싱이 일체화된 **세로로 긴 직육면체** 형상으로, 단일 Mesh Node `SC-U1`(mesh 0, material `Material #342540149`)에 외형 전체를 담는 **1 Mesh = 1 Material 구조**로, 단일 GLTF(`models/SC_02/01_default/SC_02.gltf`)의 scene은 루트에서 바로 Mesh Node `SC-U1`을 배치하며, 중간 Group Node 없이 **scene → SC-U1**의 최단 깊이 구조다(SC_01·RTU의 `scene → SC-2U1`/`scene → RTU2` 패턴과 동일한 플랫 1단 구조). Node는 Y축 기준 180° 회전(`rotation [0, -1, 0, 1.19e-08]` ≒ 쿼터니언 [x,y,z,w] 기준 Y축 π 회전)만 가지며 scale은 없다 — SC_01·RTU와 완전히 동일한 Node 변환 규약.

GLTF 구조:
```
scene → SC-U1 (Mesh Node, mesh 0, rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
                material "Material #342540149")
```

모델의 원본 bound는 X ∈ [-0.399998844, 0.399998844] · Y ∈ [-1.275, 1.275] · Z ∈ [-1.09999979, 1.09999979] — **약 0.8 × 2.55 × 2.2 단위의 세로로 긴 직육면체** 프로포션. Y축이 가장 긴 축이며(높이, 약 2.55 단위), Z축이 중간(깊이, 약 2.2 단위), X축이 가장 짧음(폭, 약 0.8 단위). **SC_01(0.8 × 2.95 × 2.2)과 X·Z 프로포션이 완전히 동일하면서 Y축 높이만 약 0.4 단위 짧은 변종 관계** — SC_01이 2U 규격의 더 높은 서버 캐비닛이라면 SC_02는 1U 규격의 약간 낮은 **짧은 서버 캐비닛**으로, 동일 시리즈 내 높이만 차별화된 **형제 변종** 관계가 명확하다. RTU(0.8 × 2.95 × 1.0, SC_02 대비 Z축 깊이 약 절반)와는 X·Y는 유사하나 Z축 깊이가 절반인 옥상 설치형 패널 캐비닛. 루트 노드에 scale 업스케일이 없어(1:1 스케일) 장면 단위 자체가 원본 단위와 동일하다 — Partition·Pump·OHU103·RoomCage·RoomCageSmall·RoadBlock의 `scale [1000, 1000, 1000]` 업스케일 패턴과 대비되는 **원본 미터 유닛 그대로** 사용 케이스(SC_01·RTU와 동일한 규약).

**Mesh 속성**:
- **`SC-U1`** (mesh 0): POSITION 26개·인덱스 48개(SCALAR, `componentType: 5123` = unsigned short). SC_01의 `SC-2U1`(POSITION 46·인덱스 84) 대비 정점 약 0.57배, 인덱스 약 0.57배 **더 단순한 박스형 캐비닛 지오메트리**(26 vertices ≒ 8 삼각형, 인덱스 48 → 16 삼각형 기준). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비도 정점 약 0.72배로 더 단순하다. 사실상 "**박스형 캐비닛을 최소 쿼드로 표현한 초저해상도 지오메트리**" 수준으로, 6면체 기본 구조에 약간의 추가 분할만 있는 형태. Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 약 234배 적은 **저해상도 지오메트리**. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #342540149` 적용.

**Material 구조**:
- `Material #342540149` — baseColorTexture `maps/SC01.jpg`(케이싱 텍스처, JPG 불투명, `images[0].uri: maps/SC01.jpg`), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(완전 매끈 — 기본값과 명시적으로 다름). `doubleSided: true`(양면 렌더 — 얇은 패널 내부도 보이게 함, SC_01·RTU와 동일한 양면 렌더 규약). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 양면 렌더 + 완전 매끈**의 광택성 PBR 셰이딩. material 이름이 `Material #342540149`라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, SC_01의 `Material #342540189`(숫자 ID `...189`)·RTU의 `Material #342540168`(숫자 ID `...168`)과 **동일 범위의 ID**(SC_01과 차이 40, RTU와 차이 19)를 가져 **같은 3ds Max 씬 또는 같은 exporter 배치 빌드에서 생성된 동일 시기 자산**임을 시사한다(SC 시리즈와 RTU가 같은 빌드 배치임). 텍스처 파일명 `SC01.jpg`의 `01` suffix는 meshName(`SC-U1`)의 번호(`1`)와 일치하며(SC_01의 `SC-2U1` + `SC04.jpg`는 번호 불일치였으나 SC_02는 **메시 번호 = 텍스처 번호**), 원본 3ds Max 씬에서 텍스처 라이브러리 내 1번째 SC 계열 텍스처로 관리되던 자산을 참조한 것으로 보인다.

**babylon.js glTF exporter for 3dsmax 2025 v20250127.3**으로 생성되었으며, SC_01·RTU와 **완전히 동일한 빌드**(3ds Max 2025 + babylon exporter 2025년 1월 빌드). Pump/RoomCage/RoomCageSmall의 `3dsmax 2023 v20240312.5`보다 한 단계 더 최신 빌드로, SC_01·RTU와 **같은 시기·같은 toolchain에서 export된 형제 자산**임이 명확하다. sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). material에 `extras`로 babylon 전용 힌트(`babylonSeparateCullingPass: false`·`subsurface_type: ""`·`caustics: false`·`internal_reflections: true`·`exit_to_background: false`·`indirect_diffuse: 1.0`·`indirect_specular: 1.0`·`dielectric_priority: 0`·`transmit_aovs: false`·`aov_id1~8: ""`)이 다수 선언되어 있고, 이는 **Arnold 렌더러 호환 extras**(3ds Max + Arnold 조합의 표준 출력)로 SC_01과 동일한 extras 세트. 표준 core glTF 2.0 외 확장 선언은 없다. 텍스처 폴더는 `maps/`(SC_01·RTU의 `maps/` 규약과 공통 — 2025년 빌드 babylon exporter의 기본 출력 폴더 규약).

**MeshStateMixin 동작 경로**: `getObjectByName('SC-U1')`은 리프 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall·SC_01과 동일한 최단 경로 패턴. material이 **baseColorTexture(불투명 JPG)를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). `doubleSided: true`는 clone 후에도 유지되므로 양면 렌더 특성도 그대로 보존된다(SC_01·RTU와 동일한 보존 규약). 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. `alphaMode` 미선언이므로 OPAQUE 기본값이 유지되어 RoomCage/RoomCageSmall의 BLEND 반투명 착색과 달리 **단일 상태색이 전체 외장에 균일하게 착색**되는 특성을 보인다(SC_01과 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'SC-U1'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명은 `SC_02`이지만 구독 데이터의 meshName은 GLTF 원본 Node 이름인 `SC-U1`을 사용해야 한다는 **비대칭 명명 규약**에 주의(SC_01의 `SC-2U1`, RTU의 `RTU2`, RoomCage의 `cage01`, RoomCageSmall의 `cage02` 패턴과 동류, BATT·Pump·RoadBlock의 "장비명 = meshName" 일치 규약과 대비). 특히 meshName에 **하이픈(`-`)이 포함된 특수 케이스**라는 점에서 SC_01과 공통되며(영문자·숫자만 사용하는 다른 컴포넌트와 구분), `getObjectByName`에 전달 시 문자열 정확히 `'SC-U1'`(하이픈 포함, `2U`가 아닌 `U`)으로 지정해야 한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
