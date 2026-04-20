# OHU103 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `OHU103` Mesh의 단일 material(`Material #42136`) 색상을 변경

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

- 경로: `models/OHU103/01_default/OHU103.gltf`
- meshName: **`OHU103`** — GLTF 내부 Node/Mesh 이름이 폴더명과 **완전히 동일**하다 (영문 대문자 약어 `OHU` + 숫자 모델 번호 `103`의 짧은 식별자 — LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake·MonnitTemperature_sensor와 같은 "이름 일치형" 규약). MetalSphere의 완전 불일치(`MetalSphere` ↔ `metal001`)나 LithiumionBattery의 대소문자 차이(`LithiumionBattery` ↔ `Lithiumionbattery`) 같은 명명 체계 변경이 없으므로 `getObjectByName('OHU103')`으로 Mesh를 바로 얻을 수 있다. MonnitTemperature_sensor의 복합 식별자(`브랜드_속성_카테고리`)와 달리 **공조 장비 약어 + 모델 번호의 간결한 식별자**가 특징이다.
- 구조: `scene → root(scale [1000,1000,1000]) → "OHU103"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. Mesh Node에 `rotation [0.0, -1.0, 0.0, 4.371139E-08]`이 존재한다 — 쿼터니언 `(x, y, z, w) = (0, -1, 0, ~0)` 형태로 **Y축 기준 180도 회전**(w ≈ 4.37e-08는 부동소수점 영점, y = -1). 3ds Max → Babylon.js glTF exporter가 3ds Max의 forward 방향을 glTF의 -Z-forward 규약에 맞춰 적용한 회전 보정이다. MetalSphere의 X축 -90도·MeetingSofa의 Y축 -90도 회전 선례와 달리 Y축 완전 뒤집기(180도) 회전으로 preview에서 모델이 올바른 방향으로 로드되도록 보정된다. Earthquake의 "2-Mesh Group"이나 LeakDetector의 "1-Mesh × 2-primitive × 2-material"과 달리 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere·MonnitTemperature_sensor와 동일한 가장 단순한 "1-Node × 1-primitive × 1-material" 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 80, 인덱스 120, 단일 primitive). **인덱스 수(120)가 정점 수(80)의 정확히 1.5배**로, MonnitTemperature_sensor의 1.75배·MetalSphere의 5.15배·MetalDetector의 1.0배 중 **낮은 인덱스 재사용** 수준을 보이는 **본 저장소 최소 밀도급** 경량 메시. 단순 박스형 공조 유닛 외관(육면체 + 약간의 패널 디테일)에 걸맞은 초저정점 구조.
- 재질: 1개 PBR material
  - `Material #42136` (material 0) — baseColorTexture `textures/OHU103.jpg`
  - 이름이 3ds Max 숫자 일련번호 형식(`Material #NN`) — MetalSphere의 `Material #14`·MetalDetector의 `Material #29`·MonnitTemperature_sensor의 `Material #26`·MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`와 동일한 명명 패턴. 숫자 자릿수 5자리는 2자리 그룹(MetalSphere·MetalDetector·MonnitTemperature_sensor)과 8자리 그룹(MeetingSofa·ArmChair)의 중간 규모. MeshStateMixin은 `material.color`만 참조하므로 material 이름 형식과 무관하게 색상 치환 동작.
  - metallicFactor 0.0, **roughnessFactor 0.450053632** (정상적인 중간 roughness — MetalSphere·MetalDetector의 0.45와 거의 동일; MonnitTemperature_sensor의 0.0 완전 매끈이나 LeakDetector·FLIREx의 범위 이탈 `-90.47056`과 대비). 공조 장비 외장 플라스틱/금속 케이싱의 자연스러운 반사 표현에 적합.
  - **doubleSided 설정 없음** — MonnitTemperature_sensor의 doubleSided=true와 달리 일반 backface culling 적용. 두꺼운 박스형 공조 유닛 외관에 적합.
  - MeshStateMixin은 `material.color`만 갱신하므로 metallic/roughness/doubleSided 값과 독립적으로 색상 치환 동작.
- 텍스처 폴더: `textures/` (ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector·MetalSphere·MonnitTemperature_sensor 선례와 동일)
- 좌표 바운드(루트 스케일 적용 전): [-0.016, 0.0, -0.00525] ~ [0.016, 0.0175965019, 0.00525000039] — Y축 최솟값 정확히 0.0(바닥 앵커링), X·Z는 원점 대칭. **X축(폭)이 주축인 가로로 긴 박스형** 프로포션 (공조/에어 핸들링 유닛 전형).
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **32 × 17.6 × 10.5 단위** (X축 폭이 주축; MonnitTemperature_sensor의 Y축 수직 기립형 1.03 × 3.66 × 1.38과 대비되는 X축 가로 긴 박스; LeakDetector의 판상형 0.95 × 1.31 × 0.27보다 **약 33배 더 큰** 대형 설치 장비)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'OHU103', status }]`
