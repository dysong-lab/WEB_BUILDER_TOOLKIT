# OHU103 — Advanced/outdoorUnitPerformance

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'OHU103' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **냉매 압력/온도 3D 게이지 HUD** — OHU103 mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 **냉매 압력(MPa)·토출온도(℃)** 두 핵심 수치를 실시간 표시. 운영자가 3D 모델을 자유롭게 회전·줌해도 HUD 카드가 OHU103 위에 고정되어 따라옴. 카드 내용은 FieldRenderMixin의 선택자 계약(`.ohu-pressure / .ohu-discharge-temp / .ohu-state`)으로 갱신 (BATT/dataHud + GasDetector/sensorHud의 라벨 매핑 패턴 답습)
3. **팬 RPM 비례 회전** — 외부 텔레메트리로 입력된 목표 RPM에 비례하여 OHU103 mesh 본체를 회전축(기본 'y') 둘레로 누적 회전. `mesh.rotation[axis] += currentRpm * rpmPerUnit * dt` (#38 Pump + #39 Heatexchanger + #40 AHU103 답습)
4. **관성(inertia) 감쇠** — 목표 RPM이 즉시 적용되지 않고 1차 시스템 응답식 `currentRpm += (targetRpm - currentRpm) * (dt / inertia)`로 매 RAF 프레임 보간. 시동/정지가 부드러운 가속·감속으로 표현
5. **RAF idle 일시정지** — `targetRpm === 0 && |currentRpm| < epsilon` 일 때 RAF stop (비용 0). setTargetRpm으로 0이 아닌 값이 들어오면 RAF 재시작
6. **외부 명령형 API** — 페이지가 `instance.outdoorUnitPerformance.setPerformance/setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/start/stop/destroy/...`를 직접 호출하여 게이지 갱신과 회전 제어

---

## OHU103 mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/OHU103/01_default/OHU103.gltf` |
| GLTF 구조 | `root` (scale [1000,1000,1000]) → `OHU103` (Mesh Node, mesh 0) — 단일 자식, 단일 mesh × 단일 primitive × 단일 material(`Material #42136`) |
| 회전·HUD 추적 대상 mesh 이름 | `OHU103` (Standard와 동일, 단일 리프 Mesh) |
| 결정 | **단일 mesh — 본체 통합** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: `OHU103.gltf`의 `nodes` 배열은 `root`(scale 1000x) + 자식 1개 `OHU103`(mesh 0)만 존재하며 별도의 `fan`/`blade`/`gauge` mesh가 분리되어 있지 않다. 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`과 일치. 따라서 (a) 회전 대상은 **단일 `OHU103` mesh 전체**(본체 통합 — AHU103/dynamicRpm 답습), (b) HUD 카드 추적 좌표도 동일 mesh의 월드 좌표(BATT/dataHud 답습). 페이지 운영에서 다른 자식 mesh로 전환이 필요하면 `setMeshName` 1회 호출로 변경 가능 (현 모델에서는 분리된 mesh 없음).

GLTF에 AnimationClip이 정의되어 있지 않으므로 회전은 mesh.rotation 직접 갱신으로 동작한다 (#38/#39/#40 동일 정책 — 클립 의존 없음).

---

## 답습 모범 — #40 AHU103/dynamicRpm + #13 BATT/dataHud (회전 + HUD 결합)

본 변형은 **#40 AHU103/Advanced/dynamicRpm**(회전 패턴) + **#13 BATT/Advanced/dataHud**(3D 추적 HUD 패턴)의 두 기법을 단일 register.js에 결합한 것이다. 두 기법 모두 4번째 채택이지만, 각자 유사 변형(GasDetector/sensorHud, tempHumiTH2B/sensorDataHud, thermohygrostat/sensorDataHud, MonnitTemperature_sensor/sensorDataHud — HUD; Pump/Heatexchanger/AHU103 — 회전)이 임계점을 명백히 초과한 상태이며 본 변형이 그 결합 사례를 추가한다.

| 답습 | 항목 |
|------|------|
| `#40 AHU103/Advanced/dynamicRpm` | **회전 알고리즘·API 시그니처·RAF 정책 100% 답습** (1차 시스템 응답 + mesh.rotation 누적 + RAF idle 일시정지) |
| `#13 BATT/Advanced/dataHud` | **HUD 추적·setData·외부 주입 자원 패턴 답습** (mesh.getWorldPosition + camera.project + canvasRect/hudRect 보정) |
| `#21 GasDetector/sensorHud` | 단일 mesh 추적 HUD + 1개 수치(농도) 라벨 (동일 패턴 — 본 변형은 2개 수치) |
| `#24/#25/#26 sensorDataHud` | 단일 mesh 추적 HUD + 2개 수치(온도/습도) 라벨 (본 변형의 직접 동형 — 압력/토출온도) |

### #40 AHU103 / #13 BATT와의 차이 (결합 시 변경 항목)

| 항목 | #40 AHU103/dynamicRpm | #13 BATT/dataHud | #41 OHU103/outdoorUnitPerformance (본) |
|------|----------------------|------------------|----------------------------------------|
| Mixin 조합 | MeshState | MeshState + FieldRender | **MeshState + FieldRender** |
| 커스텀 네임스페이스 | `this.dynamicRpm` | `this.dataHud` | **단일 `this.outdoorUnitPerformance` 통합** (회전 + HUD 모두 한 네임스페이스) |
| meshName | 'AHU103' | 'BATT' | **'OHU103'** |
| 회전 자동 데모 RPM | 1200 | — | **1100** (실외기 콘덴서 팬 일반 운전역 700~1500의 중앙) |
| HUD 표시 데이터 | — | SOC/SOH/V/state | **냉매 압력(MPa)·토출온도(℃)·state** |
| FieldRender cssSelectors | 없음 | `.batt-soc/.batt-soh/.batt-voltage/.batt-state` | **`.ohu-pressure/.ohu-discharge-temp/.ohu-state-label/.ohu-state`** |
| RAF 루프 수 | 1 (회전) | 1 (HUD 좌표) | **2 (회전 + HUD 좌표) — 두 RAF는 각각 독립 idle/start 제어** |
| 자동 데모 시드 | RPM 1200 | SOC 80/SOH 95/V 48 | **RPM 1100 / 압력 1.85 MPa / 토출온도 78℃** |

OHU(Outdoor Heat-pump Unit) — 실외기는 일반적으로:
- **냉매 응축압력**: 1.5~2.5 MPa (고압 측), 0.4~0.8 MPa (저압 측). 본 변형은 응축압력 운전역 중앙 ~1.85 MPa 표시
- **토출온도**: 70~95℃ (일반 운전), >100℃ 경보. 본 변형은 ~78℃ 표시
- **콘덴서 팬 RPM**: 700~1500 RPM (일반 운전역). 본 변형은 1100 채택 (실외기 운전역 중앙)

> 자동 데모 정책: register.js는 자동 setTargetRpm/setPerformance를 호출하지 않는다. preview에서 마운트 직후 `setTargetRpm(1100)` + `setPerformance({ pressure: 1.85, dischargeTemp: 78, ... })`을 호출하여 시각 관찰 보장. 운영에서는 페이지가 텔레메트리 데이터로 호출.

**큐 설명 (#41)**: "냉매 압력/온도 3D 게이지 + 팬 회전 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + FieldRenderMixin(선택자 계약 컨테이너) + 커스텀 메서드 `this.outdoorUnitPerformance` (#40 회전 + #13 HUD 답습 결합 — 신규 Mixin **없음**)

### Mixin 승격 메모 (필수 — 회전 4번째 채택, RotaryRpmMixin 즉시 승격 권장)

> **RotaryRpmMixin 승격 강력 권장 — #38 Pump + #39 Heatexchanger + #40 AHU103 + 본 변형(#41 OHU103) = 4개 컴포넌트 동일 회전 기법, 임계점을 두 번째로 명백히 초과.** 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 검토 즉시 권장.** setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy 시그니처 그대로 흡수 가능.
>
> **MeshTrackingHudMixin 승격 후보 — #13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + 본 변형 = 6번째 채택, 강력한 승격 후보.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 6개 컴포넌트에서 동일.

- **승격 후보 이름**: `RotaryRpmMixin`(회전), `MeshTrackingHudMixin`(HUD)
- **본 변형의 단일 통합 네임스페이스 정당화**: 두 기법(`회전`, `HUD`)이 단일 도메인(실외기 성능 표시)에 종속되므로 단일 `outdoorUnitPerformance` 네임스페이스로 통합. 미래 RotaryRpmMixin/MeshTrackingHudMixin 승격 시점에는 두 Mixin을 동시 적용하고 `outdoorUnitPerformance`는 "본 변형이 두 Mixin을 어떻게 결합하는지"를 설명하는 1줄 컴포지션으로 축소 가능.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.outdoorUnitPerformance` (신규 Mixin 없음 — #40 + #13 답습 결합)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 THREE.Object3D이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.outdoorUnitPerformance.setPerformance`가 수행한다 — `_cardEl.querySelector(cssSelectors[key])`로 sub 요소를 찾고, FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다 (#13 BATT/dataHud 답습).

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
| pressure | `.ohu-pressure` | 냉매 응축압력(MPa) — 핵심 실외기 KPI (textContent) |
| dischargeTemp | `.ohu-discharge-temp` | 토출온도(℃) — 압축기 상태 지표 (textContent) |
| stateLabel | `.ohu-state-label` | 동작 상태 라벨 한글 (textContent) |
| state | `.ohu-state` | 상태 키 (data-state — CSS 색상 분기) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.ohu-state>` 요소에 `data-state="<status>"` 부여 |

### MeshState · 회전 · HUD 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — 색상, transform, DOM 좌표는 서로 간섭하지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 색상 (Standard 승계) |
| outdoorUnitPerformance (회전) | `mesh.rotation[axis]` | RPM 비례 누적 회전 + 관성 보간 |
| outdoorUnitPerformance (HUD) | DOM (`_cardEl.style.transform`) | 월드 → 화면 projection 매 프레임, 카드 carry-along |
| FieldRenderMixin | (선택자 계약만 주입) | DOM textContent / data-attr 적용 분기 규칙 |

회전이 mesh를 돌려도 HUD 좌표 RAF는 매 프레임 `mesh.getWorldPosition`을 새로 측정하므로 카드는 항상 mesh 중심에 고정된다 (회전 시 카드만 살짝 흔들리지 않음 — 회전축이 'y'면 mesh 중심은 같은 위치 유지).

### 1차 시스템 응답 알고리즘 (회전)

```
매 RAF tick (dt = (now - lastTick) / 1000):
  // 1) currentRpm을 targetRpm으로 1차 시스템 보간
  alpha       = clamp(dt / inertia, 0, 1)
  currentRpm += (targetRpm - currentRpm) * alpha

  // 2) mesh.rotation[axis] 누적 갱신
  mesh.rotation[axis] += currentRpm * rpmPerUnit * dt

  // 3) idle 일시정지 — 목표 0 + 현재 거의 0 → RAF stop
  if (targetRpm === 0 && Math.abs(currentRpm) < epsilon) {
      currentRpm = 0
      RAF stop
  }
```

(상세 설명은 #38 Pump + #40 AHU103 답습)

### HUD 좌표 추적 RAF 핵심 (HUD)

```
mesh = appendElement.getObjectByName('OHU103')
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

(상세 설명은 #13 BATT/dataHud 답습)

### 커스텀 네임스페이스 `this.outdoorUnitPerformance`

| 메서드 | 동작 |
|--------|------|
| `setPerformance({ pressure, dischargeTemp, stateLabel, state })` | HUD 수치 갱신. FieldRender 선택자 계약을 사용하여 카드 내부 sub 요소에 값 적용. `null` 값은 해당 KEY skip |
| `setOffset({ x, y })` | DOM 오버레이의 mesh 화면 좌표 기준 픽셀 오프셋 조정 |
| `show()` / `hide()` | DOM 오버레이 표시/숨김 |
| `setTargetRpm(rpm)` | 외부 텔레메트리 입력. 즉시 적용이 아니라 다음 RAF tick부터 관성 보간 대상. RAF idle 시 자동 재시작 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 1.5s) |
| `setRotationAxis(axis)` | 회전 축 'x' / 'y' / 'z' (기본 'y') |
| `setRpmPerUnit(scale)` | 1 RPM당 라디안/초 스케일 (기본 `2π/60` rad/s) |
| `setMeshName(name)` | 회전·HUD 추적 대상 mesh를 외부에서 지정 (기본 'OHU103') |
| `getCurrentRpm()` / `getTargetRpm()` | 현재 보간된 RPM / 목표 RPM 조회 |
| `start()` | RPM RAF 재시작 + HUD RAF 시작 (둘 다 안전, 중복 시작 방지) |
| `stop()` | targetRpm을 0으로 설정 (자연스럽게 감속) + HUD RAF stop |
| `isRunning()` | RPM RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 회전 채널 토글 (HUD는 별도 — `start`/`stop`로 제어) |
| `destroy()` | 두 RAF cancel + (옵션) mesh.rotation reset(잔상 방지) + 외부 주입 자원 null + 마지막 줄 `this.outdoorUnitPerformance = null` (self-null) |

#### 외부 주입 자원 (페이지 책임 — #13 BATT/dataHud 답습)

| 자원 | 의미 |
|------|------|
| `instance.outdoorUnitPerformance._renderer` | THREE.WebGLRenderer (canvas 좌표 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.outdoorUnitPerformance._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.outdoorUnitPerformance._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setPerformance`/HUD RAF 동작 전 필수 |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| targetRpm | 0 (시작 시 idle) | preview에서 자동 1100 호출 |
| currentRpm | 0 | 0에서 시작 |
| inertia | 1.5 (sec) | 약 1.5s 후 95% 도달 — 실외기 팬 가속감으로 자연 |
| rotationAxis | 'y' | 단일 mesh 본체를 수직축으로 회전 (페이지에서 setRotationAxis로 변경 가능) |
| rpmPerUnit | `2π/60` ≈ 0.10472 rad/s per RPM | 표준 RPM 단위. preview에서는 0.05로 줄여 시각 관찰 가능 |
| meshName | 'OHU103' | Standard 동일 |
| 자동 데모 RPM (preview) | 1100 | 실외기 콘덴서 팬 운전역 700~1500의 중앙값 |
| 자동 데모 압력 (preview) | 1.85 MPa | 응축압력 운전역 1.5~2.5의 중앙 |
| 자동 데모 토출온도 (preview) | 78℃ | 일반 토출온도 70~95의 보수 운전값 |
| 시드 stateLabel | '운전 중' | preview 가시성 |
| 시드 state | 'normal' | preview 가시성 |
| autoEnable on mount | true (회전 enable, RAF idle 진입) | preview 시각 관찰 우선 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

압력/토출온도/RPM은 별도 토픽이 아니라 페이지가 외부 트리거(텔레메트리 데이터·계산값)로 `instance.outdoorUnitPerformance.setPerformance/setTargetRpm`를 직접 호출한다 (#13/#21/#24/#25/#26/#38/#39/#40 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='OHU103' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin + FieldRenderMixin 적용 + `this.outdoorUnitPerformance` API 등록 + 기본값 시드(압력 1.85 MPa / 토출온도 78℃ / state 'normal' / Label '운전 중') + (THREE 가용 시) 회전 자동 enable + equipmentStatus 구독. RPM RAF는 targetRpm=0 / currentRpm=0이므로 idle 상태로 시작
- 페이지가 `_hudRoot`에 DOM 카드 마운트 + `_hudRoot/_renderer/_camera` 주입 후 `start()` 호출 → HUD RAF 시작
- 페이지가 `setPerformance({ ... })` + `setTargetRpm(rpm)`로 데이터/회전 갱신
- `beforeDestroy.js`: 구독 해제 → `this.outdoorUnitPerformance?.destroy()` (두 RAF cancel + 회전 reset + 외부 자원 null 포함) → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/outdoorUnitPerformance |
|------|----------|---------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.outdoorUnitPerformance` 네임스페이스 | 없음 | `setPerformance/setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/setOffset/show/hide/start/stop/isRunning/enable/disable/isEnabled/getCurrentRpm/getTargetRpm/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + mesh.rotation 누적 | 없음 | 있음 — targetRpm=0 + |currentRpm|<epsilon 시 idle 일시정지 |
| RAF 매 프레임 월드→화면 projection HUD 좌표 추적 | 없음 | 있음 — `_hudRoot` 주입 후 `start` 시점에 시작 |
| `mesh.rotation[axis]` 채널 사용 | 없음 | 사용 (누적 갱신 + 옵션 reset) |
| DOM 오버레이 채널 | 없음 | 사용 (`_cardEl.style.transform` 매 프레임 갱신) |
| beforeDestroy | meshState만 정리 | outdoorUnitPerformance(두 RAF + 회전 reset + 외부 자원 null) → fieldRender → meshState 역순 정리 |
| 화면 표시 | 단일 색상 OHU 본체 | 단일 색상 + RPM 비례 본체 회전(관성 가속) + mesh 위 HUD 카드(압력·토출온도·상태) |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/outdoorUnitPerformance는 추가로 (a) `mesh.rotation[axis]` 채널 (b) DOM overlay 채널 (c) FieldRender 선택자 계약 (d) `setPerformance/setTargetRpm/...` 외부 명령형 API (e) 두 RAF (회전 + HUD 좌표) — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#40 AHU103 + #13 BATT 답습) |
| 2 | self-null `this.outdoorUnitPerformance = null` + 두 RAF cancel | OK — destroy 마지막 줄 self-null + cancelAnimationFrame(rpmRaf) + cancelAnimationFrame(hudRaf) + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.outdoorUnitPerformance?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachOutdoorUnitPerformance(inst)` 내부 destroy도 두 RAF cancel + 회전 reset + 외부 자원 null + `inst.outdoorUnitPerformance = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — 회전(`setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled`) #40과 동일, HUD(`setPerformance/setOffset/show/hide`) #13/#21/#24~#26과 동등 (단, BATT의 `setData`를 도메인 의미가 더 명확한 `setPerformance`로 명명) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview targetRpm slider 0~2000 ↔ `setTargetRpm`, 압력 slider 0.5~3.0 MPa ↔ `setPerformance({pressure})`, 토출온도 slider 50~110℃ ↔ `setPerformance({dischargeTemp})`, axis 토글 x/y/z ↔ `setRotationAxis`, start/stop 버튼 ↔ `start/stop` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setTargetRpm(1100) + setPerformance(1.85 MPa, 78℃) → mesh가 ~1.5s에 걸쳐 부드럽게 가속하여 회전 + HUD 카드가 OHU103 위에 표시되고 압력/온도 수치 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**모든 항목 통과.** 회전 (#40 답습) + HUD (#13 답습)의 결합이 8항목 중 어느 것도 깨뜨리지 않음. 단일 네임스페이스 통합으로 외부 명령형 호출 API를 단순화.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="ohu103-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="ohu-hud-card" data-mesh-name="OHU103">
        <div class="ohu-hud-row"><span class="ohu-hud-label">압력</span>
             <span class="ohu-pressure">-</span> <span class="ohu-hud-unit">MPa</span></div>
        <div class="ohu-hud-row"><span class="ohu-hud-label">토출온도</span>
             <span class="ohu-discharge-temp">-</span> <span class="ohu-hud-unit">℃</span></div>
        <div class="ohu-hud-row"><span class="ohu-state" data-state=""></span>
             <span class="ohu-state-label">-</span></div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('ohu103-hud-overlay');
this.ohuInstance = wemb.getDesignComponent('OHU103');
this.ohuInstance.outdoorUnitPerformance._hudRoot = overlay;
this.ohuInstance.outdoorUnitPerformance.start();   // 회전 + HUD 동시 시작

// 텔레메트리 토픽 어댑터
const onOhuTelemetry = ({ response: data }) => {
    this.ohuInstance.outdoorUnitPerformance.setPerformance({
        pressure: data.pressure.toFixed(2),
        dischargeTemp: data.dischargeTemp.toFixed(0),
        stateLabel: data.stateLabel,
        state: data.state
    });
    this.ohuInstance.outdoorUnitPerformance.setTargetRpm(data.fanRpm);
};
```

---

## 모델 주의사항

- `models/OHU103/01_default/OHU103.gltf`의 단일 mesh 이름은 `'OHU103'`로 확정. 회전·HUD 모두 `getObjectByName('OHU103')`로 대상 mesh를 직접 조회한다.
- GLTF에 AnimationClip이 정의되어 있지 않다 — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없으므로 무방.
- Mesh Node `rotation [0, -1, 0, 4.37e-8]` (Y축 180도 보정)은 mesh.quaternion에 적용되어 있고, dynamicRpm은 `mesh.rotation[axis]` (Euler XYZ)에 누적 갱신한다. THREE는 quaternion ↔ euler를 자동 동기화하므로 두 값이 충돌하지 않는다 (#40 AHU103과 동일하게 `[0, 180, 0]` 기준에서 추가 회전이 누적).
- OHU103은 root scale [1000, 1000, 1000] 업스케일 패턴이며 Standard preview는 `position.set(50,30,60)` + `far=500`을 사용 중. 본 변형 preview는 바운드 기반 자동 거리(`maxDim*2.0`) 사용 (#39/#40 답습).
- HUD 카드는 mesh 위쪽으로 표시 — `setOffset({ y: -16 })` 권장 (#13 BATT 동등).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='OHU103'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **RotaryRpmMixin 승격 즉시 권장 — 회전 4번째 채택 (#38 + #39 + #40 + #41) — 임계점 두 번째로 명백히 초과**: 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 알고리즘·API 시그니처·RAF 정책·destroy 규약이 4개 컴포넌트에서 100% 동일하다. **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 강력 권장.**
- **MeshTrackingHudMixin 승격 후보 — HUD 6번째 채택 (#13 + #21 + #24/#25/#26 + #41)**: setData(또는 setPerformance)/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 6개 컴포넌트에서 동일. 단일 mesh / 다중 mesh 라우팅(meshesArea/area_01/hudInfo) 모두 옵션으로 통합 가능.
- **두 기법의 결합 사례로서의 의의**: 본 변형은 "회전 + HUD"를 단일 컴포넌트에 결합한 첫 사례 (BATT/dataHud는 HUD만, AHU103/dynamicRpm은 회전만). 미래 RotaryRpmMixin + MeshTrackingHudMixin 동시 적용 시 본 변형의 구조가 그 결합 패턴의 기준 사례가 된다.
- **두 RAF의 독립 라이프사이클**: 회전 RAF는 idle 자동 일시정지(targetRpm=0+|currentRpm|<eps), HUD RAF는 명시적 start/stop만. 두 RAF가 결합되어 있어도 각자의 idle 정책을 유지 — 회전이 멈춰도 HUD는 모델 회전·줌에 따라 카드 위치 갱신을 계속해야 하기 때문.
- **단일 네임스페이스 vs 분리 네임스페이스 결정**: 두 채널이 OHU 도메인에 종속되어 있고 외부 명령형 API를 페이지가 동시 호출(`setPerformance` + `setTargetRpm`)하므로 단일 `outdoorUnitPerformance` 네임스페이스로 통합. 미래 Mixin 승격 시점에는 두 Mixin이 별도 네임스페이스(`this.dynamicRpm` + `this.dataHud`)로 분리되어도 무방 (운영 호출 코드는 페이지 책임이므로 호환성 보존 가능).
