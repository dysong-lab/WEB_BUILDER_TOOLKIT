# SDC500 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group Node `SDC500`의 자식 Mesh(`sdc500_003`, `sdc500_004`)의 material 색상을 일괄 변경

---

## 구현 명세

### Mixin

MeshStateMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음

### 커스텀 메서드

없음

### 모델 참조

- 경로: `models/SDC500/01_default/SDC500.gltf`
- meshName: **`SDC500`** — GLTF 루트 **Group Node** 이름. 장비 폴더명과 Group Node 이름이 **일치하는 대칭 명명** 케이스(BATT의 `BATT`, Pump의 `Pump`, RoadBlock의 `RoadBlock`, FLIREx의 `FLIREx`와 동류, SC_02의 `SC_02` ≠ `SC-U1`·RTU의 `RTU` ≠ `RTU2` 비대칭 명명과 대비). 이 Group은 두 자식 Mesh(`sdc500_003`·`sdc500_004`)를 children으로 가지며, MeshStateMixin이 `getObjectByName('SDC500')`으로 반환받은 Group에는 `material`이 없어서 `obj.traverse(child => child.material && applyColor(child, color))` 분기로 진입해 **자식 Mesh 두 개의 material을 일괄 clone + color 치환**한다. Partition(`Group003`)의 "**Group-traverse 단일 참조**" 패턴과 동일하되, Partition의 모델러 자동 생성 범용 Group명과 달리 SDC500은 **장비명 그대로**를 Group명으로 사용(PTT의 `PTT_033` 장비명 기반 Group명 규약과 동일 계열). Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 구분된다.
- 구조:
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
- **루트 Group `SDC500` scale 업스케일 없음(1:1)** — Partition의 `scale [1000, 1000, 1000]` 업스케일·Earthquake·OHU103·ElecPad·PCS의 "원본 mm → 장면 m 업스케일" 케이스와 대비되는 **원본 단위 유지** 패턴(BATT·SC_01·SC_02·RTU와 동류). 단, 자식 노드에 **`scale [1.1935, 1.1935, 1.1935]` 비정수 배율**이 부여되어 원본 mesh bound가 약 19% 확대된다. 이 비정수 배율은 모델 내부 미세 스케일 보정 성격으로, BATT(1:1)·Pump(`1000×`) 등의 정수·1:1 스케일과 구분된다. 자식 mesh 바운드 합산 **원본** 장면 크기 약 0.312 × 0.14 × 0.212 → scale 1.1935 적용 후 약 0.37 × 0.17 × 0.25 단위. 추가로 `sdc500_003`의 translation `z = 0.08337501`과 X축 90° 회전으로 실제 장면 배치 시 Y/Z 축 스왑과 z 오프셋이 회전 후 Y축 이동으로 전환된다. preview 카메라는 원본 단위 기준 far=50, 바운드 기반 자동 거리 패턴(근거리 배치, 1 단위 수준).
- 정점 속성 / 인덱스:
  - `sdc500_003` — POSITION 4개·인덱스 6개(SCALAR, `componentType: 5123` = unsigned short). **4 vertices → 단일 쿼드 평면(2 삼각형)** 수준의 초단순 지오메트리(본체 바닥/상단 평면 패널). 바운드 X ∈ ±0.156, Y ∈ [0, 0](평면), Z ∈ ±0.106 → 0.312 × 0 × 0.212 **얇은 평면**. TEXCOORD_0 있음(UV VEC2), NORMAL 있음, COLOR_0 없음.
  - `sdc500_004` — POSITION 44개·인덱스 78개(SCALAR, `componentType: 5123`). **44 vertices ≒ 11-12 삼각형**의 박스형 중간 해상도 지오메트리(본체 측면·상단 케이스 또는 커버 구조). 바운드 X ∈ ±0.156, Y ∈ ±0.0699, Z ∈ ±0.106 → 0.312 × 0.14 × 0.212 **박스형**. NORMAL 있음, TEXCOORD_0 **없음**(UV 부재 — `plastic01` material이 baseColorFactor 주도이고 metallicRoughnessTexture만 사용하므로 UV 불필요), COLOR_0 없음.
- 재질: **2개 PBR material** (자식별 1개씩, **타입 혼합 쌍 구조** — 텍스처 주도 + factor 주도)
  - **`SDC500`** (material 0, → `sdc500_003`에 적용): `baseColorTexture` `textures/SDC500.jpg`(감지기 본체 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면). `doubleSided: true`(양면 렌더 — 얇은 패널의 내부도 보이게 함). `extras.babylonSeparateCullingPass: false`(babylon 전용 힌트, 단일 항목만 선언 — SC_02의 Arnold 호환 다중 extras보다 훨씬 단순). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 **장비명 `SDC500` 그대로**(BATT의 material 명명과 유사한 계열, SC_02의 `Material #342540149` 등 숫자 ID 기반 자동 명명과 대비되는 **인간 친화적 명명** 규약).
  - **`plastic01`** (material 1, → `sdc500_004`에 적용): `baseColorFactor` `[0.691943169, 0.6612478, 0.609959364, 1.0]`(베이지 톤, R·G·B ≒ 0.69·0.66·0.61의 약간 붉은 빛 도는 크림색, 알파 1.0 불투명), `roughnessFactor` 0.5(중간 거칠기), `metallicRoughnessTexture` `textures/TexturesCom_Plastic_Polymer_1K_roughness255.jpg`(metallic·roughness 맵). `metallicFactor`·`baseColorTexture`·`normalTexture` 없음, `doubleSided: true`(양면 렌더), `alphaMode` 없음(OPAQUE 기본). **`baseColorFactor` 주도 + metallicRoughnessTexture 보조**의 플라스틱 셰이딩. 이름 `plastic01`은 재질 타입 기반(숫자 suffix `01`은 동일 씬 내 첫 번째 플라스틱 재질).
- MeshStateMixin의 material 처리:
  - 두 material 모두 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → 각 자식에 대해 `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - **타입 혼합 쌍 구조**에 따라 상태색 반영 강도 차이 발생:
    - `SDC500` material(`sdc500_003`): baseColorTexture 주도 → color setHex가 텍스처 색에 곱해져 **텍스처 원색이 부분적으로 유지**되며 상태색이 가미됨(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture).
    - `plastic01` material(`sdc500_004`): baseColorFactor 주도 → color setHex가 baseColorFactor를 직접 치환하여 **상태색이 플라스틱 커버 전체를 균일하게 치환**함(texture에 곱해지는 것이 아닌 색 전체 치환).
  - PTT의 "한쪽 texture / 한쪽 factor → 반영도 불일치" 케이스와 동일한 패턴이며, Partition의 "두 자식 모두 텍스처 → 균일 반영"과 대비된다.
  - 원본 속성(baseColorTexture/baseColorFactor·metallicFactor·roughnessFactor·metallicRoughnessTexture·doubleSided·extras)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 `doubleSided: true`가 두 material 모두 보존되므로 양면 렌더 특성도 유지된다.
- 텍스처 폴더: `textures/` (2개 이미지 + 1개 roughness 맵 중복 — BATT·Pump·RoadBlock·RoomCage·RoomCageSmall의 `textures/` 규약과 공통, SC_01/SC_02/RTU의 `maps/` 규약과 대비 — 2022년 빌드 babylon exporter의 출력 폴더 규약)
  - `SDC500.jpg` — `SDC500` material의 baseColorTexture (감지기 본체 외장 텍스처). 파일명이 **장비명 그대로**라 mesh/material/texture 3자의 명명이 모두 일관됨.
  - `TexturesCom_Plastic_Polymer_1K_roughness255.jpg` — `plastic01` material의 metallicRoughnessTexture (TexturesCom 라이브러리의 1K 해상도 플라스틱 폴리머 거칠기 맵, `255` suffix는 255 그레이스케일 레인지 표기로 보임).
  - `TexturesCom_Plastic_Polymer_1K_roughness.jpg` — 동일 라이브러리의 원본 또는 별도 버전 (GLTF에서 참조되지 않는 보조 리소스, `textures/` 폴더에 함께 배치됨).
- 구독 데이터 예: `[{ meshName: 'SDC500', status }]` — **단일 meshName(부모 Group 이름)으로 자식 2개 Mesh 일괄 제어**. Partition의 `[{meshName:'Group003', status}]`·PTT의 `[{meshName:'PTT_033', status}]`와 동일 패턴이며, Earthquake의 `[{meshName:'Earthquake',...}, {meshName:'Earthquake_A',...}]` 배열 방식과 대비된다. **장비 폴더명(`SDC500`)과 meshName이 일치**하므로 명명 혼동이 없다(SC_02의 `SC_02`≠`SC-U1`, RTU의 `RTU`≠`RTU2` 등 비대칭 케이스와 달리 장비명 그대로 전달).
