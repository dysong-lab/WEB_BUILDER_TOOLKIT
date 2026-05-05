# Chiller — Advanced/fluidFlow

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'chiller' Mesh 색상 변경 (Standard와 동일)
2. **냉매 배관 파티클 흐름 시각화** — Chiller 외부 배관 경로(설계 좌표 또는 모델 작가가 제공한 path)를 따라 Three.js Points 파티클이 일정 속도로 진행 → 흐름이 시각적으로 관찰됨
3. **다중 배관 동시 시각화** — 공급/귀환 등 여러 배관 경로(pathName 키)를 등록하여 각각 색상·속도·파티클 수를 독립 제어
4. **외부 명령형 API** — `start/stop/setSpeed/setColor` 호출로 페이지가 직접 제어 (구독 토픽 없음 — `pipeFlow`/`dynamicRpm`과 동일한 외부 명령형 패턴)

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 `this.fluidFlow` API (신규 Mixin 없음 — 본 사이클은 커스텀 메서드로 완결)

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 커스텀 네임스페이스 `this.fluidFlow`

| 메서드 | 동작 |
|--------|------|
| `addPipe(pathName, points, options)` | 배관 경로 등록. `points`: `THREE.Vector3` 배열(또는 `{x,y,z}` 배열). `options`: `{ color = 0x60a5fa, particleCount = 60, speed = 0.4, size = 0.05 }`. 동일 pathName 재호출 시 기존 path 교체(이전 자원 dispose) |
| `start(pathName)` | 등록된 path의 파티클 `Points`를 `appendElement`(또는 page가 주입한 `_fluidFlowParent`)에 add. RAF 루프 시작. 동일 pathName 중복 호출은 no-op |
| `stop(pathName)` | RAF 정지(활성 path가 모두 사라지면) + `Points.visible = false`. 자원은 유지(재시작 가능) |
| `setSpeed(pathName, speed)` | path의 파티클 진행 속도(path 길이/sec) 변경 |
| `setColor(pathName, color)` | path의 PointsMaterial color 변경 (`THREE.Color`로 set) |
| `setParticleCount(pathName, count)` | 파티클 개수 변경. 내부적으로 BufferGeometry/PointsMaterial 재생성 |
| `getPipeNames()` | 현재 등록된 pathName 배열 반환 (시그니처 일관성을 위해 `pipeFlow`/`dynamicRpm`의 `getMeshNames` 동사 패턴을 그대로 따름. 의미는 path name) |
| `destroy()` | 모든 RAF cancel + 모든 Points의 geometry/material dispose + scene/parent에서 remove + 마지막 줄 `this.fluidFlow = null` (self-null) |

### 파티클 시스템 설계

내부 구현 핵심:

```
// path 전처리
totalLength = sum( |points[i+1] - points[i]| )                    // 전체 path 길이
segLengths  = [ |points[1]-points[0]|, ... ]                     // 세그먼트별 길이 (보간 시 binary search)
cumLengths  = [ 0, segLengths[0], segLengths[0]+segLengths[1], ... ]  // 누적 길이

// 파티클 초기화
positions = Float32Array(particleCount * 3)
progress  = Float32Array(particleCount)                          // 0~totalLength
i in [0, count) → progress[i] = (totalLength * i) / count        // 균등 배치

// RAF tick
dt = (now - lastTime) / 1000
forEach particle i:
    progress[i] = (progress[i] + speed * totalLength * dt) % totalLength
    pos = lerpAlongPath(progress[i], points, cumLengths)
    positions[i*3..i*3+2] = pos.xyz
geometry.attributes.position.needsUpdate = true
```

- `THREE.BufferGeometry` + `Float32Array` 위치 버퍼
- `THREE.PointsMaterial` (`size`, `color`, `transparent: true`, `opacity: 0.9`, `depthWrite: false`)
- `THREE.Points` 객체 1개 = 1 path
- 모든 path가 stop 상태이면 RAF 자체를 정지(누적 부하 0)

### 데모 기본 path (모델 도착 전 시각적 관찰 가능성 확보)

모델 작가가 실제 배관 좌표를 제공하기 전까지 preview에서 흐름이 즉시 관찰되도록 데모 path 1개를 코드에 하드코딩한다. ㄷ자(rectangle U) 형태로 6개 정점:

```
(-1.0, 0.5, -1.0) → (-1.0, 0.5, +1.0) → (+1.0, 0.5, +1.0) → (+1.0, 0.5, -1.0) → ( 1.0, 0.5, -1.0) → (-1.0, 0.5, -1.0)
```

운영 환경에서는 페이지가 `addPipe(pathName, points, options)`로 실제 배관 좌표를 등록한다.

> **[MODEL_READY]**: Chiller 모델의 실제 외부 배관 경로 좌표가 모델 작가로부터 제공되면 데모 path 좌표를 교체한다. `register.js` 내부 `DEMO_PATH_POINTS` 상수가 단일 교체 지점이며, `grep -r "MODEL_READY" Chiller/Advanced/fluidFlow/`로 전수 추적 가능.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

배관 흐름 자체는 별도 구독 토픽 없이 페이지가 직접 `instance.fluidFlow.start/setSpeed/setColor`를 호출하는 외부 명령형 패턴 (`pipeFlow`/`dynamicRpm`과 동일).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='chiller' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요. 클릭 상호작용 없음.

### 라이프사이클

- `register.js`는 API + 데모 path 1개(`'demo'`)를 자동 `addPipe`까지만 수행한다. **자동 `start()` 호출하지 않음** (`pipeFlow`/`dynamicRpm`과 동일 규약)
- 페이지 `loaded.js` 또는 호스트 코드에서 `instance.fluidFlow.start('demo')` 또는 `addPipe(...)` + `start(...)` 호출로 구동
- preview에서는 모델 로드 직후 데모 path를 `start`하여 시각 관찰 보장

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/fluidFlow |
|------|----------|--------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.fluidFlow` 네임스페이스 | 없음 | `addPipe/start/stop/setSpeed/setColor/setParticleCount/getPipeNames/destroy` 노출 |
| Three.js BufferGeometry/PointsMaterial 자원 | 없음 | path 단위 생성/dispose |
| RAF 루프 | 없음 | fluidFlow 자체 관리 (활성 path 0개 시 정지) |
| beforeDestroy | meshState만 정리 | fluidFlow → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/fluidFlow는 추가로 (a) BufferGeometry 위치 버퍼, (b) PointsMaterial color/size, (c) RAF 누적 progress 진행 — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 정의 + GPU/CPU 자원 정리가 모두 추가되므로 별도 폴더로 분리한다.

---

## dynamicRpm / pipeFlow와의 기법 차이

`pipeFlow`(STATCOM_MMC) — UV 텍스처 누적 스크롤 방식:
- 자원: `material.map.offset` mutation
- 정리: `wrapS/wrapT/offset` 원복
- 관찰 조건: 텍스처에 반복 가능한 그라디언트 존재

`fluidFlow`(Chiller) — Three.js Points 파티클 시스템 방식:
- 자원: `BufferGeometry`(Float32Array 위치 버퍼) + `PointsMaterial` + `Points` 객체
- 정리: `geometry.dispose()` + `material.dispose()` + parent에서 `remove()`
- 관찰 조건: path 좌표만 있으면 텍스처 무관하게 동작

기법이 다르므로 `ADVANCED_QUEUE.md` "3차 — 같은 기능이라도 기법이 다르면 통합하지 않는다" 규칙에 따라 **별도 이름 · 별도 구현**을 유지한다. 텍스처 매핑된 파이프 mesh가 GLTF에 존재하면 `pipeFlow`를, 외부 좌표 path만 있으면 `fluidFlow`를 사용.

`dynamicRpm`(Chiller) — AnimationMixin timeScale 제어 방식:
- 자원: AnimationMixin이 mixer 본체 보유, dynamicRpm은 setSpeed 경유 + lerp RAF만
- fluidFlow는 AnimationMixin을 사용하지 않으며 자체 RAF에서 위치 버퍼를 직접 mutate

---

## 두 채널 공존

| Mixin / API | 채널 | 용도 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 표현 |
| fluidFlow (커스텀) | 별도 `Points` 객체(`BufferGeometry.position` mutation) | 배관 흐름 시각화 |

color는 'chiller' Mesh의 material에 적용되고 fluidFlow는 별도 `Points` 객체이므로 두 채널은 완전 직교 — 서로 간섭 없음.

---

## 모델 주의사항

- `models/Chiller/01_default/Chiller.gltf`의 외부 배관 path는 모델 작가가 별도 좌표 데이터로 제공해야 한다. 본 변형은 좌표를 외부에서 받는 패턴.
- 데모 path는 `register.js`에 ㄷ자 형태로 하드코딩되어 있어 모델 도착 전에도 preview에서 시각 관찰 가능.
- `appendElement`(GLTF 루트)가 비어있으면 fluidFlow는 fallback으로 page가 주입한 `instance._fluidFlowParent`(scene)에 add한다 — preview에서 활용.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.fluidFlow = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.fluidFlow?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachFluidFlow(inst)` 내부 destroy도 `inst.fluidFlow = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `start/stop/setXxx/getPipeNames/destroy` (`pipeFlow`/`dynamicRpm`과 동사 일관) |
| 6 | UI ↔ API 인자 축 일치 | OK — speed 슬라이더↔`setSpeed`, count↔`setParticleCount`, color picker↔`setColor` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview는 모델 로드 직후 데모 path를 start하여 흐름 즉시 관찰 가능 |
| 8 | manifest + Chiller/CLAUDE.md 등록 | OK (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보**: fluidFlow — BATT/Inverter/PCS 등 배관 흐름 시각화 공통 적용 가능. 본 사이클은 `ADVANCED_QUEUE.md` "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 커스텀 메서드로 완결. 2번째 컴포넌트 등록 시점(BATT chargeFlowArrow, Inverter powerFlowIndicator 등)에 `FluidFlowMixin`(또는 `PathParticleFlowMixin`) 승격 검토 필요. 큐 정의에 "신규 Mixin: FluidFlowMixin"으로 적혀있으나 1차 컴포넌트는 수동 결정으로 커스텀 메서드 유지.
- **데모 path 좌표 [MODEL_READY]**: 실제 배관 좌표 미정. ㄷ자 데모 path로 시각 관찰만 보장. 모델 도착 시 `DEMO_PATH_POINTS` 상수 1곳만 교체하면 운영 좌표 반영.
