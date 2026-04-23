# STATCOM_MMC — Advanced/pipeFlow

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽 수신 → 다수 Mesh material.color 변경 (Standard와 동일)
2. **파이프 유체 흐름 시각화** — 파이프 mesh의 `baseColorTexture`를 UV 오프셋 누적으로 스크롤하여 흐르는 물을 표현
   - Flow01(`Water_Blue`, 냉각수 공급), Flow02(`Water_Red`, 귀환)

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 pipeFlow API (신규 Mixin 없음)

### 파이프 mesh 자동 탐지 규칙

컨테이너 원칙상 meshName 하드코딩을 피한다. 아래 두 조건을 동시에 만족하는 mesh만 대상.

1. `mesh.name`에 `_Flow` 부분 문자열 포함
2. `mesh.material.map` (baseColorTexture) 존재

현 GLTF 매칭: `STATCOM_MMC_1257_Flow01`, `STATCOM_MMC_1258_Flow02`

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 커스텀 네임스페이스 `this.pipeFlow`

| 메서드 | 동작 |
|--------|------|
| `start()` | 자동 탐지 → `RepeatWrapping` 설정 → RAF 루프 시작 |
| `stop()` | RAF 루프 정지 (상태는 유지) |
| `setSpeed(meshName, { u, v })` | 개별 mesh의 축별 속도(UV/sec) 조정 |
| `getMeshNames()` | 탐지된 파이프 mesh 이름 배열 |
| `destroy()` | RAF 정리 + wrapS/wrapT + offset 원복 |

### 기본 속도 (UV/sec)

| mesh | u | v |
|------|---|---|
| `STATCOM_MMC_1257_Flow01` (Blue, 공급) | 0 | +0.25 |
| `STATCOM_MMC_1258_Flow02` (Red, 귀환)  | 0 | -0.25 |

기본값에 없는 mesh는 `{ u: 0, v: 0.25 }` 적용.

**축 선택 근거**: 현재 GLTF의 Water 텍스처(`STATCOM_Water_Blue.jpg`, `STATCOM_Water_red.jpg`)가 좌우로 균일하고 상하로 명암이 변하는 가로 그라디언트라 v축 스크롤에서만 시각적 움직임이 관찰된다. 향후 텍스처를 반복 패턴으로 교체하면 u축도 활용 가능.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### customEvents

없음. 클릭 상호작용 없음.

### resolveMeshName

없음. 본 변형은 Mesh 클릭 처리를 하지 않는다.

### 라이프사이클

- `register.js`는 API만 등록한다. **자동 `start()` 호출하지 않음** (AnimationMixin과 동일 규약)
- 페이지 `loaded.js` 또는 호스트 코드에서 `instance.pipeFlow.start()` 호출로 구동

### 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| pipeFlow (커스텀) | material.map.offset (UV) | 유체 흐름 연출 |

color와 offset은 완전 직교 — 서로 간섭 없음. 상태 색상과 UV 스크롤이 동시 적용 가능.

### 모델 주의사항

대상 mesh의 material에 `baseColorTexture`가 없으면 `start()`는 no-op로 동작한다 (탐지에서 제외). `getMeshNames()`로 런타임에 확인 가능.
