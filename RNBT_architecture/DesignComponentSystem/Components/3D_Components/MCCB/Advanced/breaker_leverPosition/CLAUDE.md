# MCCB — Advanced/breaker_leverPosition

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 루트 Group `MCCB`의 3개 자식 Mesh(`Object299`·`Object300`·`Rectangle180`) 색상 변경 (Standard 승계, `material.color` 채널)
2. **차단기 레버 회전** — ON/OFF/TRIP 운전 상태에 따라 자식 Mesh **`Rectangle180`**(토글/트립 레버)의 `rotation[axis]`를 1차 시스템 응답으로 보간하여 부드럽게 회전. ON은 위쪽(+30°), OFF는 아래쪽(-30°), TRIP은 중간(0°)
3. **TRIP 색상 펄스** — TRIP 상태일 때 `Rectangle180` material의 `emissive`를 sine wave로 주기적으로 변조하여 적색 발광 펄스 — 자동 차단(인간 조작과 구분)을 시각적으로 강조
4. **RAF idle 일시정지** — 목표 각도에 도달하고(epsilon 미만 차이) TRIP 펄스가 비활성이면 RAF stop (비용 0). setState 호출로 0이 아닌 차이가 생기면 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.breakerLeverPosition.setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`를 직접 호출하여 레버 상태 제어

---

## MCCB 레버 mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/MCCB/01_default/MCCB.gltf` |
| GLTF 구조 | `scene → "MCCB"(Group) → [Object299, Object300, Rectangle180]` |
| MeshState 타겟 (색상) | `'MCCB'` (루트 Group, Standard 승계 — Group traverse로 3개 자식 일괄 색상) |
| 회전 대상 mesh 이름 | **`Rectangle180`** (토글/트립 레버 — material 2 `WHITE`, 정점 132/인덱스 228) |
| TRIP 펄스 대상 | **`Rectangle180`** (회전 대상과 동일 — emissive 채널) |
| 결정 | **자식 Mesh 직접 회전 + emissive 펄스** — 루트 Group이 아니라 특정 자식만 transform 갱신 |

근거: 컴포넌트 루트 CLAUDE.md에 명시된 GLTF 구조에서 `Rectangle180`이 토글 스위치/트립 레버로 식별된다(material 2 `WHITE`, 본체 위 소량 translation `[0, 0.022, 0.022]`로 배치). 자식 노드는 quaternion `[0.7071, 0, 0, 0.7071]`(X축 90° baked rotation)이 이미 적용되어 있어 mesh 자체의 좌표계에서 X축이 "전후 토글 축"에 해당한다 — 페이지에서 `rotation.x`를 갱신하면 quaternion이 곱해져 레버 본체가 위/아래로 흔들리는 시각 효과가 된다. 색상 채널은 **MeshState가 루트 Group을 traverse하여 3개 자식을 일괄 적용**하므로 색상과 transform 채널은 완전 직교 — `Object299`·`Object300`은 색상만 변하고, `Rectangle180`만 회전이 누적된다.

본 변형은 GLTF 클립이 아니라 자식 mesh의 rotation 직접 갱신으로 동작하므로 GLTF에 AnimationClip이 정의되어 있지 않아도 무방하다 (`MCCB.gltf`의 `animations` 배열은 비어있음 — 클립 의존 없음 정책의 자연 정합).

---

## 답습 모범 — #38 Pump + #39 Heatexchanger + #40 AHU103 (dynamicRpm 시리즈) + BATT/alarmPulse

본 변형은 **두 개의 답습 축**을 결합한다:
- **회전 채널**: #38~#40 dynamicRpm 시리즈의 **1차 시스템 응답 보간 + RAF idle 일시정지** 패턴을 그대로 답습 (`currentAngle += (target - current) * (dt/inertia)`).
- **TRIP 펄스 채널**: BATT/Advanced/alarmPulse의 **emissive sine wave 변조 + 원본 보관/복원** 패턴을 그대로 답습.

| 답습 | 항목 |
|------|------|
| `#38 Pump/Advanced/dynamicRpm` | **1차 시스템 응답 보간 알고리즘 + RAF idle 일시정지 정책** |
| `#39 Heatexchanger/Advanced/dynamicRpm` | 답습 1차 후속 |
| `#40 AHU103/Advanced/dynamicRpm` | 직전 사이클 답습 — `setMeshName/setInertia/setRotationAxis` 시그니처 일관성 |
| `BATT/Advanced/alarmPulse` | **emissive sine wave 변조 + 원본 보관/복원 + RAF self-null** |

### #46~#49 차단기 시리즈 — 본 변형이 1차 등장 모범

본 변형(#46 MCCB)은 차단기 시리즈 5개(#45 VCB Standard 미생산으로 보류 + #46 MCCB + #47 ALTS + #48 ACBmetasol + #49 ACBsusol) 중 **1차 등장**이다. ALTS/ACBmetasol/ACBsusol는 모두 본 변형을 100% 답습 예정이며, 차이는 다음과 같다:

| 항목 | #46 MCCB (본) | 후속 답습 시 |
|------|--------------|--------------|
| `meshName` (MeshState 타겟) | `'MCCB'` | 각 차단기명 (`'ALTS'` 등) |
| `_leverMeshName` (회전 대상 자식) | `'Rectangle180'` | 각 GLTF 자식 레버명 |
| 회전 축 / 알고리즘 / 시그니처 / RAF / 펄스 정책 | — | **동일** |

**큐 설명 (#46)**: "ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (신규 Mixin **없음**)

### Mixin 승격 후보 (#46~#49 답습 임계점)

> **BreakerLeverPositionMixin 승격 후보 (#46~#49 예정)** — 본 변형이 1차 등장이므로 단일 컴포넌트 전용으로 커스텀 메서드 채택. ALTS/ACBmetasol/ACBsusol(#47/#48/#49)에서 100% 답습이 누적되면 4개 컴포넌트 임계점에 도달 — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`) 그대로 흡수 가능 + ON/OFF/TRIP 3-state 도메인이 차단기 전반에 동일.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (신규 Mixin 없음 — 1차 등장)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: breakerLeverPosition은 (a) 자식 `Rectangle180`의 `rotation` 채널 + (b) `Rectangle180`의 `material.emissive` 채널만 사용한다. MeshStateMixin이 사용하는 `material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | 루트 Group traverse → 모든 자식 `material.color` | 데이터 상태 색상 (Standard 승계, 3개 자식 일괄) |
| breakerLeverPosition (회전) | `Rectangle180.rotation[axis]` | ON/OFF/TRIP 각도 (1차 시스템 응답 보간) |
| breakerLeverPosition (TRIP 펄스) | `Rectangle180.material.emissive` + `emissiveIntensity` | TRIP 상태 sine wave 적색 발광 |

세 채널은 직교 — 색상·transform·발광이 서로 간섭하지 않는다. MeshStateMixin이 매 status 갱신마다 자식들의 material을 clone해도 (a) `Rectangle180.rotation`은 transform이라 영향 없음, (b) `emissive`는 MeshState가 건드리지 않으므로 clone 후에도 보존됨. **단** `Rectangle180`이 traverse 대상이므로 MeshState가 material을 clone하면 펄스가 매 RAF tick에서 `getObjectByName('Rectangle180').material`을 재조회하여 stale clone을 회피한다 (BATT/alarmPulse 동일 정책).

### 1차 시스템 응답 (회전 보간) 알고리즘

```
매 RAF tick (dt = (now - lastTick) / 1000):
  // 1) currentAngle을 targetAngle로 1차 시스템 보간
  alpha         = clamp(dt / inertia, 0, 1)
  currentAngle += (targetAngle - currentAngle) * alpha

  // 2) Rectangle180.rotation[axis]를 currentAngle로 절대 갱신
  //    (#38~#40 dynamicRpm은 누적 갱신, 본 변형은 절대 갱신 — 목표 각도 도달이 의미 있음)
  lever.rotation[axis] = initialRotation[axis] + currentAngle

  // 3) TRIP 펄스 (state === 'TRIP'일 때만)
  phase     = (now / pulsePeriod) * 2π
  intensity = lerp(0, maxIntensity, (sin(phase) + 1) / 2)
  lever.material.emissive.setHex(pulseColor)
  lever.material.emissiveIntensity = intensity

  // 4) idle 일시정지 — 목표 도달 + TRIP 펄스 비활성
  if (|targetAngle - currentAngle| < epsilon && !pulseActive) {
      currentAngle = targetAngle
      RAF stop
  }
```

#### #38~#40 dynamicRpm과의 알고리즘 차이

| 항목 | #38~#40 dynamicRpm | #46 breaker_leverPosition |
|------|---------------------|---------------------------|
| rotation 갱신 방식 | 누적 (`+=` rate × dt) | **절대** (`=` initial + currentAngle) |
| 의미 | 연속 회전 (RPM = 분당 회전수) | 정적 각도 (ON/OFF/TRIP 3-state) |
| 목표 변수 | targetRpm (rad/s 비례) | targetAngle (rad) |
| idle 조건 | `targetRpm===0 && |currentRpm|<eps` | `|target-current|<eps && !TRIP펄스` |
| 추가 채널 | 없음 | `emissive` 펄스 (TRIP 시) |

알고리즘 핵심 — 1차 시스템 응답 보간 + RAF idle 일시정지 + RAF self-null — 은 동일.

### 커스텀 네임스페이스 `this.breakerLeverPosition`

| 메서드 | 동작 |
|--------|------|
| `setState(state)` | `'ON'`/`'OFF'`/`'TRIP'` 받아 `targetAngle`을 `_angleByState[state]`로 갱신 + TRIP이면 펄스 활성, 아니면 펄스 정지(emissive 원복). RAF idle 시 자동 재시작 |
| `setAngleMap(map)` | `{ ON, OFF, TRIP }` 라디안 각도 커스터마이즈. 부분 객체 허용 (병합) |
| `setRotationAxis(axis)` | 회전 축 `'x'`/`'y'`/`'z'` (기본 `'x'`). 잘못된 값 무시. 변경 시 회전 0으로 reset 후 새 축에 적용 |
| `setLeverMeshName(name)` | 회전/펄스 대상 자식 mesh를 외부에서 지정 (기본 `'Rectangle180'`). 답습 컴포넌트(ALTS 등)에서 자식명 교체 시 사용 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 0.4s). 작을수록 빠르게 도달 — 차단기 레버는 RPM보다 빠른 동작이 자연(0.4s 권장) |
| `getState()` | 현재 state (`'ON'`/`'OFF'`/`'TRIP'`) |
| `getCurrentAngle()` | 현재 보간된 각도 (rad) |
| `enable()` / `disable()` | 회전 채널 토글. disable 시 RAF stop + (옵션) 회전 reset + emissive 원복 |
| `destroy()` | RAF cancel + Rectangle180.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원 + 모든 reference null + 마지막 줄 `this.breakerLeverPosition = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| `_state` (초기) | `'OFF'` | 마운트 시 OFF 위치(아래쪽) |
| `_leverMeshName` | `'Rectangle180'` | MCCB GLTF 자식 레버 (Standard/CLAUDE.md 명시 노드명) |
| `_rotationAxis` | `'x'` | quaternion baked X-rotation을 가진 자식이므로 mesh-local X가 토글 축 |
| `_angleByState` | `{ ON: π/6, OFF: -π/6, TRIP: 0 }` | ±30°/0° — preview에서 명확히 시각 분간 가능 |
| `_inertia` | 0.4 (sec) | 약 0.4s에 95% 도달 — 차단기 동작감으로 자연 (RPM보다 빠른 응답 — dynamicRpm 1.5s 대비) |
| `_pulseColor` (TRIP) | 0xff4444 | 적색 발광 — 자동 차단(인간 조작과 구분) 강조 |
| `_pulsePeriod` (TRIP) | 800 (ms) | error 알람 700ms와 비슷한 빠른 펄스 |
| `_pulseMaxIntensity` (TRIP) | 1.5 | BATT/alarmPulse와 동일 (ACESFilmic 톤매핑 1.2 환경 기준) |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#40 동일 정책) |

> **자동 데모 정책**: register.js는 자동 setState 호출하지 않음. preview에서 마운트 직후 시퀀스로 `setState('OFF')→'ON'→'TRIP'→'OFF'`를 호출하여 시각 관찰 보장. 운영에서는 페이지가 차단기 상태 데이터로 setState 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만, MCCB Group traverse) |

레버 상태 변경은 페이지가 외부 명령형으로 직접 호출 (`instance.breakerLeverPosition.setState(...)`). 색상과 레버 상태는 직교 토픽 — 같은 차단기에서 색상은 normal/warning/error/offline, 레버는 ON/OFF/TRIP. 별도 구독 없음 (#9/#38~#40 동일 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MCCB' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.breakerLeverPosition` API 등록 + (THREE 가용 시) 자동 enable + equipmentStatus 구독. 초기 state=`'OFF'`, currentAngle=`-π/6`로 즉시 적용. RAF는 idle (`|target-current|<eps && !TRIP`)
- 페이지가 `instance.breakerLeverPosition.setState('TRIP')` 호출 등으로 회전 + 펄스 트리거
- `beforeDestroy.js`: 구독 해제 → `this.breakerLeverPosition?.destroy()` (RAF cancel + 회전/emissive 복원 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/breaker_leverPosition |
|------|----------|--------------------------------|
| `applyMeshStateMixin` | ✓ (루트 Group `MCCB` traverse) | ✓ (동일) |
| `this.breakerLeverPosition` 네임스페이스 | 없음 | `setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + rotation 절대 갱신 | 없음 | 있음 — idle 시 자동 정지/재시작 |
| `Rectangle180.rotation[axis]` 채널 사용 | 없음 | 사용 (절대 갱신 + destroy reset) |
| `Rectangle180.material.emissive` 채널 사용 | 없음 | TRIP 시 sine wave 변조 (BATT/alarmPulse 답습) |
| beforeDestroy | meshState만 정리 | breakerLeverPosition(RAF + 회전 reset + emissive 복원) → meshState 역순 |
| 화면 표시 | 단일 색상 MCCB 본체 | 단일 색상 + 자식 `Rectangle180` 레버 ON/OFF/TRIP 회전 + TRIP 적색 펄스 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/breaker_leverPosition은 추가로 (a) 자식 `Rectangle180.rotation[axis]` 채널 (b) 자식 `Rectangle180.material.emissive` TRIP 펄스 채널 (c) `setState/setAngleMap/...` 외부 명령형 API (d) RAF 매 프레임 1차 시스템 응답 보간 (e) idle 일시정지 — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#38~#40 답습) |
| 2 | self-null `this.breakerLeverPosition = null` + RAF cancel + 회전/emissive 복원 | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + Rectangle180 rotation 원본 복원 + emissive 원본 복원 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.breakerLeverPosition?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachBreakerLeverPosition(inst)` 내부 destroy도 RAF cancel + 회전/emissive 복원 + `inst.breakerLeverPosition = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/enable/disable/destroy` (#38~#40 dynamicRpm + BATT/alarmPulse 시그니처 그룹 일관) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Status 4버튼 ↔ `meshState.renderData`, Lever 3버튼 ON/OFF/TRIP ↔ `setState`, axis 토글 x/y/z ↔ `setRotationAxis`, inertia 슬라이더 ↔ `setInertia` |
| 7 | 기본값 시각 관찰 | OK — 마운트 직후 자동 enable + 시퀀스 데모(`OFF→1.5s→ON→3s→TRIP→5s→OFF`)로 회전+펄스 명확히 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**8항목 모두 통과.** 알고리즘·API 시그니처·RAF 정책·destroy 규약은 #38~#40 dynamicRpm + BATT/alarmPulse 답습 그대로.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.mccbInst = wemb.getDesignComponent('MCCB');

// 차단기 상태 토픽 어댑터
const onBreakerState = ({ response: data }) => {
    // data: { state: 'ON' | 'OFF' | 'TRIP' }
    this.mccbInst.breakerLeverPosition.setState(data.state);
};

// 외부 직접 제어
this.mccbInst.breakerLeverPosition.setInertia(0.6);              // 좀 더 느린 동작
this.mccbInst.breakerLeverPosition.setAngleMap({ ON: Math.PI/4 }); // 더 큰 각도(45°)
```

---

## 모델 주의사항

- `models/MCCB/01_default/MCCB.gltf`의 자식 mesh 이름은 `'Object299'`/`'Object300'`/`'Rectangle180'`로 확정. 본 변형은 `getObjectByName('Rectangle180')`로 회전 대상 자식을 직접 조회한다.
- 자식 노드는 quaternion `[0.7071, 0, 0, 0.7071]`(X축 90° baked rotation)이 이미 적용되어 있으므로 mesh-local `rotation.x`를 갱신하면 quaternion이 곱해져 시각적으로 "전후 토글" 효과가 된다 (절대 갱신 — `lever.rotation.x = baked + currentAngle`).
- GLTF에 AnimationClip이 정의되어 있지 않다 (`animations` 배열 비어있음) — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없으므로 무방.
- MCCB는 루트 scale이 없는 소형 원시 좌표형(~0.10×0.09×0.20 단위) — preview는 Standard와 동일한 바운드 기반 자동 거리(`maxDim*2.2`)와 `near=0.01, far=100` 사용.
- **[MODEL_READY] placeholder 사용 안 함** — meshName=`'MCCB'`/leverMeshName=`'Rectangle180'`은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 메모 (#46~#49 답습 임계점 예정)

- **Mixin 승격 후보 (#46~#49 누적 시)**: 본 변형은 차단기 시리즈 1차 등장이므로 단일 컴포넌트 전용 → 커스텀 규칙 + 신규 Mixin 금지 정책으로 완결. ALTS/ACBmetasol/ACBsusol(#47/#48/#49)에서 100% 답습이 누적되면 4개 컴포넌트 임계점에 도달하여 **`BreakerLeverPositionMixin` 승격 검토 권장** (메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출).
- **#38~#40 dynamicRpm 시리즈와의 차이**: 회전 알고리즘 핵심(1차 시스템 응답 + RAF idle pause + RAF self-null)은 동일하나 **갱신 방식이 누적(+=) vs 절대(=)**, **추가 채널이 emissive 펄스**라는 두 가지 차이로 RotaryRpmMixin과는 별도 Mixin이 자연스럽다. 두 시리즈를 한 Mixin으로 통합하면 옵션 분기 폭발 — ADVANCED_QUEUE.md의 "3차 — 같은 기능이라도 기법이 다르면 통합하지 않는다" 규칙 적용.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + Rectangle180.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
