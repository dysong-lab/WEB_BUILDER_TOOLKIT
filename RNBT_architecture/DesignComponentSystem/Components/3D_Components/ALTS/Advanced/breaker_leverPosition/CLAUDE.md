# ALTS — Advanced/breaker_leverPosition

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 Mesh `ALTS-1`의 색상 변경 (Standard 승계, `material.color` 채널)
2. **차단기 레버 회전** — ON/OFF/TRIP 운전 상태에 따라 단일 Mesh **`ALTS-1`**(`[MODEL_READY]` placeholder — 본체+레버 일체)의 `rotation[axis]`를 1차 시스템 응답으로 보간하여 부드럽게 회전. ON은 위쪽(+30°), OFF는 아래쪽(-30°), TRIP은 중간(0°)
3. **TRIP 색상 펄스** — TRIP 상태일 때 `ALTS-1` material의 `emissive`를 sine wave로 주기적으로 변조하여 적색 발광 펄스 — 자동 차단(인간 조작과 구분)을 시각적으로 강조
4. **RAF idle 일시정지** — 목표 각도에 도달하고(epsilon 미만 차이) TRIP 펄스가 비활성이면 RAF stop (비용 0). setState 호출로 0이 아닌 차이가 생기면 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.breakerLeverPosition.setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`를 직접 호출하여 레버 상태 제어

---

## ALTS 레버 mesh 구조 결정 — `[MODEL_READY]` placeholder

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/ALTS/01_default/ALTS.gltf` |
| GLTF 구조 | `scene → "ALTS-1"(Mesh, 자식 없음)` — **단일 Mesh** |
| MeshState 타겟 (색상) | `'ALTS-1'` (Standard 승계, 단일 Mesh `material.color`) |
| 회전 대상 mesh 이름 | **`ALTS-1`** (`[MODEL_READY]` placeholder — 단일 Mesh 자체 회전) |
| TRIP 펄스 대상 | **`ALTS-1`** (회전 대상과 동일 — emissive 채널) |
| 결정 | **단일 Mesh 직접 회전 + emissive 펄스** — 본체와 레버가 함께 회전하는 **모델 한계** |

### ALTS 모델 한계 — `[MODEL_READY]` 처리 사유

ALTS GLTF는 **단일 Mesh `ALTS-1`** 구조이다 (`scene → ALTS-1` 단일 노드, 자식 없음). MCCB의 `Group + 3 child Mesh(Object299/Object300/Rectangle180)` 구조와 달리 분리된 레버 자식 mesh가 존재하지 않는다. 따라서:

- **현재 구현**: `_leverMeshName = 'ALTS-1'`로 단일 mesh 자체를 회전. 본체와 레버가 일체로 흔들리는 시각 효과가 된다 — 차단기 동작감을 표현하지만 본체가 함께 회전하는 한계가 있다.
- **`[MODEL_READY]` 표식 위치**:
  - `register.js` 최상단 TODO 주석 + `DEFAULT_LEVER_MESH_NAME` 상수 옆 인라인 주석
  - `preview/01_default.html`의 demo-hint 영역 + 자동 데모 로그 + COMPONENT 본문 주석 + attach 함수 내부 상수 주석
  - 본 CLAUDE.md (이 절)
- **모델 업데이트 시 마이그레이션**: GLTF가 본체/레버로 분리되면 (예: `ALTS-1`이 Group이 되고 `ALTS-1-body`/`ALTS-1-lever` 자식이 생기면) 페이지에서 `instance.breakerLeverPosition.setLeverMeshName('ALTS-1-lever')` 한 줄로 교체 가능. **시그니처 변경 없음** — `setLeverMeshName` API가 답습 시 자식명 교체용으로 이미 노출되어 있다.

본 변형은 GLTF 클립이 아니라 mesh의 rotation 직접 갱신으로 동작하므로 GLTF에 AnimationClip이 정의되어 있지 않아도 무방하다 (`ALTS.gltf`의 `animations` 배열은 비어있음 — 클립 의존 없음 정책의 자연 정합).

---

## 답습 모범 — #46 MCCB/Advanced/breaker_leverPosition (1차 등장 모범)

본 변형(#47 ALTS)은 **#46 MCCB/Advanced/breaker_leverPosition을 100% 답습**한다. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`), 알고리즘(1차 시스템 응답 보간 + 절대 갱신), RAF 정책(idle 일시정지 + self-null), TRIP emissive sine 펄스, destroy 규약 모두 동일.

| 답습 | 항목 |
|------|------|
| `#46 MCCB/Advanced/breaker_leverPosition` | **시그니처 100% 동일 — 차단기 시리즈 1차 등장 모범** |
| `#38 Pump/Advanced/dynamicRpm` (#46 경유) | 1차 시스템 응답 보간 + RAF idle 일시정지 |
| `#39 Heatexchanger/Advanced/dynamicRpm` (#46 경유) | 답습 1차 후속 |
| `#40 AHU103/Advanced/dynamicRpm` (#46 경유) | `setMeshName/setInertia/setRotationAxis` 시그니처 일관성 |
| `BATT/Advanced/alarmPulse` (#46 경유) | emissive sine wave 변조 + 원본 보관/복원 + RAF self-null |

### #46과의 옵션값 차이

| 항목 | #46 MCCB | #47 ALTS (본) |
|------|----------|---------------|
| `meshName` (MeshState 타겟) | `'MCCB'` (Group, 3 자식 traverse) | **`'ALTS-1'`** (단일 Mesh 직접) |
| `_leverMeshName` (회전/펄스 대상) | `'Rectangle180'` (자식 레버) | **`'ALTS-1'`** (`[MODEL_READY]` 단일 Mesh 자체) |
| 회전 축 / 알고리즘 / 시그니처 / RAF / 펄스 정책 | — | **동일** |
| 모델 한계 | 자식 레버 분리됨 | 단일 Mesh — 본체/레버 일체 회전 |

### #46~#49 차단기 시리즈 — 본 변형은 2차 답습

본 변형(#47 ALTS)은 차단기 시리즈 5개(#45 VCB Standard 미생산으로 보류 + #46 MCCB(1차) + **#47 ALTS(본)** + #48 ACBmetasol + #49 ACBsusol) 중 **2차 답습**이다. 후속 ACBmetasol/ACBsusol(#48/#49) 누적 시 4개 컴포넌트 임계점에 도달 — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장.

**큐 설명 (#47)**: "ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (#46 답습, 신규 Mixin **없음**)

### Mixin 승격 후보 (#46~#49 답습 임계점 — 본 변형은 2/4)

> **BreakerLeverPositionMixin 승격 후보 (#46~#49 예정)** — #46 MCCB 1차 등장 + **#47 ALTS(본) 2차 답습** = 누적 2개. ACBmetasol/ACBsusol(#48/#49)에서 100% 답습이 누적되면 4개 컴포넌트 임계점에 도달 — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`) 그대로 흡수 가능 + ON/OFF/TRIP 3-state 도메인이 차단기 전반에 동일.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (#46 답습, 신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: breakerLeverPosition은 (a) `ALTS-1`의 `rotation` 채널 + (b) `ALTS-1`의 `material.emissive` 채널만 사용한다. MeshStateMixin이 사용하는 `material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `ALTS-1` `material.color` | 데이터 상태 색상 (Standard 승계, 단일 Mesh) |
| breakerLeverPosition (회전) | `ALTS-1.rotation[axis]` | ON/OFF/TRIP 각도 (1차 시스템 응답 보간) |
| breakerLeverPosition (TRIP 펄스) | `ALTS-1.material.emissive` + `emissiveIntensity` | TRIP 상태 sine wave 적색 발광 |

세 채널은 직교 — 색상·transform·발광이 서로 간섭하지 않는다. MeshStateMixin이 매 status 갱신마다 material을 clone해도 (a) `ALTS-1.rotation`은 transform이라 영향 없음, (b) `emissive`는 MeshState가 건드리지 않으므로 clone 후에도 보존됨. **단** `ALTS-1`이 동일 mesh이므로 MeshState가 material을 clone하면 펄스가 매 RAF tick에서 `getObjectByName('ALTS-1').material`을 재조회하여 stale clone을 회피한다 (BATT/alarmPulse 동일 정책).

### 1차 시스템 응답 (회전 보간) 알고리즘

```
매 RAF tick (dt = (now - lastTick) / 1000):
  // 1) currentAngle을 targetAngle로 1차 시스템 보간
  alpha         = clamp(dt / inertia, 0, 1)
  currentAngle += (targetAngle - currentAngle) * alpha

  // 2) ALTS-1.rotation[axis]를 currentAngle로 절대 갱신
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

알고리즘 핵심 — 1차 시스템 응답 보간 + RAF idle 일시정지 + RAF self-null + TRIP emissive 펄스 — 은 #46 MCCB와 100% 동일.

### 커스텀 네임스페이스 `this.breakerLeverPosition`

| 메서드 | 동작 |
|--------|------|
| `setState(state)` | `'ON'`/`'OFF'`/`'TRIP'` 받아 `targetAngle`을 `_angleByState[state]`로 갱신 + TRIP이면 펄스 활성, 아니면 펄스 정지(emissive 원복). RAF idle 시 자동 재시작 |
| `setAngleMap(map)` | `{ ON, OFF, TRIP }` 라디안 각도 커스터마이즈. 부분 객체 허용 (병합) |
| `setRotationAxis(axis)` | 회전 축 `'x'`/`'y'`/`'z'` (기본 `'x'`). 잘못된 값 무시. 변경 시 회전 0으로 reset 후 새 축에 적용 |
| `setLeverMeshName(name)` | 회전/펄스 대상 mesh를 외부에서 지정 (기본 `'ALTS-1'`). **`[MODEL_READY]` 마이그레이션 경로** — GLTF가 본체/레버로 분리되면 자식 레버명으로 교체 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 0.4s). 작을수록 빠르게 도달 |
| `getState()` | 현재 state (`'ON'`/`'OFF'`/`'TRIP'`) |
| `getCurrentAngle()` | 현재 보간된 각도 (rad) |
| `enable()` / `disable()` | 회전 채널 토글. disable 시 RAF stop + emissive 원복 |
| `destroy()` | RAF cancel + ALTS-1.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원 + 모든 reference null + 마지막 줄 `this.breakerLeverPosition = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 / 비고 |
|------|-------|----------|
| `_state` (초기) | `'OFF'` | 마운트 시 OFF 위치(아래쪽) |
| `_leverMeshName` | **`'ALTS-1'`** | **`[MODEL_READY]` placeholder** — 단일 Mesh 자체 회전. 향후 자식 레버 분리 시 교체 |
| `_rotationAxis` | `'x'` | #46 MCCB 동일 가정. 모델 업데이트 시 회전축 재조정 필요 가능 |
| `_angleByState` | `{ ON: π/6, OFF: -π/6, TRIP: 0 }` | ±30°/0° — preview에서 명확히 시각 분간 가능 |
| `_inertia` | 0.4 (sec) | 약 0.4s에 95% 도달 — 차단기 동작감으로 자연 (#46 동일) |
| `_pulseColor` (TRIP) | 0xff4444 | 적색 발광 (#46 동일) |
| `_pulsePeriod` (TRIP) | 800 (ms) | error 알람 700ms와 비슷한 빠른 펄스 |
| `_pulseMaxIntensity` (TRIP) | 1.5 | BATT/alarmPulse·#46 동일 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#46 동일 정책) |

> **자동 데모 정책**: register.js는 자동 setState 호출하지 않음. preview에서 마운트 직후 시퀀스로 `setState('OFF')→'ON'→'TRIP'→'OFF'`를 호출하여 시각 관찰 보장. 운영에서는 페이지가 차단기 상태 데이터로 setState 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만, 단일 Mesh `ALTS-1`) |

레버 상태 변경은 페이지가 외부 명령형으로 직접 호출 (`instance.breakerLeverPosition.setState(...)`). #46 동일 규약.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='ALTS-1' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.breakerLeverPosition` API 등록 + (THREE 가용 시) 자동 enable + equipmentStatus 구독. 초기 state=`'OFF'`, currentAngle=`-π/6`로 즉시 적용. RAF는 idle (`|target-current|<eps && !TRIP`)
- 페이지가 `instance.breakerLeverPosition.setState('TRIP')` 호출 등으로 회전 + 펄스 트리거
- `beforeDestroy.js`: 구독 해제 → `this.breakerLeverPosition?.destroy()` (RAF cancel + 회전/emissive 복원 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/breaker_leverPosition |
|------|----------|--------------------------------|
| `applyMeshStateMixin` | ✓ (단일 Mesh `ALTS-1`) | ✓ (동일) |
| `this.breakerLeverPosition` 네임스페이스 | 없음 | `setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + rotation 절대 갱신 | 없음 | 있음 — idle 시 자동 정지/재시작 |
| `ALTS-1.rotation[axis]` 채널 사용 | 없음 | 사용 (절대 갱신 + destroy reset) |
| `ALTS-1.material.emissive` 채널 사용 | 없음 | TRIP 시 sine wave 변조 (BATT/alarmPulse 답습) |
| beforeDestroy | meshState만 정리 | breakerLeverPosition(RAF + 회전 reset + emissive 복원) → meshState 역순 |
| 화면 표시 | 단일 색상 ALTS-1 본체 | 단일 색상 + ALTS-1 ON/OFF/TRIP 회전 + TRIP 적색 펄스 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/breaker_leverPosition은 추가로 (a) `ALTS-1.rotation[axis]` 채널 (b) `ALTS-1.material.emissive` TRIP 펄스 채널 (c) `setState/setAngleMap/...` 외부 명령형 API (d) RAF 매 프레임 1차 시스템 응답 보간 (e) idle 일시정지 — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#46 답습) |
| 2 | self-null `this.breakerLeverPosition = null` + RAF cancel + 회전/emissive 복원 | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + ALTS-1 rotation 원본 복원 + emissive 원본 복원 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.breakerLeverPosition?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachBreakerLeverPosition(inst)` 내부 destroy도 RAF cancel + 회전/emissive 복원 + `inst.breakerLeverPosition = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — #46과 100% 동일 (`setXxx/get*/enable/disable/destroy`) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Status 4버튼 ↔ `meshState.renderData(meshName='ALTS-1')`, Lever 3버튼 ON/OFF/TRIP ↔ `setState`, axis 토글 x/y/z ↔ `setRotationAxis`, inertia 슬라이더 ↔ `setInertia` |
| 7 | 기본값 시각 관찰 | OK — 마운트 직후 자동 enable + 시퀀스 데모(`OFF→1.5s→ON→3s→TRIP→5s→OFF`)로 회전+펄스 명확히 관찰. 단일 Mesh 한계로 본체 전체가 회전 — `[MODEL_READY]`로 명시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 |

**8항목 모두 통과.** 알고리즘·API 시그니처·RAF 정책·destroy 규약은 #46 MCCB 답습 그대로. 차이는 옵션값(`_leverMeshName='ALTS-1'`)과 `[MODEL_READY]` 표식뿐.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.altsInst = wemb.getDesignComponent('ALTS');

// 차단기 상태 토픽 어댑터
const onBreakerState = ({ response: data }) => {
    // data: { state: 'ON' | 'OFF' | 'TRIP' }
    this.altsInst.breakerLeverPosition.setState(data.state);
};

// 외부 직접 제어
this.altsInst.breakerLeverPosition.setInertia(0.6);              // 좀 더 느린 동작
this.altsInst.breakerLeverPosition.setAngleMap({ ON: Math.PI/4 }); // 더 큰 각도(45°)

// [MODEL_READY] GLTF 분리 후 마이그레이션 (가상 예시)
// this.altsInst.breakerLeverPosition.setLeverMeshName('ALTS-1-lever');
```

---

## 모델 주의사항

- `models/ALTS/01_default/ALTS.gltf`의 scene은 단일 Mesh `'ALTS-1'`으로 구성 (자식 노드 없음). 본 변형은 `getObjectByName('ALTS-1')`로 동일 mesh를 회전·펄스 대상으로 조회한다 — 색상 채널과 회전·emissive 채널이 동일 material 객체에 적용되지만, MeshStateMixin은 `material.color`만 / breakerLeverPosition은 `material.emissive`+`emissiveIntensity`+`mesh.rotation`만 사용하여 채널 직교가 유지된다.
- ALTS 루트 Mesh는 `rotation: [0.0, 4.371139E-08, 1.0, 0.0]` (Y축 180° baked rotation) + `scale: [1.0, -1.0, 1.0]` (Y축 mirror)이 적용되어 있다. mesh-local `rotation.x`를 갱신하면 baked rotation/scale이 곱해져 시각적으로 "전후 토글" 효과가 된다 (절대 갱신 — `lever.rotation.x = baked + currentAngle`).
- GLTF에 AnimationClip이 정의되어 있지 않다 (`animations` 배열 비어있음) — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없으므로 무방.
- ALTS는 ~1.6 × 3.4 × 3.0 단위 규모 — preview는 Standard와 동일한 카메라 정책 (`camera.position = (center + (2, 1, 3))`, `near=0.1, far=100`, `GridHelper(10, 20)`).
- **`[MODEL_READY]` placeholder 사용 위치 (4곳)**:
  1. 본 CLAUDE.md "ALTS 모델 한계" 절
  2. `register.js` 최상단 TODO 주석 + `DEFAULT_LEVER_MESH_NAME` 상수 옆 인라인 주석
  3. `preview/01_default.html` demo-hint + 자동 데모 로그 + COMPONENT 본문 주석 + attach 함수 내부
  4. 컴포넌트 루트 CLAUDE.md 세트 현황 행

---

## 발견한 문제 / Mixin 승격 메모 (#46~#49 답습 임계점 예정 — 본 변형은 2/4)

- **Mixin 승격 후보 (#46~#49 누적 시)**: #46 MCCB 1차 + **#47 ALTS(본) 2차** = 누적 2개. ACBmetasol/ACBsusol(#48/#49)에서 100% 답습이 누적되면 4개 컴포넌트 임계점에 도달하여 **`BreakerLeverPositionMixin` 승격 검토 권장** (메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출).
- **`[MODEL_READY]` 한계의 표면화**: 본 변형은 **단일 Mesh = 본체+레버 일체 회전** 한계를 명시적으로 노출한다. 실제 운영 환경에서는 본체가 함께 흔들리는 시각 효과가 부자연스러울 수 있으나, 시그니처·알고리즘은 #46과 100% 동일하므로 GLTF 업데이트 한 번으로 자연스러운 동작으로 전환 가능 (`setLeverMeshName('레버자식명')` 1회 호출). 이는 "코드는 차단기 시리즈 표준, 모델만 후속 업데이트" 분리 원칙에 부합한다.
- **#46과의 옵션값 차이 최소성**: meshName(`'ALTS-1'`) + leverMeshName(`'ALTS-1'`) 두 값만 다르고 나머지 모든 코드가 동일 — 답습 임계점 도달 시 Mixin 승격 비용이 매우 낮을 것으로 예상.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + ALTS-1.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
