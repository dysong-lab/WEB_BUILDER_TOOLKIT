# GasDetector — Advanced/sensorHud

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'Detector' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **실시간 가스 농도 수치 라벨 (DOM 오버레이)** — 'Detector' mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 가스 농도 값(예: `250 ppm`)을 실시간 표시
   - 운영자가 3D 모델을 자유롭게 회전·줌해도 라벨이 GasDetector 위에 고정되어 따라온다
   - BATT/dataHud 패턴 답습: FieldRenderMixin 선택자 계약 + RAF 좌표 추적 + DOM 오버레이
3. **감지반경 반투명 구체 시각화 (3D 채널)** — GasDetector 주변에 반투명 구체(SphereGeometry + 반투명 MeshBasicMaterial)를 자체 생성하여 감지 반경을 시각화
   - 반경(`meters`) 동적 변경 가능 (geometry 재생성)
   - 농도 임계값(warn/danger) 비교 결과로 구체 색상 자동 변조 (정상=초록 / 경고=노랑 / 위험=빨강)
4. **임계값 기반 시각 변조** — 가스 농도가 `warn` 임계값 초과 시 구체와 라벨 색상이 노랑, `danger` 초과 시 빨강으로 자동 변경. 정상 범위에서는 초록.
5. **외부 명령형 API** — 페이지가 `instance.sensorHud.setData/setRadius/setThresholds/setOffset/show/hide/start/stop`을 직접 호출하여 데이터/반경/임계값 제어 (BATT/dataHud + Chiller/fluidFlow + BATT/alarmPulse 외부 명령형 패턴 결합)

---

## GasDetector mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/GasDetector/01_default/GasDetector.gltf` |
| mesh 이름 | `Detector` (단일 — 폴더명 `GasDetector`와 다름) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)` 및 `meshName = Detector`와 일치. Standard도 `'Detector'` 메시 기반으로 동작 중. 본 변형도 그 규약을 따른다.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.sensorHud` (신규 Mixin 없음)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 `THREE.Object3D`이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.sensorHud.setData`가 수행한다 — `this.sensorHud._cardEl.querySelector(cssSelectors[key])`로 sub 요소를 찾고, FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다. BATT/dataHud의 단순화 패턴을 그대로 답습.

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### cssSelectors (FieldRenderMixin) — HUD 카드 내부 sub 요소

| KEY | VALUE | 용도 |
|-----|-------|------|
| concentration | `.gasdetector-concentration` | 가스 농도 수치 (textContent) |
| unit | `.gasdetector-unit` | 단위 라벨 — `ppm`, `%LEL` 등 (textContent) |
| levelLabel | `.gasdetector-level` | 위험 단계 라벨 — `정상`/`경고`/`위험` (textContent) |
| level | `.gasdetector-level` | 위험 단계 키 (data-level — CSS 색상 분기 트리거) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| level | `level` | `<.gasdetector-level>` 요소에 `data-level="<normal|warn|danger>"` 부여 (CSS로 색상/배경 분기) |

### 커스텀 네임스페이스 `this.sensorHud`

| 메서드 | 동작 |
|--------|------|
| `setData({ concentration, unit })` | 가스 농도 갱신. `concentration`(number) → 임계값 비교 → `level` 결정 → DOM 라벨 + 구체 material.color 동시 적용. `unit`은 옵션(기본 `'ppm'`). null 값은 해당 KEY skip |
| `setRadius(meters)` | 감지 반경 변경. SphereGeometry 재생성(`dispose` + `new SphereGeometry(meters, 32, 16)`)하여 mesh에 적용 |
| `setThresholds({ warn, danger })` | 경고/위험 임계값 변경. 다음 `setData` 호출부터 새 임계값 적용. 즉시 재계산은 안 함(데이터가 다시 들어올 때까지 색상 유지) |
| `setOffset({ x, y })` | DOM 라벨의 mesh 화면 좌표 기준 픽셀 오프셋 조정 |
| `show()` | DOM 라벨 + 구체 둘 다 표시 (`display:''` + `mesh.visible = true`) |
| `hide()` | DOM 라벨 + 구체 둘 다 숨김 (`display:'none'` + `mesh.visible = false`) |
| `start()` | RAF 좌표 추적 루프 시작 + 구체 parent에 add(미생성 시 lazy 생성). 동일 호출 중복은 no-op |
| `stop()` | RAF 정지. DOM/구체는 유지 (재시작 가능) |
| `destroy()` | RAF cancel + DOM 자체 remove 안 함(페이지 책임) + 외부 주입 자원(`_renderer`/`_camera`/`_cardEl`/`_hudRoot`) null + **Sphere geometry/material dispose + parent.remove** + 마지막 줄 `this.sensorHud = null` (self-null) |

#### setData 입력 포맷

```javascript
{
    concentration: number | string | null,   // ppm 또는 %LEL — 임계값 비교는 number 일 때만
    unit:          string | null              // 'ppm' | '%LEL' (default: 'ppm')
}
```

#### 임계값 색상 매핑 정책

```
concentration < warn        → level = 'normal' → 색상 0x34d399 (초록)
warn  ≤ concentration < danger → level = 'warn'   → 색상 0xfbbf24 (노랑)
danger ≤ concentration       → level = 'danger' → 색상 0xf87171 (빨강)
```

| level | 라벨 텍스트 (levelLabel) | 색상 hex | 적용 대상 |
|-------|-------------------------|---------|----------|
| normal | `정상` | 0x34d399 | 라벨 `data-level="normal"` + 구체 `material.color` |
| warn | `경고` | 0xfbbf24 | 라벨 `data-level="warn"` + 구체 `material.color` |
| danger | `위험` | 0xf87171 | 라벨 `data-level="danger"` + 구체 `material.color` |

라벨 색상은 CSS로 `[data-level="warn"]` 등에 분기하여 적용 (DOM 직접 색 변경 아님 — FieldRender 패턴 답습).
구체 색상은 `material.color.setHex(...)` 직접 mutation.

#### 외부 주입 자원 (페이지 책임)

| 자원 | 의미 |
|------|-----|
| `instance.sensorHud._renderer` | THREE.WebGLRenderer (canvas DOM 크기/위치 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.sensorHud._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.sensorHud._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setData`/RAF DOM 갱신 전 필수 |
| `instance.sensorHud._sphereParent` | 구체가 add될 부모 (페이지/preview가 직접 주입 — `scene` 등). 없으면 `appendElement`(GLTF 루트) fallback |

> register.js는 `wemb.threeElements`에서 renderer/camera/scene을 자동으로 끌어오지만, preview·테스트 환경에서는 페이지가 직접 `instance.sensorHud._renderer`/`_camera`/`_sphereParent`를 주입할 수 있다. `_hudRoot`는 항상 페이지가 주입한다 (DOM 마운트 시점이 페이지 책임).

#### 좌표 추적 RAF 핵심 (BATT/dataHud 답습)

```
mesh = appendElement.getObjectByName('Detector')
// 매 프레임:
mesh.getWorldPosition(_tmpVec3)
_tmpVec3.project(_camera)
canvasRect = _renderer.domElement.getBoundingClientRect()
hudRect    = _hudRoot.getBoundingClientRect()
xCanvas = (_tmpVec3.x * 0.5 + 0.5) * canvasRect.width
yCanvas = (-_tmpVec3.y * 0.5 + 0.5) * canvasRect.height
xHud = (canvasRect.left - hudRect.left) + xCanvas + offsetX
yHud = (canvasRect.top  - hudRect.top ) + yCanvas + offsetY
_cardEl.style.transform = `translate(${xHud}px, ${yHud}px) translate(-50%, -100%)`
```

#### 구체 (SphereGeometry) 결정

- geometry: `new THREE.SphereGeometry(radius, 32, 16)` — radius는 `setRadius(m)` 또는 기본값 `2.0`
- material: `new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide })`
- mesh: `new THREE.Mesh(geometry, material)`
- 위치: GasDetector mesh의 boundingBox 중심에 `mesh.position.copy(detectorCenter)` (mesh의 월드 위치를 추적하여 매 프레임 갱신할 수도 있으나 GasDetector는 정적이므로 mount 시 1회 설정으로 충분)
- parent: `_sphereParent` > `appendElement` 우선순위 (Chiller/fluidFlow 답습)
- depthWrite: false → 다른 mesh에 가려져도 wireframe-like 시각 표현 보장
- side: DoubleSide → 내부에서 봤을 때도 보임

### 기본값

| 항목 | 기본값 | 시각적 관찰성 |
|------|-------|--------------|
| concentration | 100 (ppm) | mount 직후 `정상` 라벨 + 초록 구체 표시 |
| unit | `'ppm'` | |
| radius | `2.0` (m) | mount 직후 GasDetector 주변 2m 반경 구체 즉시 표시 |
| thresholds | `{ warn: 200, danger: 500 }` | (단위는 ppm 가정) |
| offset | `{ x: 0, y: -16 }` | 라벨이 mesh 위쪽으로 16px 띄움 |
| autoStart on mount | true | mount 직후 RAF + 구체 add 자동 (preview 시각 관찰 우선) |

> **자동 start 규약**: `fluidFlow`/`pipeFlow`/`dataHud`는 register 시점에 start 하지 않고 페이지가 명시 start 호출하는 외부 명령형 패턴이다. 본 변형은 **mount 직후 자동 start with 기본 데이터/반경/임계값**으로 시각 관찰성을 우선한다 (`chargeFlowArrow` 동일 정책 / Phase 1.5 항목 #7). 페이지가 즉시 표시를 원하지 않으면 `setMode` 대신 `hide()` 또는 `stop()` 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

가스 농도 자체는 별도 토픽 없이 페이지가 직접 `instance.sensorHud.setData(...)`를 호출하는 외부 명령형 패턴 (BATT/dataHud, Chiller/fluidFlow와 동일). 향후 `gasConcentration` 같은 표준 토픽이 정의되면 페이지가 자체 어댑터에서 `sensorHud.setData`로 위임하거나, register에서 직접 구독하도록 확장 가능.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Detector' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 + `this.sensorHud` API 등록 + 기본값 시드 적용 + (parent 가용 시) **자동 start** with `concentration: 100, radius: 2.0, thresholds: { warn:200, danger:500 }`
- 페이지가 추가로 `_hudRoot` 주입 후 `setData/setRadius/setThresholds` 외부 명령형 호출
- `setData()`/`setRadius()`는 sphere mesh가 아직 없으면 lazy 생성(start가 호출되어 sphere가 add된 후에만 색상/반경 변경 적용)
- `beforeDestroy.js`: 구독 해제 → `this.sensorHud?.destroy()` → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/sensorHud |
|------|----------|---------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.sensorHud` 네임스페이스 | 없음 | `setData/setRadius/setThresholds/setOffset/show/hide/start/stop/destroy` 노출 |
| RAF 좌표 추적 루프 | 없음 | sensorHud 자체 관리 (`start/stop`으로 명시 제어) |
| Three.js SphereGeometry/Material 자체 자원 | 없음 | path 단위 생성/dispose |
| DOM 오버레이 | 없음 | `_hudRoot` 외부 주입 + RAF 좌표 추적 |
| beforeDestroy | meshState만 정리 | sensorHud → fieldRender → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/sensorHud는 추가로 (a) FieldRender 선택자 계약, (b) 월드→화면 projection RAF + DOM 오버레이 carry-along, (c) 별도 SphereGeometry/Material 자원 — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 정의 + DOM/Sphere/RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 두 채널 통합 (DOM + 3D Sphere)

| 채널 | 표현 |
|------|------|
| DOM 오버레이 (`_hudRoot` + `_cardEl`) | 가스 농도 수치 + 단위 + 위험 단계 라벨 — RAF로 mesh 위치 추적 |
| 3D 구체 (`_sphereMesh`) | 감지 반경 시각화 — 반경/색상 동적 변경, 정적 위치(GasDetector 중심) |

두 채널은 동일한 `setData(concentration)` 호출에서 함께 갱신된다:
- 임계값 비교 → `level` 결정 (`normal`/`warn`/`danger`)
- DOM: `_cardEl.querySelector('.gasdetector-level').setAttribute('data-level', level)` + textContent `정상`/`경고`/`위험`
- 3D: `_sphereMesh.material.color.setHex(LEVEL_COLORS[level])`

따라서 페이지는 단일 `setData` 호출로 두 시각 채널을 동기화 갱신할 수 있다.

---

## BATT/dataHud + Chiller/fluidFlow + BATT/alarmPulse 패턴 결합

| 측면 | BATT/dataHud | Chiller/fluidFlow | BATT/alarmPulse | sensorHud |
|------|--------------|-------------------|------------------|-----------|
| DOM 라벨 + RAF 좌표 추적 | ✓ | — | — | ✓ (dataHud 답습) |
| 자체 mesh 생성 + dispose | — | ✓ | — | ✓ (fluidFlow 답습 — Sphere) |
| 임계값 기반 색상 변조 | — | — | ✓ (status 분기) | ✓ (concentration 분기) |
| 외부 명령형 API | ✓ | ✓ | ✓ | ✓ |
| 자동 start | — | — | — | ✓ (mount 직후 시각 관찰 우선) |

본 변형은 위 세 패턴의 결합이다. 셋 다 단일 컴포넌트 전용 커스텀 메서드로 검증되어 있어 그대로 답습한다.

---

## Mixin 승격 시나리오 (메모)

본 변형의 "단일 mesh + DOM 라벨(좌표 추적) + 3D 시각화 보조 mesh + 임계값 색상 매핑" 패턴은 **다수 센서 컴포넌트 #22~#26**에서 거의 동일 기법으로 요구될 가능성이 높다:

- #22 `LeakDetector/leakAlarmPulse` (누수 펄스 + 화살표) — 시각 보조 mesh + 임계 색상 변조 부분 공통
- #23 `IntrusionDetectionSensor/sensorAlertDirection` (침입 화살표 + 원형 펄스) — 시각 보조 mesh 공통
- #24 `tempHumiTH2B/sensorDataHud` (온습도 라벨 + 임계 색상) — DOM 라벨 + 임계 색상 매핑 동일 기법
- #25 `thermohygrostat/sensorDataHud` — #24와 같은 기법
- #26 `MonnitTemperature_sensor/sensorDataHud` — #24와 같은 기법

ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 **본 사이클은 커스텀 메서드로 완결**. 2번째 컴포넌트(예: #24 tempHumiTH2B/sensorDataHud) 등록 시점에 다음 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `SensorHudMixin`(가칭) — DOM 라벨 + 좌표 RAF + 임계 색상 매핑까지 패키지
- **또는** `Worldspace2DOverlayMixin`(가칭) — DOM 좌표 추적만 분리, 임계 색상은 컴포넌트 register 책임
- **API 호환성**: 현 시그니처(`setData/setRadius/setThresholds/setOffset/show/hide/start/stop/destroy`) 그대로 수용 가능. `setRadius`는 SensorHud 전용이므로 일반화하려면 옵션 시각보조 mesh 슬롯 도입 검토
- **BATT/dataHud와의 통합**: dataHud는 라벨만, sensorHud는 라벨+sphere — 옵션으로 `sphere: { radius, opacity }` 도입 시 통합 가능. 단 라벨 sub 필드 셋이 달라 cssSelectors는 컴포넌트마다 다르게 유지

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="gasdetector-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="gasdetector-hud-card" data-mesh-name="Detector">
        <div class="gasdetector-hud-header">GAS-01</div>
        <div class="gasdetector-hud-row">
            <span class="gasdetector-concentration">-</span>
            <span class="gasdetector-unit">ppm</span>
        </div>
        <div class="gasdetector-hud-row">
            <span class="gasdetector-level" data-level="">-</span>
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('gasdetector-hud-overlay');
this.gasInst = wemb.getDesignComponent('GasDetector');
this.gasInst.sensorHud._hudRoot = overlay;
// _renderer/_camera/_sphereParent는 register.js가 wemb.threeElements에서 자동 획득
this.gasInst.sensorHud.start();   // register.js가 자동 start 한 경우 no-op

// 데이터 수신 시 (가스 센서 토픽 어댑터)
this.gasInst.sensorHud.setData({ concentration: 250, unit: 'ppm' });
this.gasInst.sensorHud.setRadius(3.0);
this.gasInst.sensorHud.setThresholds({ warn: 150, danger: 400 });
```

---

## 모델 주의사항

- `models/GasDetector/01_default/GasDetector.gltf`의 단일 메시 이름은 `'Detector'`로 확정 (폴더명 `GasDetector`와 다름). sensorHud는 `getObjectByName('Detector')`로 추적/위치 산출 대상 mesh를 직접 조회한다.
- 구체는 `_sphereParent` 또는 `appendElement`(GLTF 루트)에 add 된다. preview에서는 scene을 직접 `_sphereParent`로 주입하여 GLTF 변환의 영향 없이 절대 좌표로 동작.
- `_renderer.domElement`(canvas)와 `_hudRoot`(overlay div)가 서로 다른 부모에 위치해도 `getBoundingClientRect` 차이를 보정하므로 정합. 단, 두 요소 모두 정상 렌더링된 상태(즉, 0 크기가 아님)여야 한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.sensorHud = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.sensorHud?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSensorHud(inst)` 내부 destroy도 `inst.sensorHud = null` 포함 + DOM null + sphere dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setData/setRadius/setThresholds/setOffset/show/hide/start/stop/destroy` (dataHud/fluidFlow/alarmPulse 동사 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 농도 슬라이더 ppm ↔ `setData({concentration})`, 반경 슬라이더 m ↔ `setRadius(m)`, warn/danger 슬라이더 ppm ↔ `setThresholds({warn, danger})` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 start로 라벨(`100 ppm 정상`) + 초록 구체(반경 2m) 즉시 관찰 |
| 8 | manifest + GasDetector/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보 (강력)**: `SensorHudMixin`(가칭) — #22~#26 센서 컴포넌트(LeakDetector/IntrusionDetectionSensor/tempHumiTH2B/thermohygrostat/MonnitTemperature_sensor)에서 패턴 거의 동일. 2번째 컴포넌트 등록 시점에 승격 검토 권장. 또는 라벨만 분리한 `Worldspace2DOverlayMixin`(가칭)을 먼저 만들고 임계 색상/sphere는 컴포넌트별 커스텀으로 유지하는 분리안도 고려.
- **자동 start 규약 차이**: dataHud/fluidFlow는 페이지 명시 start 규약이지만 본 변형은 chargeFlowArrow처럼 **mount 직후 자동 start**. 향후 Mixin 승격 시 옵션화(`options.autoStart`) 권장.
- **`setData` 토픽 표준화 후보**: 현재 페이지가 외부 명령형으로 `setData` 호출하지만, 가스 센서 데이터 토픽이 표준화되면 register에서 `gasConcentration` 토픽 직접 구독으로 단순화 가능.
- **단위 가정**: 임계값 기본값(warn 200 / danger 500)은 ppm 가정. `%LEL` 단위로 운영하는 경우 페이지가 `setThresholds` 호출로 재설정 필요.
