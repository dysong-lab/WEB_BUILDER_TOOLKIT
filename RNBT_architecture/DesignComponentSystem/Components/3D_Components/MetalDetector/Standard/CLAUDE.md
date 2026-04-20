# MetalDetector — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `MetalDetector` Mesh의 단일 material(`Material #29`) 색상을 변경

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

- 경로: `models/MetalDetector/01_default/MetalDetector.gltf`
- meshName: **`MetalDetector`** — 폴더명 = Node/Mesh 이름 일치 (MeetingSofa·ArmChair·Chair_Cafe 등 "이름 일치형" 규약을 따름; LithiumionBattery의 "폴더-Node 대소문자 불일치" 같은 특이 케이스 없음).
- 구조: `scene → root(scale [1000,1000,1000]) → "MetalDetector"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. Mesh Node에 `translation`·`rotation`이 모두 없어 기본 identity 변환만 적용됨 (MeetingSofa의 Y축 -90도 회전과 대비되는 "회전 없는 단순 배치"). LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 ArmChair·MeetingSofa·LithiumionBattery와 동일한 가장 단순한 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 930, 인덱스 930, 단일 primitive). MeetingSofa(395 정점)의 약 2.35배, ArmChair(630 정점)의 약 1.48배, LithiumionBattery(25200 정점)의 약 0.037배로 본 저장소 개별 3D 컴포넌트 중 낮은 정점 밀도(중간 정도의 게이트 구조물). 정점 수와 인덱스 수가 동일한 점은 인덱스 재사용이 최소화된 형태를 시사.
- 재질: 1개 PBR material
  - `Material #29` (material 0) — baseColorTexture `textures/MetalDetector.jpg`
  - 이름이 3ds Max 숫자 일련번호 형식(`Material #NN`) — MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`와 동일한 명명 패턴이며, 숫자 자릿수가 2자리로 짧음(3ds Max 서로 다른 세션에서 채번된 결과). MeshStateMixin은 `material.color`만 참조하므로 material 이름 형식과 무관하게 색상 치환 동작.
  - metallicFactor 0.0, roughnessFactor 0.450053632 (**정상 범위값** — MeetingSofa·ArmChair와 동일 수치; LeakDetector·FLIREx의 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(-90.47056)와 대비)
  - MeshStateMixin은 `material.color`만 갱신하므로 roughness/metallic 값과 독립적으로 색상 치환 동작
- 텍스처 폴더: `textures/` (ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례와 동일)
- 좌표 바운드(루트 스케일 적용 전): [-0.0069458, 0, -0.00249999971] ~ [0.0069458, 0.0223500039, 0.00250000064]
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **13.9 × 22.35 × 5.0 단위** (얇고 세로로 긴 게이트 형태; Mesh Node 회전이 없어 월드 바운드는 이 수치를 그대로 유지 — MeetingSofa처럼 회전에 의한 축 교체가 일어나지 않음)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'MetalDetector', status }]`
