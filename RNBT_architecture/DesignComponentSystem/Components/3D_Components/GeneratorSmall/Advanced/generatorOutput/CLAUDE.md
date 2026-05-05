# GeneratorSmall — Advanced/generatorOutput

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'Generator' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **출력 kW 3D 바그래프 실시간 시각화** — Generator mesh 옆 3D 공간에 동적 생성한 BoxGeometry mesh(`bar`)의 `scale.y`를 출력 kW에 비례하여 조정. 운영자가 모델을 회전·줌해도 바가 발전기에 부착되어 함께 따라온다 (`appendElement`의 자식으로 add). 바 색상은 kW 임계값에 따라 녹색/황색/적색 임계 매핑 (#42 Generator/generatorOutput 답습)
3. **출력 kW 3D 라벨 HUD** — Generator mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 **출력(kW)·부하율(%)·상태** 수치를 실시간 표시 (#41 OHU103 + #42 Generator HUD 패턴 답습)
4. **외부 명령형 API** — 페이지가 `instance.generatorOutput.setOutput(kw)/setMaxKw(maxKw)/setThresholds({warning, critical})/setData({...})/start/stop/destroy/...`를 직접 호출하여 바그래프와 HUD를 갱신

---

## GeneratorSmall mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/GeneratorSmall/01_default/GeneratorSmall.gltf` |
| GLTF 구조 | `root`(scale 1000) → 단일 Mesh `Generator` (자식 1개) |
| 추적 대상 mesh 이름 | `Generator` (단일 Mesh; HUD 좌표 / 바 부착 모두 동일) |
| 결정 | **단일 Mesh 추적** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. MeshStateMixin은 `getObjectByName('Generator')`로 단일 Mesh를 찾고 material 색상을 직접 변경한다(MeshStateMixin.js의 Mesh 단독 경로). 본 변형의 바그래프 mesh와 HUD 추적도 동일하게 `getObjectByName('Generator')`로 Mesh를 조회하고 (a) Mesh의 자식으로 BoxGeometry bar를 add (회전·이동 시 함께 따라옴), (b) Mesh의 월드 좌표로 HUD 카드 위치 계산.

> **#42 Generator(대형)와의 구조 차이**: Generator는 `Generator` 이름이 Group 노드(자식 Mesh 3개)에 매칭되어 Group 경로를 탔다. GeneratorSmall은 단일 Mesh 매칭이므로 Mesh 자체에 바그래프가 add된다. 두 경우 모두 `mesh.add(bar)`/`mesh.getWorldPosition(_tmpVec3)`이 동일하게 동작하므로 (Object3D 공통 API) **시그니처와 코드 흐름은 100% 동일**. 단, 모델 scale이 root에서 1000배 적용되므로 바 dimensions/offset은 작은 값으로 해도 충분히 보인다 (#33/#34 CoolingTower02/03 scale 1000 보정 사례 답습 — 본 변형은 본체가 작아 오히려 ×1.0 유지로 충분).

---

## 답습 모범 — #42 Generator/Advanced/generatorOutput (시그니처 100% 동일)

본 변형은 **#42 Generator/Advanced/generatorOutput**을 100% 답습한다 — Mixin 조합·커스텀 네임스페이스·메서드 시그니처·destroy 규약·preview 라벨링·자동 데모 흐름 모두 동일. 차이는 **maxKw / 자동 데모 kW / 임계 색상 분기 시점**의 GeneratorSmall 운전역 보정뿐이다.

| 답습 | 항목 |
|------|------|
| `#42 Generator/Advanced/generatorOutput` | **전체 100% 답습** — MeshState + FieldRender + 커스텀 `this.generatorOutput` + 두 RAF (바 + HUD) + 외부 주입 자원(_renderer/_camera/_hudRoot/_cardEl) + destroy self-null |
| `#41 OHU103/Advanced/outdoorUnitPerformance` | HUD 추적 패턴 원조 (간접 답습) |
| `#13 BATT/Advanced/dataHud` | HUD 단일 mesh 추적 패턴 (간접 답습) |
| `#17 BATT/Advanced/cellHeatmap` | kW 값 → 임계 색상 매핑 패턴 (간접 답습) |

### #42 Generator와의 차이 (소형 발전기 운전역 보정)

| 항목 | #42 Generator/generatorOutput | #43 GeneratorSmall/generatorOutput (본) |
|------|-------------------------------|------------------------------------------|
| Mixin 조합 | MeshState + FieldRender | **MeshState + FieldRender** (동일) |
| 커스텀 네임스페이스 | `this.generatorOutput` | **`this.generatorOutput`** (동일) |
| meshName | 'Generator' (Group) | **'Generator'** (Mesh, 동일 이름 — `appendElement` 범위 충돌 없음) |
| 메서드 시그니처 | setOutput/setMaxKw/setThresholds/setData/setBarGeometry/setInertia/setMeshName/setOffset/show/hide/getCurrentOutput/getTargetOutput/getMaxKw/getLoadRate/start/stop/isRunning/enable/disable/isEnabled/destroy | **100% 동일** |
| 정격 maxKw 기본값 | 2000 | **500** (소형 비상발전기 운전역) |
| 자동 데모 kW (preview) | 1200 (60% 부하) | **300** (60% 부하 — 동일 비율) |
| warning / critical | 75% / 90% | **75% / 90%** (동일 비율) |
| 바 dimensions (width × depth × maxHeight) | 1.5 × 1.5 × 20 | **1.0 × 1.0 × 12** (소형 본체에 맞춰 축소) |
| 바 offset (x / y / z) | 4 / 0 / 0 | **2.5 / 0 / 0** (소형 본체 옆 부착) |
| inertia | 1.0s | **1.0s** (동일) |

### GeneratorSmall 운전역 근거 (300 kW 자동 데모, maxKw 500)

소형 비상발전기는 일반적으로 정격 출력 200~800 kW 영역에서 운영된다. 본 변형은 **maxKw 500 / current 300 (= 60% 부하)** 채택:
- 정격 500 kW (소형 비상발전기 운전역 중간)
- 현재 300 kW (60% 부하 — 운전역 중앙 + #42 Generator와 동일 시각 비율)
- warning 임계: 부하율 75% (375 kW)
- critical 임계: 부하율 90% (450 kW)

### 바 dimensions 축소 근거

GeneratorSmall 모델은 `root`에 scale 1000이 적용되어 단일 Mesh가 카메라 거리 ~3 단위 안에서도 충분히 큰 면적을 차지한다 (Standard preview camera offset `+6, +4, +8`). 따라서 #42 Generator 바 (1.5 × 1.5 × 20)는 본 모델 옆에서 과대 표현. **1.0 × 1.0 × 12**로 축소하여 본체 비율과 일치시킨다.

### Mixin 승격 메모 (필수 — 임계점 도달)

> **GeneratorOutputBarMixin / OutputBarMixin 승격 임계점 도달 — #42 + #43 = 2번째 채택.** 본 변형의 시그니처가 #42와 100% 동일하다는 사실이 곧 패턴 안정성 증명. setOutput/setMaxKw/setThresholds/setBarGeometry + RAF 1차 시스템 응답 + 임계 색상 매핑이 두 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출 권장.

> **MeshTrackingHudMixin 승격 강력 권장 — HUD 8번째 채택 (#13 + #21 + #24/#25/#26 + #41 + #42 + 본 #43).** 임계점 명백히 초과. setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 8개 컴포넌트에서 동일.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.generatorOutput` (#42 Generator 100% 답습)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다 (#42 답습). DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.generatorOutput.setData`가 수행한다.

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### cssSelectors (FieldRenderMixin) — HUD 카드 내부 sub 요소

| KEY | VALUE | 용도 |
|-----|-------|------|
| output | `.gen-output` | 현재 출력 kW (textContent) |
| loadRate | `.gen-load-rate` | 부하율(%) — `current/max*100` (textContent) |
| stateLabel | `.gen-state-label` | 동작 상태 라벨 한글 (textContent) |
| state | `.gen-state` | 상태 키 (data-state — CSS 색상 분기) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.gen-state>` 요소에 `data-state="<status>"` 부여 |

### 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — Mesh 색상, bar transform, DOM 좌표는 서로 간섭하지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | Mesh `material.color` | 데이터 상태 색상 (Standard 승계) |
| generatorOutput (바그래프) | `bar.scale.y` + `bar.material.color` | kW 비례 막대 높이 + 임계 색상 |
| generatorOutput (HUD) | DOM (`_cardEl.style.transform`) | 월드 → 화면 projection 매 프레임, 카드 carry-along |
| FieldRenderMixin | (선택자 계약만 주입) | DOM textContent / data-attr 적용 분기 규칙 |

### 커스텀 네임스페이스 `this.generatorOutput` (#42 답습 — 시그니처 100% 동일)

| 메서드 | 동작 |
|--------|------|
| `setOutput(kw)` | 현재 출력 kW 설정. 다음 RAF tick부터 `bar.scale.y`로 보간. HUD 카드의 `output`/`loadRate`도 자동 동기 갱신 |
| `setMaxKw(maxKw)` | 정격 출력 kW (기본 **500**). loadRate = currentKw/maxKw |
| `setThresholds({ warning, critical })` | 임계 부하율 % (기본 75/90). 임계 초과 시 바 색상 황색/적색 |
| `setData({ output, loadRate, stateLabel, state })` | HUD 수치 직접 갱신 |
| `setBarGeometry({ width, depth, maxHeight, offsetX, offsetY, offsetZ })` | 바그래프 mesh 크기/위치 (기본 width=**1.0**, depth=**1.0**, maxHeight=**12**, offsetX=**2.5**, offsetY=0, offsetZ=0) |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 1.0s) |
| `setMeshName(name)` | HUD 추적 / 바 부착 대상 mesh를 외부에서 지정 (기본 'Generator') |
| `setOffset({ x, y })` | DOM 오버레이 픽셀 오프셋 |
| `show()` / `hide()` | DOM 오버레이 + 바그래프 mesh 표시/숨김 |
| `getCurrentOutput()` / `getTargetOutput()` / `getMaxKw()` / `getLoadRate()` | 조회 |
| `start()` | 바 RAF + HUD RAF 시작 |
| `stop()` | 바 RAF stop + HUD RAF stop |
| `isRunning()` | 바 RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 바 채널 토글 |
| `destroy()` | 두 RAF cancel + bar mesh dispose + 외부 주입 자원 null + self-null |

#### 외부 주입 자원 (페이지 책임 — #42 Generator 답습)

| 자원 | 의미 |
|------|------|
| `instance.generatorOutput._renderer` | THREE.WebGLRenderer — 기본값 `wemb.threeElements.renderer` |
| `instance.generatorOutput._camera` | THREE.Camera — 기본값 `wemb.threeElements.camera` |
| `instance.generatorOutput._hudRoot` | absolute-position된 DOM 컨테이너 |

#### 옵션 기본값 (Generator와의 차이만 굵게)

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| currentKw | 0 | 0에서 시작, preview에서 자동 300 호출 |
| **maxKw** | **500** | 소형 비상발전기 정격 운전역 |
| inertia | 1.0 (sec) | 약 1.0s 후 95% 도달 |
| meshName | 'Generator' | Standard 동일 |
| **바 width × depth × maxHeight** | **1.0 × 1.0 × 12** | 소형 본체 옆 시각 관찰 가능 |
| **바 offsetX / Y / Z** | **2.5 / 0 / 0** | 소형 본체 옆(+X) 부착 |
| warning threshold | 75 (%) | Generator 동일 비율 |
| critical threshold | 90 (%) | Generator 동일 비율 |
| **자동 데모 kW (preview)** | **300** | 60% 부하 — 운전역 중앙 + 바 높이 시각 관찰 (= maxKw 500 × 0.6) |
| 시드 stateLabel | '운전 중' | preview 가시성 |
| 시드 state | 'normal' | preview 가시성 |
| autoEnable on mount | true (바 enable, RAF idle 진입) | preview 시각 관찰 우선 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널) |

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Generator' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin + FieldRenderMixin 적용 + `this.generatorOutput` API 등록 + 기본값 시드(maxKw 500 / state 'normal' / Label '운전 중') + (THREE 가용 시) 바 자동 enable + equipmentStatus 구독.
- 페이지가 `_hudRoot`에 DOM 카드 마운트 + `_hudRoot/_renderer/_camera` 주입 후 `start()` 호출 → HUD RAF 시작 + 바 mesh 동적 생성 (첫 setOutput 호출 시 또는 start 시점)
- 페이지가 `setOutput(kw)` + `setData({...})`로 데이터 갱신
- `beforeDestroy.js`: 구독 해제 → `this.generatorOutput?.destroy()` (두 RAF cancel + bar dispose + 외부 자원 null) → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/generatorOutput |
|------|----------|--------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.generatorOutput` 네임스페이스 | 없음 | `setOutput/setMaxKw/setThresholds/setData/setBarGeometry/setInertia/setMeshName/setOffset/show/hide/start/stop/isRunning/enable/disable/isEnabled/getCurrentOutput/getTargetOutput/getMaxKw/getLoadRate/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + bar.scale.y 보간 | 없음 | 있음 |
| RAF 매 프레임 월드→화면 projection HUD 좌표 추적 | 없음 | 있음 |
| BoxGeometry bar 동적 생성 + Mesh 자식으로 add | 없음 | 있음 |
| 바 색상 임계값 매핑 (kW 부하율 기반) | 없음 | 있음 (warning 75% / critical 90%) |
| DOM 오버레이 채널 | 없음 | 사용 |
| beforeDestroy | meshState만 정리 | generatorOutput → fieldRender → meshState 역순 |
| 화면 표시 | 단일 색상 Generator Mesh | 단일 색상 + Mesh 옆 3D 바그래프 + mesh 위 HUD 카드(kW·부하율·상태) |

Standard는 Mesh의 `material.color` 채널만 데이터에 결합한다. Advanced/generatorOutput은 추가로 (a) BoxGeometry 자식 mesh 동적 생성 + scale.y 보간 채널 (b) DOM overlay 채널 (c) FieldRender 선택자 계약 (d) 외부 명령형 API (e) 두 RAF — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#42 답습) |
| 2 | self-null `this.generatorOutput = null` + 두 RAF cancel | OK — destroy 마지막 줄 self-null + cancelAnimationFrame(barRaf) + cancelAnimationFrame(hudRaf) + bar dispose + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.generatorOutput?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachGeneratorOutput(inst)` 내부 destroy도 두 RAF cancel + bar dispose + 외부 자원 null + `inst.generatorOutput = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — #42와 100% 동일 시그니처 (모든 메서드 이름·인자 형태 일치) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview kW slider 0~700 ↔ `setOutput`, maxKw slider 200~1000 ↔ `setMaxKw`, warning/critical slider ↔ `setThresholds`, state 토글 ↔ `setData({state})`, start/stop 버튼 ↔ `start/stop` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setOutput(300) → 바 mesh가 ~1s에 걸쳐 부드럽게 7.2 단위 높이로 솟아오름 + HUD 카드가 Generator 위에 표시되고 kW/부하율 수치 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**모든 항목 통과.** #42 Generator 100% 답습으로 시그니처 drift 없음.

---

## 모델 주의사항

- `models/GeneratorSmall/01_default/GeneratorSmall.gltf`의 단일 Mesh 이름은 `'Generator'`로 확정. HUD 추적 / 바 부착 모두 `getObjectByName('Generator')`로 대상 Mesh를 직접 조회한다.
- root 노드에 scale 1000이 적용되어 있다. Three.js scene graph에서 **자식의 transform은 부모의 world matrix에 곱해지므로**, bar를 mesh의 자식으로 add하면 bar의 world 크기는 `bar.scale × parent.worldScale`이 된다. 보정 없이 width/depth/maxHeight = 1.0/1.0/12로 두면 world 단위로 1000/1000/12000이 되어 사실상 비가시(거대한 plane이 카메라 frustum을 덮음).
- **해결**: `ensureBar()`에서 `mesh.getWorldScale()`로 누적 world scale을 측정하고 `bar.scale`/`bar.position`을 inversely 보정 — `bar.scale.set(1/ws.x, 0.001/ws.y, 1/ws.z)`. 이로써 spec 값(1.0/1.0/12)이 항상 world 단위로 보장되고 root scale에 무관하게 동일하게 보인다. `barTick`도 동일 보정 적용. Generator(scale=1.0)는 division by 1.0이라 no-op이지만 #42/#43 시그니처 일관성을 위해 동일 패턴 유지.
- 시각 검증 결과 바가 너무 작거나 크면 `setBarGeometry`로 동적 보정 가능.
- HUD 카드는 Generator 위쪽으로 표시 — `setOffset({ y: -16 })` 권장 (#42 동일).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='Generator'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 / Standard preview에서 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **GeneratorOutputBarMixin / OutputBarMixin 승격 임계점 도달 (#42 + #43)**: 두 컴포넌트가 시그니처 100% 동일을 입증. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장. 후보 이름: `OutputBarMixin` (kW에 한정하지 않고 임의 수치 → 막대 높이 매핑으로 재사용 가능).
- **MeshTrackingHudMixin 승격 강력 권장 — HUD 8번째 채택**: 임계점 명백히 초과 (#13 + #21 + #24/#25/#26 + #41 + #42 + 본 #43).
- **단일 통합 네임스페이스 (#42과 동일 정책)**: 두 채널(`바그래프`, `HUD`)이 단일 도메인(소형 발전기 출력 표시)에 종속되어 페이지가 동시 호출하므로 단일 `generatorOutput` 네임스페이스로 통합. 미래 Mixin 승격 시점에는 두 Mixin이 별도 네임스페이스(`this.outputBar` + `this.dataHud`)로 분리되어도 무방.
- **모델 scale 1000 보정 미적용**: 단일 Mesh가 root 변환 후 화면 단위로 표시되므로 바 dimensions는 #42(2000 kW Generator)와 동일 단위계로 처리 가능. 다만 본체가 작아 1.0/1.0/12로 비례 축소.
- **Mesh vs Group 추적 차이 (Generator와의 모델 구조 차이)**: Generator는 Group 노드(자식 Mesh 3개)를 추적하지만 GeneratorSmall은 단일 Mesh를 직접 추적. 두 경우 모두 `Object3D.add`/`Object3D.getWorldPosition` API가 동일하게 동작하므로 코드 흐름 무관.
