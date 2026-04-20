# Marker_AICCTV — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `MarkerAICCTV_A` Mesh의 단일 material(`Material #30`) 색상을 변경

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

- 경로: `models/Marker_AICCTV/01_default/Marker_AICCTV.gltf`
- meshName: **`MarkerAICCTV_A`** — 폴더명은 `Marker_AICCTV`(카멜케이스 + 중간 언더스코어)이지만 GLTF 내부 Node/Mesh 이름은 `MarkerAICCTV_A`(중간 언더스코어 제거 + 뒤쪽 `_A` 접미)로 **구분자 위치 + 접미 불일치**다. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerAICCTV_A'`(언더스코어 + A)로 조회해야 한다. LV_BAT(`LV-BAT1`)·LV_R(`LV-2R1`)·MT_01(`MT-M1`)과 동일한 축의 불일치 패턴이며, FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의 "이름 일치형" 및 LithiumionBattery의 "순수 대소문자 차이"와도 대비된다.
- 구조: `scene → root(scale [1000,1000,1000]) → "MarkerAICCTV_A"(mesh 0, translation [0, 0, -0.00010015742])` — 단일 Mesh Node × 단일 primitive × 단일 material. LithiumionBattery의 `root(scale 1000) → Mesh` 2층 구조와 동일한 패턴 (LV_BAT·MT_01·LV_2P_02/09/10/11의 "루트 스케일 없음" 1층 구조와 대비). 자식 Node translation Z `-0.00010015742`는 판 두께(±0.000100158)의 절반으로 3ds Max pivot 오프셋.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 60, 인덱스 60, 1:1 비율 — 인덱스 재사용이 거의 없는 저복잡도 판 구조; 본 저장소 개별 3D 컴포넌트 중 마커에 어울리는 매우 적은 정점 수)
- 재질: 1개 PBR material
  - `Material #30` (material 0) — baseColorTexture `textures/MarkerAICCTV_A.png`
  - metallicFactor 0.0, roughnessFactor **0.450053632** (**정상 범위값** — LeakDetector·FLIREx의 Babylon exporter 범위 이탈 값 `-90.47056`이나 MT_01·LV_BAT의 경계값 `0.0`과 달리 PBR 사양 `[0, 1]` 범위 내 자연스러운 중간값; LithiumionBattery의 0.5·MCCB의 0.5 계열에 가까움)
  - Material id `#30`은 LV 계열(`#342540XXX`)·MT_01(`#342540102`)과 전혀 다른 낮은 번호대 — 3ds Max 소스 파일에서 독립적으로 정의된 마커 전용 material slot
  - MeshStateMixin은 `material.color`만 갱신하므로 roughness/metallic 값과 독립적으로 색상 치환 동작
- 텍스처 폴더: `textures/` (Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery 선례와 동일; LV·MT 계열의 `maps/` 규약과 대비). 텍스처 파일명 `MarkerAICCTV_A.png`는 Node/Mesh 이름과 정확히 일치하며, **PNG 포맷**은 JPG를 쓰는 LithiumionBattery·MT_01과 달리 알파 채널을 활용 가능 (마커 아이콘 배경 투명도).
- 좌표 바운드(루트 스케일 적용 전): [-0.0029696722, -0.00342908176, -0.000100158271] ~ [0.0029696722, 0.00342908176, 0.000100158279]
- 실제 장면 크기: 루트 `scale [1000, 1000, 1000]` 적용 후 약 **5.94 × 6.86 × 0.20 단위** (극단적 판상형 — X·Y는 수 단위인데 Z가 0.2 단위로 약 30배 얇음; 본 저장소 마커 컴포넌트 대표 비율. LithiumionBattery의 434 × 228 × 108의 1/75 스케일, MT_01의 3.70 × 3.72 × 3.00 입방에 가까운 블록형과 대비)
- 단일 material 단일 primitive이므로 MeshStateMixin의 "배열 material 지원" 경로가 아니라 **단일 material 경로**로 동작 — Mesh의 `material`이 객체이므로 clone 후 color를 직접 적용한다 (LithiumionBattery·MT_01·LV_BAT와 동일 경로; MCCB의 Group traverse 경로, LeakDetector의 배열 material 경로와 대비).
- 구독 데이터 예: `[{ meshName: 'MarkerAICCTV_A', status }]` (언더스코어 + A)
