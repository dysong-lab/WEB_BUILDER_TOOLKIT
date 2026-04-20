# Pump — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`Pump`)의 material 색상 변경

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

- 경로: `models/Pump/01_default/Pump.gltf`
- meshName: **`Pump`** — GLTF **리프 Mesh Node** 이름. 이 Mesh는 자식이 없는 단일 Mesh이며, MeshStateMixin이 `getObjectByName('Pump')`으로 반환받은 Mesh에는 단일 `material`이 있어서 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Partition_small의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다. meshName이 장비명 `Pump`와 정확히 일치(대소문자 포함)하여 편집자 직관에 부합한다.
- 구조:
  ```
  scene → root (scale [1000, 1000, 1000])
          └─ Pump (Mesh Node, mesh 0, translation [0, 2.98e-08, 0],
                   material "Pump")
  ```
- **루트 `root` scale [1000, 1000, 1000] 업스케일** — Partition·Partition_small·Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 패턴. Mesh Node 자체는 Y축으로 극소량(`2.98e-08`) translation만 가지며 rotation·scale은 없다(사실상 원점 배치). 원본 bound 기준 장면 크기 약 0.00186 × 0.00323 × 0.00154 단위(세로로 약간 긴 직육면체성 부피체, Y축이 길이 방향) → 업스케일 후 **1.86 × 3.23 × 1.54** 수준. Partition_small의 "세로로 매우 길쭉한 얇은 판재(0.18 × 3.79 × 13.5)"와 달리 **세 축이 비교적 균등한 부피체**. preview 카메라 near/far는 업스케일된 장면 크기에 맞춰 "far=50, 바운드 기반 자동 거리" 패턴(Partition_small의 far=100보다 작음 — 모델 최대축이 더 작음).
- 정점 속성 / 인덱스:
  - `Pump` — POSITION 6090개·인덱스 6090개(SCALAR). Partition_small의 `partitionSmall`(POSITION 128·인덱스 294)보다 정점 수 약 48배, 삼각형 수 약 20배 더 복잡한 고해상도 형상. 펌프 본체·모터·배관 연결부·볼트 등 외형 디테일을 한 Mesh에 포함. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.00093, 0.00093] · Y ∈ [-0.00161, 0.00161] · Z ∈ [-0.00077, 0.00077].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Pump`** (material 0, → `Pump` Mesh에 적용): `baseColorTexture` `textures/Pump.jpg`(펌프 외형 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속). `roughnessFactor`·`baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode`·`doubleSided` 없음 → **순수 텍스처 + 비금속 + glTF 기본 roughness(1.0으로 해석)**의 매트한 셰이딩. `extras.babylonSeparateCullingPass: false`는 babylon 전용 힌트로 three.js 렌더 경로에는 영향 없음. material 이름이 숫자 suffix(`#...`)가 아닌 **장비명 그대로 `Pump`**인 점이 Partition 시리즈의 연번 suffix 규약과 대비된다.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). Partition_small과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.
- 텍스처 폴더: `textures/` (1개 이미지)
  - `Pump.jpg` — `Pump` material의 baseColorTexture (펌프 외형/본체 텍스처). 파일명이 mesh·material 이름과 일치하여 1:1 대응이 명확(Partition_small의 `partitionSmall.jpg`와 동일 명명 규약, 대소문자 정책만 다름 — Pump는 PascalCase, partitionSmall은 camelCase).
- 구독 데이터 예: `[{ meshName: 'Pump', status }]` — **단일 meshName(리프 Mesh 이름)으로 단일 Mesh 제어**. FLIREx(`[{meshName:'FLIREx', status}]`)·Partition_small(`[{meshName:'partitionSmall', status}]`)과 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]` Group-traverse 경유 방식과 대비된다.
