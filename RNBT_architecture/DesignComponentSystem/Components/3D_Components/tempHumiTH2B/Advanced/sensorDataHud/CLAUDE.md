# tempHumiTH2B — Advanced/sensorDataHud

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'tempHumiTH2B' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **실시간 온습도 수치 라벨 (DOM 오버레이)** — 'tempHumiTH2B' mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 온도(℃) + 습도(%) 두 수치를 실시간 표시
   - 운영자가 3D 모델을 자유롭게 회전·줌해도 라벨이 tempHumiTH2B 위에 고정되어 따라온다
   - BATT/dataHud + GasDetector/sensorHud 답습: FieldRenderMixin 선택자 계약 + RAF 좌표 추적 + DOM 오버레이
3. **임계값 초과 시 emissive 펄스 + 라벨 색상 변경** — 온도 또는 습도가 정상 범위(`tempMin~tempMax`, `humiMin~humiMax`)를 벗어나면:
   - 'tempHumiTH2B' mesh `material.emissive` 펄스 자동 활성 (BATT/alarmPulse 패턴 답습)
   - DOM 라벨 `data-state="alarm"` 부여 → CSS 분기로 라벨 텍스트 색상 빨강
   - 정상 범위로 복귀하면 펄스 정지 + emissive 원본 복원 + `data-state="normal"`
4. **외부 명령형 API** — 페이지가 `instance.sensorDataHud.setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop`을 직접 호출하여 데이터/임계값/펄스 제어

---

## tempHumiTH2B mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/tempHumiTH2B/01_default/tempHumiTH2B.gltf` |
| mesh 이름 | `tempHumiTH2B` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치하며 Standard/Advanced/camera/popup 모두 단일 'tempHumiTH2B' 메시 기반으로 동작 중. 본 변형도 그 규약을 그대로 따른다.

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.sensorDataHud` (신규 Mixin 없음)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 `THREE.Object3D`이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.sensorDataHud.setData`가 수행한다 — `this.sensorDataHud._cardEl.querySelector(cssSelectors[key])`로 sub 요소를 찾고, FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다. BATT/dataHud + GasDetector/sensorHud의 단순화 패턴을 그대로 답습.

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
| temperature | `.th-temperature` | 온도 수치 (℃) (textContent) |
| humidity | `.th-humidity` | 습도 수치 (%) (textContent) |
| stateLabel | `.th-state` | 상태 라벨 — `정상`/`이상` (textContent) |
| state | `.th-state` | 상태 키 (data-state — CSS 색상 분기 트리거) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.th-state>` 요소에 `data-state="<normal|alarm>"` 부여 (CSS로 색상 분기) |

### 커스텀 네임스페이스 `this.sensorDataHud`

| 메서드 | 동작 |
|--------|------|
| `setData({ temperature, humidity })` | 수치 갱신. 임계값 비교 후 정상/비정상 판정 → DOM 라벨 갱신 + 펄스 자동 start/stop. null 값은 해당 KEY skip |
| `setThresholds({ tempMin, tempMax, humiMin, humiMax })` | 정상 범위 임계값 변경. 다음 `setData` 호출부터 새 임계값 적용 (즉시 재계산 안 함) |
| `setOffset({ x, y })` | DOM 라벨의 mesh 화면 좌표 기준 픽셀 오프셋 조정 |
| `setPulseOptions({ period, color, minIntensity, maxIntensity })` | 펄스 파라미터 변경. 활성 펄스가 있으면 즉시 반영 |
| `show()` / `hide()` | DOM 라벨 표시/숨김 (펄스는 별도 — `display:''` 또는 `display:'none'`). 펄스는 `setData`/`setThresholds` 결과에 의해 자동 관리되므로 `hide()`는 라벨만 끔 |
| `start()` | RAF 좌표 추적 루프 시작. 동일 호출 중복은 no-op |
| `stop()` | RAF 정지. DOM은 유지(재시작 가능). 활성 펄스가 있으면 함께 정지 + emissive 복원 |
| `destroy()` | RAF cancel + 펄스 정지 + emissive 원본 복원 + 외부 주입 자원(`_renderer`/`_camera`/`_cardEl`/`_hudRoot`) null + 마지막 줄 `this.sensorDataHud = null` (self-null) |

#### setData 입력 포맷

```javascript
{
    temperature: number | string | null,   // ℃ — 임계값 비교는 number 일 때만
    humidity:    number | string | null    // % — 임계값 비교는 number 일 때만
}
```

#### 임계값 비교 / 펄스 트리거 정책

```
temperature ∈ [tempMin, tempMax]  ∧  humidity ∈ [humiMin, humiMax]  → state='normal'
그 외 (어느 한쪽이라도 범위 밖)                                     → state='alarm'
```

| state | DOM 라벨 | 펄스 |
|-------|----------|------|
| normal | `data-state="normal"` + textContent `정상` | 정지 + emissive 원본 복원 |
| alarm | `data-state="alarm"` + textContent `이상` | start (기본 빨강 700ms) |

**펄스 색상 결정**: 단순화 — 온도/습도 어느 쪽이 벗어나든 항상 **빨강 1색**(`0xff3030`, period 700ms). 차등 색상(온도=빨강, 습도=파랑)은 시각적 혼동 우려 + alarmPulse 패턴 일관성 우선 + Mixin 승격 시점의 단순한 시그니처 보존. 운영자는 라벨 수치로 어느 채널이 알람인지 즉시 식별 가능.

DOM 라벨 색상은 CSS `[data-state="alarm"]` 분기로 빨강 적용 (FieldRender 패턴 답습 — JS는 data-state만 셋, 색상은 CSS 책임).

#### 외부 주입 자원 (페이지 책임)

| 자원 | 의미 |
|------|-----|
| `instance.sensorDataHud._renderer` | THREE.WebGLRenderer (canvas DOM 크기/위치 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.sensorDataHud._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.sensorDataHud._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setData`/RAF DOM 갱신 전 필수 |

> register.js는 `wemb.threeElements`에서 renderer/camera를 자동으로 끌어오지만, preview·테스트 환경에서는 페이지가 직접 `instance.sensorDataHud._renderer`/`_camera`를 주입할 수 있다. `_hudRoot`는 항상 페이지가 주입한다 (DOM 마운트 시점이 페이지 책임).

#### 좌표 추적 RAF 핵심 (BATT/dataHud + GasDetector/sensorHud 답습)

```
mesh = appendElement.getObjectByName('tempHumiTH2B')
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

#### 펄스 알고리즘 (BATT/alarmPulse 답습)

```
t            = performance.now() (ms)
phase        = (t / period) * 2π
norm         = (sin(phase) + 1) / 2          // 0 ~ 1
intensity    = lerp(minIntensity, maxIntensity, norm)

material.emissive.setHex(pulseColor)
material.emissiveIntensity = intensity
```

- 펄스 시작 시점에 mesh의 material(들)의 `emissive.clone()` + `emissiveIntensity`를 1회 보관
- 펄스 정지 시 `emissive.copy(saved)` + `emissiveIntensity = saved` 복원
- 매 RAF tick에서 `mesh.material`을 재조회 (MeshState가 status 갱신 시 material을 clone하므로 stale 회피 — alarmPulse 동등)
- emissive를 지원하지 않는 material(MeshBasicMaterial 등)이면 펄스 silent skip — 라벨만 동작

### 기본값

| 항목 | 기본값 | 시각적 관찰성 |
|------|-------|--------------|
| temperature | 25 (℃) | 정상 범위 내 — 라벨 `25 ℃` `정상` |
| humidity | 50 (%) | 정상 범위 내 — 라벨 `50 %` `정상` |
| thresholds | `{ tempMin: 18, tempMax: 28, humiMin: 30, humiMax: 70 }` | 일반 실내 환경 기준 |
| pulseOptions | `{ period: 700, color: 0xff3030, minIntensity: 0, maxIntensity: 1.5 }` | alarmPulse 동일 |
| offset | `{ x: 0, y: -16 }` | 라벨이 mesh 위쪽으로 16px 띄움 |
| autoStart on mount | true | mount 직후 RAF 자동 (preview 시각 관찰 우선 — sensorHud/chargeFlowArrow 답습) |

> **자동 start 규약**: BATT/dataHud는 페이지 명시 start 규약이지만, 본 변형은 GasDetector/sensorHud · chargeFlowArrow처럼 **mount 직후 자동 start with 기본 데이터/임계값**으로 시각 관찰성을 우선한다 (Phase 1.5 항목 #7).

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

온습도 수치는 별도 토픽 없이 페이지가 직접 `instance.sensorDataHud.setData(...)`를 호출하는 외부 명령형 패턴 (BATT/dataHud, GasDetector/sensorHud와 동일). 향후 `tempHumidity` 같은 표준 토픽이 정의되면 페이지가 자체 어댑터에서 `sensorDataHud.setData`로 위임하거나, register에서 직접 구독하도록 확장 가능.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='tempHumiTH2B' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 + `this.sensorDataHud` API 등록 + 기본값 시드 적용 + **자동 start** with `temperature: 25, humidity: 50, thresholds: {18~28, 30~70}`
- 페이지가 추가로 `_hudRoot` 주입 후 `setData/setThresholds` 외부 명령형 호출
- `setData()`는 `_hudRoot` 마운트 전 호출되면 silent skip(라벨 갱신 안 함). 펄스 토글은 _hudRoot 무관하게 동작 (mesh emissive 채널만 사용)
- `beforeDestroy.js`: 구독 해제 → `this.sensorDataHud?.destroy()` → `this.fieldRender?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/sensorDataHud |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyFieldRenderMixin` | ✗ | ✓ (선택자 계약 컨테이너) |
| `this.sensorDataHud` 네임스페이스 | 없음 | `setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy` 노출 |
| RAF 좌표 추적 루프 | 없음 | sensorDataHud 자체 관리 (`start/stop`으로 명시 제어) |
| `material.emissive` 채널 사용 | 없음 | 사용 (보관/변조/복원 — 펄스) |
| DOM 오버레이 | 없음 | `_hudRoot` 외부 주입 + RAF 좌표 추적 |
| beforeDestroy | meshState만 정리 | sensorDataHud → fieldRender → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/sensorDataHud는 추가로 (a) FieldRender 선택자 계약, (b) 월드→화면 projection RAF + DOM 오버레이, (c) `material.emissive` 펄스 채널 — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 정의 + DOM/펄스/RAF 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 두 채널 통합 (DOM 라벨 + emissive 펄스)

| 채널 | 표현 |
|------|------|
| DOM 오버레이 (`_hudRoot` + `_cardEl`) | 온도(℃) + 습도(%) + 상태 라벨 — RAF로 mesh 위치 추적 |
| 3D mesh emissive | 알람 시 sine wave 기반 빨강 펄스 — `material.emissive` 채널만 사용(MeshState `material.color`와 직교) |

두 채널은 동일한 `setData(...)` 호출에서 함께 갱신된다:
- 임계값 비교 → state 결정 (`normal`/`alarm`)
- DOM: `_cardEl.querySelector('.th-state').setAttribute('data-state', state)` + textContent `정상`/`이상`
- 펄스: state='alarm'이면 펄스 자동 start, 'normal'이면 자동 stop + emissive 복원

따라서 페이지는 단일 `setData` 호출로 두 시각 채널을 동기화 갱신할 수 있다.

---

## BATT/dataHud + BATT/alarmPulse + GasDetector/sensorHud 패턴 결합

| 측면 | BATT/dataHud | BATT/alarmPulse | GasDetector/sensorHud | sensorDataHud |
|------|--------------|------------------|-----------------------|---------------|
| DOM 라벨 + RAF 좌표 추적 | ✓ | — | ✓ | ✓ (dataHud/sensorHud 답습) |
| emissive 펄스 (시간 변조) | — | ✓ | — | ✓ (alarmPulse 답습) |
| 임계값 기반 자동 토글 | — | status 분기(자동) | concentration 분기 | temp/humi 범위 비교 |
| 외부 명령형 API | ✓ | ✓ | ✓ | ✓ |
| 자동 start | — | — | ✓ | ✓ (sensorHud 답습) |
| 자체 mesh 생성 (Sphere 등) | — | — | ✓ | — (불필요 — 라벨+펄스만) |

본 변형은 위 세 패턴의 결합이다. 셋 다 단일 컴포넌트 전용 커스텀 메서드로 검증되어 있어 그대로 답습한다. GasDetector/sensorHud의 시각 보조 mesh(Sphere)는 본 변형에서 제외 — 온습도는 농도와 달리 "감지반경"이라는 공간적 의미가 없고, 라벨 + 펄스 두 채널만으로 알람 표현이 충분하다.

---

## Mixin 승격 시나리오 (메모)

본 변형의 "단일 mesh + DOM 라벨(좌표 추적) + 임계값 기반 emissive 펄스" 패턴은 **다수 센서 컴포넌트 #25, #26**에서 거의 동일 기법으로 요구될 가능성이 매우 높다:

- #25 `thermohygrostat/sensorDataHud` — 온습도 라벨 + 임계 펄스 (본 변형과 거의 동일)
- #26 `MonnitTemperature_sensor/sensorDataHud` — 온도 라벨 + 임계 펄스 (단채널이지만 패턴 동일)

ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 **본 사이클은 커스텀 메서드로 완결**. 2번째 컴포넌트(예: #25 thermohygrostat/sensorDataHud) 등록 시점에 다음 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `SensorDataHudMixin`(가칭) — DOM 라벨 + 좌표 RAF + 임계값 비교 + emissive 펄스 자동 토글까지 패키지
- **또는 단계적 분리**: `Worldspace2DOverlayMixin`(가칭, 라벨만) + `MeshEmissivePulseMixin`(가칭, 펄스만) → 컴포넌트 register에서 두 Mixin 조합 + 임계값 비교 래퍼만 작성
- **API 호환성**: 현 시그니처(`setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy`) 그대로 수용 가능
- **GasDetector/sensorHud와의 통합**: sensorHud는 라벨+sphere+임계색상, 본 변형은 라벨+펄스+임계상태. 옵션으로 `sphere: { enabled, radius, opacity }` + `pulse: { enabled, color, period }` 도입 시 통합 가능. 단 라벨 sub 필드 셋이 컴포넌트마다 다르므로 cssSelectors는 컴포넌트별로 유지

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="th-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="th-hud-card" data-mesh-name="tempHumiTH2B">
        <div class="th-hud-header">TH-01</div>
        <div class="th-hud-row">
            <span class="th-hud-label">온도</span>
            <span class="th-temperature">-</span>
            <span class="th-hud-unit">°C</span>
        </div>
        <div class="th-hud-row">
            <span class="th-hud-label">습도</span>
            <span class="th-humidity">-</span>
            <span class="th-hud-unit">%</span>
        </div>
        <div class="th-hud-row">
            <span class="th-state" data-state="">-</span>
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('th-hud-overlay');
this.thInst = wemb.getDesignComponent('tempHumiTH2B');
this.thInst.sensorDataHud._hudRoot = overlay;
// _renderer/_camera는 register.js가 wemb.threeElements에서 자동 획득
this.thInst.sensorDataHud.start();   // register.js가 자동 start 한 경우 no-op

// 데이터 수신 시 (온습도 센서 토픽 어댑터)
this.thInst.sensorDataHud.setData({ temperature: 23.5, humidity: 55 });
this.thInst.sensorDataHud.setThresholds({ tempMin: 18, tempMax: 28, humiMin: 30, humiMax: 70 });
```

---

## 모델 주의사항

- `models/tempHumiTH2B/01_default/tempHumiTH2B.gltf`의 단일 메시 이름은 `'tempHumiTH2B'`로 확정. sensorDataHud는 `getObjectByName('tempHumiTH2B')`로 추적/펄스 대상 mesh를 직접 조회한다.
- mesh material이 `MeshStandardMaterial`/`MeshPhysicalMaterial`이면 `emissive` 속성이 존재하므로 펄스 동작. `MeshBasicMaterial` 등 emissive를 지원하지 않는 타입이면 펄스 silent skip — 라벨만 동작.
- `_renderer.domElement`(canvas)와 `_hudRoot`(overlay div)가 서로 다른 부모에 위치해도 `getBoundingClientRect` 차이를 보정하므로 정합. 단, 두 요소 모두 정상 렌더링된 상태(즉, 0 크기가 아님)여야 한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.sensorDataHud = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.sensorDataHud?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSensorDataHud(inst)` 내부 destroy도 `inst.sensorDataHud = null` 포함 + DOM null + emissive 복원 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy` (dataHud/sensorHud/alarmPulse 동사 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 온도 슬라이더 ℃ ↔ `setData({temperature})`, 습도 슬라이더 % ↔ `setData({humidity})`, tempMin/tempMax/humiMin/humiMax 슬라이더 ↔ `setThresholds(...)` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 start로 라벨(`25 ℃ / 50 % / 정상`) 즉시 관찰. Random Data 또는 임계값 토글 시 펄스 즉시 트리거 |
| 8 | manifest + tempHumiTH2B/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보 (강력)**: `SensorDataHudMixin`(가칭) — #25 thermohygrostat, #26 MonnitTemperature_sensor가 **거의 동일 패턴**으로 예상됨. 2번째 컴포넌트(즉 #25) 등록 시점이 **승격 검토의 결정적 시점**. 본 변형의 시그니처(`setData/setThresholds/setPulseOptions/...`)를 그대로 Mixin 옵션으로 승격하면 호환 깨짐 없이 리팩터 가능.
- **펄스 색상 차등 미적용**: 온도 알람 vs 습도 알람을 색상으로 구분할 수도 있었으나(예: 온도=빨강, 습도=파랑), 시각적 혼동 우려 + Mixin 승격 시 단순 시그니처 보존 우선으로 **빨강 1색 통일**. 라벨 수치로 어느 채널이 알람인지 식별 가능하므로 정보 손실 없음.
- **자동 start 규약 차이**: dataHud/alarmPulse는 페이지 명시 start 규약이지만 본 변형은 sensorHud/chargeFlowArrow처럼 **mount 직후 자동 start**. 향후 Mixin 승격 시 옵션화(`options.autoStart`) 권장.
- **`setData` 토픽 표준화 후보**: 현재 페이지가 외부 명령형으로 `setData` 호출하지만, 온습도 센서 데이터 토픽이 표준화되면 register에서 `tempHumidity` 토픽 직접 구독으로 단순화 가능.
