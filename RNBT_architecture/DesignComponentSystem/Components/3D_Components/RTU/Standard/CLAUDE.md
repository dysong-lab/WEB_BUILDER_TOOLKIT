# RTU — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`RTU2`)의 material 색상 변경

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

- 경로: `models/RTU/01_default/RTU.gltf`
- meshName: **`RTU2`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명 `RTU`와 **meshName이 다른 비대칭 명명** 케이스(BATT·Pump의 "장비명 = meshName" 일치 규약과 대비). `getObjectByName('RTU2')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다.
- 구조:
  ```
  scene → RTU2 (Mesh Node, mesh 0,
                 rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
                 material "Material #342540168")
  ```
- **루트 업스케일 없음(1:1 스케일)** — Partition·Pump·OHU103 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 달리 RTU는 루트에 scale 적용이 없어 **원본 미터 유닛을 그대로 사용**한다. Mesh Node 자체는 Y축 기준 약 π 회전(쿼터니언 `[0, -1, 0, 1.19e-08]`)만 가지며 scale은 없다. 원본 bound 기준 장면 크기 X ∈ [-0.3999, 0.3999] · Y ∈ [-1.4750, 1.4750] · Z ∈ [-0.5000, 0.5000] — **약 0.8 × 2.95 × 1.0 단위의 세로로 긴 직육면체**(Y축이 높이 방향). Pump(1.86 × 3.23 × 1.54 업스케일 후)보다 작고 세로 방향 비율이 더 큼. preview 카메라는 far=50, 바운드 기반 자동 거리 패턴.
- 정점 속성 / 인덱스:
  - `RTU2` — POSITION 36개·인덱스 54개(SCALAR, `componentType: 5123` = unsigned short). Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 정점 수 약 170배 적은 **저해상도 박스형 캐비닛 지오메트리**(36 vertices ≒ 12 삼각형 = 6면 × 2 삼각형, 단 인덱스 54로 일부 면 분할). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.3999, 0.3999] · Y ∈ [-1.4750, 1.4750] · Z ∈ [-0.5000, 0.5000].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Material #342540168`** (material 0, → `RTU2` Mesh에 적용): `baseColorTexture` `maps/RTU02.jpg`(케이싱 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면), `doubleSided: true`(**양면 렌더** — 얇은 패널 내부도 보이게 함, Pump의 doubleSided 미지정과 대비). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540168`이라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, BATT 계열의 자동 생성 패턴과 유사하며 Pump(`Pump`)·Partition 시리즈(`#25192003`)와 대비된다.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). Pump·Partition_small과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 `doubleSided: true`가 보존되므로 양면 렌더 특성도 그대로 유지된다.
- 텍스처 폴더: `maps/` (1개 이미지, Pump의 `textures/` 폴더 규약과 달리 `maps/` 폴더 사용 — RTU 모델 export 시점의 babylon exporter 기본 설정)
  - `RTU02.jpg` — `Material #342540168`의 baseColorTexture (RTU 케이싱/외장 텍스처). 파일명이 meshName(`RTU2`)과 유사(`RTU02` ≒ `RTU2`의 0패딩 표기)하지만 material 이름(`Material #342540168`)과는 무관한 **텍스처 고유 파일명** 패턴.
- 구독 데이터 예: `[{ meshName: 'RTU2', status }]` — **단일 meshName(리프 Mesh 이름)으로 단일 Mesh 제어**. FLIREx(`[{meshName:'FLIREx', status}]`)·Pump(`[{meshName:'Pump', status}]`)·Partition_small(`[{meshName:'partitionSmall', status}]`)과 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]` Group-traverse 경유 방식과 대비된다. **장비 폴더명(`RTU`)이 아닌 Mesh Node 이름(`RTU2`)을 사용**해야 한다는 점에 주의.
