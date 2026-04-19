# MCCB — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 루트 Group `MCCB`의 3개 자식 Mesh(`Object299`·`Object300`·`Rectangle180`)의 material(GRAY / MCCB / WHITE) 색상을 일괄 변경

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

- 경로: `models/MCCB/01_default/MCCB.gltf`
- meshName: **`MCCB`** — 루트 Group 노드를 단일 타겟으로 사용. Group은 자체 `material`이 없으므로 MeshStateMixin은 `traverse`로 자식 Mesh들을 순회하여 material 색상을 일괄 적용한다. 자식 Mesh 이름(`Object299`, `Object300`, `Rectangle180`)은 3ds Max 기본 네이밍이며 의미를 담지 않으므로 페이지가 직접 참조하지 않는다. Earthquake의 "개별 자식 2-Mesh 나열"(`['Earthquake', 'Earthquake_A']`)과 대비되는 "루트 Group 1-항목 타겟" 패턴.
- 구조:
  ```
  scene → "MCCB"(Group)
           ├── "Object299"(mesh 0, material 0=GRAY)          — 케이스 본체
           ├── "Object300"(mesh 1, material 1=MCCB, texture)  — 라벨 데칼 (alphaMode BLEND, doubleSided)
           └── "Rectangle180"(mesh 2, material 2=WHITE)       — 토글 스위치/레버
  ```
- 정점/인덱스: Object299(160 / 330), Object300(60 / 114), Rectangle180(132 / 228) — 각 1 primitive, 총 3 primitive.
- 자식 노드 변환: 각 자식에 Z축 약 90° 회전(quaternion `[0.7071, 0, 0, 0.7071]`)이 적용되어 있다. `Object300`·`Rectangle180`은 소량 translation으로 본체 위 라벨/레버 위치 지정. 루트 `MCCB`에는 `scale`이 없음.
- 재질: 3개 PBR material
  - `GRAY` (material 0) — baseColorFactor `[0.166, 0.166, 0.166, 1.0]`, roughnessFactor 0.5 (정상 범위값)
  - `MCCB` (material 1) — baseColorTexture `textures/MCCB.png`, alphaMode `BLEND`, doubleSided `true`
  - `WHITE` (material 2) — baseColorFactor `[0.744, 0.744, 0.744, 1.0]`, roughnessFactor 0.5
- 색상 치환 경로: MeshStateMixin은 Group 대상에 대해 traverse로 내려가 각 자식 Mesh의 `material`을 clone 후 `color.setHex`를 호출한다. 3개 자식 material이 모두 단일 객체(배열 아님)이므로 **객체 material 단일 경로**로 각각 처리된다. `Object300`의 baseColorTexture는 유지되고 그 위에 color 승수만 적용된다 — 라벨 글자는 유지되고 배경 톤이 상태 색으로 변한다.
- 텍스처 폴더: `textures/` (Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery 선례와 동일)
- 좌표 바운드(루트 스케일 없음):
  - `Object299`: [-0.052, -0.045, -0.099] ~ [0.052, 0.045, 0.099]
  - `Object300`: [-0.052, -0.007, -0.098] ~ [0.052, 0.007, 0.098]
  - `Rectangle180`: [-0.052, -0.008, -0.055] ~ [0.052, 0.008, 0.055]
- 실제 장면 크기: 원시 좌표 약 **0.10 × 0.09 × 0.20 단위** (루트 scale 없음; LithiumionBattery·Earthquake의 scale 1000 적용형과 대비되는 소형 원시 좌표형)
- 구독 데이터 예: `[{ meshName: 'MCCB', status }]` — 단일 항목으로 3개 자식 일괄 제어
