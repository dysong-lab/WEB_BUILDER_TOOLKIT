# RoadBlock — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`RoadBlock`)의 material 색상 변경

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

- 경로: `models/RoadBlock/01_default/RoadBlock.gltf`
- meshName: **`RoadBlock`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명과 meshName이 **일치**하는 대칭 명명 케이스(BATT·Pump·Chiller와 동일 규약), RTU(장비 `RTU` ≠ Mesh `RTU2`)의 비대칭 명명과 대비. `getObjectByName('RoadBlock')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다.
- 구조:
  ```
  scene → root (Group Node, scale [1000, 1000, 1000])
            └── RoadBlock (Mesh Node, mesh 0, material "Material #37")
  ```
- **루트 Group에 `scale [1000, 1000, 1000]` 업스케일 적용** — Partition·Pump·OHU103과 공통되는 babylon exporter의 mm→m 변환 패턴. 원본 모델 좌표는 극소형(X ±0.0144, Y ±0.00285, Z ±0.00369, 단위 ≈ 0.029 × 0.0057 × 0.0074)이지만 업스케일 후 최종 장면 단위로 **약 28.8 × 5.7 × 7.4 단위의 가로로 긴 납작한 바(bar) 형태**가 된다. X축이 압도적으로 긴 **수평 차단기** 프로포션(차량 진로를 가로지르는 차단 바). preview 카메라는 far=100 이상과 바운드 기반 자동 거리 패턴.
- 정점 속성 / 인덱스:
  - `RoadBlock` — POSITION 216개·인덱스 582개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 **약 6배 많은 정점**으로 박스형 캐비닛보다 한 단계 더 세분된 지오메트리(바 본체 + 양단 캡 등의 세부 면). Pump(POSITION 6090)보다는 훨씬 적어 **중간 해상도의 단순 차단기 형상**. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.0144, 0.0144] · Y ∈ [-0.00285, 0.00285] · Z ∈ [-0.00369, 0.00369].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Material #37`** (material 0, → `RoadBlock` Mesh에 적용): `baseColorTexture` `textures/RoadBlock.jpg`(바 본체 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.450053632(**중간 거칠기** — RTU의 0.0(완전 매끈)과 달리 적당한 무광 표면, 고무/페인트 마감 느낌). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode`·`doubleSided` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기 + 기본 단면 렌더**의 무광 PBR 셰이딩. material 이름이 `Material #37`이라는 **3ds Max 원본 material ID 기반 짧은 숫자 suffix** 형식으로, RTU(`Material #342540168`)·Partition 시리즈(`#25192003`)와 대비된다.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). BATT·Pump·Partition_small·RTU와 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. `doubleSided`가 선언되지 않았으므로 three.js 기본 `FrontSide` 렌더가 유지된다.
- 텍스처 폴더: `textures/` (BATT/Pump의 규약과 공통, RTU의 `maps/` 규약과 대비 — RoadBlock 모델 export 시점의 babylon exporter 기본 설정이 BATT·Pump와 동일)
  - `RoadBlock.jpg` — `Material #37`의 baseColorTexture (도로 차단기 바 본체/캡 영역의 텍스처 아틀라스). 파일명이 meshName(`RoadBlock`)과 일치하는 **BATT/Pump 스타일 규약**(텍스처 파일명 = meshName).
- 구독 데이터 예: `[{ meshName: 'RoadBlock', status }]` — **단일 meshName으로 단일 Mesh 제어**. BATT(`[{meshName:'BATT', status}]`)·Pump(`[{meshName:'Pump', status}]`)·Chiller와 동일한 최단 경로 패턴. **장비명 = meshName**이므로 데이터 키 매핑이 1:1로 직관적이다.
