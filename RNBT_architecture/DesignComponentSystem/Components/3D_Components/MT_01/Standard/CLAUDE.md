# MT_01 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `MT-M1` Mesh의 단일 material(`Material #342540102`) 색상을 변경

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

- 경로: `models/MT_01/01_default/MT_01.gltf`
- meshName: **`MT-M1`** — 폴더명은 `MT_01`(언더스코어 + 2자리 장비 번호)이지만 GLTF 내부 Node/Mesh 이름은 `MT-M1`(하이픈 + Mesh 접두 `M` + 1자리 숫자)로 **폴더-Node 형태 불일치형**이다. `getObjectByName`은 이름을 그대로 비교하므로 반드시 하이픈을 사용한 `'MT-M1'`로 조회해야 한다. LV_BAT(`LV-BAT1`)·LV_R(`LV-2R1`)과 동일한 축의 불일치 패턴이며, FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의 "이름 일치형"과 대비된다.
- 구조: `scene → "MT-M1"(mesh 0, rotation=[0,-1,0,4.371139e-08])` — 단일 Node, 단일 Mesh. 루트 스케일 노드 없음 (LV_BAT, LV_2P_02/09/10/11과 동일 패턴; LithiumionBattery의 `root(scale 1000) → Mesh` 2층 구조와 대비). Node rotation은 Y축 180° (Babylon.js 3ds Max exporter 좌표계 변환).
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 26, 인덱스 48 — 본 저장소 개별 3D 컴포넌트 중 매우 적은 편, 단순화된 블록 지오메트리)
- 재질: 1개 PBR material
  - `Material #342540102` (material 0) — baseColorTexture `maps/MT.jpg`
  - metallicFactor 0.0, roughnessFactor **0.0**, doubleSided `true` (LV_BAT와 동일한 babylon.js 3ds Max exporter 출력 패턴; `[0, 1]` 범위 내 경계값으로 LeakDetector·FLIREx의 Babylon exporter 범위 이탈 값 -90.47056과는 구분되는 "경계 정상값")
  - MeshStateMixin은 `material.color` 채널만 갱신하므로 roughness/metallic 값과 독립적으로 색상 치환 동작
- 텍스처 폴더: `maps/` (LV_BAT·LV_01~02·LV_1P_01~07·LV_2P_01~11·HV_1P_01 선례와 동일; Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery·MCCB의 `textures/` 규약과 대비). 파일명 `MT.jpg`는 장비 번호 접미 없는 기본명으로, 동일 계열(`MT_02`, `MT_03` 등) 추가 시 공유될 가능성이 있다.
- 좌표 바운드(루트 스케일 없음): [-1.8499999, -1.85944676, -1.5] ~ [1.8499999, 1.85944676, 1.5]
- 실제 장면 크기: 약 **3.70 × 3.72 × 3.00 단위** (정사각 기둥에 가까운 직육면체; 본 저장소 개별 3D 컴포넌트 중 중형 블록형 — LV_BAT 0.8 × 2.95 × 2.2의 판상형, MCCB 0.10 × 0.09 × 0.20의 소형 원시 좌표형과 구분)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다 (LV_BAT·LithiumionBattery와 동일 경로; MCCB의 Group traverse 경로, LeakDetector의 배열 material 경로와 대비).
- 구독 데이터 예: `[{ meshName: 'MT-M1', status }]` (하이픈)
