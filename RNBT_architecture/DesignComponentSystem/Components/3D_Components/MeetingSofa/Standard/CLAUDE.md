# MeetingSofa — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `MeetingSofa` Mesh의 단일 material(`Material #25192277`) 색상을 변경

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

- 경로: `models/MeetingSofa/01_default/MeetingSofa.gltf`
- meshName: **`MeetingSofa`** — 폴더명 = Node/Mesh 이름 일치 (ArmChair·Chair_Cafe 등 가구 계열의 "이름 일치형" 규약을 따름; LithiumionBattery의 "폴더-Node 대소문자 불일치" 같은 특이 케이스 없음).
- 구조: `scene → root(scale [1000,1000,1000]) → "MeetingSofa"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. Mesh Node에 `translation [0, ~0, 0]`(수치상 0) + `rotation [0, -0.7071068, 0, 0.7071067]`(Y축 -90도 회전) 적용. LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 ArmChair·LithiumionBattery와 동일한 가장 단순한 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 395, 인덱스 726, 단일 primitive). ArmChair(630 정점)의 약 0.63배, LithiumionBattery(25200 정점)의 약 0.016배로 본 저장소 개별 3D 컴포넌트 중 매우 낮은 정점 밀도(로우폴리 가구 모델).
- 재질: 1개 PBR material
  - `Material #25192277` (material 0) — baseColorTexture `textures/MeetingSofa.jpg`
  - 이름이 3ds Max 숫자 일련번호 형식(`Material #NNNNNNNN`) — ArmChair의 `Material #25191008`와 동일한 명명 패턴이며, LithiumionBattery의 `Lithiumionbattery` 같은 "장비명 material"과 대비. MeshStateMixin은 `material.color`만 참조하므로 material 이름 형식과 무관하게 색상 치환 동작.
  - metallicFactor 0.0, roughnessFactor 0.450053632 (**정상 범위값** — ArmChair와 동일 수치; LeakDetector·FLIREx의 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(-90.47056)와 대비)
  - MeshStateMixin은 `material.color`만 갱신하므로 roughness/metallic 값과 독립적으로 색상 치환 동작
- 텍스처 폴더: `textures/` (ArmChair·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례와 동일)
- 좌표 바운드(루트 스케일 적용 전): [-0.00740001, -3.81E-09, -0.00484999] ~ [0.00739999, 0.03, 0.00485]
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **14.8 × 30 × 9.7 단위** (세로로 긴 형태; Mesh Node의 Y축 -90도 회전이 월드 변환에 포함되면 X/Z 축이 교체되어 나타남)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'MeetingSofa', status }]`
