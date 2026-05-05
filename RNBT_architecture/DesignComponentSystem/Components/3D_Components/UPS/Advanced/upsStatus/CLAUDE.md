# UPS — Advanced/upsStatus

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 `UPS` Mesh의 `material.color`를 colorMap에 맞춰 변경. Standard와 동일한 colorMap 사용.
2. **3-모드 LED (Online / Bypass / Battery)** — UPS 본체 옆/앞에 3개의 작은 발광 SphereGeometry mesh를 자식으로 add (가로 배열). 현재 모드의 LED만 강하게 점등(`emissive` 강도 1.0 + 짙은 base color), 나머지는 약하게(0.1) 표시. 모드 ↔ 색상: `online`=녹색(0x4ade80), `bypass`=황색(0xfbbf24), `battery`=적색(0xef4444).
3. **잔여시간 카운트다운 HUD** — `mode === 'battery'`일 때만 표시. UPS mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 mm:ss 형식의 잔여시간을 실시간 표시 (#13 BATT/dataHud + #41 OHU103 + #42 Generator/generatorOutput HUD 패턴 답습). online/bypass 모드에서는 카드 hide.
4. **자동 카운트다운** — `mode='battery'` 진입 시 1초 간격으로 `pushSecond()` 자동 호출 (autoCountdown=true 기본). 0 도달 시 자동 정지. 외부에서 `setRemainingSeconds(s)`로 갱신 가능.
5. **외부 명령형 API** — 페이지가 `instance.upsStatus.setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy`를 직접 호출하여 모드 + 잔여시간 제어.

---

## UPS mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/UPS/01_default/UPS.gltf` |
| GLTF 구조 | 루트 nodes(`Camera002.Target`, `Camera003.Target`, `UPS`) → 단일 Mesh `UPS` (자식 없음) |
| 좌표 바운드 | `[-2.42, -1.16, -0.47] ~ [2.42, 1.16, 0.47]` (UPS Mesh, 정점 212) — 가로 약 4.84 × 세로 2.32 × 깊이 0.94 단위 |
| 추적 대상 mesh 이름 | `UPS` (단일 Mesh; HUD 좌표 / LED 부착 / MeshState 색상 모두 동일) |
| 결정 | **단일 Mesh 추적** — 개별 단위(1 GLTF = 1 Mesh) 패턴 (Standard 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)` 및 Standard register.js의 `meshName: 'UPS'`와 일치. LED/HUD는 동일하게 `getObjectByName('UPS')`로 mesh를 직접 조회한다. LED 3개는 mesh의 자식으로 add하여 UPS 이동/회전 시 함께 따라온다.

---

## 답습 모범 — #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput (HUD) + #50 Inverter/powerFlowIndicator (LED 자식 mesh 동적 생성/dispose) + #46 MCCB/breaker_leverPosition (절대 모드 시그니처)

본 변형은 **세 개의 답습 축**을 결합한다:
- **HUD 채널**: #41/#42 HUD overlay 패턴(MeshState + 단일 통합 네임스페이스 + 외부 주입 자원 + RAF idle 정책 + DOM carry-along) 100% 답습 — 단, **`mode==='battery'`일 때만 카드 표시** (online/bypass에서는 hide).
- **LED 채널**: #50 Inverter/powerFlowIndicator의 **자식 mesh 동적 생성 + 공유 geometry/material dispose 규약** 답습 — 풀 대신 정확히 3개 mesh(online/bypass/battery)를 가로로 배열, 각자 고유 material(개별 색상).
- **시그니처 그룹**: #46 MCCB/breakerLeverPosition의 **절대 모드 setState** 시그니처 답습 — 본 변형의 `setMode('online'|'bypass'|'battery')`는 3-state 정적 모드 전환과 동치.

| 답습 | 항목 |
|------|------|
| `#41 OHU103/Advanced/outdoorUnitPerformance` | HUD 좌표 추적·setData·외부 주입 자원·통합 네임스페이스·RAF idle 정책 답습 (간접) |
| `#42 Generator/Advanced/generatorOutput` | **HUD overlay + 외부 주입 자원(_renderer/_camera/_hudRoot/_cardEl) + start/stop 라이프사이클 패턴 100% 답습** |
| `#50 Inverter/Advanced/powerFlowIndicator` | **자식 mesh 동적 생성 + parent.add + dispose 규약 답습** (풀이 아닌 고정 3개 LED) |
| `#46 MCCB/Advanced/breaker_leverPosition` | **3-state 절대 모드 setState 시그니처 답습** (ON/OFF/TRIP → online/bypass/battery) |
| `BATT/Advanced/alarmPulse` | (간접) emissive 채널 사용 패턴 |

### #54 B3F_UPS/upsStatus 답습 예정

> **본 변형은 #54 B3F_UPS/upsStatus가 100% 답습 예정**(시그니처/알고리즘/destroy 규약 동일, meshName/scale 보정만 차이). 따라서 시그니처/destroy 규약을 가능한 일관되게 정착시킨다 — `setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy`.

### Mixin 승격 메모 (필수 — UpsStatusLedMixin 후보 + MeshTrackingHudMixin 9번째)

> **UpsStatusLedMixin 승격 후보 (#53 + #54 예정)** — 본 변형(#53 UPS)은 LED 합성 1차 등장. **#54 B3F_UPS/upsStatus가 본 변형 시그니처 100% 답습 예정** (시그니처 일관성 매우 중요). 2번째 채택(#54) 시점에 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `UpsStatusLedMixin`(또는 더 일반화된 `MultiLedStateMixin` — 임의 N-state LED 합성) 승격 검토 권장. 시그니처(`setMode/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setMeshName/getMode/enable/disable/isEnabled/destroy`) 그대로 흡수 가능 + 다중 LED 합성 도메인이 UPS·인디케이터·디스플레이 박스 전반에 동일.

> **MeshTrackingHudMixin 매우 강력 권장 — HUD 9번째 채택 (#13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput + 본 변형(#53 UPS/upsStatus)) — 임계점 명백히 초과 누적.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 9개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장 (다른 누적 mixin 후보보다 우선순위 최상위)**.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.upsStatus` (신규 Mixin **없음** — #41/#42/#50/#46 답습 + LED 합성 패턴 1차 등장)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — 본체 색상, LED group, HUD DOM은 서로 간섭하지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `UPS.material.color` | 데이터 상태 색상 (Standard 승계) |
| upsStatus (LED) | 자체 `THREE.Group` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) | 운전 모드 (online/bypass/battery) |
| upsStatus (HUD) | DOM (`_cardEl.style.transform` + textContent) | 잔여시간 mm:ss (battery 모드 한정) |

### LED 합성 알고리즘

```
풀 크기: 정확히 3개 (online/bypass/battery 각각 1 mesh)
geometry: SphereGeometry(_ledRadius, 16, 16) — 3개 mesh가 공유 (1회 생성)
materials: 3개 — 각자 독립 MeshStandardMaterial
   { color, emissive: color, emissiveIntensity: <active ? 1.0 : 0.1>, transparent: true, opacity: 0.95 }

배치 (horizontal 기본):
  i in 0..2 (key: ['online', 'bypass', 'battery'])
  pos = _ledOffset + axis * (i - 1) * _ledSpacing  // 중앙 정렬, axis = horizontal ? +X : +Y
  mesh.position.set(...)

매 setMode 호출:
  for each mesh:
    materials[k].emissiveIntensity = (k === currentMode) ? 1.0 : 0.1
    materials[k].opacity = (k === currentMode) ? 1.0 : 0.6
```

### HUD 좌표 추적 RAF (#42 Generator/generatorOutput 답습)

```
mesh = appendElement.getObjectByName('UPS')
// 매 프레임 (battery 모드일 때만 실행):
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

mode가 'online'/'bypass'로 바뀌면 cardEl.style.display = 'none' + RAF stop.

### 자동 카운트다운

```
startCountdown():
  if (_countdownIntervalId !== null) return    // 중복 시작 방지
  _countdownIntervalId = setInterval(pushSecond, 1000)

pushSecond():
  if (_remainingSeconds <= 0) { stopCountdown(); return; }
  _remainingSeconds -= 1
  // HUD 카드의 .ups-remaining-time 텍스트 갱신 (mm:ss)

stopCountdown():
  if (_countdownIntervalId !== null) {
      clearInterval(_countdownIntervalId)
      _countdownIntervalId = null
  }
```

`setMode('battery')` 호출 시 자동으로 startCountdown 호출 (autoCountdown=true 기본). `setMode('online'|'bypass')` 시 자동 stopCountdown.

### 커스텀 네임스페이스 `this.upsStatus`

| 메서드 | 동작 |
|--------|------|
| `setMode(mode)` | `'online'`/`'bypass'`/`'battery'` 받아 LED emissive 갱신 + HUD show/hide + (battery면) auto-countdown 시작/(아니면) 정지 |
| `setRemainingSeconds(s)` | 잔여시간 (초) 직접 설정. mm:ss로 HUD 즉시 갱신 |
| `pushSecond()` | 잔여시간 1초 차감 + HUD 갱신. 0 도달 시 자동 stopCountdown |
| `startCountdown()` | setInterval(pushSecond, 1000) 시작 (중복 시작 방지) |
| `stopCountdown()` | clearInterval. _countdownIntervalId = null |
| `setLedColors({ online?, bypass?, battery? })` | 부분 객체 허용. 각 LED material.color + emissive 갱신 |
| `setLedLayout(layout)` | `'horizontal'` (X축 배열) / `'vertical'` (Y축 배열). LED position 재계산 |
| `setLedOffset({x?, y?, z?})` | 부분 객체 허용. LED group 중심 (UPS mesh local) |
| `setLedRadius(r)` | SphereGeometry 반지름. mesh 풀 재생성 (geometry 크기는 생성 시 고정) |
| `setLedSpacing(s)` | LED 간 간격. position만 재계산 (mesh 재생성 불필요) |
| `setHudOffset({x?, y?})` | HUD 카드 화면 좌표 픽셀 오프셋 |
| `setMeshName(name)` | LED 부착/HUD 추적 대상 mesh 이름 (기본 'UPS'). 변경 시 LED 재부착 |
| `getMode()` | 현재 모드 |
| `getRemainingSeconds()` | 현재 잔여시간 (초) |
| `enable()` / `disable()` / `isEnabled()` | LED 채널 토글 (HUD/카운트다운은 별도 — `setMode` 시점에 결정) |
| `destroy()` | clearInterval + cancelAnimationFrame(hudRafId) + LED group remove + 3 material dispose + 1 geometry dispose + HUD 외부 자원 null + 마지막 줄 `this.upsStatus = null` (self-null) |

#### 외부 주입 자원 (페이지 책임 — #41/#42 답습)

| 자원 | 의미 |
|------|------|
| `instance.upsStatus._renderer` | THREE.WebGLRenderer (canvas 좌표 산출용) — 기본값 `wemb.threeElements.renderer` |
| `instance.upsStatus._camera` | THREE.Camera (월드→화면 projection용) — 기본값 `wemb.threeElements.camera` |
| `instance.upsStatus._hudRoot` | absolute-position된 DOM 컨테이너 (페이지가 마운트한 overlay div) — battery 모드 시 RAF 동작 전 필수 |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| `_meshName` | `'UPS'` | Standard 동일 |
| `_mode` | `'online'` | preview 마운트 시 녹색 LED 점등 |
| `_remainingSeconds` | 600 (= 10분) | preview battery 진입 시 mm:ss = 10:00 시작 |
| `_ledLayout` | `'horizontal'` | 가로 배열 (UPS 본체가 가로 4.84 단위로 넓음) |
| `_ledOffset` | `{ x: 0, y: 1.4, z: 0.5 }` | UPS 본체 위쪽 + 약간 앞 (UPS bound y_max=1.16, z_max=0.47) |
| `_ledRadius` | 0.12 | 본체 대비 시각적으로 분명히 관찰 가능한 크기 |
| `_ledSpacing` | 0.45 | 3개 LED 간격 (가로 총 폭 0.9 — 본체 4.84 대비 적절) |
| `_autoCountdown` | true | battery 모드 진입 시 자동 카운트다운 |
| `_hudOffset` | `{ x: 0, y: -10 }` | UPS mesh 위로 약간 띄움 |
| autoEnable on mount | true (LED 자동 생성 + group attach) | preview 시각 관찰 우선 (#29~#52 동일 정책) |

> **자동 데모 정책**: register.js는 mount 직후 자동으로 setMode('online') 호출 → 2초 후 'bypass' → 4초 후 'battery' (잔여 300초로 카운트다운 시작) → 7초 후 'online' 복귀 순환. 운영에서는 페이지가 UPS 텔레메트리 데이터로 setMode/setRemainingSeconds 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 본체 색상 채널) |

mode/잔여시간은 별도 토픽이 아니라 페이지가 외부 트리거(텔레메트리·SCADA)로 `instance.upsStatus.setMode/setRemainingSeconds`를 직접 호출 (#13/#41/#42 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='UPS' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.upsStatus` API 등록 + 기본값 시드(_mode='online', _remainingSeconds=600) + (THREE 가용 시) 자동 enable + LED group 생성/attach + equipmentStatus 구독 + 자동 데모 시퀀스(setMode 순환).
- 페이지가 `_hudRoot/_renderer/_camera` 주입 → `setMode('battery')` 호출 시 → HUD RAF 시작 + 카운트다운 시작
- `beforeDestroy.js`: 구독 해제 → `this.upsStatus?.destroy()` (clearInterval + cancelAnimationFrame + LED dispose + 외부 자원 null 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/upsStatus |
|------|----------|--------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.upsStatus` 네임스페이스 | 없음 | `setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Group` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) | 없음 | 자체 생성 + UPS mesh 자식 attach + dispose |
| RAF 매 프레임 월드→화면 projection HUD 좌표 추적 | 없음 | 있음 — battery 모드일 때만 active, 다른 모드 시 RAF stop |
| setInterval 1초 카운트다운 | 없음 | 있음 — battery 모드일 때 active, 0 도달 시 자동 정지 |
| DOM 오버레이 채널 | 없음 | 사용 (`_cardEl.style.transform` + textContent 갱신) |
| LED emissive 채널 | 없음 | 사용 (3개 material 독립 emissiveIntensity 토글) |
| beforeDestroy | meshState만 정리 | upsStatus(setInterval clear + RAF cancel + LED dispose + 외부 자원 null) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 UPS 본체 | 단일 색상 + 본체 위 3-LED + (battery 시) HUD mm:ss 카드 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/upsStatus는 추가로 (a) 자체 Group + 3 SphereGeometry mesh + 3 material 자원 (b) UPS mesh 자식 attach 절차 (c) DOM overlay 채널 (d) `setMode/setRemainingSeconds/...` 외부 명령형 API (e) HUD RAF + 카운트다운 setInterval (f) 모드별 emissive 강도 토글 — 여섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#41/#42/#46/#50 답습) |
| 2 | self-null `this.upsStatus = null` + clearInterval + RAF cancel | OK — destroy 마지막 줄 self-null + clearInterval(_countdownIntervalId) + cancelAnimationFrame(_hudRafId) + LED group parent.remove + 3 material dispose + 1 geometry dispose + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.upsStatus?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachUpsStatus(inst)` 내부 destroy도 clearInterval + RAF cancel + LED dispose + 외부 자원 null + `inst.upsStatus = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setMode/getMode` (#46 setState/getState 시그니처 그룹), `setLedXxx/setHudXxx` (#42 setBarGeometry/setOffset), `start/stopCountdown` (interval 도메인), `enable/disable/isEnabled/destroy` (전 시리즈 공통). #54 B3F_UPS/upsStatus 100% 동일 시그니처 답습 가능 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 3-mode 버튼 ↔ `setMode('online'/'bypass'/'battery')`, 잔여시간 슬라이더 0~1800초 ↔ `setRemainingSeconds`, status 4버튼 ↔ `meshState.renderData` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 데모(`setMode('online') → 2s → 'bypass' → 4s → 'battery'(300초) → 7s → 'online'`)로 LED 색상 변화 + battery 시 HUD 카운트다운 시각 분명 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**8항목 모두 통과.**

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="ups-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="ups-hud-card" data-mesh-name="UPS">
        <div class="ups-hud-header">UPS-01 · Battery Mode</div>
        <div class="ups-hud-row">
            <span class="ups-hud-label">잔여 시간</span>
            <span class="ups-remaining-time">--:--</span>
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('ups-hud-overlay');
this.upsInstance = wemb.getDesignComponent('UPS');
this.upsInstance.upsStatus._hudRoot = overlay;
this.upsInstance.upsStatus.setMode('online');

// SCADA 어댑터
const onUpsTelemetry = ({ response: data }) => {
    // data: { mode: 'online'|'bypass'|'battery', remainingSeconds: number }
    this.upsInstance.upsStatus.setMode(data.mode);
    if (data.mode === 'battery' && typeof data.remainingSeconds === 'number') {
        this.upsInstance.upsStatus.setRemainingSeconds(data.remainingSeconds);
    }
};
```

---

## 모델 주의사항

- `models/UPS/01_default/UPS.gltf`의 단일 Mesh 이름은 `'UPS'`로 확정. LED 부착 / HUD 추적 모두 `getObjectByName('UPS')`로 mesh를 직접 조회한다.
- LED 3개는 UPS mesh의 자식으로 add — UPS 이동/회전 시 LED가 그대로 따라온다. UPS bound는 `[-2.42, -1.16, -0.47] ~ [2.42, 1.16, 0.47]` (가로 4.84 × 세로 2.32 × 깊이 0.94 단위)로, 기본 ledOffset y=1.4(상부 위쪽), z=0.5(약간 앞)에 horizontal 배치.
- HUD 카드는 UPS 위쪽으로 표시 — `setHudOffset({ y: -10 })` 권장.
- mode='battery' 진입 시 카운트다운 시작 / 종료 시 정지 자동 처리 (setMode 내부에서). pushSecond는 외부에서도 호출 가능 (수동 카운트다운 테스트 등).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='UPS'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 / Standard preview에서 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **UpsStatusLedMixin 승격 후보 (#53 + #54 예정)**: 본 변형(#53 UPS)은 LED 합성 1차 등장. **#54 B3F_UPS/upsStatus가 본 변형 시그니처 100% 답습 예정**. 2번째 채택(#54) 시점에 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장 (시그니처 그대로 흡수 가능, meshName/scale 보정만 차이).
- **MeshTrackingHudMixin 승격 매우 강력 권장 — HUD 9번째 채택 (#13 + #21 + #24/#25/#26 + #41 + #42 + #53)**: setData(또는 텍스트 갱신)/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 9개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장 (다른 누적 mixin 후보보다 우선순위 최상위)**.
- **단일 통합 네임스페이스 (#42 동일 정책)**: 두 채널(LED, HUD)이 단일 도메인(UPS 운전 모드 표시)에 종속되어 페이지가 동시 호출(`setMode` + `setRemainingSeconds`)하므로 단일 `upsStatus` 네임스페이스로 통합. 미래 Mixin 승격 시점에는 두 Mixin이 별도 네임스페이스(`this.modeLed` + `this.dataHud`)로 분리되어도 무방.
- **mode==='battery'일 때만 HUD 활성 정책**: HUD RAF는 mode==='battery'일 때만 active, online/bypass 시 즉시 stop + cardEl.style.display='none'. setMode 진입/이탈 시 자동 처리. 이 정책이 #41/#42(상시 active)와의 차이.
- **카운트다운은 setInterval (RAF 아님)**: 1초 단위로 차감하므로 setInterval이 자연스럽다. RAF는 60fps인데 1초마다 차감하려면 시간 누적 변수가 필요해 복잡 — setInterval이 코드가 짧고 의도가 명확 (정확도는 1초 단위 도메인이라 충분).
