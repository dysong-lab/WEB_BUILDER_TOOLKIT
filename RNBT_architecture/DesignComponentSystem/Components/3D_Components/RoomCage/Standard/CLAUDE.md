# RoomCage — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`cage01`)의 material 색상 변경

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

- 경로: `models/RoomCage/01_default/RoomCage.gltf`
- meshName: **`cage01`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명 `RoomCage`와 **meshName이 다른 비대칭 명명** 케이스(RTU의 `RTU` ≠ `RTU2` 패턴과 동류, BATT·Pump·RoadBlock의 "장비명 = meshName" 일치 규약과 대비). `getObjectByName('cage01')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다.
- 구조:
  ```
  scene → root (Group Node, scale [1000, 1000, 1000])
            └── cage01 (Mesh Node, mesh 0, material "cage01")
  ```
- **루트 Group에 `scale [1000, 1000, 1000]` 업스케일 적용** — Partition·Pump·OHU103·RoadBlock과 공통되는 babylon exporter의 mm→m 변환 패턴. 원본 모델 좌표는 극소형(X ±0.0125, Y ±0.0125, Z ±0.00025, 단위 ≈ 0.025 × 0.025 × 0.0005)이지만 업스케일 후 최종 장면 단위로 **약 25 × 25 × 0.5 단위의 정사각형 얇은 판**이 된다. X와 Y가 거의 동일한 **정사각형 판재**이면서 Z축 두께가 사실상 평면에 가까운(약 2500:1 비율) **케이지/펜스 데칼 판재** 특성. RoadBlock(X ≫ Y ≈ Z, 가로로 긴 바)·RTU(Y ≫ X ≈ Z, 세로형 캐비닛)·Pump(세 축 균형, 부피형)와 구분되는 **평면형 정사각 판** 프로포션. preview 카메라는 far=100 이상과 바운드 기반 자동 거리 패턴.
- 정점 속성 / 인덱스:
  - `cage01` — POSITION 20개·인덱스 30개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 약 1.8배 더 적은 **최소 정점**으로, RoadBlock(POSITION 216)·Pump(POSITION 6090)보다 훨씬 단순한 **사실상 평면에 가까운 최저 해상도 지오메트리**(20 vertices ≒ 4~5 쿼드 = 8~10 삼각형, 인덱스 30이므로 10 삼각형 기준). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.0125, 0.0125] · Y ∈ [-0.0125, 0.0125] · Z ∈ [-0.00025, 0.00025].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`cage01`** (material 0, → `cage01` Mesh에 적용): `baseColorTexture` `textures/cage01_A.png`(케이지/펜스 패턴 텍스처, **PNG with alpha**), `metallicFactor` 0.0(비금속), `alphaMode: BLEND`(**반투명 알파 블렌딩** — 판재 위에 투명 영역을 포함한 케이지 패턴을 적용하는 데칼 방식), `roughnessFactor`·`baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`doubleSided` 없음 → **순수 알파 텍스처 + 비금속 + 기본 단면 렌더 + BLEND 합성**의 투명 PBR 셰이딩. RoadBlock(`Material #37`)·RTU(`Material #342540168`)·Partition 시리즈(`#25192003`) 같은 "Material #숫자" 패턴과 달리 **meshName과 동일한 `cage01` 명칭** 사용(Pump의 `Pump` material 명명과 유사). `extras.babylonSeparateCullingPass: false` 선언이 있다. 텍스처 파일명의 `_A` suffix는 **Alpha 채널이 있는 텍스처**임을 나타내는 babylon/3ds Max 규약.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture(알파 PNG) 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). BATT·Pump·Partition_small·RTU·RoadBlock과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·alphaMode)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 **`alphaMode: BLEND`와 텍스처 알파 채널이 보존되므로 투명 영역은 그대로 투명하게 유지되고 불투명 영역(케이지 패턴)만 상태색으로 착색**되는 특수한 시각적 결과를 만든다. `doubleSided`가 선언되지 않았으므로 three.js 기본 `FrontSide` 렌더가 유지된다.
- 텍스처 폴더: `textures/` (BATT/Pump/RoadBlock의 규약과 공통, RTU의 `maps/` 규약과 대비 — RoomCage 모델 export 시점의 babylon exporter 기본 설정이 BATT·Pump·RoadBlock과 동일)
  - `cage01_A.png` — `cage01` material의 baseColorTexture (케이지/펜스 패턴 알파 텍스처). 파일명이 meshName(`cage01`) + `_A`(Alpha 채널 suffix) 규약으로, RoadBlock(`RoadBlock.jpg`, 불투명 JPG)·RTU(`RTU02.jpg`, 불투명 JPG)의 JPG 텍스처 패턴과 달리 **PNG + 알파**를 사용하는 투명 데칼 텍스처 케이스.
- 구독 데이터 예: `[{ meshName: 'cage01', status }]` — **단일 meshName으로 단일 Mesh 제어**. BATT(`[{meshName:'BATT', status}]`)·RTU(`[{meshName:'RTU2', status}]`)·RoadBlock(`[{meshName:'RoadBlock', status}]`)과 동일한 최단 경로 패턴. **장비 폴더명(`RoomCage`)이 아닌 Mesh Node 이름(`cage01`)을 사용**해야 한다는 점에 주의(RTU와 동일한 비대칭 명명 규약).
