# PCS — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 Mesh Node `PCS`의 material 색상 변경

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

- 경로: `models/PCS/01_default/PCS.gltf`
- meshName: **`PCS`** — GLTF **단일 Mesh Node** 이름이 폴더명과 완전히 일치. `root`(scale [1000, 1000, 1000])의 유일한 자식이며 mesh 이름·material 이름도 모두 `PCS`로 동일 — **4-이름 일치형** 규약. MeshStateMixin은 `getObjectByName('PCS')`로 단일 Mesh를 반환받은 뒤 `obj.isMesh`가 true이므로 Mesh 브랜치로 직진, `obj.material`을 clone한 뒤 color만 setHex로 치환한다. P300C·P2400CH의 "Group-traverse" 패턴이나 Earthquake의 "자식 이름 열거" 패턴과 달리, 이름 하나로 Mesh 하나를 직접 가리키는 **단일-Mesh 개별 단위**의 가장 단순한 형태.
- 구조: `scene → root(Node, scale [1000, 1000, 1000], children [1]) → "PCS"(Mesh Node, mesh 0, 1 primitive, 1 material)`
- **루트 `scale [1000, 1000, 1000]` 적용**. Earthquake·OHU103·ElecPad의 `root(scale 1000)` 컨테이너 패턴과 동일한 "원본 미리미터 → 장면 단위" 변환 케이스. P300C·P2400CH의 "root scale 없음 → 초소형 0.15 단위" 케이스와 대비. 실제 장면 크기도 약 **20.3 × 22.8 × 12.6 단위**의 중소형으로, preview 카메라 far/near 및 grid 사이즈를 Earthquake 선례와 동일한 "far=100, position ≈ 2~3, grid size=10" 패턴으로 구성한다.
- 정점 속성: POSITION/NORMAL/TEXCOORD_0 (표준 셋; COLOR_0 없음 — OHU103·P2400CH·P300C와 동일한 표준 패턴, OutdoorConditioner_Ani의 COLOR_0 추가 속성 없음)
  - 정점 680 · 인덱스 1320 (재사용 비율 약 1.94배 — 서브박스 집합체의 중밀도)
  - 단일 primitive에 1개 material만 참조 (서브메시 분할 없음)
  - 원본 바운드: X ≈ ±0.0102, Y ≈ ±0.0114, Z ≈ ±0.0063 — Y축 주축(세로로 약간 긴 박스), root scale 1000 적용 후 약 20 × 23 × 13 단위
- 재질: 1개 PBR material `PCS`
  - baseColorTexture `textures/1FS090.jpg` (단일 텍스처, PCS 폴더 안의 유일한 이미지)
  - `metallicFactor` 0.2 (약한 금속감)
  - `roughnessFactor` 0.5 (중간 거칠기)
  - **doubleSided 속성 미지정** (암묵적 false = single-sided) — P300C·P2400CH의 세 material이 모두 `doubleSided=true`였던 것과 대비되는 single-sided 패턴
  - extras: `babylonSeparateCullingPass: false` (babylon.js exporter 확장, 런타임 three.js에서는 무시됨)
  - **P300C와의 차이**: P300C가 세 material(`P300C`/`plastic01`/`black`)을 자식 Mesh별로 분리 적용한 것과 달리 PCS는 **단일 material**만 보유. P300C의 `P300C` material(baseColorTexture + doubleSided)과 비교하면 doubleSided 선언 없고 metallicFactor 명시(0.2)
  - material 이름이 mesh·Node·폴더 이름과 동일(`PCS`)한 **자기-지시적 명명** — OHU103(`Material #42136`)·OutdoorConditioner_Ani(`Material #42064`)의 3ds Max 숫자 일련번호 규약과 달리 모델러가 장비 코드를 그대로 전파한 케이스
  - baseColorFactor/emissiveFactor 오버라이드 없이 **순수 텍스처 기반 셰이딩**
  - MeshStateMixin은 material을 clone 후 color만 setHex로 치환하므로 원본 속성(baseColorTexture 경로, metallicFactor, roughnessFactor, extras)은 모두 그대로 유지된 채 color 채널만 상태색으로 갱신
- 텍스처 폴더: `textures/` (1개 이미지 — `1FS090.jpg`; 텍스처 파일명은 mesh·material 이름(`PCS`)과 별개로 텍스처 자산 원본명 `1FS090`을 유지)
- 구독 데이터 예: `[{ meshName: 'PCS', status }]` — 단일 meshName으로 단일 Mesh 제어
