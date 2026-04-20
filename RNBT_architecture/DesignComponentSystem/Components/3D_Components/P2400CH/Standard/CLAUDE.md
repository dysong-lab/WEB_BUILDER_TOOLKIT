# P2400CH — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group Node `P2400CH` 아래 세 자식 Mesh(`P300C_004`, `P300C_006`, `P300C_008`)의 material 색상을 일괄 변경

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

- 경로: `models/P2400CH/01_default/P2400CH.gltf`
- meshName: **`P2400CH`** — GLTF 내부 **최상위 Group Node** 이름이 폴더명과 완전히 일치. Group 아래에 `P300C_004`(mesh 0, material `P2400CH` with `textures/P2400CH.jpg`, doubleSided), `P300C_006`(mesh 1, material `dGRAY` baseColorFactor 어두운 회색, roughnessFactor 0.5), `P300C_008`(mesh 2, material `black` baseColorFactor [0.052,0.052,0.052], doubleSided) 세 자식 Mesh가 배치된다. MeshStateMixin은 `getObjectByName('P2400CH')`로 Group을 얻은 뒤 `obj.material`이 없으므로 `obj.traverse(child => applyColor(child))` 경로를 타며, 각 자식 Mesh의 material을 clone하여 color만 치환한다 — **자식 이름을 register에 하드코딩할 필요 없이 Group 이름 하나로 전체 장비를 다룬다**. OutdoorConditioner_Ani(자식 3개를 직접 열거)·Earthquake(자식 2개를 직접 열거)와 다른 "Group-traverse" 패턴이며, 폴더명 = Group Node명 일치라는 구조가 이 단축을 허용한다.
- 구조: `scene → "P2400CH"(Group Node, translation≈0, 3 children)` 아래
  - `P300C_004`(mesh 0, 1 primitive, 1 material, translation [0, 0, +0.07481] — Z축 앞쪽)
  - `P300C_006`(mesh 1, 1 primitive, 1 material, translation [0, 0, -0.000244] — 원점 근처)
  - `P300C_008`(mesh 2, 1 primitive, 1 material, translation [0, -0.000999, +0.003307] — 근소한 Y/Z 오프셋)
- 루트 `scale` 보정 **없음**. Earthquake·OHU103·OutdoorConditioner_Ani의 `root(scale [1000,1000,1000])` 컨테이너 패턴과 대비되는 **원본 유닛 크기 그대로** 로드되는 소수 케이스. 실제 장면 크기도 약 **0.153 × 0.092 × 0.234 단위**의 초소형으로, preview 카메라 far/near 및 grid 사이즈를 이에 맞춰 작게 설정한다(예: far=10, position ≈ 0.5, grid size ≈ 1).
- 정점 속성: 세 Mesh 모두 POSITION/NORMAL/TEXCOORD_0 (OHU103과 동일한 표준 셋; OutdoorConditioner_Ani의 COLOR_0 추가 속성 없음)
  - `P300C_004`: 정점 4 · 인덱스 6 (초저밀도 — 단일 사각형 2 triangle 구성)
  - `P300C_006`: 정점 212 · 인덱스 396 (본 그룹 최대 Mesh, 메인 본체)
  - `P300C_008`: 정점 112 · 인덱스 168 (저밀도 판상)
- 재질: 3개 PBR material
  - `P2400CH` (material 0) — `P300C_004`에 적용, baseColorTexture `textures/P2400CH.jpg`, **doubleSided=true**. 외관 표지판/레이블 판(양면 가시) 용도
  - `dGRAY` (material 1) — `P300C_006`에 적용, baseColorFactor [0.0645, 0.0699, 0.0806, 1.0] 어두운 회색, roughnessFactor 0.5. 본체 메인 케이싱
  - `black` (material 2) — `P300C_008`에 적용, baseColorFactor [0.052, 0.052, 0.052, 1.0] 거의 검정, roughnessFactor 0.5, **doubleSided=true**. 상/전면 블랙 프레임
  - 세 material 이름이 모두 **의미 있는 문자열**(`P2400CH`, `dGRAY`, `black`)이다 — OHU103(`Material #42136`)·OutdoorConditioner_Ani(`Material #42064`/`#42066`)의 3ds Max 숫자 일련번호와 달리 모델러가 수동 명명한 드문 케이스
  - baseColorTexture는 `P2400CH` material만 참조하며 `dGRAY`·`black`은 baseColorFactor(어두운 톤)만 사용
  - MeshStateMixin은 각 child Mesh 단위로 material을 clone 후 color를 setHex로 치환하므로, 세 material의 원본 속성(doubleSided, roughness, factor)은 그대로 유지된 채 color 채널만 일괄 갱신
- 텍스처 폴더: `textures/` (1개 이미지 — `P2400CH.jpg`, OHU103·Earthquake·OutdoorConditioner_Ani 선례와 동일한 `textures/` 규약)
- 구독 데이터 예: `[{ meshName: 'P2400CH', status }]` — 단일 meshName으로 Group 전체 제어
