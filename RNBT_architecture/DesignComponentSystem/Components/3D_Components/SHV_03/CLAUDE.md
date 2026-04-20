# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh** `SHV-6`) — 단일 Mesh 직접 참조, 단일 material |
| 기본 Mixin | MeshStateMixin |
| meshName | `SHV-6` — **Mesh Node 이름** (장비 폴더명 `SHV_03`과 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('SHV-6')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU(`RTU2`)·HV_1P_01·SHV_01(`SHV-1`)·SHV_02(`SHV-4-1`)의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·HV_1P_01(meshName `HV_1P_01`)처럼 **장비명과 meshName이 일치하는 대칭 명명 컴포넌트와 달리** SHV_03은 장비 폴더명(`SHV_03`, 언더스코어+숫자 suffix)과 Mesh Node 이름(`SHV-6`, 하이픈+숫자 suffix)이 다른 **비대칭 명명** 케이스다 — 접두어 `SHV` 뒤의 숫자 부분이 서로 다른(폴더 `03` vs Node `6`) 특이 패턴이며, SHV 라이브러리 내부 식별자가 폴더 번호와 독립적으로 운영됨을 드러낸다. SHV_01(폴더 `SHV_01` vs meshName `SHV-1`, 폴더번호 1 ↔ Node번호 1 일치)·SHV_02(폴더 `SHV_02` vs meshName `SHV-4-1`, 폴더번호 2 ↔ Node번호 4-1 불일치)와 대비해 SHV_03은 **가장 단순한 하이픈 1회 suffix**(SHV_02의 2단 하이픈보다 단순)이면서도 **폴더 번호와 Node 번호가 불일치**(3 ≠ 6)라는 복합적 비대칭을 가진다. RTU(폴더 `RTU` vs meshName `RTU2`)·SC_02(폴더 `SC_02` vs meshName `SC-U1`)와 동류의 2025년 빌드 비대칭 규약(폴더는 언더스코어 표기, 내부 Node는 하이픈 표기). |

## 장비 개요

SHV_03(Station High Voltage 계열, SHV 라이브러리 내부 6번 식별자)은 변전소 고전압 단상 유닛의 6형 바리에이션을 표현하는 3D 컴포넌트이다. 세로+깊이로 긴 직육면체 외장 형상으로, 단일 Mesh Node `SHV-6`(mesh 0, material `Material #342540113`)에 외형 전체를 담는다. 단일 GLTF(`models/SHV_03/01_default/SHV_03.gltf`)의 scene은 루트에서 바로 Mesh Node `SHV-6`을 배치하며, 중간 Group Node 없이 **scene → SHV-6** 의 최단 깊이 구조다(SHV_01의 `scene → SHV-1`·SHV_02의 `scene → SHV-4-1`·RTU의 `scene → RTU2`와 동일한 직접 참조 패턴). Node는 Y축 기준 180° 회전(`rotation [0.0, -1.0, 0.0, 4.371139E-08]` ≒ 쿼터니언 [x,y,z,w] 기준 Y축 π 회전)만 가지며 scale·translation은 지정되지 않는다(SHV_02와 **비트 단위로 동일한** `4.371139E-08` w값 — 3ds Max → glTF 좌표계 변환 시 축 플립을 회전으로 흡수하는 2025년 빌드 패턴).

GLTF 구조:
```
scene → SHV-6 (Mesh Node, mesh 0,
                rotation [0.0, -1.0, 0.0, 4.371139E-08] ≒ Y축 π 회전,
                material "Material #342540113")
```

모델의 원본 bound는 X ∈ [-0.6000004, 0.6000004] · Y ∈ [-1.3235234, 1.3235234] · Z ∈ [-1.5, 1.5] — **약 1.2 × 2.65 × 3.0 단위의 세로로 긴 직육면체** 프로포션(SHV_01·SHV_02와 **완전히 동일한 바운드 수치**). Z축이 가장 긴 축(깊이 3.0), Y가 중간(높이 2.65), X가 가장 짧음(폭 1.2) — 얇지 않은 **입체감 있는 캐비닛** 느낌. SHV_01·SHV_02와 프로포션이 **비트 단위로 일치**하여, 같은 SHV 제품군에서 **외형 바운드는 공유하되 텍스처/머티리얼만 바꾼 바리에이션 설계**임을 확인한다(SHV 제품군의 공통 외형 템플릿 패턴이 SHV_01 → SHV_02 → SHV_03까지 3종에 걸쳐 유지됨). 루트 Node에 scale 업스케일이 없어(1:1 스케일) 장면 단위 자체가 원본 단위와 동일하다 — Partition·Pump·OHU103 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 대비되는 **원본 미터 유닛 그대로** 사용 케이스(RTU·SC_01/SC_02·BATT·HV_1P_01·SHV_01·SHV_02의 "루트 scale 없음" 원본 유지 패턴과 동류).

**Mesh 속성**:
- **`SHV-6`** (mesh 0): POSITION 26개·인덱스 48개(SCALAR, `componentType: 5123` = unsigned short) — SHV_01의 `SHV-1`·SHV_02의 `SHV-4-1`과 **정점/인덱스 수치가 완전히 동일**(SHV 제품군 공통 템플릿 지오메트리의 3종 확정). Pump의 `Pump`(POSITION 6090) 대비 약 235배 적은 저해상도이며, RTU의 `RTU2`(POSITION 36·인덱스 54)보다도 더 적다. 사실상 "**박스형 캐비닛을 최소 쿼드로 표현한 초저해상도 지오메트리**"(26 vertices ≒ 8-10 삼각형 수준, 인덱스 48 → 16 삼각형). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 단일 material `Material #342540113` 적용.

**Material 구조**:
- `Material #342540113` — baseColorTexture `maps/SHV05.jpg`(케이싱 텍스처, JPG 불투명, `images[0].uri: maps/SHV05.jpg`), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면), `doubleSided: true`(양면 렌더 — 얇은 패널 내부도 보이게 함). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540113`이라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, SHV_02의 `Material #342540112`보다 1 큰 ID이고 SHV_01의 `Material #342540116`보다 3 작은 ID이다 — 같은 SHV 라이브러리 내 material ID 순번이 SHV_02 → SHV_03 → SHV_01 순으로 연속적이지 않고 띄엄띄엄한 오름차순(112 → 113 → 116)이며, RTU의 `Material #342540168`·HV_1P_01의 `Material #342540146`·BATT 계열의 자동 생성 패턴과 동일 규약이다. 단일 material 구조이므로 SDC500(2개 쌍 구조)·PTT(2개 쌍 구조)와 대비되는 **단일 material 최단 경로**(RTU·HV_1P_01·SHV_01·SHV_02와 동일).

**babylon.js glTF exporter for 3dsmax 2025 v20250127.3**으로 생성되었으며, SHV_01·SHV_02·RTU·SC_01/SC_02와 **완전히 동일한 2025년 빌드**다(3ds Max 2025 + babylon exporter 2025년 1월 빌드). SDC500·PTT의 `3dsmax 2023 v20220628.14` 2022년 빌드보다 약 2-3년 최신 빌드. sampler는 `magFilter: 9729`(LINEAR), `minFilter: 9987`(LINEAR_MIPMAP_LINEAR). material `extras`에 babylon·Arnold 호환 다중 힌트(`babylonSeparateCullingPass: false`·`subsurface_type: ""`·`caustics: false`·`internal_reflections: true`·`exit_to_background: false`·`indirect_diffuse: 1.0`·`indirect_specular: 1.0`·`dielectric_priority: 0`·`transmit_aovs: false`·`aov_id1~8: ""`)가 선언되어 있고, 표준 core glTF 2.0 외 확장 선언은 없다. SHV_01·SHV_02·SC_02와 동일한 Arnold 렌더러 호환을 위한 다중 extras 패턴이며, SDC500(단일 `babylonSeparateCullingPass` 항목만)보다 풍부한 힌트 세트를 가진다.

**MeshStateMixin 동작 경로**: `getObjectByName('SHV-6')`는 Mesh Node(단일 material 객체)를 반환 → `obj.material`이 존재하므로 **Mesh 브랜치**로 진입 → `Array.isArray(material)` 미발동(단일 객체) → material을 직접 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·HV_1P_01·SHV_01·SHV_02와 동일한 최단 경로 패턴. material이 **baseColorTexture를 가지므로** color setHex가 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). `doubleSided: true`는 clone 후에도 유지되므로 양면 렌더 특성도 그대로 보존된다. 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided·extras)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'SHV-6'` 한 개만 보내면 단일 Mesh가 착색된다. 장비 폴더명은 `SHV_03`(언더스코어+숫자 3)이지만 구독 데이터의 meshName은 GLTF 원본 Node 이름인 `SHV-6`(하이픈+숫자 6)을 사용해야 한다는 **비대칭 명명 규약**에 주의(BATT·Pump·HV_1P_01의 "장비명 = meshName" 대칭 규약과 대비). 특히 SHV_03은 **폴더 번호(3)와 Node 번호(6)가 일치하지 않는다**는 점에서 SHV_01(폴더 1 = Node 1)·SHV_02(폴더 2 ≠ Node 4-1)의 패턴과도 차이가 있어, meshName을 절대 추측하지 말고 GLTF를 반드시 확인해야 하는 케이스다. 텍스처 폴더는 `maps/`(HV_1P_01·RTU·SHV_01·SHV_02의 `maps/` 규약과 공통 — 2025년 빌드 babylon exporter의 출력 폴더 규약, BATT·Pump의 `textures/` 규약과 대비). 텍스처 파일 `SHV05.jpg`는 SHV 라이브러리 내 5번째 텍스처이며, SHV_01의 `SHV07.jpg`·SHV_02의 `SHV04.jpg`와는 또 다른 번호로, 텍스처 번호 ↔ Node 번호 ↔ 폴더 번호가 모두 독립적으로 운영됨을 확인할 수 있다(각 SHV 인스턴스의 3대 식별자가 비동기).

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
