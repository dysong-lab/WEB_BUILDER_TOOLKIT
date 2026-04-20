# MonnitTemperature_sensor — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `MonnitTemperature_sensor` Mesh의 단일 material(`Material #26`) 색상을 변경

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

- 경로: `models/MonnitTemperature_sensor/01_default/MonnitTemperature_sensor.gltf`
- meshName: **`MonnitTemperature_sensor`** — GLTF 내부 Node/Mesh 이름이 폴더명과 **완전히 동일**하다 (밑줄 `_` 포함 식별자까지 그대로 승계 — LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake와 같은 "이름 일치형" 규약). MetalSphere의 완전 불일치(`MetalSphere` ↔ `metal001`)나 LithiumionBattery의 대소문자 차이(`LithiumionBattery` ↔ `Lithiumionbattery`) 같은 명명 체계 변경이 없으므로 `getObjectByName('MonnitTemperature_sensor')`로 Mesh를 바로 얻을 수 있다. 브랜드(Monnit) + 속성(Temperature) + 카테고리(_sensor)의 복합 식별자를 가진 다소 긴 이름이 특징이다.
- 구조: `scene → root(scale [1000,1000,1000]) → "MonnitTemperature_sensor"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. Mesh Node에 `translation [0.0, 0.0, -7.989568E-11]`만 존재하며 `rotation`은 없다(식별 행렬). Z축 translation 값은 `-7.99e-11`로 **부동소수점 epsilon 범위**이며 3ds Max → Babylon.js glTF exporter의 수치적 잔여이다 — 실질적으로 원점에 놓인 것과 동일하게 취급된다. MetalSphere의 X축 -90도 회전이나 MeetingSofa의 Y축 -90도 회전 같은 **좌표계 보정 회전이 없는** 케이스 (모델러가 glTF Y-up 좌표계에 맞춘 상태로 제작했거나 exporter가 axis 변환을 vertex 단계에서 베이크한 경우). LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere와 동일한 가장 단순한 "1-Node × 1-primitive × 1-material" 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 260, 인덱스 456, 단일 primitive). **인덱스 수(456)가 정점 수(260)의 약 1.75배**로, MetalSphere의 5.15배와 MetalDetector의 1.0배의 중간에 해당하는 **중간 수준의 인덱스 재사용**을 보이는 경량 메시이다. 단순 박스형 센서 케이싱 지오메트리에 걸맞은 저정점 구조.
- 재질: 1개 PBR material
  - `Material #26` (material 0) — baseColorTexture `textures/MonnitTemperature_sensor.jpg`
  - 이름이 3ds Max 숫자 일련번호 형식(`Material #NN`) — MetalSphere의 `Material #14`·MetalDetector의 `Material #29`·MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`와 동일한 명명 패턴이며, 숫자 자릿수가 2자리로 MetalSphere·MetalDetector와 동일하게 짧음 (3ds Max 서로 다른 세션에서 채번된 결과). MeshStateMixin은 `material.color`만 참조하므로 material 이름 형식과 무관하게 색상 치환 동작.
  - metallicFactor 0.0, **roughnessFactor 0.0** (정상 범위 하한 — 완전 매끈한 glossy 표면; MetalSphere·ArmChair·MeetingSofa·MetalDetector의 0.45와 다름; LeakDetector·FLIREx의 범위 이탈 `-90.47056`과도 대비). 플라스틱 센서 케이싱의 반짝이는 표면 표현에 적합.
  - **doubleSided=true** — 얇은 케이싱 면의 backface culling 회피 설정.
  - 플라스틱 센서 케이싱 특성을 반영한 저 metallic + 저 roughness 조합. MeshStateMixin은 `material.color`만 갱신하므로 metallic/roughness 값과 독립적으로 색상 치환 동작.
- 텍스처 폴더: `textures/` (ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector·MetalSphere 선례와 동일)
- 좌표 바운드(루트 스케일 적용 전): [-0.0005156, 0.0, -0.0006873] ~ [0.0005156, 0.00365560013, 0.0006873001] — Y축 최솟값이 정확히 0.0(바닥 앵커링), X·Z는 원점 대칭. **Y축으로 길쭉한 수직 기립형** 프로포션.
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **1.031 × 3.656 × 1.375 단위** (Y축 높이가 주축; LeakDetector의 판상형 0.95 × 1.31 × 0.27보다 Y축으로 약 2.8배 길고 X·Z는 유사 규모)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'MonnitTemperature_sensor', status }]`
