# MonnitTemperature_sensor — Advanced/sensorDataHud

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MonnitTemperature_sensor' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **실시간 온도 수치 라벨 (DOM 오버레이)** — 'MonnitTemperature_sensor' mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 온도(℃) 단일 수치를 실시간 표시
   - 운영자가 3D 모델을 자유롭게 회전·줌해도 라벨이 MonnitTemperature_sensor 위에 고정되어 따라온다
   - BATT/dataHud + GasDetector/sensorHud + tempHumiTH2B/sensorDataHud + thermohygrostat/sensorDataHud 답습: FieldRenderMixin 선택자 계약 + RAF 좌표 추적 + DOM 오버레이
3. **임계값 초과 시 emissive 펄스 + 라벨 색상 변경** — 온도가 정상 범위(`tempMin~tempMax`)를 벗어나면:
   - 'MonnitTemperature_sensor' mesh `material.emissive` 펄스 자동 활성 (BATT/alarmPulse 패턴 답습)
   - DOM 라벨 `data-state="alarm"` 부여 → CSS 분기로 라벨 텍스트 색상 빨강
   - 정상 범위로 복귀하면 펄스 정지 + emissive 원본 복원 + `data-state="normal"`
4. **외부 명령형 API** — 페이지가 `instance.sensorDataHud.setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop`을 직접 호출하여 데이터/임계값/펄스 제어

> 본 변형은 직전 사이클 `thermohygrostat/Advanced/sensorDataHud`의 100% 답습 + **humidity 채널 제거**다. mesh name(`thermohygrostat` → `MonnitTemperature_sensor`)과 GLTF 모델 경로, 그리고 단일 채널화(temperature만)가 차이의 전부이며 그 외 모든 로직(시그니처·기본값·임계값·펄스 옵션·라이프사이클·beforeDestroy)은 동일.

---

## MonnitTemperature_sensor mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/MonnitTemperature_sensor/01_default/MonnitTemperature_sensor.gltf` |
| mesh 이름 | `MonnitTemperature_sensor` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치하며 Standard도 단일 'MonnitTemperature_sensor' 메시 기반으로 동작 중. 본 변형도 그 규약을 그대로 따른다. 폴더명·Node 이름·Mesh 이름이 모두 `MonnitTemperature_sensor`로 완전 일치(밑줄 `_` 포함 식별자 그대로 승계).

---

## 구현 명세

### Mixin

MeshStateMixin + FieldRenderMixin (선택자 계약 컨테이너) + 커스텀 메서드 `this.sensorDataHud` (신규 Mixin 없음)

> **FieldRender의 역할 분담**: 3D 컴포넌트의 `instance.appendElement`는 `THREE.Object3D`이므로 `appendElement.querySelector`가 동작하지 않는다. 따라서 `this.fieldRender.renderData`를 그대로 구독하지 **않고**, FieldRenderMixin이 주입한 `cssSelectors`/`datasetAttrs` **선택자 계약**만 활용한다. DOM 카드 내부 sub 요소 갱신은 커스텀 메서드 `this.sensorDataHud.setData`가 수행한다 — `this.sensorDataHud._cardEl.querySelector(cssSelectors[key])`로 sub 요소를 찾고, FieldRender의 `_applyValue` 분기 규칙(datasetAttrs → data-*, 그 외 → textContent)을 그대로 재현한다. tempHumiTH2B/sensorDataHud + thermohygrostat/sensorDataHud + BATT/dataHud + GasDetector/sensorHud의 단순화 패턴을 그대로 답습.

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
| temperature | `.mt-temperature` | 온도 수치 (℃) (textContent) |
| stateLabel | `.mt-state` | 상태 라벨 — `정상`/`이상` (textContent) |
| state | `.mt-state` | 상태 키 (data-state — CSS 색상 분기 트리거) |

### datasetAttrs (FieldRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| state | `state` | `<.mt-state>` 요소에 `data-state="<normal|alarm>"` 부여 (CSS로 색상 분기) |

### 커스텀 네임스페이스 `this.sensorDataHud`

| 메서드 | 동작 |
|--------|------|
| `setData({ temperature })` | 온도 수치 갱신. 임계값 비교 후 정상/비정상 판정 → DOM 라벨 갱신 + 펄스 자동 start/stop. null 값은 해당 KEY skip. (humidity 인자가 들어오더라도 cssSelectors에 없으므로 silent skip) |
| `setThresholds({ tempMin, tempMax })` | 정상 범위 임계값 변경. 다음 `setData` 호출부터 새 임계값 적용 (즉시 재계산 안 함) |
| `setOffset({ x, y })` | DOM 라벨의 mesh 화면 좌표 기준 픽셀 오프셋 조정 |
| `setPulseOptions({ period, color, minIntensity, maxIntensity })` | 펄스 파라미터 변경. 활성 펄스가 있으면 즉시 반영 |
| `show()` / `hide()` | DOM 라벨 표시/숨김 (펄스는 별도 — `display:''` 또는 `display:'none'`). 펄스는 `setData`/`setThresholds` 결과에 의해 자동 관리되므로 `hide()`는 라벨만 끔 |
| `start()` | RAF 좌표 추적 루프 시작. 동일 호출 중복은 no-op |
| `stop()` | RAF 정지. DOM은 유지(재시작 가능). 활성 펄스가 있으면 함께 정지 + emissive 복원 |
| `destroy()` | RAF cancel + 펄스 정지 + emissive 원본 복원 + 외부 주입 자원(`_renderer`/`_camera`/`_cardEl`/`_hudRoot`) null + 마지막 줄 `this.sensorDataHud = null` (self-null) |

#### setData 입력 포맷

```javascript
{
    temperature: number | string | null   // ℃ — 임계값 비교는 number 일 때만
}
```

#### 임계값 비교 / 펄스 트리거 정책

```
temperature ∈ [tempMin, tempMax]   → state='normal'
그 외 (범위 밖)                    → state='alarm'
```

| state | DOM 라벨 | 펄스 |
|-------|----------|------|
| normal | `data-state="normal"` + textContent `정상` | 정지 + emissive 원본 복원 |
| alarm | `data-state="alarm"` + textContent `이상` | start (기본 빨강 700ms) |

**펄스 색상**: 빨강 1색(`0xff3030`, period 700ms) — alarmPulse 패턴 + tempHumiTH2B/thermohygrostat sensorDataHud와 일관성 유지.

DOM 라벨 색상은 CSS `[data-state="alarm"]` 분기로 빨강 적용 (FieldRender 패턴 답습 — JS는 data-state만 셋, 색상은 CSS 책임).

#### 외부 주입 자원 (페이지 책임)

| 자원 | 의미 |
|------|-----|
| `instance.sensorDataHud._renderer` | THREE.WebGLRenderer (canvas DOM 크기/위치 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.sensorDataHud._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.sensorDataHud._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — `setData`/RAF DOM 갱신 전 필수 |

#### 좌표 추적 RAF 핵심

```
mesh = appendElement.getObjectByName('MonnitTemperature_sensor')
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
| thresholds | `{ tempMin: 18, tempMax: 28 }` | 일반 실내 환경 기준 |
| pulseOptions | `{ period: 700, color: 0xff3030, minIntensity: 0, maxIntensity: 1.5 }` | alarmPulse 동일 |
| offset | `{ x: 0, y: -16 }` | 라벨이 mesh 위쪽으로 16px 띄움 |
| autoStart on mount | true | mount 직후 RAF 자동 (preview 시각 관찰 우선 — sensorHud/chargeFlowArrow 답습) |

> **자동 start 규약**: GasDetector/sensorHud · chargeFlowArrow · tempHumiTH2B/sensorDataHud · thermohygrostat/sensorDataHud처럼 **mount 직후 자동 start with 기본 데이터/임계값**으로 시각 관찰성을 우선한다 (Phase 1.5 항목 #7).

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

온도 수치는 별도 토픽 없이 페이지가 직접 `instance.sensorDataHud.setData(...)`를 호출하는 외부 명령형 패턴.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MonnitTemperature_sensor' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 + `this.sensorDataHud` API 등록 + 기본값 시드 적용 + **자동 start** with `temperature: 25, thresholds: {18~28}`
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

## thermohygrostat/sensorDataHud + tempHumiTH2B/sensorDataHud 대비 시그니처 차이 (Mixin 승격 핵심 근거)

본 변형은 직전 두 사이클(`tempHumiTH2B/Advanced/sensorDataHud`, `thermohygrostat/Advanced/sensorDataHud`)의 답습 + **humidity 채널 제거**다. 시그니처 차이는 **humidity 채널 유무**뿐이며, 신규 Mixin 승격(`SensorDataHudMixin` 가칭) 시 `hasHumidity` 옵션(또는 `cssSelectors.humidity` 존재 여부)으로 흡수 가능한 결정적 근거.

| 항목 | tempHumiTH2B/sensorDataHud | thermohygrostat/sensorDataHud | MonnitTemperature_sensor/sensorDataHud (본 변형) | 차이 |
|------|----------------------------|--------------------------------|----------------------------------------------------|------|
| Mixin 조합 | MeshStateMixin + FieldRenderMixin + 커스텀 | 동일 | 동일 | ✓ |
| colorMap | `{normal:0x34d399, warning:0xfbbf24, error:0xf87171, offline:0x6b7280}` | 동일 | 동일 | ✓ |
| cssSelectors | `{temperature:'.th-temperature', humidity:'.th-humidity', stateLabel:'.th-state', state:'.th-state'}` | 동일 | `{temperature:'.mt-temperature', stateLabel:'.mt-state', state:'.mt-state'}` (humidity 제거 + 클래스 prefix `mt-`) | **humidity 키 부재 + 클래스 prefix만 차이** |
| datasetAttrs | `{state:'state'}` | 동일 | 동일 | ✓ |
| 커스텀 메서드 명 | `setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy` | 동일 | 동일 | ✓ |
| `setData` 입력 | `{temperature, humidity}` | 동일 | `{temperature}` | **humidity 인자 부재** |
| `setThresholds` 입력 | `{tempMin, tempMax, humiMin, humiMax}` | 동일 | `{tempMin, tempMax}` | **humi* 인자 부재** |
| DEFAULT_SEED | `{temperature:25, humidity:50}` | 동일 | `{temperature:25}` | **humidity 부재** |
| DEFAULT_THRESHOLDS | `{tempMin:18, tempMax:28, humiMin:30, humiMax:70}` | 동일 | `{tempMin:18, tempMax:28}` | **humi* 부재** |
| DEFAULT_PULSE_OPTS | `{color:0xff3030, period:700, minIntensity:0, maxIntensity:1.5}` | 동일 | 동일 | ✓ |
| offset 기본값 | `{x:0, y:-16}` | 동일 | 동일 | ✓ |
| autoStart on mount | true | true | true | ✓ |
| 구독 토픽 | `equipmentStatus → meshState.renderData` | 동일 | 동일 | ✓ |
| `computeState` 평가 축 | tempOk ∧ humiOk | 동일 | tempOk만 | **습도 평가 부재** |
| 라이프사이클 | self-null destroy + 적용 역순 정리 | 동일 | 동일 | ✓ |
| **mesh name** | `'tempHumiTH2B'` | `'thermohygrostat'` | `'MonnitTemperature_sensor'` | mesh name |
| **GLTF 경로** | `models/tempHumiTH2B/...` | `models/thermohygrostat/...` | `models/MonnitTemperature_sensor/...` | 모델 경로 |

**옵션 차이**: humidity 채널 유무 1축. 이외 시그니처 동일성은 100%. mesh name + cssSelectors + `hasHumidity`(또는 cssSelectors에 `humidity` 키 존재 여부) 옵션화로 즉시 Mixin으로 통합 가능.

---

## Mixin 승격 검토 (3번째 컴포넌트 적용)

### ADVANCED_QUEUE.md 정책 도달 — 강화

ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" — **"2번째 컴포넌트 등록 시점에 Mixin 승격 검토"** 정책을 직전 사이클(thermohygrostat)에서 통과했고, **본 사이클(MonnitTemperature_sensor)이 3번째 등록**으로 승격 압박이 추가 강화된다.

| 카운트 | 컴포넌트 | 사이클 | 시그니처 |
|--------|---------|--------|----------|
| 1번째 | `tempHumiTH2B/Advanced/sensorDataHud` | (완료) | 베이스 (온습도 2채널) |
| 2번째 | `thermohygrostat/Advanced/sensorDataHud` | (완료) — 승격 검토 시점 도달 | 100% 동일 (온습도 2채널) |
| **3번째** | `MonnitTemperature_sensor/Advanced/sensorDataHud` | **본 사이클 (완료)** — **승격 압박 추가 강화** | humidity 채널 제거 (온도 1채널) |

### 3번째 등록의 의미 (강화 포인트)

- 3번째 등록은 단순한 카운트 증가가 아니라 **"같은 패턴이 다른 입력 차원으로 변주되는 첫 사례"**다. 1·2번째는 100% 동일한 시그니처였지만 본 변형은 humidity 채널 제거 = **단일 채널 구성**이라는 새로운 변주를 보여준다.
- 즉, 신규 Mixin은 단지 "템플릿 일치"가 아니라 **"센서 데이터 채널 셋의 가변성"**을 옵션으로 흡수해야 함이 본 사이클에서 최종 확정된다. `hasHumidity` 옵션(또는 더 일반적인 `cssSelectors`/`thresholds` 키 셋의 동적 처리)이 Mixin 승격의 핵심 옵션이 된다.
- 만약 4번째(예: tempHumi+pressure) 컴포넌트가 등록되면 또 다른 채널이 추가되므로 — 본 시점에서 Mixin 승격을 더 늦추면 컴포넌트마다 register.js가 중복 약 350줄씩 증가한다 (현재 3 × 350 = ~1050줄 중복).

### 본 사이클의 의사결정 (반복)

- **신규 Mixin 생성 금지** (메인 루프 정책) — 본 사이클은 **메모만 남기고 마이그레이션은 별도 사이클에서 일괄 수행**
- 사용자가 별도 사이클(`create-mixin-spec` + `implement-mixin`)을 실행하면 **세 컴포넌트(tempHumiTH2B + thermohygrostat + MonnitTemperature_sensor)를 한꺼번에 마이그레이션** 가능

### 신규 Mixin 후보 사양 (강화 — 3번째 컴포넌트 반영)

| 항목 | 권고 |
|------|------|
| **이름 (1안)** | `SensorDataHudMixin`(가칭) — 라벨 + 좌표 RAF + 임계값 비교 + emissive 펄스 자동 토글까지 통합. **채널 셋(`temperature`, `humidity`, … )은 옵션으로 가변** |
| **이름 (2안 — 단계적 분리)** | `Worldspace2DOverlayMixin`(라벨/좌표만) + `MeshEmissivePulseMixin`(펄스만). 컴포넌트 register는 두 Mixin 조합 + 임계값 비교 래퍼만 작성 |
| **공개 시그니처** | `setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy` — 세 컴포넌트 100% 호환, 깨짐 없음 |
| **Mixin 옵션 (강화)** | `meshName`(string, 필수), **`channels`(array, 예: `['temperature', 'humidity']` 또는 `['temperature']`)** — 본 변형이 추가한 핵심 옵션, `cssSelectors`, `datasetAttrs`, `defaultSeed`, `defaultThresholds`(채널별 min/max 동적), `defaultPulseOpts`, `defaultOffset`, `stateLabels`, `autoStart`(boolean, 기본 true) |
| **GasDetector/sensorHud와의 통합** | sensorHud는 라벨+sphere+임계색상, 본 변형은 라벨+펄스+임계상태. 옵션으로 `sphere: { enabled, radius, opacity }` + `pulse: { enabled, color, period }` 도입 시 통합 가능 |

### 마이그레이션 영향도 (3개 컴포넌트 동시)

| 항목 | 영향 |
|------|------|
| 호환성 | 100% — 시그니처 일치이므로 기존 페이지(loaded.js / setData 호출 코드) 수정 불필요 |
| 세 컴포넌트 register 변경 | 각 약 350줄 → `applySensorDataHudMixin({ meshName, channels: [...], ... })` 약 5~30줄로 축소 (총 ~1050줄 → ~75줄) |
| 향후 추가 컴포넌트 | 4번째 이후 단/다채널 변종은 모두 옵션 변경만으로 즉시 적용 가능 |

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="mt-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="mt-hud-card" data-mesh-name="MonnitTemperature_sensor">
        <div class="mt-hud-header">MT-01</div>
        <div class="mt-hud-row">
            <span class="mt-hud-label">온도</span>
            <span class="mt-temperature">-</span>
            <span class="mt-hud-unit">°C</span>
        </div>
        <div class="mt-hud-row">
            <span class="mt-state" data-state="">-</span>
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('mt-hud-overlay');
this.mtInst = wemb.getDesignComponent('MonnitTemperature_sensor');
this.mtInst.sensorDataHud._hudRoot = overlay;
// _renderer/_camera는 register.js가 wemb.threeElements에서 자동 획득
this.mtInst.sensorDataHud.start();   // register.js가 자동 start 한 경우 no-op

// 데이터 수신 시 (온도 센서 토픽 어댑터)
this.mtInst.sensorDataHud.setData({ temperature: 23.5 });
this.mtInst.sensorDataHud.setThresholds({ tempMin: 18, tempMax: 28 });
```

---

## 모델 주의사항

- `models/MonnitTemperature_sensor/01_default/MonnitTemperature_sensor.gltf`의 단일 메시 이름은 `'MonnitTemperature_sensor'`로 확정. sensorDataHud는 `getObjectByName('MonnitTemperature_sensor')`로 추적/펄스 대상 mesh를 직접 조회한다.
- mesh material(`Material #26`)이 PBR 머티리얼이므로 `emissive` 속성이 존재 → 펄스 정상 동작.
- `_renderer.domElement`(canvas)와 `_hudRoot`(overlay div)가 서로 다른 부모에 위치해도 `getBoundingClientRect` 차이를 보정하므로 정합. 단, 두 요소 모두 정상 렌더링된 상태(즉, 0 크기가 아님)여야 한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.sensorDataHud = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.sensorDataHud?.destroy(); this.fieldRender?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSensorDataHud(inst)` 내부 destroy도 `inst.sensorDataHud = null` 포함 + DOM null + emissive 복원 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setData/setThresholds/setOffset/setPulseOptions/show/hide/start/stop/destroy` (thermohygrostat/sensorDataHud 베이스 + humidity 인자 제거) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 온도 슬라이더 ℃ ↔ `setData({temperature})`, tempMin/tempMax 슬라이더 ↔ `setThresholds(...)` 1:1 (humidity 슬라이더 부재) |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 start로 라벨(`25 ℃ / 정상`) 즉시 관찰. 온도 슬라이더 외측 또는 임계값 토글 시 펄스 즉시 트리거 |
| 8 | manifest + MonnitTemperature_sensor/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 압박 강화 (3번째 컴포넌트 적용)**: `SensorDataHudMixin`(가칭) — humidity 채널 옵션화로 통합 가능. 1·2번째(tempHumiTH2B + thermohygrostat)는 시그니처 100% 동일이었고, 본 사이클(3번째)에서 humidity 채널 제거라는 새 변주가 등장 → Mixin은 단순 템플릿이 아니라 **채널 셋 가변(`channels` 옵션)**을 흡수해야 함이 확정. ADVANCED_QUEUE.md "2번째 컴포넌트 등록 시점에 Mixin 승격 검토" 정책을 이미 통과한 시점에 추가 강화. 본 사이클은 신규 Mixin 생성 금지이므로 메모만 남긴다. 사용자가 별도 사이클(`create-mixin-spec` + `implement-mixin`)을 실행하면 세 컴포넌트(tempHumiTH2B + thermohygrostat + MonnitTemperature_sensor)를 한꺼번에 마이그레이션할 수 있도록 위 "thermohygrostat/sensorDataHud + tempHumiTH2B/sensorDataHud 대비 시그니처 차이" + "Mixin 승격 검토 (3번째 컴포넌트 적용)" 섹션에 충분한 근거(시그니처 차이 1축·옵션 후보·이름 후보 1안/2안)를 기록했다.
- **펄스 색상 차등 미적용**: 단일 채널이라 펄스 색상 차등 자체가 의미 없음 (직전 두 사이클은 온/습도 차등 가능성을 빨강 1색으로 통일했지만 본 변형은 단일 채널이므로 자연 동일). Mixin 승격 시 채널 수와 무관하게 빨강 1색 기본 + 옵션화 가능.
- **`setData` 토픽 표준화 후보**: 현재 페이지가 외부 명령형으로 `setData` 호출하지만, 온도 센서 데이터 토픽이 표준화되면 register에서 직접 구독으로 단순화 가능. (3개 컴포넌트 공통 — Mixin 승격 시 `subscribeTopic` 옵션 도입 권장)
- **CSS 클래스 prefix `mt-` 결정 근거**: `th-`(thermohygrostat) prefix는 다른 컴포넌트와 구분이 명확하지만, MonnitTemperature_sensor가 동일 페이지에서 thermohygrostat과 함께 마운트될 경우를 대비해 `mt-` prefix로 분리. CSS 충돌 방지 + 라벨 컴포넌트별 식별성 우선.
