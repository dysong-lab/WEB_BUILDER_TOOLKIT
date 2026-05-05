# ACBmetasol — Advanced/breaker_leverPosition

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 루트 Group `ACBmetasol`의 자식 Mesh들(`DDH001~005`, `DDH021`, `Object231`, `Rectangle070`, `Line005`) 색상 변경 (Standard 승계, `material.color` 채널, Group traverse)
2. **차단기 레버 회전** — ON/OFF/TRIP 운전 상태에 따라 자식 Mesh **`Rectangle070`**(토글/트립 레버)의 `rotation[axis]`를 1차 시스템 응답으로 보간하여 부드럽게 회전. ON은 위쪽(+30°), OFF는 아래쪽(-30°), TRIP은 중간(0°)
3. **TRIP 색상 펄스** — TRIP 상태일 때 `Rectangle070` material의 `emissive`를 sine wave로 주기적으로 변조하여 적색 발광 펄스 — 자동 차단(인간 조작과 구분)을 시각적으로 강조
4. **RAF idle 일시정지** — 목표 각도에 도달하고(epsilon 미만 차이) TRIP 펄스가 비활성이면 RAF stop (비용 0). setState 호출로 0이 아닌 차이가 생기면 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.breakerLeverPosition.setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`를 직접 호출하여 레버 상태 제어

---

## ACBmetasol 레버 mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/ACBmetasol/01_default/ACBmetasol.gltf` |
| GLTF 구조 | `scene → "ACBmetasol"(Group) → ["DC_ACB_Switch_DisconnectorDDH"(Group) → DDH001~005, DDH021, Object231, Rectangle070], Line005]` |
| MeshState 타겟 (색상) | `'ACBmetasol'` (루트 Group, Standard 승계 — Group traverse로 자식 mesh 일괄 색상) |
| 회전 대상 mesh 이름 | **`Rectangle070`** (토글/트립 레버 — 3ds Max 기본 네이밍 `Rectangle###` — MCCB의 `Rectangle180`과 동일 명명 패턴) |
| TRIP 펄스 대상 | **`Rectangle070`** (회전 대상과 동일 — emissive 채널) |
| 결정 | **자식 Mesh 직접 회전 + emissive 펄스** — 루트 Group이 아니라 특정 자식만 transform 갱신 |

### Rectangle070 식별 근거

ACBmetasol GLTF의 자식 노드들은 의미명(`DDH001~005`, `DDH021`, `Object231`)과 도구 기본명(`Rectangle070`, `Line005`)이 혼재한다. **`Rectangle###`은 3ds Max에서 사각 평면 원시체를 생성할 때 부여되는 기본 네이밍 패턴**으로, 차단기 모델에서 토글 레버를 모델링할 때 자주 등장한다 — 이 명명 패턴은 #46 MCCB의 `Rectangle180`과 정확히 동일하다.

추가 결정 근거:

1. **베이크된 X축 90° 회전** — Rectangle070 노드는 quaternion `[0.7071068, 0.0, 0.0, 0.7071067]`(X축 90° baked rotation)을 가지며, 이는 MCCB의 Rectangle180과 **완전히 동일한 quaternion 값**이다. 두 차단기 모두 동일한 모델링 도구(3ds Max)에서 동일한 토글 레버 패턴으로 만들어졌다는 강력한 증거.
2. **단일 평면 원시체** — `Rectangle###`은 평면(2D 사각형)이며, 차단기에서 본체 위에 배치되어 있고(`translation: [0.000281, -0.186, 0.0104]`) 본체 메시(`DDH001~005` 등)와 떨어진 별도 노드 — 토글 레버의 전형적 위치.
3. **DC_ACB_Switch_DisconnectorDDH 그룹의 자식 중 유일한 비-DDH 사각 평면** — DDH001~005/DDH021은 차단기 본체 부품(DDH = DC ACB 시리즈 조립 부품 코드), Object231은 보조 메시, **Rectangle070만 별개의 도구 기본명을 가진 평면 노드** — 본체와 구분되는 독립 토글 부품임을 시사.

본 변형은 GLTF 클립이 아니라 자식 mesh의 rotation 직접 갱신으로 동작하므로 GLTF에 AnimationClip이 정의되어 있지 않아도 무방하다 (`ACBmetasol.gltf`에 `animations` 배열 없음 — 클립 의존 없음 정책의 자연 정합).

---

## 답습 모범 — #46 MCCB/Advanced/breaker_leverPosition (시그니처 100% 동일, 1차 등장)

본 변형은 **#46 MCCB/Advanced/breaker_leverPosition**을 시그니처 100% 동일하게 답습한다. 차이는 다음 옵션값뿐:

| 항목 | #46 MCCB (1차 등장) | #48 ACBmetasol (본, 3차 답습) |
|------|---------------------|------------------------------|
| `meshName` (MeshState 타겟) | `'MCCB'` | **`'ACBmetasol'`** |
| `_leverMeshName` (회전 대상 자식) | `'Rectangle180'` | **`'Rectangle070'`** |
| 회전 축 / 각도 매핑 / 알고리즘 / 시그니처 / RAF / 펄스 정책 | — | **동일** |

### 답습 체인

| # | 컴포넌트 | 위치 |
|---|----------|------|
| #46 | MCCB/Advanced/breaker_leverPosition | 1차 등장 모범 — 답습 대상 (`Rectangle180`) |
| #47 | ALTS/Advanced/breaker_leverPosition | 2차 답습 |
| **#48** | **ACBmetasol/Advanced/breaker_leverPosition (본)** | **3차 답습 (`Rectangle070`)** |
| #49 | ACBsusol/Advanced/breaker_leverPosition | 4차 답습 (예정) |

### 알고리즘 답습 축

본 변형은 #46 MCCB와 동일하게 **두 개의 답습 축**을 결합한다:
- **회전 채널**: #38~#40 dynamicRpm 시리즈의 **1차 시스템 응답 보간 + RAF idle 일시정지** 패턴 (`currentAngle += (target - current) * (dt/inertia)`).
- **TRIP 펄스 채널**: BATT/Advanced/alarmPulse의 **emissive sine wave 변조 + 원본 보관/복원** 패턴.

| 답습 | 항목 |
|------|------|
| `#46 MCCB/Advanced/breaker_leverPosition` | **시그니처 100% 동일 + 두 채널(회전+펄스) 결합 정책** |
| `#38 Pump/Advanced/dynamicRpm` | 1차 시스템 응답 보간 알고리즘 + RAF idle 일시정지 정책 |
| `#39 Heatexchanger/Advanced/dynamicRpm` | 답습 1차 후속 |
| `#40 AHU103/Advanced/dynamicRpm` | `setMeshName/setInertia/setRotationAxis` 시그니처 일관성 |
| `BATT/Advanced/alarmPulse` | emissive sine wave 변조 + 원본 보관/복원 + RAF self-null |

**큐 설명 (#48)**: "ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (#46 MCCB 답습, 신규 Mixin **없음**)

### Mixin 승격 후보 (#46~#49 답습 임계점)

> **BreakerLeverPositionMixin 승격 후보** — 본 변형은 차단기 시리즈 #48(3차 답습). #46 MCCB 1차 등장 → #47 ALTS 2차 답습 → **#48 ACBmetasol(본) 3차 답습** → #49 ACBsusol 4차 답습이 누적되면 4개 컴포넌트 임계점에 도달 — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`) 그대로 흡수 가능 + ON/OFF/TRIP 3-state 도메인이 차단기 전반에 동일.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.breakerLeverPosition` (#46 MCCB 답습, 신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습 — #46 MCCB 동일)

### MeshState 채널과의 충돌 회피 정책

**원칙**: breakerLeverPosition은 (a) 자식 `Rectangle070`의 `rotation` 채널 + (b) `Rectangle070`의 `material.emissive` 채널만 사용한다. MeshStateMixin이 사용하는 `material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | 루트 Group traverse → 모든 자식 `material.color` | 데이터 상태 색상 (Standard 승계, 자식 mesh 일괄) |
| breakerLeverPosition (회전) | `Rectangle070.rotation[axis]` | ON/OFF/TRIP 각도 (1차 시스템 응답 보간) |
| breakerLeverPosition (TRIP 펄스) | `Rectangle070.material.emissive` + `emissiveIntensity` | TRIP 상태 sine wave 적색 발광 |

세 채널은 직교 — 색상·transform·발광이 서로 간섭하지 않는다. MeshStateMixin이 매 status 갱신마다 자식들의 material을 clone해도 (a) `Rectangle070.rotation`은 transform이라 영향 없음, (b) `emissive`는 MeshState가 건드리지 않으므로 clone 후에도 보존됨. **단** `Rectangle070`이 traverse 대상이므로 MeshState가 material을 clone하면 펄스가 매 RAF tick에서 `getObjectByName('Rectangle070').material`을 재조회하여 stale clone을 회피한다 (#46 MCCB / BATT/alarmPulse 동일 정책).

### 1차 시스템 응답 (회전 보간) 알고리즘

```
매 RAF tick (dt = (now - lastTick) / 1000):
  // 1) currentAngle을 targetAngle로 1차 시스템 보간
  alpha         = clamp(dt / inertia, 0, 1)
  currentAngle += (targetAngle - currentAngle) * alpha

  // 2) Rectangle070.rotation[axis]를 currentAngle로 절대 갱신
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

(#46 MCCB와 100% 동일한 알고리즘 — `Rectangle070`로 대상 mesh만 차이)

### 커스텀 네임스페이스 `this.breakerLeverPosition`

| 메서드 | 동작 |
|--------|------|
| `setState(state)` | `'ON'`/`'OFF'`/`'TRIP'` 받아 `targetAngle`을 `_angleByState[state]`로 갱신 + TRIP이면 펄스 활성, 아니면 펄스 정지(emissive 원복). RAF idle 시 자동 재시작 |
| `setAngleMap(map)` | `{ ON, OFF, TRIP }` 라디안 각도 커스터마이즈. 부분 객체 허용 (병합) |
| `setRotationAxis(axis)` | 회전 축 `'x'`/`'y'`/`'z'` (기본 `'x'`). 잘못된 값 무시. 변경 시 회전 0으로 reset 후 새 축에 적용 |
| `setLeverMeshName(name)` | 회전/펄스 대상 자식 mesh를 외부에서 지정 (기본 `'Rectangle070'`). 답습 컴포넌트(ACBsusol 등)에서 자식명 교체 시 사용 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 0.4s). 작을수록 빠르게 도달 — 차단기 레버는 RPM보다 빠른 동작이 자연(0.4s 권장) |
| `getState()` | 현재 state (`'ON'`/`'OFF'`/`'TRIP'`) |
| `getCurrentAngle()` | 현재 보간된 각도 (rad) |
| `enable()` / `disable()` | 회전 채널 토글. disable 시 RAF stop + (옵션) 회전 reset + emissive 원복 |
| `destroy()` | RAF cancel + Rectangle070.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원 + 모든 reference null + 마지막 줄 `this.breakerLeverPosition = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| `_state` (초기) | `'OFF'` | 마운트 시 OFF 위치(아래쪽) |
| `_leverMeshName` | **`'Rectangle070'`** | ACBmetasol GLTF 자식 레버 (#46 MCCB의 `Rectangle180`과 동일 명명 패턴) |
| `_rotationAxis` | `'x'` | quaternion baked X-rotation을 가진 자식이므로 mesh-local X가 토글 축 (#46 MCCB와 동일 quaternion 값) |
| `_angleByState` | `{ ON: π/6, OFF: -π/6, TRIP: 0 }` | ±30°/0° — preview에서 명확히 시각 분간 가능 |
| `_inertia` | 0.4 (sec) | 약 0.4s에 95% 도달 — 차단기 동작감 (#46 MCCB와 동일) |
| `_pulseColor` (TRIP) | 0xff4444 | 적색 발광 — 자동 차단(인간 조작과 구분) 강조 |
| `_pulsePeriod` (TRIP) | 800 (ms) | error 알람 700ms와 비슷한 빠른 펄스 |
| `_pulseMaxIntensity` (TRIP) | 1.5 | BATT/alarmPulse와 동일 (ACESFilmic 톤매핑 1.2 환경 기준) |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#40, #46 동일 정책) |

> **자동 데모 정책**: register.js는 자동 setState 호출하지 않음. preview에서 마운트 직후 시퀀스로 `setState('OFF')→'ON'→'TRIP'→'OFF'`를 호출하여 시각 관찰 보장. 운영에서는 페이지가 차단기 상태 데이터로 setState 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만, ACBmetasol Group traverse) |

레버 상태 변경은 페이지가 외부 명령형으로 직접 호출 (`instance.breakerLeverPosition.setState(...)`). 색상과 레버 상태는 직교 토픽 — 같은 차단기에서 색상은 normal/warning/error/offline, 레버는 ON/OFF/TRIP. 별도 구독 없음 (#46 MCCB 동일 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='ACBmetasol' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.breakerLeverPosition` API 등록 + (THREE 가용 시) 자동 enable + equipmentStatus 구독. 초기 state=`'OFF'`, currentAngle=`-π/6`로 즉시 적용. RAF는 idle (`|target-current|<eps && !TRIP`)
- 페이지가 `instance.breakerLeverPosition.setState('TRIP')` 호출 등으로 회전 + 펄스 트리거
- `beforeDestroy.js`: 구독 해제 → `this.breakerLeverPosition?.destroy()` (RAF cancel + 회전/emissive 복원 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/breaker_leverPosition |
|------|----------|--------------------------------|
| `applyMeshStateMixin` | ✓ (루트 Group `ACBmetasol` traverse) | ✓ (동일) |
| `this.breakerLeverPosition` 네임스페이스 | 없음 | `setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + rotation 절대 갱신 | 없음 | 있음 — idle 시 자동 정지/재시작 |
| `Rectangle070.rotation[axis]` 채널 사용 | 없음 | 사용 (절대 갱신 + destroy reset) |
| `Rectangle070.material.emissive` 채널 사용 | 없음 | TRIP 시 sine wave 변조 (BATT/alarmPulse 답습) |
| beforeDestroy | meshState만 정리 | breakerLeverPosition(RAF + 회전 reset + emissive 복원) → meshState 역순 |
| 화면 표시 | 단일 색상 ACBmetasol 본체 | 단일 색상 + 자식 `Rectangle070` 레버 ON/OFF/TRIP 회전 + TRIP 적색 펄스 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/breaker_leverPosition은 추가로 (a) 자식 `Rectangle070.rotation[axis]` 채널 (b) 자식 `Rectangle070.material.emissive` TRIP 펄스 채널 (c) `setState/setAngleMap/...` 외부 명령형 API (d) RAF 매 프레임 1차 시스템 응답 보간 (e) idle 일시정지 — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#46 MCCB 답습) |
| 2 | self-null `this.breakerLeverPosition = null` + RAF cancel + 회전/emissive 복원 | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + Rectangle070 rotation 원본 복원 + emissive 원본 복원 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.breakerLeverPosition?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachBreakerLeverPosition(inst)` 내부 destroy도 RAF cancel + 회전/emissive 복원 + `inst.breakerLeverPosition = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/enable/disable/destroy` (#46 MCCB 100% 동일 시그니처) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Status 4버튼 ↔ `meshState.renderData` (`meshName: 'ACBmetasol'`), Lever 3버튼 ON/OFF/TRIP ↔ `setState`, axis 토글 x/y/z ↔ `setRotationAxis`, inertia 슬라이더 ↔ `setInertia` |
| 7 | 기본값 시각 관찰 | OK — 마운트 직후 자동 enable + 시퀀스 데모(`OFF→1.5s→ON→3s→TRIP→5s→OFF`)로 회전+펄스 명확히 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**8항목 모두 통과.** 시그니처·알고리즘·RAF 정책·destroy 규약은 #46 MCCB 100% 답습 — 차이는 `_leverMeshName='Rectangle070'` (MCCB `'Rectangle180'`) 및 `meshName='ACBmetasol'` (MCCB `'MCCB'`) 두 옵션값뿐.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.acbInst = wemb.getDesignComponent('ACBmetasol');

// 차단기 상태 토픽 어댑터
const onBreakerState = ({ response: data }) => {
    // data: { state: 'ON' | 'OFF' | 'TRIP' }
    this.acbInst.breakerLeverPosition.setState(data.state);
};

// 외부 직접 제어
this.acbInst.breakerLeverPosition.setInertia(0.6);              // 좀 더 느린 동작
this.acbInst.breakerLeverPosition.setAngleMap({ ON: Math.PI/4 }); // 더 큰 각도(45°)
```

---

## 모델 주의사항

- `models/ACBmetasol/01_default/ACBmetasol.gltf`의 자식 mesh 중 토글 레버는 **`Rectangle070`** 으로 확정. 본 변형은 `getObjectByName('Rectangle070')`로 회전 대상 자식을 직접 조회한다.
- Rectangle070 노드는 quaternion `[0.7071068, 0.0, 0.0, 0.7071067]`(X축 90° baked rotation)이 이미 적용되어 있으므로 mesh-local `rotation.x`를 갱신하면 quaternion이 곱해져 시각적으로 "전후 토글" 효과가 된다 (절대 갱신 — `lever.rotation.x = baked + currentAngle`). 이 quaternion 값은 #46 MCCB Rectangle180과 **완전히 동일** — 동일 모델링 도구·동일 패턴.
- GLTF에 AnimationClip이 정의되어 있지 않다 — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없으므로 무방.
- ACBmetasol은 루트 scale이 없는 소형 원시 좌표형(~0.24×0.27×0.20 단위) — preview는 #46 MCCB와 동일한 바운드 기반 자동 거리(`maxDim*2.2`)와 `near=0.01, far=100` 사용.
- **[MODEL_READY] placeholder 사용 안 함** — meshName=`'ACBmetasol'`/leverMeshName=`'Rectangle070'`은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 메모 (#46~#49 답습 임계점 진행 중)

- **Mixin 승격 후보 (#46~#49 누적)**: 본 변형은 차단기 시리즈 #48(3차 답습). #46 MCCB(1차 등장) → #47 ALTS(2차 답습) → **#48 ACBmetasol(본, 3차 답습)**가 누적된 시점. **#49 ACBsusol 4차 답습 완료 시 4개 컴포넌트 임계점에 도달** — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장 (메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출).
- **#46 MCCB와의 차이**: 옵션값 2개(`_leverMeshName='Rectangle070'`, `meshName='ACBmetasol'`)뿐 — 알고리즘·시그니처·RAF·펄스 정책 100% 동일. **Mixin 승격 시 옵션 분기 비용 거의 없음** — 차단기마다 자식 레버명만 다를 뿐 도메인이 동일.
- **Rectangle070 식별 신뢰도**: (a) 3ds Max 기본 명명 패턴 `Rectangle###` (b) MCCB Rectangle180과 **bit-identical quaternion** `[0.7071068, 0, 0, 0.7071067]` (c) DDH 본체 부품과 분리된 별도 노드 (d) 본체 위 소량 translation으로 배치 — 4개 근거가 모두 토글 레버를 가리킨다.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + Rectangle070.rotation 원본 복원 + emissive/emissiveIntensity 원본 복원. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
