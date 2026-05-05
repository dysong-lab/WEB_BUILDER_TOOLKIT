# Generator — Advanced/generatorOutput

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'Generator' Group(자식 Mesh 3개) 색상 일괄 변경 (Standard 승계, `material.color` 채널)
2. **출력 kW 3D 바그래프 실시간 시각화** — Generator mesh 옆 3D 공간에 동적 생성한 BoxGeometry mesh(`bar`)의 `scale.y`를 출력 kW에 비례하여 조정. 운영자가 모델을 회전·줌해도 바가 발전기에 부착되어 함께 따라온다 (`appendElement`의 자식으로 add). 바 색상은 kW 임계값에 따라 녹색/황색/적색 임계 매핑 (#17 BATT/cellHeatmap 색상 임계 답습)
3. **출력 kW 3D 라벨 HUD** — Generator mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 **출력(kW)·부하율(%)·상태** 수치를 실시간 표시 (#13 BATT/dataHud + #41 OHU103/outdoorUnitPerformance HUD 패턴 답습)
4. **외부 명령형 API** — 페이지가 `instance.generatorOutput.setOutput(kw)/setMaxKw(maxKw)/setThresholds({warning, critical})/setData({...})/start/stop/destroy/...`를 직접 호출하여 바그래프와 HUD를 갱신

---

## Generator mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Generator/01_default/Generator.gltf` |
| GLTF 구조 | 루트 Group `Generator` → 자식 Mesh 3개(`Generator_mesh_A`, `Generator_blade`, `Generator`) |
| 추적 대상 mesh 이름 | `Generator` (루트 Group; HUD 좌표 / 바 부착 모두 동일) |
| 결정 | **단일 Group 추적** — 개별 단위(1 GLTF = 1 Group "Generator") 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Group "Generator" [자식 Mesh 3개])`와 일치. MeshStateMixin은 `getObjectByName('Generator')`로 부모 Group을 찾고 자식 Mesh들을 traverse하여 색상을 일괄 적용한다. 본 변형의 바그래프 mesh와 HUD 추적도 동일하게 `getObjectByName('Generator')`로 Group을 조회하고 (a) Group의 자식으로 BoxGeometry bar를 add (회전·이동 시 함께 따라옴), (b) Group의 월드 좌표로 HUD 카드 위치 계산.

---

## 답습 모범 — #41 OHU103/outdoorUnitPerformance + #17 BATT/cellHeatmap (HUD + 임계 색상 결합 + 바그래프 신규)

본 변형은 **#41 OHU103/outdoorUnitPerformance**의 HUD 패턴(MeshState + FieldRender + 단일 통합 네임스페이스 + 외부 주입 자원 + RAF idle 정책)을 그대로 답습하되, 회전 채널 대신 **3D 바그래프 채널**(BoxGeometry mesh 동적 생성 + scale.y 보간 + 임계 색상 매핑)로 교체한다.

| 답습 | 항목 |
|------|------|
| `#41 OHU103/Advanced/outdoorUnitPerformance` | **HUD 추적·setData·외부 주입 자원·통합 네임스페이스·destroy 규약 100% 답습** (mesh.getWorldPosition + camera.project + canvasRect/hudRect 보정) |
| `#13 BATT/Advanced/dataHud` | HUD 단일 mesh 추적 패턴 원조 (간접 답습) |
| `#17 BATT/Advanced/cellHeatmap` | **kW 값 → 임계 색상 매핑 패턴 답습** (warning/critical threshold 분기 + 색상 lerp 구간 mapping) |
| `#21 GasDetector/sensorHud` / `#24/#25/#26 sensorDataHud` | 단일 mesh HUD + 수치 라벨 (간접 답습) |

### #41 OHU103과의 차이 (회전 → 바그래프 채널 교체)

| 항목 | #41 OHU103/outdoorUnitPerformance | #42 Generator/generatorOutput (본) |
|------|----------------------------------|------------------------------------|
| Mixin 조합 | MeshState + FieldRender | **MeshState + FieldRender** (동일) |
| 커스텀 네임스페이스 | `this.outdoorUnitPerformance` | `this.generatorOutput` |
| meshName | 'OHU103' (단일 Mesh) | **'Generator'** (Group, 자식 3개) |
| 회전 채널 (mesh.rotation) | 있음 — RPM 비례 누적 회전 | **없음** |
| 바그래프 채널 (BoxGeometry add + scale.y) | 없음 | **있음 — 동적 BoxGeometry mesh 생성, kW 비례 scale.y, 임계 색상** |
| HUD 채널 (DOM carry-along) | 있음 | **있음** (동일 패턴) |
| HUD 표시 데이터 | 압력/토출온도/state | **출력 kW / 부하율(%) / state** |
| FieldRender cssSelectors | `.ohu-pressure/.ohu-discharge-temp/.ohu-state-label/.ohu-state` | **`.gen-output/.gen-load-rate/.gen-state-label/.gen-state`** |
| RAF 루프 수 | 2 (회전 + HUD) | **2 (바 보간 + HUD 좌표)** — 두 RAF는 각각 독립 idle/start 제어 |
| 자동 데모 시드 (preview) | RPM 1100 / 압력 1.85 / 토출 78 | **kW 1200 / maxKw 2000 / 부하율 60%** (1200/2000) |

### Generator 운전역 근거 (1200 kW 자동 데모)

비상발전기는 일반적으로 정격 출력의 50~80% 운전역에서 동작한다. 본 변형은 **maxKw 2000 / current 1200 (= 60% 부하)** 채택:
- 정격 2000 kW (중대형 비상발전기 운전역 중앙)
- 현재 1200 kW (60% 부하 — 운전역 중앙 + 시각적 바 높이 관찰 보장)
- warning 임계: 부하율 75% (1500 kW)
- critical 임계: 부하율 90% (1800 kW)

### Mixin 승격 메모 (필수 — HUD 7번째 채택)

> **MeshTrackingHudMixin 승격 강력 권장 — #13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + 본 변형(#42 Generator/generatorOutput) = 7번째 채택, 임계점 명백히 초과.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 7개 컴포넌트에서 동일.

> **GeneratorOutputBarMixin 승격 후보 (#42 + #43 GeneratorSmall 예정)** — 본 변형의 "BoxGeometry 동적 생성 + scale.y kW 비례 + 임계 색상 분기" 패턴은 즉시 다음 큐 항목 #43 GeneratorSmall에서 시그니처 100% 동일하게 채택될 것. 2번째 채택 시점에 Mixin 승격 검토 (1차 시점은 본 사이클 — 커스텀 메서드).

> **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장.**

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.generatorOutput` (신규 Mixin 없음 — #41 답습 + 바그래프 채널 신규)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다 (#13/#41 답습). DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.generatorOutput.setData`가 수행한다.

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

**원칙**: 세 채널은 완전 직교 — Group 색상, bar transform, DOM 좌표는 서로 간섭하지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | Group 자식 Mesh `material.color` | 데이터 상태 색상 (Standard 승계) |
| generatorOutput (바그래프) | `bar.scale.y` + `bar.material.color` | kW 비례 막대 높이 + 임계 색상 |
| generatorOutput (HUD) | DOM (`_cardEl.style.transform`) | 월드 → 화면 projection 매 프레임, 카드 carry-along |
| FieldRenderMixin | (선택자 계약만 주입) | DOM textContent / data-attr 적용 분기 규칙 |

### 바그래프 알고리즘

```
mesh = appendElement.getObjectByName('Generator')   // Group
// 1회: BoxGeometry bar 생성 (Group의 자식으로 add — 회전·이동 시 함께 따라옴)
bar = new THREE.Mesh(
    new THREE.BoxGeometry(barWidth, 1, barDepth),     // unit height (scale.y로 보간)
    new THREE.MeshStandardMaterial({ color: 0x34d399, transparent: true, opacity: 0.85 })
)
bar.position.set(barOffsetX, barOffsetY, barOffsetZ)
mesh.add(bar)

// 매 RAF tick: scale.y 1차 시스템 보간 + 임계 색상 매핑
ratio = clamp(currentKw / maxKw, 0, 1.2)             // 1.2까지 허용 (over-load 표시)
targetScaleY = ratio * barMaxHeight                  // ratio=0.6 + barMaxHeight=20 → 12 단위
alpha = clamp(dt / inertia, 0, 1)
bar.scale.y += (targetScaleY - bar.scale.y) * alpha
bar.position.y = barOffsetY + bar.scale.y / 2        // 바닥 앵커 유지

// 임계 색상 매핑 (loadRate = ratio * 100)
if (loadRate < warning)         color = green   (0x34d399)
else if (loadRate < critical)   color = yellow  (0xfbbf24)
else                            color = red     (0xf87171)
bar.material.color.setHex(color)

// idle 일시정지: target 도달 + |target - current| < epsilon 시 RAF stop
```

### HUD 좌표 추적 RAF 핵심 (#41 OHU103 답습)

```
mesh = appendElement.getObjectByName('Generator')
// 매 프레임:
mesh.getWorldPosition(_tmpVec3)
_tmpVec3.project(_camera)                                   // NDC -3D→2D
canvasRect = _renderer.domElement.getBoundingClientRect()
hudRect    = _hudRoot.getBoundingClientRect()
xCanvas = (_tmpVec3.x * 0.5 + 0.5) * canvasRect.width
yCanvas = (-_tmpVec3.y * 0.5 + 0.5) * canvasRect.height
xHud = (canvasRect.left - hudRect.left) + xCanvas + offsetX
yHud = (canvasRect.top  - hudRect.top ) + yCanvas + offsetY
_cardEl.style.transform = `translate(${xHud}px, ${yHud}px) translate(-50%, -100%)`
```

### 커스텀 네임스페이스 `this.generatorOutput`

| 메서드 | 동작 |
|--------|------|
| `setOutput(kw)` | 현재 출력 kW 설정. 다음 RAF tick부터 `bar.scale.y`로 보간. HUD 카드의 `output`/`loadRate`도 자동 동기 갱신 |
| `setMaxKw(maxKw)` | 정격 출력 kW (기본 2000). loadRate = currentKw/maxKw |
| `setThresholds({ warning, critical })` | 임계 부하율 % (기본 75/90). 임계 초과 시 바 색상 황색/적색 |
| `setData({ output, loadRate, stateLabel, state })` | HUD 수치 직접 갱신 (output/loadRate는 setOutput 호출이 우선). state만 외부 명령형으로 업데이트하고 싶을 때 사용 |
| `setBarGeometry({ width, depth, maxHeight, offsetX, offsetY, offsetZ })` | 바그래프 mesh 크기/위치 (기본 width=1.5, depth=1.5, maxHeight=20, offsetX=4, offsetY=0, offsetZ=0) |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 1.0s) |
| `setMeshName(name)` | HUD 추적 / 바 부착 대상 mesh를 외부에서 지정 (기본 'Generator') |
| `setOffset({ x, y })` | DOM 오버레이의 mesh 화면 좌표 기준 픽셀 오프셋 |
| `show()` / `hide()` | DOM 오버레이 + 바그래프 mesh 표시/숨김 |
| `getCurrentOutput()` / `getTargetOutput()` / `getMaxKw()` / `getLoadRate()` | 현재 보간 kW / 목표 kW / 정격 / 부하율(%) 조회 |
| `start()` | 바 RAF + HUD RAF 시작 (둘 다 안전, 중복 시작 방지) |
| `stop()` | 바 RAF stop (현재 위치 유지) + HUD RAF stop |
| `isRunning()` | 바 RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 바 채널 토글 (HUD는 별도 — `start`/`stop`로 제어) |
| `destroy()` | 두 RAF cancel + bar mesh dispose(geometry/material) + 외부 주입 자원 null + 마지막 줄 `this.generatorOutput = null` (self-null) |

#### 외부 주입 자원 (페이지 책임 — #41 OHU103 답습)

| 자원 | 의미 |
|------|------|
| `instance.generatorOutput._renderer` | THREE.WebGLRenderer (canvas 좌표 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.generatorOutput._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.generatorOutput._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setData`/HUD RAF 동작 전 필수 |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| currentKw | 0 | 0에서 시작, preview에서 자동 1200 호출 |
| maxKw | 2000 | 중대형 비상발전기 정격 운전역 |
| inertia | 1.0 (sec) | 약 1.0s 후 95% 도달 — 발전기 출력 변동감 |
| meshName | 'Generator' | Standard 동일 |
| 바 width × depth × maxHeight | 1.5 × 1.5 × 20 | 발전기 옆 시각적으로 분명히 관찰 가능한 크기 |
| 바 offsetX / Y / Z | 4 / 0 / 0 | 발전기 본체 옆(+X) 부착 |
| warning threshold | 75 (%) | 일반 비상발전기 경계 부하 |
| critical threshold | 90 (%) | 정격 근접 |
| 자동 데모 kW (preview) | 1200 | 60% 부하 — 운전역 중앙 + 바 높이 시각 관찰 |
| 시드 stateLabel | '운전 중' | preview 가시성 |
| 시드 state | 'normal' | preview 가시성 |
| autoEnable on mount | true (바 enable, RAF idle 진입) | preview 시각 관찰 우선 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — Group 색상 채널) |

출력 kW / loadRate / state는 별도 토픽이 아니라 페이지가 외부 트리거(텔레메트리·SCADA 데이터)로 `instance.generatorOutput.setOutput/setData`를 직접 호출한다 (#13/#41/#21/#24/#25/#26/#38/#39/#40 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Generator' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin + FieldRenderMixin 적용 + `this.generatorOutput` API 등록 + 기본값 시드(maxKw 2000 / state 'normal' / Label '운전 중') + (THREE 가용 시) 바 자동 enable + equipmentStatus 구독. 바 RAF는 currentKw=0 / targetKw=0이므로 idle 상태로 시작
- 페이지가 `_hudRoot`에 DOM 카드 마운트 + `_hudRoot/_renderer/_camera` 주입 후 `start()` 호출 → HUD RAF 시작 + 바 mesh 동적 생성(첫 setOutput 호출 시 또는 start 시점)
- 페이지가 `setOutput(kw)` + `setData({...})`로 데이터 갱신
- `beforeDestroy.js`: 구독 해제 → `this.generatorOutput?.destroy()` (두 RAF cancel + bar dispose + 외부 자원 null 포함) → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/generatorOutput |
|------|----------|--------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.generatorOutput` 네임스페이스 | 없음 | `setOutput/setMaxKw/setThresholds/setData/setBarGeometry/setInertia/setMeshName/setOffset/show/hide/start/stop/isRunning/enable/disable/isEnabled/getCurrentOutput/getTargetOutput/getMaxKw/getLoadRate/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + bar.scale.y 보간 | 없음 | 있음 — target 도달 시 idle 일시정지 |
| RAF 매 프레임 월드→화면 projection HUD 좌표 추적 | 없음 | 있음 — `_hudRoot` 주입 후 `start` 시점에 시작 |
| BoxGeometry bar 동적 생성 + Group 자식으로 add | 없음 | 있음 (Group 회전·이동 시 함께 따라옴) |
| 바 색상 임계값 매핑 (kW 부하율 기반) | 없음 | 있음 (warning 75% / critical 90% 임계 분기) |
| DOM 오버레이 채널 | 없음 | 사용 (`_cardEl.style.transform` 매 프레임 갱신) |
| beforeDestroy | meshState만 정리 | generatorOutput(두 RAF + bar dispose + 외부 자원 null) → fieldRender → meshState 역순 정리 |
| 화면 표시 | 단일 색상 Generator Group | 단일 색상 + Generator 옆 3D 바그래프 + mesh 위 HUD 카드(kW·부하율·상태) |

Standard는 Group 자식의 `material.color` 채널만 데이터에 결합한다. Advanced/generatorOutput은 추가로 (a) BoxGeometry 자식 mesh 동적 생성 + scale.y 보간 채널 (b) DOM overlay 채널 (c) FieldRender 선택자 계약 (d) `setOutput/setData/setMaxKw/setThresholds/...` 외부 명령형 API (e) 두 RAF (바 + HUD 좌표) — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#41 OHU103 + #13 BATT 답습) |
| 2 | self-null `this.generatorOutput = null` + 두 RAF cancel | OK — destroy 마지막 줄 self-null + cancelAnimationFrame(barRaf) + cancelAnimationFrame(hudRaf) + bar geometry/material dispose + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.generatorOutput?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachGeneratorOutput(inst)` 내부 destroy도 두 RAF cancel + bar dispose + 외부 자원 null + `inst.generatorOutput = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — HUD(`setData/setOffset/show/hide/start/stop/destroy`) #13/#41과 동일, 도메인 메서드(`setOutput/setMaxKw/setThresholds/setBarGeometry/setInertia/getCurrentOutput/getTargetOutput/getMaxKw/getLoadRate/isRunning/enable/disable/isEnabled`) — 도메인 의미 명확. #43 GeneratorSmall에서 100% 동일 시그니처 답습 가능 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview kW slider 0~2500 ↔ `setOutput`, maxKw slider 1000~3000 ↔ `setMaxKw`, warning/critical slider ↔ `setThresholds`, state 토글 ↔ `setData({state})`, start/stop 버튼 ↔ `start/stop` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setOutput(1200) → 바 mesh가 ~1s에 걸쳐 부드럽게 12 단위 높이로 솟아오름 + HUD 카드가 Generator 위에 표시되고 kW/부하율 수치 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**모든 항목 통과.** HUD (#41 답습) + 바그래프 (신규) 결합이 8항목 중 어느 것도 깨뜨리지 않음.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="generator-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="gen-hud-card" data-mesh-name="Generator">
        <div class="gen-hud-row"><span class="gen-hud-label">출력</span>
             <span><span class="gen-output">-</span> <span class="gen-hud-unit">kW</span></span></div>
        <div class="gen-hud-row"><span class="gen-hud-label">부하율</span>
             <span><span class="gen-load-rate">-</span> <span class="gen-hud-unit">%</span></span></div>
        <div class="gen-hud-row"><span class="gen-state" data-state=""></span>
             <span class="gen-state-label">-</span></div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('generator-hud-overlay');
this.genInstance = wemb.getDesignComponent('Generator');
this.genInstance.generatorOutput._hudRoot = overlay;
this.genInstance.generatorOutput.start();   // 바 RAF + HUD RAF 동시 시작

// SCADA/텔레메트리 어댑터
const onGeneratorTelemetry = ({ response: data }) => {
    this.genInstance.generatorOutput.setOutput(data.outputKw);
    this.genInstance.generatorOutput.setData({
        stateLabel: data.stateLabel,
        state:      data.state
    });
};
```

---

## 모델 주의사항

- `models/Generator/01_default/Generator.gltf`의 루트 Group 이름은 `'Generator'`로 확정. HUD 추적 / 바 부착 모두 `getObjectByName('Generator')`로 대상 Group을 직접 조회한다.
- Group 아래 자식 Mesh 3개(`Generator_mesh_A`, `Generator_blade`, `Generator`) 중 자식 `Generator`(Mesh)와 부모 `Generator`(Group)의 이름 충돌이 있다 — `getObjectByName`은 depth-first 첫 매치로 부모 Group을 반환한다 (Standard와 동일). 본 변형도 이 동작에 의존.
- 바 mesh는 Group의 자식으로 `add` — Group이 회전/이동하면 바도 따라간다. 바 자체는 unit height(BoxGeometry) + scale.y 변경으로 신축. 바닥 앵커를 위해 `bar.position.y = barOffsetY + bar.scale.y / 2`로 매 프레임 갱신.
- HUD 카드는 Generator 위쪽으로 표시 — `setOffset({ y: -16 })` 권장 (#13 BATT / #41 OHU103 동등).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='Generator'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 / Standard preview에서 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **MeshTrackingHudMixin 승격 강력 권장 — HUD 7번째 채택 (#13 + #21 + #24/#25/#26 + #41 + #42)**: setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 7개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장.
- **GeneratorOutputBarMixin 승격 후보 (#42 + #43 GeneratorSmall 예정)**: 본 변형의 바그래프 채널(BoxGeometry 동적 + scale.y 보간 + 임계 색상)은 즉시 다음 큐 항목 #43 GeneratorSmall에서 시그니처 100% 동일하게 채택될 것. 2번째 채택 시점에 Mixin 승격 검토 — 이름 후보: `OutputBarMixin` (kW에 한정하지 않고 임의 수치 → 막대 높이 매핑으로 재사용 가능), `MeshAttachedBarMixin` (특정 mesh의 자식으로 부착되는 바그래프).
- **두 RAF의 독립 라이프사이클 (#41과 동일 정책)**: 바 RAF는 idle 자동 일시정지(target=current+|delta|<eps), HUD RAF는 명시적 start/stop만. 두 RAF가 결합되어 있어도 각자의 idle 정책을 유지.
- **단일 통합 네임스페이스 (#41과 동일 정책)**: 두 채널(`바그래프`, `HUD`)이 단일 도메인(발전기 출력 표시)에 종속되어 페이지가 동시 호출(`setOutput` + `setData`)하므로 단일 `generatorOutput` 네임스페이스로 통합. 미래 Mixin 승격 시점에는 두 Mixin이 별도 네임스페이스(`this.outputBar` + `this.dataHud`)로 분리되어도 무방.
- **Group vs 개별 Mesh 추적**: Generator는 Group 노드(자식 Mesh 3개)를 추적하므로, `getObjectByName('Generator')` 결과가 Group이다. 본 변형의 바그래프는 Group의 자식으로 add되어 Group의 transform을 그대로 상속받는다 (자식 Mesh들과 동일하게 회전·이동 시 함께 따라옴). HUD 좌표도 Group의 월드 좌표를 사용하므로 자식 mesh 분해 무관 — 일관된 동작.
