# CardReader_T40 — Advanced/cardAccessFeedback

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 `T40` Mesh의 `material.color`를 colorMap에 맞춰 변경. Standard와 동일한 colorMap 사용.
2. **3-모드 LED (Granted / Denied / Waiting)** — CardReader_T40 본체 위쪽에 3개의 작은 발광 SphereGeometry mesh를 자식으로 add (가로 배열). 카드 태깅 결과에 따라 활성 LED만 강하게 점등(`emissive` 강도 1.0 + 짙은 base color), 나머지는 약하게(0.1) 표시. 모드 ↔ 색상: `granted`=녹색(0x22c55e), `denied`=적색(0xef4444), `waiting`=황색(0xfbbf24).
3. **출입 거부 시 본체 emissive 적색 펄스** — `tagDenied()` 호출 시 `T40` 본체 material `emissive`를 sine wave로 주기적으로 변조하여 적색 펄스(`_denyPulseDuration` ms 후 자동 종료 + emissive 원본 복원). 거부 알림의 시각적 강조.
4. **사운드 피드백 이벤트 발행** — `tagGranted()`/`tagDenied()`/`tagWaiting()` 호출 시 `@cardAccessSound` 커스텀 이벤트(detail: `{ result: 'granted'|'denied'|'waiting' }`)를 `appendElement.dispatchEvent`로 발행. 실제 오디오 재생은 페이지(또는 브라우저 권한 컨텍스트)가 담당 — 컴포넌트는 사운드 자원을 직접 소유하지 않는다 (3D 환경에서 오디오 권한·믹싱은 페이지 책임). 옵션으로 `_useBuiltinBeep=true`일 때 `new Audio(dataURI)` 기반 짧은 비프음 fallback 재생, 권한 미허용·자원 미가용 시 무음으로 안전 fallback.
5. **자동 LED 일시 점등 + auto-revert** — `tagGranted/tagDenied/tagWaiting` 호출 후 `_autoRevertMs`(기본 2000ms) 경과 시 `_idleMode`(기본 `'waiting'`)로 자동 복귀. 페이지가 다음 태깅 결과를 누적 호출하면 시각적 간섭이 없도록 한다. `_autoRevertMs=null`이면 영구 유지.
6. **외부 명령형 API** — 페이지가 `instance.cardAccessFeedback.tagGranted/tagDenied/tagWaiting/setMode/setIdleMode/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setDenyPulseDuration/setDenyPulseColor/setAutoRevertMs/setUseBuiltinBeep/setMeshName/getMode/enable/disable/isEnabled/destroy`를 직접 호출하여 카드 태깅 피드백 제어.

---

## CardReader_T40 mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/CardReader_T40/01_default/CardReader_T40.gltf` |
| GLTF 구조 | 루트 `root` Node(scale=[1000,1000,1000]) → 단일 자식 Node `T40`(mesh=0, 자식 없음) + `Default light`(mesh 없음) |
| GLTF 내부 mesh 이름 | `T40` (Standard register.js / preview에서 검증) |
| mesh local 좌표 바운드 | `[-0.00035, -0.000771, -0.000185] ~ [0.00035, 0.000771, 0.000185]` (정점 840) |
| 월드(root scale 1000 적용) 바운드 | 가로 약 0.7 × 세로 약 1.54 × 깊이 약 0.37 단위 |
| 추적 대상 mesh 이름 | `T40` (단일 Mesh; LED 부착 / MeshState 색상 / emissive 펄스 모두 동일) |
| 결정 | **단일 Mesh 추적** — 개별 단위(1 GLTF = 1 Mesh) 패턴 (Standard 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)` 및 Standard register.js의 `meshName: 'T40'`와 일치. LED 3개는 mesh의 자식으로 add하여 CardReader 이동/회전 시 함께 따라온다. **mesh local bbox가 매우 작으므로**(B3F_UPS의 약 1/27, UPS의 약 1/6900) LED offset/radius/spacing을 mesh local 좌표계에 비례하여 scale-down 보정한다.

### LED offset/radius/spacing 결정 근거

CardReader_T40 mesh local bbox max = `(0.00035, 0.000771, 0.000185)`. 가로 폭 ~0.0007, 세로 높이 ~0.00154, 깊이 ~0.00037. 이에 비례하여:

| 옵션 | 값 | 근거 |
|------|-----|------|
| `_ledRadius` | `0.00007` | bbox max 가로 (0.00035) 대비 약 20% — 본체 위에 시각적으로 명확히 관찰 가능 |
| `_ledSpacing` | `0.00018` | 3개 LED 가로 총 폭 0.00036 — 본체 가로 0.0007 대비 약 50% (대부분의 본체 위 영역 차지하면서도 양옆에 여백) |
| `_ledOffset` | `{ x: 0, y: 0.00091, z: 0.00022 }` | y_max(0.000771) 위쪽 약간 띄움(+0.00014), z_max(0.000185) 약간 앞 |

이 비율은 #54 B3F_UPS의 scale-down 보정 정책(`mesh local bbox max 비율로 LED offset/radius/spacing scale-down`)을 답습한다.

---

## #54 B3F_UPS/upsStatus + #55 AutomaticDoor2P/doorOpenClose + #33 IRISID_iCAM7/detectionMarker 답습

본 변형은 **세 개의 답습 축**을 결합한다:

- **3-모드 LED 합성 (B3F_UPS/upsStatus 답습)**: `setMode` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) + ACTIVE/INACTIVE intensity·opacity 토글 + `THREE.Group` 자식 attach + dispose 규약 — `#53 UPS + #54 B3F_UPS` 시그니처 답습.
- **본체 emissive sine 펄스 + 1회성 duration (AutomaticDoor2P/doorOpenClose `triggerDenied` 답습)**: `tagDenied()` 호출 시 본체 material `emissive`를 sine 변조 (200ms 주기) + duration 후 자동 종료 + emissive 원본 복원 + RAF idle 일시정지.
- **이벤트 emit + 페이지 위임 (IRISID_iCAM7/detectionMarker의 외부 명령형 패턴 + AutomaticDoor2P의 `triggerDenied` 1회성 트리거 답습)**: `tagGranted/tagDenied/tagWaiting`은 LED+펄스+auto-revert 외에 `@cardAccessSound` 이벤트만 dispatch하고 실제 오디오 재생은 페이지에 위임.

| 답습 | 항목 |
|------|------|
| `#53 UPS/Advanced/upsStatus` + `#54 B3F_UPS/Advanced/upsStatus` | **3-모드 LED 합성 (Group + 3 SphereGeometry + emissive intensity 토글) + dispose 규약** + **mesh local bbox 비례 LED 옵션 scale-down** |
| `#55 AutomaticDoor2P/Advanced/doorOpenClose` | **emissive sine 펄스 + 원본 보관/복원 + 1회성 duration + RAF idle 일시정지 + state self-null** |
| `#46 MCCB/Advanced/breaker_leverPosition` | **3-state 절대 모드 setState 시그니처** (간접 — `setMode('granted'|'denied'|'waiting')`) |
| `BATT/Advanced/alarmPulse` | (간접) emissive sine 변조 + 매 tick mesh.material 재조회 (stale clone 회피) |

### #54와의 알고리즘 차이

| 항목 | #54 B3F_UPS/upsStatus | #61 CardReader_T40/cardAccessFeedback |
|------|----------------------|--------------------------------------|
| 모드 종류 | online / bypass / battery | **granted / denied / waiting** |
| LED 색상 | 녹/황/적 (operating mode) | **녹/적/황 (access result)** |
| 잔여시간 HUD | 있음 (battery 모드) | **없음** — HUD 채널 제거 (출입 결과는 일시 표시) |
| 카운트다운 setInterval | 있음 (battery 모드) | **없음** — 대신 setTimeout 기반 auto-revert |
| 본체 emissive 펄스 | 없음 | **있음 — `tagDenied()` 시 적색 sine 펄스 (doorOpenClose `triggerDenied` 답습)** |
| 사운드 이벤트 emit | 없음 | **있음 — `@cardAccessSound` dispatchEvent (페이지 위임)** |
| autoRevert | 없음 | **있음 — `_autoRevertMs` 후 idleMode로 자동 복귀** |

### Mixin 승격 메모 (#54 임계점 도달 + 본 변형 LED 합성 3번째 채택)

> **MultiLedStateMixin 승격 후보 (#53 UPS + #54 B3F_UPS + #61 본 변형 = 3개 채택 도달)** — `#53 + #54`에서 이미 임계점 2개 도달했으며, 본 변형이 3번째 채택으로 임계점 명백히 초과. 단, 본 변형은 LED 외에 **본체 emissive 펄스** + **`tagXxx` 이벤트 emit + auto-revert 정책**이 추가되어 시그니처가 #53/#54의 `upsStatus`와 정확히 일치하지는 않는다(`setMode` 동치, but `tagGranted/tagDenied/tagWaiting`/`setAutoRevertMs` 등은 신규). 따라서 LED 합성 부분만 `MultiLedStateMixin`으로 승격하고, 펄스+이벤트+auto-revert는 컴포넌트별 커스텀 메서드로 유지하는 분리 정책이 자연스럽다. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지.
>
> **MeshTrackingHudMixin은 본 변형에는 적용 안 함** — 카드 리더는 출입 결과를 LED+사운드로 표현하며 별도 HUD 카드가 불필요(출입 결과가 일시적이고 1회 알림 성격이므로 mm:ss 같은 지속 데이터가 없음).

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.cardAccessFeedback` (신규 Mixin **없음** — #54 LED 합성 + #55 emissive 펄스 답습 + 사운드 이벤트 emit 패턴 결합)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### 채널 직교성 정책

**원칙**: 세 채널은 완전 직교 — 본체 base color, LED group, 본체 emissive 펄스는 서로 간섭하지 않는다 (LED material과 본체 material은 별개 객체).

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `T40.material.color` | 데이터 상태 색상 (Standard 승계) |
| cardAccessFeedback (LED) | 자체 `THREE.Group` + 3 SphereGeometry mesh × 3 MeshStandardMaterial(emissive 독립) | 카드 태깅 결과 (granted/denied/waiting) |
| cardAccessFeedback (펄스) | `T40.material.emissive` + `emissiveIntensity` | tagDenied 시 sine wave 적색 발광 (1회성 duration) |
| cardAccessFeedback (사운드 이벤트) | `appendElement.dispatchEvent('cardAccessSound', { detail: { result } })` | 페이지에 사운드 재생 위임 |

세 채널은 직교 — `material.color`(MeshState) vs `material.emissive`(펄스)는 PBR 채널 분리 + LED는 별도 mesh로 완전 격리. 매 RAF tick에서 `getObjectByName('T40').material`을 재조회하여 stale clone 회피 (BATT/alarmPulse, MCCB/breaker_leverPosition, AutomaticDoor2P/doorOpenClose 동일 정책).

### LED 합성 알고리즘 (#54 답습)

```
풀 크기: 정확히 3개 (granted/denied/waiting 각각 1 mesh)
geometry: SphereGeometry(_ledRadius, 16, 16) — 3개 mesh가 공유 (1회 생성)
materials: 3개 — 각자 독립 MeshStandardMaterial
   { color, emissive: color, emissiveIntensity: <active ? 1.0 : 0.1>, transparent: true, opacity: <active ? 1.0 : 0.6> }

배치 (horizontal 기본):
  i in 0..2 (key: ['granted', 'denied', 'waiting'])
  pos = _ledOffset + axis * (i - 1) * _ledSpacing  // 중앙 정렬, axis = horizontal ? +X : +Y
  mesh.position.set(...)

매 setMode 호출:
  for each mesh:
    materials[k].emissiveIntensity = (k === currentMode) ? 1.0 : 0.1
    materials[k].opacity            = (k === currentMode) ? 1.0 : 0.6
```

### 본체 emissive 펄스 알고리즘 (#55 doorOpenClose `triggerDenied` 답습)

```
tagDenied() 호출 시:
  capture body.material.emissive 원본 (clone) + emissiveIntensity 원본
  denying = true
  denyPulseStartTime = now
  RAF ensureLoop

매 RAF tick (denying === true):
  elapsed = now - denyPulseStartTime
  if (elapsed >= _denyPulseDuration) {
      // 종료
      body.material.emissive.copy(savedEmissive)
      body.material.emissiveIntensity = savedIntensity
      denying = false
  } else {
      phase = (now / 200ms) * 2π
      intensity = lerp(0, 1.5, (sin(phase) + 1) / 2)
      body.material.emissive.setHex(_denyPulseColor)  // 0xff3333
      body.material.emissiveIntensity = intensity
  }

idle 진입 조건: denying === false  →  RAF stop
```

### auto-revert 정책

```
tagGranted/tagDenied/tagWaiting 호출 시:
  setMode(result)
  dispatchEvent('@cardAccessSound', { result })
  if (result === 'denied') triggerDenyPulse()
  if (_autoRevertMs > 0) {
      clearTimeout(_revertTimerId)
      _revertTimerId = setTimeout(() => {
          if (mode !== _idleMode) setMode(_idleMode)
          _revertTimerId = null
      }, _autoRevertMs)
  }
```

### 사운드 이벤트 발행

```
const detail = { result };  // 'granted' | 'denied' | 'waiting'
const evt = new CustomEvent('cardAccessSound', { detail });
this.appendElement?.dispatchEvent(evt);  // GLTF root가 EventDispatcher를 가짐 (THREE.Object3D)

// 또는 옵션 _useBuiltinBeep=true일 때:
if (_useBuiltinBeep) {
    try {
        const audio = new Audio(BEEP_DATA_URI[result] || BEEP_DATA_URI.default);
        audio.volume = 0.3;
        audio.play().catch(() => {});  // 권한 미허용 시 무음 fallback
    } catch {}
}
```

> **3D 환경에서의 사운드 위임 정책**: 컴포넌트는 사운드 자원(파일 경로, AudioContext 등)을 직접 소유하지 않는다. 페이지가 출입 도메인 사운드 셋(승인음·거부음·대기음)을 단일 자원으로 묶어 관리하는 것이 자연스럽고, 브라우저 자동 재생 정책(user gesture 필요)을 페이지 레벨에서 일괄 처리할 수 있다. 컴포넌트는 이벤트 emit으로 통지만 한다. `_useBuiltinBeep` 옵션은 운영 환경에서는 권장하지 않으며 preview/데모 시 fallback으로만 사용 (data URI는 짧은 sine beep, 무음 fallback 보장).

### 커스텀 네임스페이스 `this.cardAccessFeedback`

| 메서드 | 동작 |
|--------|------|
| `tagGranted()` | `setMode('granted')` + `dispatchEvent('cardAccessSound', { result: 'granted' })` + (옵션) builtin beep + auto-revert 타이머 시작 |
| `tagDenied()` | `setMode('denied')` + `dispatchEvent('cardAccessSound', { result: 'denied' })` + (옵션) builtin beep + 본체 emissive 적색 sine 펄스 시작 + auto-revert 타이머 시작 |
| `tagWaiting()` | `setMode('waiting')` + `dispatchEvent('cardAccessSound', { result: 'waiting' })` + (옵션) builtin beep + auto-revert 타이머 시작 |
| `setMode(mode)` | `'granted'`/`'denied'`/`'waiting'` 받아 LED emissive intensity·opacity 토글 (이벤트/펄스/auto-revert 없음 — 순수 LED 갱신) |
| `setIdleMode(mode)` | auto-revert 후 복귀할 모드 (기본 `'waiting'`). 잘못된 값 무시 |
| `setLedColors({ granted?, denied?, waiting? })` | 부분 객체 허용. 각 LED material.color + emissive 갱신 |
| `setLedLayout(layout)` | `'horizontal'` (X축 배열) / `'vertical'` (Y축 배열). LED position 재계산 |
| `setLedOffset({x?, y?, z?})` | 부분 객체 허용. LED group 중심 (T40 mesh local) |
| `setLedRadius(r)` | SphereGeometry 반지름. mesh 풀 재생성 (geometry 크기는 생성 시 고정) |
| `setLedSpacing(s)` | LED 간 간격. position만 재계산 (mesh 재생성 불필요) |
| `setDenyPulseDuration(ms)` | tagDenied 펄스 총 지속 시간 (양수 ms). 잘못된 값 무시 |
| `setDenyPulseColor(hex)` | 펄스 색상 (0x000000 ~ 0xffffff). 잘못된 값 무시 |
| `setAutoRevertMs(ms)` | tagXxx 후 idleMode 복귀까지의 지연 (양수 ms 또는 null/0/-1로 영구) |
| `setUseBuiltinBeep(b)` | builtin beep fallback 사용 여부 (boolean). 기본 false |
| `setMeshName(name)` | LED 부착/펄스 대상 mesh 이름 (기본 `'T40'`). 변경 시 LED 재부착 + 펄스 자원 재캡처 |
| `getMode()` | 현재 모드 |
| `enable()` / `disable()` / `isEnabled()` | LED 채널 토글 (펄스/auto-revert는 별도) |
| `destroy()` | clearTimeout + cancelAnimationFrame + LED group remove + 3 material/1 geometry dispose + 본체 emissive 원본 복원 + 마지막 줄 `this.cardAccessFeedback = null` (self-null) |

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| `_meshName` | `'T40'` | Standard 동일 |
| `_mode` (초기) | `'waiting'` | preview 마운트 시 황색 LED 점등 (대기 상태가 카드 리더의 기본) |
| `_idleMode` | `'waiting'` | auto-revert 복귀 모드 |
| `_ledLayout` | `'horizontal'` | 가로 배열 (T40 본체가 가로보다 세로가 더 길지만, 위쪽에 가로 배치가 카드 리더 LED 패턴의 시각 관습) |
| `_ledOffset` | `{ x: 0, y: 0.00091, z: 0.00022 }` | T40 본체 위쪽(+y) + 약간 앞(+z). y_max=0.000771 위 +0.00014, z_max=0.000185 약간 앞 |
| `_ledRadius` | `0.00007` | bbox 가로(0.0007)의 약 10% — mesh local 좌표에서 시각 관찰 가능 |
| `_ledSpacing` | `0.00018` | 3개 LED 총 폭 0.00036 — 본체 가로 0.0007의 약 50% |
| `_denyPulseDuration` | `1500` (ms) | doorOpenClose 답습 — 1.5초 펄스 |
| `_denyPulseColor` | `0xff3333` | 적색 — 거부 알림의 시각 관습 |
| `_denyPulseMaxIntensity` | `1.5` | doorOpenClose / BATT/alarmPulse 답습 (ACESFilmic 톤매핑 1.2 환경 기준) |
| 펄스 sine 주기 | `200` (ms) | 빠른 펄스 — 1.5초 동안 7~8회 깜빡 |
| `_autoRevertMs` | `2000` (ms) | tagXxx 후 2초 뒤 waiting 복귀 — 카드 태깅 1회 결과 표시 시간 |
| `_useBuiltinBeep` | `false` | 운영에서는 페이지가 사운드 셋 관리. preview에서만 true 시도 가능(권한 미허용 시 무음) |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~ 동일 정책) |

> **자동 데모 정책**: register.js는 mount 직후 자동으로 `setMode('waiting')`로 대기 상태 LED 점등 → 1.5초 후 `tagGranted()` (녹색 LED + 사운드 이벤트) → 4초 후 `tagDenied()` (적색 LED + 본체 적색 sine 펄스 + 사운드 이벤트) → 7초 후 `tagWaiting()` 복귀. 운영에서는 페이지가 카드 리더 결과로 tagGranted/tagDenied/tagWaiting을 직접 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 본체 색상 채널) |

카드 태깅 결과는 별도 토픽이 아니라 페이지가 외부 트리거(인증 시스템·카드 리더 펌웨어 이벤트)로 `instance.cardAccessFeedback.tagGranted/tagDenied/tagWaiting`을 직접 호출 (#53/#55/#46 동일 외부 명령형 규약).

### 이벤트 (customEvents)

없음 (DesignComponent.customEvents 매핑 의미). 본 변형이 emit하는 `@cardAccessSound`는 `appendElement.dispatchEvent`로 직접 발행하는 외부 통지이며, customEvents/eventBus 매핑은 사용하지 않는다 (개별 단위 컴포넌트라 meshName이 확정이고 cardClicked 같은 동적 식별 이벤트가 불필요한 점은 #55 doorOpenClose와 동일).

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.cardAccessFeedback` API 등록 + 기본값 시드(_mode='waiting') + (THREE 가용 시) 자동 enable + LED group 생성/attach + equipmentStatus 구독 + 자동 데모 시퀀스(`waiting → 1.5s → tagGranted → 4s → tagDenied → 7s → tagWaiting`).
- 페이지가 `tagGranted/tagDenied/tagWaiting` 호출 시 → LED 갱신 + 사운드 이벤트 emit + (denied) emissive 펄스 RAF 시작 + auto-revert setTimeout 시작
- `beforeDestroy.js`: 구독 해제 → `this.cardAccessFeedback?.destroy()` (clearTimeout + cancelAnimationFrame + LED dispose + 본체 emissive 원본 복원 + self-null) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/cardAccessFeedback |
|------|----------|------------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.cardAccessFeedback` 네임스페이스 | 없음 | `tagGranted/tagDenied/tagWaiting/setMode/setIdleMode/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setDenyPulseDuration/setDenyPulseColor/setAutoRevertMs/setUseBuiltinBeep/setMeshName/getMode/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Group` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) | 없음 | 자체 생성 + T40 mesh 자식 attach + dispose |
| RAF 매 프레임 emissive sine 펄스 | 없음 | tagDenied 시 — duration 후 자동 종료 + emissive 원본 복원 + idle 일시정지 |
| setTimeout auto-revert 타이머 | 없음 | tagXxx 호출 후 _autoRevertMs 경과 시 idleMode로 복귀 |
| `T40.material.emissive` 채널 사용 | 없음 | tagDenied 시 sine wave 변조 |
| `appendElement.dispatchEvent('cardAccessSound')` 이벤트 emit | 없음 | tagXxx 호출 시 발행 |
| LED emissive 채널 (3 material 독립 토글) | 없음 | 사용 |
| beforeDestroy | meshState만 정리 | cardAccessFeedback(clearTimeout + RAF cancel + LED dispose + 본체 emissive 복원 + self-null) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 T40 본체 | 단일 색상 + 본체 위 3-LED + (denied 시) 본체 적색 sine 펄스 + (모든 tag 시) 사운드 이벤트 emit |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/cardAccessFeedback은 추가로 (a) 자체 Group + 3 SphereGeometry mesh + 3 material 자원 (b) T40 mesh 자식 attach 절차 (c) 본체 `material.emissive` 펄스 채널 (d) `tagXxx/setXxx/...` 외부 명령형 API (e) RAF (펄스 전용, idle pause) (f) setTimeout auto-revert (g) `cardAccessSound` 이벤트 emit (사운드 위임) — 일곱 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#54/#55 답습) |
| 2 | self-null `this.cardAccessFeedback = null` + clearTimeout + RAF cancel + 본체 emissive 복원 | OK — destroy 마지막 줄 self-null + clearTimeout(_revertTimerId) + cancelAnimationFrame(_pulseRafId) + LED group parent.remove + 3 material dispose + 1 geometry dispose + 본체 emissive 원본 복원 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.cardAccessFeedback?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachCardAccessFeedback(inst)` 내부 destroy도 clearTimeout + RAF cancel + LED dispose + 본체 emissive 복원 + `inst.cardAccessFeedback = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setMode/getMode` (#46/#53/#54 시그니처 그룹), `setLedXxx` (#53/#54 시그니처 그룹), `setDenyPulseXxx` (#55 doorOpenClose 시그니처 그룹), `tagGranted/tagDenied/tagWaiting` (1회성 트리거 — #55 `triggerDenied` 답습), `enable/disable/isEnabled/destroy` (전 시리즈 공통) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Status 4버튼 ↔ `meshState.renderData`, Tag Granted/Denied/Waiting 3버튼 ↔ `tagGranted/tagDenied/tagWaiting`, autoRevert 슬라이더 ↔ `setAutoRevertMs`, denyPulseDuration 슬라이더 ↔ `setDenyPulseDuration`, builtinBeep 토글 ↔ `setUseBuiltinBeep` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 데모(`waiting → 1.5s → tagGranted → 4s → tagDenied(적색 펄스) → 7s → tagWaiting`)로 LED 색상 변화 + denied 시 본체 적색 sine 펄스 + 사운드 이벤트 emit 시각/콘솔 분명 관찰. mesh local bbox 비례 LED 옵션(_ledRadius=0.00007, _ledSpacing=0.00018, _ledOffset y=0.00091)이 본체 위에 명확히 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**8항목 모두 통과.**

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 정적 자원 (선택) — 출입 사운드 셋
const accessSounds = {
    granted: new Audio('/assets/audio/access-granted.mp3'),
    denied:  new Audio('/assets/audio/access-denied.mp3'),
    waiting: new Audio('/assets/audio/access-waiting.mp3')
};

// loaded.js
this.cardReaderInst = wemb.getDesignComponent('CardReader_T40');

// 사운드 이벤트 핸들러 (컴포넌트가 emit, 페이지가 재생)
const onCardAccessSound = (evt) => {
    const result = evt.detail?.result;
    const audio = accessSounds[result];
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});  // 권한 미허용 시 무음 fallback
};
this.cardReaderInst.appendElement.addEventListener('cardAccessSound', onCardAccessSound);

// 인증 시스템 어댑터
const onCardTag = ({ response: data }) => {
    // data: { result: 'granted'|'denied'|'waiting', userId?, reason? }
    if (data.result === 'granted') {
        this.cardReaderInst.cardAccessFeedback.tagGranted();
    } else if (data.result === 'denied') {
        this.cardReaderInst.cardAccessFeedback.tagDenied();
    } else {
        this.cardReaderInst.cardAccessFeedback.tagWaiting();
    }
};

// before_unload.js
this.cardReaderInst.appendElement.removeEventListener('cardAccessSound', onCardAccessSound);
```

---

## 모델 주의사항

- `models/CardReader_T40/01_default/CardReader_T40.gltf`의 단일 Mesh 이름은 `'T40'`로 확정 (Standard register.js / preview / GLTF 파일 직접 검증). LED 부착 / 펄스 모두 `getObjectByName('T40')`로 mesh를 직접 조회한다.
- root node에 `scale: [1000, 1000, 1000]`이 적용되어 있어 화면상에는 T40이 적당한 크기로 보인다. LED는 mesh의 자식으로 add되어 mesh **local 좌표계**(bbox max 약 0.000771)를 사용하므로 LED offset/radius/spacing은 mesh local bbox에 비례하여 매우 작은 값(`_ledRadius=0.00007`, `_ledSpacing=0.00018`, `_ledOffset.y=0.00091`)으로 설정.
- LED 3개는 T40 mesh의 자식으로 add — T40 이동/회전 시 LED가 그대로 따라온다.
- 본체 emissive 펄스는 `T40` mesh 자체의 material을 변조하므로 LED와 채널 분리 (LED는 별도 mesh + 별도 material).
- **사운드는 페이지 책임**: 컴포넌트는 `cardAccessSound` 이벤트만 emit. `_useBuiltinBeep=true`일 때만 짧은 data URI 비프음 fallback (권한 미허용·자원 미가용 시 무음).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='T40'는 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 / Standard preview에서 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 메모

- **MultiLedStateMixin 임계점 3개 도달 (#53 UPS + #54 B3F_UPS + #61 본 변형)**: LED 합성 부분(`setMode/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setMeshName/getMode/enable/disable/isEnabled/destroy` + LED 옵션값)이 3개 컴포넌트에서 동일. 사용자가 메인 외부에서 `create-mixin-spec` → `implement-mixin` 호출로 즉시 승격 검토 강력 권장 (모델 bbox 비례 LED 옵션 scale-down 정책 그대로 흡수).
- **CardAccessFeedbackMixin 후보**: 본 변형은 카드 리더 도메인 1차 등장. SpeedGate(#58~#60 대기) 등 후속 출입 통제 컴포넌트가 등장하면 `CardAccessFeedbackMixin` 답습 가능성 — `tagGranted/tagDenied/tagWaiting/cardAccessSound 이벤트 emit/auto-revert` 시그니처 흡수. 단 1차 등장 단계이므로 임계점 미도달 → 단일 컴포넌트 전용 커스텀 메서드 채택.
- **사운드 위임 정책 (3D 환경 표준)**: 컴포넌트가 사운드 자원을 소유하면 (a) 페이지의 사운드 셋 통합 관리 곤란 (b) 브라우저 자동 재생 정책 위반 위험 (c) 컴포넌트 단위 dispose 시 audio 자원 누수 위험 — 셋 다 발생. 따라서 컴포넌트는 이벤트 emit만 하고 페이지가 audio 라이프사이클을 관리. `_useBuiltinBeep`은 preview 데모용 fallback (권한 미허용 시 무음).
- **LED layout 결정**: T40 본체는 가로(0.0007)보다 세로(0.00154)가 더 길지만, 카드 리더의 LED는 일반적으로 본체 위쪽 가로 배치(시각 관습)이므로 horizontal 채택. 페이지에서 `setLedLayout('vertical')` 호출 시 세로 배치도 가능.
- **emissive 펄스 + LED 채널 충돌 회피**: 본체 emissive(펄스)와 LED material(자식 mesh의 emissive)는 완전히 다른 material 객체이므로 간섭 없음. MeshState의 `material.color`(본체 base color)도 emissive와 직교 채널이라 적색 펄스 중에도 base color는 normal/warning/error/offline 그대로 유지.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + clearTimeout + 본체 emissive 원본 복원 + LED group dispose. enable은 RAF 재진입 안전(중복 시작 방지 — `_pulseRafId !== null`이면 ensureLoop no-op). auto-revert 타이머도 destroy 시 clearTimeout 필수.
