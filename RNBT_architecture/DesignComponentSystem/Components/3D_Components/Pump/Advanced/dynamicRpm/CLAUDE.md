# Pump — Advanced/dynamicRpm

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'Pump' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **RPM 비례 임펠러 회전** — 외부 텔레메트리로 입력된 목표 RPM에 비례하여 Pump mesh 본체를 회전축(기본 'y') 둘레로 누적 회전. `mesh.rotation[axis] += currentRpm * rpmPerUnit * dt`
3. **관성(inertia) 감쇠** — 목표 RPM이 즉시 적용되지 않고 1차 시스템 응답식 `currentRpm += (targetRpm - currentRpm) * (dt / inertia)`로 매 RAF 프레임 보간. 시동/정지가 부드러운 가속·감속으로 표현됨
4. **RAF idle 일시정지** — `targetRpm === 0 && |currentRpm| < epsilon` 일 때 RAF stop (비용 0). setTargetRpm으로 0이 아닌 값이 들어오면 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.dynamicRpm.setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy`를 직접 호출하여 회전 제어

---

## Pump mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Pump/01_default/Pump.gltf` |
| 회전 대상 mesh 이름 | `Pump` (Standard와 동일, 단일 리프 Mesh) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. Standard 변형이 단일 'Pump' Mesh 기반으로 동작 중이며, 본 변형은 그 위에 회전 채널만 추가한다. **본 변형은 GLTF 클립이 아니라 mesh.rotation 직접 갱신**으로 동작하므로 GLTF에 AnimationClip이 정의되어 있지 않아도 무방하다.

---

## 신규 기법 명시 — mesh.rotation 직접 갱신 + 1차 시스템 응답

본 변형은 저장소에서 **AnimationMixin 의존 없이 mesh.rotation을 매 프레임 직접 갱신하는 회전 채널** 첫 사례다. #9 `Chiller/Advanced/dynamicRpm`은 GLTF 내장 클립이 존재하는 경우 `AnimationMixin.setSpeed(clipName, scale)`로 `action.timeScale`을 동적 변경하는 방식이며, 본 변형(#38 Pump)은 클립 의존이 없는 **mesh.rotation[axis] 누적 갱신** 방식이다.

답습 모범:

| 답습 | 항목 |
|------|------|
| `Chiller/Advanced/dynamicRpm` | 1차 lerp 응답 / RPM → 출력 매핑 / `start/stop/setInertia/destroy` 시그니처 일관성 |
| `BATT/Advanced/alarmPulse` | RAF self-null + `entries.size === 0` 시 stop, ensureLoop 패턴 |
| `CoolingTower/Advanced/steamEjection` | RAF idle 일시정지 (조건 만족 시 RAF stop, 입력 변경 시 재시작) |

**큐 설명 (#38)**: "RPM 비례 임펠러 회전 + 관성 감쇠 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.dynamicRpm` (신규 Mixin **없음**)

### Mixin 승격 메모 (필수)

> **RotaryRpmMixin 승격 후보 — 큐 #38(본) + #39 Heatexchanger + #40 AHU103 + 향후 #45~#49 breaker_leverPosition(레버 회전, 다만 ON/OFF 단일 회전이라 다른 기법) 등에서 회전 변환이 다수 등장. dynamicRpm 패밀리는 3개로 임계점 도달 예정. setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/start/stop/enable/disable/destroy 시그니처 그대로 흡수 가능.**

큐 #38(본) + #39 Heatexchanger + #40 AHU103 = 3개 임계점 도달 예정. 본 사이클은 1차 등장이므로 **단일 컴포넌트 전용 → 커스텀 메서드** 규칙에 따라 커스텀으로 완결하지만, 메인 루프 외부에서 사용자가 #39, #40 완료 후 `create-mixin-spec` → `implement-mixin` 호출로 `RotaryRpmMixin`(또는 `MeshRotationMixin`) 승격 강력 권장.

- **승격 후보 이름**: `RotaryRpmMixin` 또는 더 일반적인 `MeshRotationMixin`
- **흡수할 메서드**: `setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy`
- **#9 Chiller/dynamicRpm과의 관계**: Chiller는 GLTF 내장 클립이 존재하는 경우 `AnimationMixin.setSpeed`로 timeScale을 동적 변경. 본 변형은 클립 의존이 없는 mesh.rotation 직접 갱신. RotaryRpmMixin이 승격되면 두 경로(클립 timeScale 모드 / mesh.rotation 모드)를 옵션 분기로 통합 가능

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.dynamicRpm` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: dynamicRpm은 `mesh.rotation`(transform) 채널만 사용한다. MeshStateMixin이 사용하는 `material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 색상 (Standard 승계) |
| dynamicRpm (커스텀) | `mesh.rotation[axis]` | RPM 비례 누적 회전 + 관성 보간 |

두 채널은 완전 직교 — 색상과 transform은 서로 간섭하지 않는다. MeshStateMixin이 매 status 갱신마다 material을 clone해도 mesh.rotation은 영향받지 않는다.

### 1차 시스템 응답 (관성 감쇠) 알고리즘

```
매 RAF tick (dt = (now - lastTick) / 1000):
  // 1) currentRpm을 targetRpm으로 1차 시스템 보간
  alpha       = clamp(dt / inertia, 0, 1)        // dt가 inertia 시간 상수에 가까울수록 1, 즉 즉시 반응
  currentRpm += (targetRpm - currentRpm) * alpha

  // 2) mesh.rotation[axis] 누적 갱신
  //   1 RPM = 2π / 60 rad/s = rpmPerUnit (기본)
  mesh.rotation[axis] += currentRpm * rpmPerUnit * dt

  // 3) idle 일시정지 — 목표 0 + 현재 거의 0 → RAF stop
  if (targetRpm === 0 && Math.abs(currentRpm) < epsilon) {
      currentRpm = 0
      RAF stop
  }
```

- **inertia (시간 상수, sec)**: 작을수록 빠르게 따라감, 클수록 느린 관성. 기본 1.5s. setTargetRpm으로 변경 시 약 1.5s 후 95% 도달 (1차 시스템의 표준 응답).
- **rpmPerUnit (rad/s per RPM)**: 1 RPM = `2π / 60` rad/s 기본. 운영에서 펌프 임펠러를 시각적으로 강조하려면 더 큰 값으로 조정 (예: 0.3 정도면 1500 RPM에서도 부드럽게 보임).
- **회전축 (axis)**: 기본 'y'. 펌프 임펠러는 보통 수직축(샤프트)을 따라 회전. setRotationAxis('x'|'y'|'z')로 변경 가능.
- **누적 회전 wrap**: `mesh.rotation[axis] += delta`는 무한히 누적되지만 THREE.js가 sin/cos 내부 처리로 0~2π wrap이 시각적으로 무관. 별도 wrap 처리 불필요.

### 커스텀 네임스페이스 `this.dynamicRpm`

| 메서드 | 동작 |
|--------|------|
| `setTargetRpm(rpm)` | 외부 텔레메트리 입력. 즉시 적용이 아니라 다음 RAF tick부터 관성 보간 대상. RAF idle 시 자동 재시작 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 1.5s). 작을수록 빠르게 따라감, 0 이하 무시 |
| `setRotationAxis(axis)` | 회전 축 'x' / 'y' / 'z' (기본 'y'). 잘못된 값 무시 |
| `setRpmPerUnit(scale)` | 1 RPM당 라디안/초 스케일 (기본 `2π/60` rad/s). 시각적 강조 목적의 가속 가능 |
| `setMeshName(name)` | 회전 대상 mesh를 외부에서 지정 (기본 'Pump'). 운영에서 다른 자식 mesh로 전환 가능 |
| `getCurrentRpm()` | 현재 보간된 RPM (실수) |
| `getTargetRpm()` | 현재 목표 RPM |
| `start()` | RAF 재시작 (`enable` + 보간 진행 가능 상태로 진입). 목표가 0이고 현재가 0이면 idle |
| `stop()` | targetRpm을 0으로 설정 (자연스럽게 감속 후 idle). 즉시 정지가 아님 |
| `isRunning()` | RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 회전 채널 토글. disable 시 RAF stop + (옵션) 회전 0 reset |
| `destroy()` | RAF cancel + (옵션) mesh.rotation reset(잔상 방지) + 모든 reference null + 마지막 줄 `this.dynamicRpm = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| targetRpm | 0 (시작 시 idle) | preview에서 자동 1500 호출 |
| currentRpm | 0 | 0에서 시작 |
| inertia | 1.5 (sec) | 약 1.5s 후 95% 도달 — 펌프 임펠러 가속감으로 자연 |
| rotationAxis | 'y' | 펌프 임펠러는 수직 샤프트 회전 (장면 Y축 = 수직) |
| rpmPerUnit | `2π/60` ≈ 0.10472 (rad/s per RPM) | 표준 RPM 단위. 1500 RPM = 25 회전/sec → 매우 빠름. preview에서는 0.05 정도로 줄여 시각 관찰 가능 |
| meshName | 'Pump' | Standard 동일 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#37 동일 정책) |
| 자동 데모 setTargetRpm on mount | 1500 | preview 로드 직후 부드럽게 가속하여 회전이 명확히 보이도록 |

> **자동 데모 정책**: register.js는 자동 setTargetRpm 호출하지 않는다. preview에서 마운트 직후 `setTargetRpm(1500)`을 호출하여 시각 관찰 보장. 운영에서는 페이지가 텔레메트리 데이터로 setTargetRpm 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

RPM 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음 (#9 Chiller/dynamicRpm과 동일 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='Pump' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.dynamicRpm` API 등록 + (THREE 가용 시) 자동 enable + equipmentStatus 구독. RAF는 targetRpm=0 / currentRpm=0이므로 idle 상태로 시작
- 페이지가 `instance.dynamicRpm.setTargetRpm(rpm)` 호출로 회전 시작
- `beforeDestroy.js`: 구독 해제 → `this.dynamicRpm?.destroy()` (RAF cancel + reset 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/dynamicRpm |
|------|----------|---------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.dynamicRpm` 네임스페이스 | 없음 | `setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy` 노출 |
| RAF 매 프레임 1차 시스템 응답 + mesh.rotation 누적 | 없음 | 있음 — targetRpm=0 + |currentRpm|<epsilon 시 idle 일시정지 |
| `mesh.rotation[axis]` 채널 사용 | 없음 | 사용 (누적 갱신 + 옵션 reset) |
| beforeDestroy | meshState만 정리 | dynamicRpm(RAF cancel + 회전 reset 포함) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 펌프 | 단일 색상 + RPM 비례 임펠러 회전 (관성 가속/감속) |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/dynamicRpm은 추가로 (a) `mesh.rotation[axis]` 채널 (b) `setTargetRpm/setInertia/...` 외부 명령형 API (c) RAF 매 프레임 1차 시스템 응답 보간 (d) idle 일시정지 — 네 채널을 페이지에 노출한다.

---

## #9 Chiller/dynamicRpm과의 차이

| 항목 | #9 Chiller/dynamicRpm | #38 Pump/dynamicRpm (본) |
|------|-----------------------|-------------------------|
| Mixin 조합 | MeshState + AnimationMixin + 커스텀 | MeshState + 커스텀 |
| 회전 메커니즘 | GLTF 내장 AnimationClip의 `action.timeScale` 동적 변경 | mesh.rotation[axis] 직접 누적 갱신 |
| 클립 의존 | 필수 (없으면 무동작) | 없음 (모든 모델에 동작) |
| 식별자 | clipName | meshName |
| 보간 방식 | `currentScale = lerp(currentScale, targetScale, inertiaRate)` (이산 비율) | `currentRpm += (targetRpm - currentRpm) * (dt / inertia)` (1차 시스템 응답, 시간 상수) |
| start API | `start(clipName)` — 클립을 timeScale 0으로 진입 | `start()` — RAF idle 해제 (인자 없음) |
| stop API | `stop(clipName)` — 클립 정지 + dispose | `stop()` — targetRpm=0 (자연 감속) |
| 시그니처 호환성 | `setRpm(clipName, rpm)/setRange/setInertia/getMeshNames/destroy` | `setTargetRpm(rpm)/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy` |

**시그니처 차이의 정당성**: Chiller는 GLTF 내장 클립이 자연 식별자이므로 모든 메서드가 `(clipName, ...)` 인자 형태. Pump는 mesh가 자연 식별자이고 단일 mesh를 전제하므로 `setMeshName(name)` 1회 설정 후 인자 생략. 동사 형태(`setXxx/start/stop/get*/destroy`)는 일관성 유지. 향후 RotaryRpmMixin 승격 시 두 패턴을 옵션 분기로 흡수 가능.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#9 Chiller/dynamicRpm 답습) |
| 2 | self-null `this.dynamicRpm = null` + RAF cancel | OK — destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.dynamicRpm?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachDynamicRpm(inst)` 내부 destroy도 RAF cancel + 회전 reset + `inst.dynamicRpm = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/start/stop/isRunning/enable/disable/isEnabled/destroy` (#9 Chiller/dynamicRpm + steamEjection 동사 형태 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview targetRpm slider 0~3000 ↔ `setTargetRpm`, inertia 0.1~5s ↔ `setInertia`, rpmPerUnit 0.01~0.5 ↔ `setRpmPerUnit`, axis 토글 x/y/z ↔ `setRotationAxis`, start/stop 버튼 ↔ `start/stop` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setTargetRpm(1500), inertia=1.5s, axis='y' → mesh가 약 1.5s에 걸쳐 부드럽게 가속하여 명확히 회전 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.pumpInst = wemb.getDesignComponent('Pump');

// 텔레메트리 토픽 어댑터
const onPumpRpm = ({ response: data }) => {
    this.pumpInst.dynamicRpm.setTargetRpm(data.rpm);
};

// 외부 직접 제어
this.pumpInst.dynamicRpm.setInertia(2.0);          // 좀 더 느린 가속
this.pumpInst.dynamicRpm.setRotationAxis('y');     // 수직 샤프트
this.pumpInst.dynamicRpm.setRpmPerUnit(0.05);      // 시각적 강조 (0.05 ≈ 1/2 RPM)
```

---

## 모델 주의사항

- `models/Pump/01_default/Pump.gltf`의 단일 mesh 이름은 `'Pump'`로 확정. dynamicRpm은 `getObjectByName('Pump')`로 회전 대상 mesh를 직접 조회한다.
- GLTF에 AnimationClip이 정의되어 있지 않아도 무방 — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없다.
- preview 카메라는 Standard와 동일한 `(maxDim*2.0, maxDim*1.2, maxDim*2.0)` 거리. 회전 축('y' = 수직)으로 회전이 시각적으로 잘 관찰되는 각도.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='Pump'은 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 강력 검토 시점 도달 — 큐 #38(본) + #39 Heatexchanger + #40 AHU103 = 3개 임계점 도달 예정**: 본 변형은 1차 등장이라 단일 컴포넌트 전용 → 커스텀 규칙으로 완결. 다만 #39/#40이 동일 기법으로 큐 대기. 메인 루프 외부에서 #39/#40 완료 후 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `RotaryRpmMixin`(또는 더 일반적인 `MeshRotationMixin`) 승격 강력 권장.
- **#9 Chiller/dynamicRpm과의 시그니처 차이**: 본 변형은 클립 의존이 없으므로 `setRpm(clipName, rpm)` → `setTargetRpm(rpm)`, `getMeshNames()` → `getCurrentRpm()/getTargetRpm()` 등으로 인자/반환을 변경. 동사 형태(`setXxx/start/stop/get*/destroy`)는 일관 유지. RotaryRpmMixin 승격 시 두 패턴 모두 옵션 분기로 흡수 가능.
- **회전 누적 wrap 정책**: `mesh.rotation[axis] += delta`로 무한 누적되지만 THREE.js 내부 sin/cos 처리로 시각적으로 무관. 별도 wrap 처리 불필요(불필요한 부동소수 정밀도 손실만 야기).
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + null 처리. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
