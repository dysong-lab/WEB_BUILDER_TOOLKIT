# LeakDetector — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LeakDetector` Mesh의 두 material(leakEtc, winBody) 색상을 일괄 변경

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

- 경로: `models/LeakDetector/01_default/LeakDetector.gltf`
- meshName: **`LeakDetector`** — GLTF 내부 Node/Mesh 이름이 폴더명과 동일하다 (FLIREx·ExitSign·ElecPad·Earthquake와 같은 "이름 일치형"; LV_R의 `LV-2R1`·LV_BAT의 `LV-BAT1` 같은 "폴더-Node 불일치형"과 대비). `getObjectByName('LeakDetector')`로 Mesh를 얻는다.
- 구조: `scene → root(scale [1000,1000,1000]) → "LeakDetector"(mesh 0)` — 단일 Mesh Node. Earthquake가 2개의 별도 Mesh Node(Earthquake, Earthquake_A)를 갖는 "2-Mesh Group"과 달리, LeakDetector는 Mesh Node가 하나뿐이고 그 Mesh가 **2 primitive × 2 material**(multi-material submeshes)를 가진다.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 1784, 인덱스 합 11592 — primitive 0: 4542, primitive 1: 7050). LV 계열(정점 46)보다 약 39배 많은 정점 규모.
- 재질: 2개 PBR material
  - `leakEtc` (material 0) — baseColorTexture `textures/leakEtc.jpg` (센서 본체·감지부)
  - `winBody` (material 1) — baseColorTexture `textures/winBody.jpg` (투명창·윈도우 바디)
  - 공통: metallicFactor 0.0, roughnessFactor -90.47056 (Babylon.js glTF exporter 원본값; Three.js PBR에서 실질 roughness=0으로 clamp됨 — color 채널만 갱신하는 MeshStateMixin과 무관)
  - 공통: doubleSided=true
- 텍스처 폴더: `textures/` (Earthquake·FLIREx·ExitSign·ElecPad 선례와 동일; LV 계열의 `maps/` 규약과 대비)
- 좌표 바운드(루트 스케일 적용 전): 약 [-0.000475, -0.000644, -0.000136] ~ [0.000475, 0.000666, 0.000134]
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **0.95 × 1.31 × 0.27 단위** (얇고 길쭉한 판상형)
- MeshStateMixin의 **배열 material 지원**에 의존한다 — Mesh의 `material`이 `[leakEtcMat, winBodyMat]` 배열이므로 각 material을 clone한 뒤 두 서브메시 색상이 동일하게 갱신된다.
- 구독 데이터 예: `[{ meshName: 'LeakDetector', status }]`
