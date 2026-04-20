# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Group Node** `SDC500` → 2 자식 Mesh `sdc500_003`, `sdc500_004`) — 루트 Group 이름 하나로 자식 Mesh 일괄 착색 |
| 기본 Mixin | MeshStateMixin |
| meshName | `SDC500` — **Group Node 이름**. 장비 폴더명과 meshName이 **일치하는 대칭 명명** 케이스(BATT의 `BATT`, Pump의 `Pump`, RoadBlock의 `RoadBlock`, FLIREx의 `FLIREx`와 동류). `getObjectByName('SDC500')`은 두 자식 Mesh(`sdc500_003`, `sdc500_004`)를 가진 Group Node를 반환하고, MeshStateMixin은 `obj.material`이 없으므로 `obj.traverse(child => child.material && applyColor(child, color))` 분기로 진입해 자식 Mesh들의 material을 일괄 clone+setHex. Partition(`Group003`)의 "**Group-traverse 단일 참조**" 패턴과 동일하되, Partition의 모델러 자동 생성 범용 Group명(`Group003`)과 달리 SDC500은 **장비명 그대로**를 Group명으로 사용한다는 점이 구분점(PTT의 `PTT_033` 장비명 기반 Group명 규약과 동일 계열). Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 대비된다. |

## 장비 개요

SDC500(Smoke Detection Controller 500 계열)은 화재 감지 시스템의 **공기 샘플링 스모크 디텍터 본체**를 표현하는 3D 컴포넌트이다. 서버룸·데이터센터·전기실 천장 또는 벽면에 설치되는 소형 박스형 감지기로, 두 부분으로 구성된 복합 형상(본체 케이스 + 플라스틱 커버 혹은 샘플링 유닛)을 한 장비로 묶는다. 단일 GLTF(`models/SDC500/01_default/SDC500.gltf`)의 scene은 `SDC500`(Group Node, children [1, 2]) 아래에 두 자식 Mesh Node `sdc500_003`(mesh 0, material `SDC500`)과 `sdc500_004`(mesh 1, material `plastic01`)을 배치한다. 두 자식은 **공통적으로** X축 기준 90° 회전(쿼터니언 `[0.7071068, ~0, ~0, 0.7071067]` ≒ X축 π/2 회전)과 `scale [1.1935, 1.1935, 1.1935]`를 가지며, 첫 번째 자식(`sdc500_003`)만 `translation [0, 0, 0.08337501]` z축 오프셋을 추가로 갖는다. 서로 다른 mesh·material(텍스처 주도 본체 vs 플라스틱 커버)을 가진 복합 구조이므로 Group 이름 하나(`SDC500`)로 자식 전체를 참조하는 것이 가장 단순한 접근이다(Partition과 동일한 Group-traverse 규약).

GLTF 구조:
```
scene → SDC500 (Group Node, children [1, 2])
        ├─ sdc500_003 (Mesh Node, mesh 0,
        │              translation [0, 0, 0.08337501],
        │              rotation [0.7071068, ~0, ~0, 0.7071067] ≒ X축 π/2 회전,
        │              scale [1.1935, 1.1935, 1.1935],
        │              material "SDC500")
        └─ sdc500_004 (Mesh Node, mesh 1,
                       rotation [0.7071068, ~0, ~0, 0.7071067] ≒ X축 π/2 회전,
                       scale [1.1935, 1.1935, 1.1935],
                       material "plastic01")
```

루트 Group `SDC500`은 **scale 업스케일이 없는(1:1)** 원본 단위 유지 케이스다. Partition(`scale [1000, 1000, 1000]`)·Earthquake·OHU103·ElecPad·PCS의 "원본 mm → 장면 m 업스케일" 패턴과 대비되며, SC_01·SC_02·RTU·BATT의 "root scale 없음" 원본 유지 패턴과 동류이다. 다만 자식 노드에 **`scale [1.1935, 1.1935, 1.1935]`라는 비정수 배율**이 부여되어 있어, 원본 mesh bound가 약간 확대되어 장면에 반영된다(1.1935배 ≒ 약 19% 확대). 이 비정수 배율은 BATT(1:1)·SC_01/SC_02(1:1)·Pump(`1000×`)·RoomCage(`1000×`) 등의 **정수 또는 1:1 스케일과 달리 모델 내부 미세 스케일 보정** 성격이 강하다.

원본 mesh 바운드(두 자식 합산): 대략 X ∈ ±0.156 · Y ∈ ±0.0699 · Z ∈ ±0.106 (자식 `sdc500_003`의 Y는 0 평면만 — 바닥 평면 역할, Z는 ±0.106; `sdc500_004`는 Y ∈ ±0.0699 · Z ∈ ±0.106인 입체). **두 자식을 합친 원본 바운드는 약 0.312 × 0.14 × 0.212 단위**이며, scale 1.1935 배율 적용 후 약 **0.37 × 0.17 × 0.25 단위**가 된다. 추가로 `sdc500_003`의 translation `z = 0.08337501`과 X축 90° 회전(quaternion 기준)으로 인해 실제 장면 배치는 회전 후 Y/Z 축이 스왑되며 z 오프셋이 회전 후 Y축 방향 이동으로 전환된다. 전반적으로 **소형 박스형 감지기**로서 preview 카메라는 약 1.0 단위 이하의 근거리 배치가 적절하다.

**자식 Mesh별 속성**:
- **`sdc500_003`** (mesh 0): POSITION 4개·인덱스 6개(SCALAR, `componentType: 5123` = unsigned short). **4 vertices → 단일 쿼드 평면 (2 삼각형)** 수준의 초단순 지오메트리로, 본체의 바닥 또는 상단 평면 패널을 담당한다. TEXCOORD_0 있음(UV VEC2), NORMAL 있음, COLOR_0 없음. 바운드 Y ∈ [0, 0](평면)·X ∈ ±0.156·Z ∈ ±0.106 → 0.312 × 0 × 0.212 **얇은 평면**. material `SDC500`(baseColorTexture `textures/SDC500.jpg`) 적용.
- **`sdc500_004`** (mesh 1): POSITION 44개·인덱스 78개(SCALAR, `componentType: 5123` = unsigned short). **44 vertices ≒ 11-12 삼각형**의 박스형 중간 해상도 지오메트리로, 본체의 측면·상단 케이스 또는 커버 구조를 담당한다. NORMAL 있음, TEXCOORD_0 **없음**(UV 부재 — `plastic01` material이 metallicRoughnessTexture만 사용하고 baseColorFactor로 색상 부여하므로 UV 불필요). 바운드 X ∈ ±0.156 · Y ∈ ±0.0699 · Z ∈ ±0.106 → 0.312 × 0.14 × 0.212 **박스형**. material `plastic01`(baseColorFactor 베이지 톤 + metallicRoughnessTexture) 적용.

**Material 구조 (쌍 구조 + 타입 혼합)**:
- **`SDC500`** (material 0, → `sdc500_003`): `baseColorTexture` `textures/SDC500.jpg`(감지기 본체 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면). `doubleSided: true`(양면 렌더 — 얇은 패널의 내부도 보이게 함). `extras.babylonSeparateCullingPass: false`(babylon 전용 힌트, 단일 항목만 선언 — SC_02의 다수 Arnold 호환 extras보다 훨씬 단순). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 **장비명 `SDC500` 그대로**라는 점이 SC_02(`Material #342540149`)·Partition(`Material #25192003`) 등의 **숫자 ID 기반 자동 명명**과 대비되는 **인간 친화적 명명** 규약(BATT의 material 명명과 유사한 계열).
- **`plastic01`** (material 1, → `sdc500_004`): `baseColorFactor` `[0.691943169, 0.6612478, 0.609959364, 1.0]`(베이지 톤, R·G·B ≒ 0.69·0.66·0.61의 약간 붉은 빛 도는 크림색, 알파 1.0 불투명), `roughnessFactor` 0.5(중간 거칠기), `metallicRoughnessTexture` `textures/TexturesCom_Plastic_Polymer_1K_roughness255.jpg`(metallic·roughness 맵). `metallicFactor`·`baseColorTexture`·`normalTexture` 없음, `doubleSided: true`(양면 렌더), `alphaMode` 없음(OPAQUE 기본). **`baseColorFactor` 주도 + metallicRoughnessTexture 보조**의 플라스틱 셰이딩으로, SDC500 material의 "텍스처 주도"와 **타입이 혼합된 쌍 material** 구조다. 이는 PTT의 "한쪽 texture / 한쪽 factor" 혼합 케이스와 동류이며, Partition의 "두 자식 모두 텍스처 주도"·BATT의 단일 material과 대비된다. 이름 `plastic01`은 재질 타입 기반(숫자 suffix `01`은 동일 씬 내 첫 번째 플라스틱 재질).

**babylon.js glTF exporter for 3dsmax 2023 v20220628.14**으로 생성되었으며, SC_01/SC_02/RTU의 2025년 빌드보다 **약 2-3년 앞선 빌드**로 PTT의 `3dsmax 2023 v20220628.14`와 **완전히 동일한 빌드**다(SC 시리즈와는 다른 빌드 시기). extras는 첫 번째 material에만 `babylonSeparateCullingPass: false` 단일 항목만 선언되어 있어 SC_02의 Arnold 호환 다중 extras(10+ 항목)보다 훨씬 단순한 표준 core glTF 2.0에 가까운 출력이다. 확장 선언은 없다. 텍스처 폴더는 `textures/`(BATT·Pump·RoadBlock·RoomCage·RoomCageSmall의 `textures/` 규약과 공통 — 2022년 빌드 babylon exporter의 출력 폴더 규약, SC_01/SC_02/RTU의 `maps/` 규약과 대비).

**MeshStateMixin 동작 경로**: `getObjectByName('SDC500')`은 Group Node(`material` 미지정)를 반환 → `obj.material`이 undefined이므로 `else` 분기의 `obj.traverse(child => child.material && applyColor(child, color))` 경로로 진입 → 자식 `sdc500_003`·`sdc500_004`의 `material`을 각각 clone하여 color만 setHex 치환. 두 material 모두 단일 객체(배열 아님)이므로 `Array.isArray(material)` 분기는 발동하지 않고 각각 직접 clone 경로. `SDC500` material은 **baseColorTexture 주도**이므로 color setHex가 텍스처 색에 곱해지고(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture), `plastic01` material은 **baseColorFactor 주도**이므로 color setHex가 baseColorFactor를 직접 치환한다(texture에 곱해지는 것이 아닌 색 전체 치환). 따라서 두 자식의 **상태색 반영 강도가 다르다** — `sdc500_003`(텍스처 주도)은 텍스처 원색이 부분적으로 유지되며 상태색이 가미되는 반면, `sdc500_004`(factor 주도)는 상태색이 플라스틱 커버 전체를 균일하게 치환한다. PTT의 "한쪽 texture / 한쪽 factor → 반영도 불일치" 케이스와 동일한 패턴이며, Partition의 "두 자식 모두 텍스처 → 균일 반영"과 대비된다.

`doubleSided: true`는 두 material 모두 보존되므로 양면 렌더 특성이 유지되고, `alphaMode` 미선언(OPAQUE 기본)이므로 반투명 처리는 없다. 원본 속성(baseColorTexture/baseColorFactor·metallicFactor·roughnessFactor·metallicRoughnessTexture·doubleSided·extras)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'SDC500'` 한 개만 보내도 자식 2개가 함께 착색된다(Group-traverse 일괄 적용). Earthquake가 `['Earthquake','Earthquake_A']`를 배열로 열거한 것과 달리 SDC500은 부모 Group 이름 하나면 충분하다. Group 이름이 **장비명 그대로**라는 점이 Partition(`Group003` — 모델러 자동 생성 범용명)과의 명확한 차이이며(PTT의 `PTT_033` 장비명 기반 Group명 규약과 동일 계열), BATT(meshName=`BATT`) 등 "장비명 = meshName" 대칭 규약과 동류다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
