# MetalSphere — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `metal001` Mesh의 단일 material(`Material #14`) 색상을 변경

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

- 경로: `models/MetalSphere/01_default/MetalSphere.gltf`
- meshName: **`metal001`** — 폴더명 `MetalSphere`(카멜케이스)와 GLTF 내부 Node/Mesh 이름 `metal001`(소문자 + 3자리 숫자)이 **명명 체계 자체가 완전히 다르다**. LithiumionBattery의 순수 대소문자 차이(`LithiumionBattery` → `Lithiumionbattery`)보다 더 강한 불일치이며, Node 이름이 텍스처 파일명(`metal001.jpg`) 및 material 이름과 연관된 3ds Max 재질 라이브러리 이름으로 명명된 것으로 추정된다. `getObjectByName`은 대소문자를 구분하므로 반드시 `'metal001'`로 조회해야 한다. (MeetingSofa·ArmChair·MetalDetector의 "이름 일치형" 규약과 대비)
- 구조: `scene → root(scale [1000,1000,1000]) → "metal001"(mesh 0, 1 primitive, 1 material)` — 단일 Mesh Node × 단일 primitive × 단일 material. Mesh Node에 `rotation [-0.7071068, 0, 0, 0.7071067]`(**X축 -90도 회전** 쿼터니언)이 설정되어 있다 — MeetingSofa의 Y축 -90도 회전과 축이 다른 회전으로, 3ds Max의 Z-up → glTF Y-up 좌표계 보정(Y↔Z 축 교체)에 해당한다. 다만 Mesh가 대칭적인 구(sphere)이므로 회전이 시각적으로 드러나지 않는다. LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector와 동일한 가장 단순한 구조.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 559, 인덱스 2880, 단일 primitive). **인덱스 수(2880)가 정점 수(559)의 약 5.15배**로 인덱스 재사용이 활발한 닫힌 구 지오메트리의 전형 (MetalDetector의 정점 수 = 인덱스 수 930과 대비되는 구조). 구의 위/경도 분할(약 20×24 세그먼트 규모)을 시사.
- 재질: 1개 PBR material
  - `Material #14` (material 0) — baseColorTexture `textures/metal001.jpg`
  - 이름이 3ds Max 숫자 일련번호 형식(`Material #NN`) — MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`·MetalDetector의 `Material #29`와 동일한 명명 패턴이며, 숫자 자릿수가 2자리로 MetalDetector와 동일하게 짧음(3ds Max 서로 다른 세션에서 채번된 결과). MeshStateMixin은 `material.color`만 참조하므로 material 이름 형식과 무관하게 색상 치환 동작.
  - metallicFactor 0.0, roughnessFactor 0.450053632 (**정상 범위값** — MeetingSofa·ArmChair·MetalDetector와 완전히 동일 수치; LeakDetector·FLIREx의 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(-90.47056)와 대비)
  - 구(sphere)임에도 metallicFactor 0.0으로 텍스처 맵(`metal001.jpg`)에 시각 표현을 위임. MeshStateMixin은 `material.color`만 갱신하므로 metallic/roughness 값과 독립적으로 색상 치환 동작.
- 텍스처 폴더: `textures/` (ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector 선례와 동일)
- 좌표 바운드(루트 스케일 적용 전): [-0.02500001, -0.0249999985, -0.0249999985] ~ [0.0249999855, 0.0249999985, 0.0249999985] — 완벽한 **정육면체 바운드**(±0.025 모든 축 동일)
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **50 × 50 × 50 단위** (반지름 약 25 단위의 구). 바운드가 정육면체이므로 X축 -90도 회전 후에도 월드 바운드는 동일하게 50 × 50 × 50을 유지 — MeetingSofa의 Y축 회전에 의한 축 교체와 달리 시각적으로 동일.
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다.
- 구독 데이터 예: `[{ meshName: 'metal001', status }]` (소문자 + 숫자)
