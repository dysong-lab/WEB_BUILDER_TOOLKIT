# LithiumionBattery — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `Lithiumionbattery` Mesh의 단일 material(`Lithiumionbattery`) 색상을 변경

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

- 경로: `models/LithiumionBattery/01_default/LithiumionBattery.gltf`
- meshName: **`Lithiumionbattery`** — 폴더명은 `LithiumionBattery`(카멜케이스, 'B' 대문자)이지만 GLTF 내부 Node/Mesh 이름은 `Lithiumionbattery`(소문자 'b')로 **대소문자가 불일치**한다. `getObjectByName`은 대소문자를 구분하므로 반드시 소문자 'b'의 `'Lithiumionbattery'`로 조회해야 한다 (FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의 "이름 일치형"과 대비, LV_R의 `LV-2R1`/LV_BAT의 `LV-BAT1` 같은 "폴더-Node 불일치형"과 유사하지만 이 경우는 순수 대소문자 차이).
- 구조: `scene → root(scale [1000,1000,1000]) → "Lithiumionbattery"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 LV_BAT·LV_2P_09/10/11 계열과 동일한 가장 단순한 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 25200, 인덱스 25200, 단일 primitive). LeakDetector(1784 정점)의 약 14배, LV 계열(46 정점)의 약 548배 규모.
- 재질: 1개 PBR material
  - `Lithiumionbattery` (material 0) — baseColorTexture `textures/Lithiumionbattery.jpg`
  - metallicFactor 0.0, roughnessFactor 0.5 (**정상 범위값** — LeakDetector·FLIREx 등의 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(-90.47056)와 대비되는 정상 스칼라)
  - MeshStateMixin은 `material.color`만 갱신하므로 roughness/metallic 값과 독립적으로 색상 치환 동작
- 텍스처 폴더: `textures/` (Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례와 동일; LV 계열의 `maps/` 규약과 대비)
- 좌표 바운드(루트 스케일 적용 전): [-0.217230, -0.113873, -0.054166] ~ [0.217230, 0.113873, 0.054166]
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **434 × 228 × 108 단위** (판상형, X축이 가장 긴 직육면체; 본 저장소 개별 3D 컴포넌트 중 최대 규모 계열)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'Lithiumionbattery', status }]` (소문자 'b')
