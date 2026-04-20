# P300C — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group Node `P300C` 아래 세 자식 Mesh(`P300C_01`, `P300C_02`, `P300C_03`)의 material 색상을 일괄 변경

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

- 경로: `models/P300C/01_default/P300C.gltf`
- meshName: **`P300C`** — GLTF 내부 **최상위 Group Node** 이름이 폴더명과 완전히 일치. Group 아래에 `P300C_01`(mesh 0, material `P300C` with `textures/P300C.jpg`, doubleSided), `P300C_02`(mesh 1, material `plastic01` baseColorFactor 밝은 베이지 그레이, roughnessFactor 0.5, metallicRoughnessTexture, doubleSided), `P300C_03`(mesh 2, material `black` baseColorFactor [0.052,0.052,0.052], doubleSided) 세 자식 Mesh가 배치된다. MeshStateMixin은 `getObjectByName('P300C')`로 Group을 얻은 뒤 `obj.material`이 없으므로 `obj.traverse(child => applyColor(child))` 경로를 타며, 각 자식 Mesh의 material을 clone하여 color만 치환한다 — **자식 이름을 register에 하드코딩할 필요 없이 Group 이름 하나로 전체 장비를 다룬다**. OutdoorConditioner_Ani(자식 3개를 직접 열거)·Earthquake(자식 2개를 직접 열거)와 다른 P2400CH와 동일한 "Group-traverse" 패턴이며, 폴더명 = Group Node명 일치라는 구조가 이 단축을 허용한다.
- 구조: `scene → "P300C"(Group Node, translation≈0, 3 children)` 아래
  - `P300C_01`(mesh 0, 1 primitive, 1 material, translation [0, 0, +0.07481] — Z축 앞쪽)
  - `P300C_02`(mesh 1, 1 primitive, 1 material, translation [0, 0, -0.00025] — 원점 근처)
  - `P300C_03`(mesh 2, 1 primitive, 1 material, translation [0, -0.001, +0.003313] — 근소한 Y/Z 오프셋)
- 루트 `scale` 보정 **없음**. Earthquake·OHU103·OutdoorConditioner_Ani의 `root(scale [1000,1000,1000])` 컨테이너 패턴과 대비되는 **원본 유닛 크기 그대로** 로드되는 소수 케이스(P2400CH와 동일). 실제 장면 크기도 약 **0.153 × 0.092 × 0.234 단위**의 초소형으로, preview 카메라 far/near 및 grid 사이즈를 이에 맞춰 작게 설정한다(예: far=10, position ≈ 0.5, grid size ≈ 1).
- 정점 속성: 세 Mesh 모두 POSITION/NORMAL/TEXCOORD_0 (OHU103·P2400CH와 동일한 표준 셋; OutdoorConditioner_Ani의 COLOR_0 추가 속성 없음)
  - `P300C_01`: 정점 4 · 인덱스 6 (초저밀도 — 단일 사각형 2 triangle 구성)
  - `P300C_02`: 정점 212 · 인덱스 396 (본 모듈 최대 Mesh, 메인 본체 케이싱)
  - `P300C_03`: 정점 112 · 인덱스 168 (저밀도 판상, 상/전면 블랙 프레임)
- 재질: 3개 PBR material
  - `P300C` (material 0) — `P300C_01`에 적용, baseColorTexture `textures/P300C.jpg`, **doubleSided=true**. 외관 상단 표지판/레이블 판(양면 가시) 용도
  - `plastic01` (material 1) — `P300C_02`에 적용, baseColorFactor [0.692, 0.661, 0.610, 1.0] **밝은 베이지·그레이** (피부색에 가까운 중간 톤), roughnessFactor 0.5, **metallicRoughnessTexture `textures/TexturesCom_Plastic_Polymer_1K_roughness255.jpg`**, doubleSided=true. 본체 메인 케이싱의 플라스틱 폴리머 질감
  - `black` (material 2) — `P300C_03`에 적용, baseColorFactor [0.052, 0.052, 0.052, 1.0] 거의 검정, roughnessFactor 0.5, doubleSided=true. 상/전면 블랙 프레임
  - **P2400CH와의 차이**: P2400CH의 2번 material `dGRAY` (baseColorFactor [0.0645, 0.0699, 0.0806, 1.0], 어두운 회색 factor만)과 비교해 P300C의 2번 material `plastic01`은 **약 10배 밝은 베이지 톤**이며 **추가로 metallicRoughnessTexture를 참조**한다. P2400CH가 P300C의 "어두운 재색 변형"인 셈
  - 세 material 이름이 모두 **의미 있는 문자열**(`P300C`, `plastic01`, `black`)이다 — OHU103(`Material #42136`)·OutdoorConditioner_Ani(`Material #42064`/`#42066`)의 3ds Max 숫자 일련번호와 달리 모델러가 수동 명명한 케이스
  - baseColorTexture는 `P300C` material만 참조하며, `plastic01`은 metallicRoughnessTexture만, `black`은 baseColorFactor만 사용
  - MeshStateMixin은 각 child Mesh 단위로 material을 clone 후 color를 setHex로 치환하므로, 세 material의 원본 속성(doubleSided, roughness, factor, metallicRoughnessTexture)은 그대로 유지된 채 color 채널만 일괄 갱신
- 텍스처 폴더: `textures/` (3개 이미지 — `P300C.jpg`, `TexturesCom_Plastic_Polymer_1K_roughness.jpg`, `TexturesCom_Plastic_Polymer_1K_roughness255.jpg`. GLTF는 후자 두 개 중 `..._roughness255.jpg`만 실제 참조; P2400CH는 텍스처 1개만 가진 것과 대비)
- 구독 데이터 예: `[{ meshName: 'P300C', status }]` — 단일 meshName으로 Group 전체 제어
