# AHU103 — Advanced/dynamicRpm

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'AHU103' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **RPM 비례 팬 회전** — 외부 텔레메트리로 입력된 목표 RPM에 비례하여 AHU103 mesh 본체를 회전축(기본 'y') 둘레로 누적 회전. `mesh.rotation[axis] += currentRpm * rpmPerUnit * dt`
3. **관성(inertia) 감쇠** — 목표 RPM이 즉시 적용되지 않고 1차 시스템 응답식 `currentRpm += (targetRpm - currentRpm) * (dt / inertia)`로 매 RAF 프레임 보간. 시동/정지가 부드러운 가속·감속으로 표현됨
4. **RAF idle 일시정지** — `targetRpm === 0 && |currentRpm| < epsilon` 일 때 RAF stop (비용 0). setTargetRpm으로 0이 아닌 값이 들어오면 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.dynamicRpm.setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy`를 직접 호출하여 회전 제어

---

## AHU103 mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/AHU103/01_default/AHU103.gltf` |
| GLTF 구조 | `root` (scale [1000,1000,1000]) → `AHU103` (Mesh Node, mesh 0) — 단일 자식, 단일 mesh |
| 회전 대상 mesh 이름 | `AHU103` (Standard와 동일, 단일 리프 Mesh) |
| 결정 | **단일 mesh — 본체 통합** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: `AHU103.gltf`의 `nodes` 배열은 `root`(scale 1000x) + 자식 1개 `AHU103`(mesh 0)만 존재하며 별도의 `fan`/`blade` mesh가 분리되어 있지 않다. 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. 따라서 회전 대상은 **단일 `AHU103` mesh 전체**(본체 통합) — AHU 외형 모델이 송풍팬을 외부에 노출하지 않거나 본체에 통합된 형상이라는 점이 단일 mesh 구조의 시각적 근거. 페이지 운영에서 다른 자식 mesh로 전환이 필요하면 `setMeshName` 1회 호출로 변경 가능 (현 모델에서는 분리된 mesh 없음).

본 변형은 GLTF 클립이 아니라 mesh.rotation 직접 갱신으로 동작하므로 GLTF에 AnimationClip이 정의되어 있지 않아도 무방하다 (`AHU103.gltf`의 `animations` 배열은 비어있음 — 클립 의존 없음 정책의 자연 정합).

---

## 답습 모범 — #38 Pump + #39 Heatexchanger

본 변형은 #38 `Pump/Advanced/dynamicRpm` 1차 + #39 `Heatexchanger/Advanced/dynamicRpm` 직전 사이클을 **그대로 답습**한다. 알고리즘(1차 시스템 응답 + mesh.rotation 누적 갱신), API 시그니처, RAF idle 일시정지 정책, beforeDestroy 역순 정리, preview 구조까지 동일하다.

| 답습 | 항목 |
|------|------|
| `#38 Pump/Advanced/dynamicRpm` | **알고리즘·API 시그니처·RAF 정책·preview 구조 1차 등장 모범** |
| `#39 Heatexchanger/Advanced/dynamicRpm` | **직전 사이클 답습 — meshName/기본 RPM/slider 상한만 차이** |
| `Chiller/Advanced/dynamicRpm` | 1차 lerp 응답 / `start/stop/setInertia/destroy` 시그니처 일관성 (간접 답습) |
| `BATT/Advanced/alarmPulse` | RAF self-null + 조건 만족 시 stop, ensureLoop 패턴 (간접 답습) |
| `CoolingTower/Advanced/steamEjection` | RAF idle 일시정지 + autoEnable on mount (간접 답습) |

### #38 Pump / #39 Heatexchanger와의 차이 (답습 시 변경 항목)

| 항목 | #38 Pump | #39 Heatexchanger | #40 AHU103 (본) |
|------|----------|-------------------|-----------------|
| meshName 기본값 | `'Pump'` | `'Heatexchanger'` | `'AHU103'` |
| 자동 데모 setTargetRpm | 1500 | 1000 | **1200** (AHU 송풍팬 800~1500 운전역의 중앙) |
| preview slider 상한 | 0~3000 | 0~2000 | **0~2000** (#39와 동일 — 팬 일반 운전역) |
| 회전 축 / 알고리즘 / 시그니처 / RAF 정책 | — | 동일 | **동일** |

펌프 임펠러는 산업용에서 1500~3000 RPM, 열교환기/팬은 800~1500 RPM이 일반적. AHU(Air Handling Unit) 송풍팬은 일반적으로 800~1500 RPM 운전역으로 본 변형의 기본 RPM을 1200(중앙값), 상한을 2000으로 조정 — 큐 brief의 "AHU 팬은 800~1500 운전역. 기본 1200 권장"과 일치. **회전 축 'y'는 #38/#39와 동일** — AHU103은 단일 mesh이므로 mesh 자체를 수직축으로 회전시키며, 페이지가 setRotationAxis로 'x'/'z'로 변경 가능 (실제 AHU 모델의 송풍팬 축이 'x' 수평인 경우 페이지에서 1회 호출로 전환). 본 모델은 단일 mesh 본체 회전이므로 기본 'y' 시각 관찰이 가장 자연스럽다.

**큐 설명 (#40)**: "팬/블레이드 RPM 비례 회전 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.dynamicRpm` (#38/#39 답습 — 신규 Mixin **없음**)

### Mixin 승격 메모 (필수 — 3개 임계점 명백히 초과)

> **RotaryRpmMixin 승격 강력 권장 — #38 Pump + #39 Heatexchanger + 본 변형(#40 AHU103) = 3개 컴포넌트 동일 기법 임계점 명백히 초과.** 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 **사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 검토 강력 권장.** 시그니처(setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy) 그대로 흡수 가능.

- **승격 후보 이름**: `RotaryRpmMixin` 또는 더 일반적인 `MeshRotationMixin`
- **흡수할 메서드**: `setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/getCurrentRpm/getTargetRpm/start/stop/isRunning/enable/disable/isEnabled/destroy`
- **3개 임계점 도달 명백한 증거**: #38(1차) → #39(직전) → 본 변형(3번째)에서 **알고리즘·API 시그니처·RAF 정책·destroy 규약·preview 구조 100% 동일**, 차이는 단순 옵션값(meshName, 자동 데모 RPM, slider 상한)뿐이라 옵션화로 완전 흡수 가능. 본 사이클이 답습 패턴의 효율성을 입증하나, 4번째 등장 전에 Mixin 승격이 명백히 합리적.
- **#9 Chiller/dynamicRpm과의 관계**: Chiller는 GLTF 내장 클립이 존재하는 경우 `AnimationMixin.setSpeed`로 timeScale을 동적 변경. #38/#39/본 변형은 클립 의존이 없는 mesh.rotation 직접 갱신. RotaryRpmMixin이 승격되면 두 경로(클립 timeScale 모드 / mesh.rotation 모드)를 옵션 분기로 통합 가능.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.dynamicRpm` (신규 Mixin 없음 — #38/#39 답습)

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
  alpha       = clamp(dt / inertia, 0, 1)
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

(상세 설명은 #38 Pump/Advanced/dynamicRpm/CLAUDE.md 참조 — 본 변형은 동일 알고리즘)

### 커스텀 네임스페이스 `this.dynamicRpm`

| 메서드 | 동작 |
|--------|------|
| `setTargetRpm(rpm)` | 외부 텔레메트리 입력. 즉시 적용이 아니라 다음 RAF tick부터 관성 보간 대상. RAF idle 시 자동 재시작 |
| `setInertia(timeConstantSec)` | 1차 시스템 응답 시간 상수 (기본 1.5s). 작을수록 빠르게 따라감, 0 이하 무시 |
| `setRotationAxis(axis)` | 회전 축 'x' / 'y' / 'z' (기본 'y'). 잘못된 값 무시 |
| `setRpmPerUnit(scale)` | 1 RPM당 라디안/초 스케일 (기본 `2π/60` rad/s). 시각적 강조 목적의 가속 가능 |
| `setMeshName(name)` | 회전 대상 mesh를 외부에서 지정 (기본 'AHU103'). 운영에서 다른 자식 mesh로 전환 가능 |
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
| targetRpm | 0 (시작 시 idle) | preview에서 자동 1200 호출 |
| currentRpm | 0 | 0에서 시작 |
| inertia | 1.5 (sec) | 약 1.5s 후 95% 도달 — AHU 팬 가속감으로 자연 |
| rotationAxis | 'y' | 단일 mesh 본체를 수직축으로 회전 (기본 — 페이지에서 setRotationAxis로 'x'/'z' 전환 가능) |
| rpmPerUnit | `2π/60` ≈ 0.10472 (rad/s per RPM) | 표준 RPM 단위. 1200 RPM = 약 20 회전/sec → 매우 빠름. preview에서는 0.05 정도로 줄여 시각 관찰 가능 |
| meshName | 'AHU103' | Standard 동일 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#39 동일 정책) |
| 자동 데모 setTargetRpm on mount | 1200 | preview 로드 직후 부드럽게 가속하여 회전이 명확히 보이도록. AHU 송풍팬 운전역 800~1500의 중앙값(brief 권장값) |

> **자동 데모 정책**: register.js는 자동 setTargetRpm 호출하지 않는다. preview에서 마운트 직후 `setTargetRpm(1200)`을 호출하여 시각 관찰 보장. 운영에서는 페이지가 텔레메트리 데이터로 setTargetRpm 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

RPM 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음 (#9 Chiller/dynamicRpm + #38 Pump + #39 Heatexchanger 동일 규약).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='AHU103' 확정)이므로 동적 식별 이벤트 불필요.

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
| 화면 표시 | 단일 색상 AHU 본체 | 단일 색상 + RPM 비례 본체 회전 (관성 가속/감속) |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/dynamicRpm은 추가로 (a) `mesh.rotation[axis]` 채널 (b) `setTargetRpm/setInertia/...` 외부 명령형 API (c) RAF 매 프레임 1차 시스템 응답 보간 (d) idle 일시정지 — 네 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#38/#39 답습) |
| 2 | self-null `this.dynamicRpm = null` + RAF cancel | OK — destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.dynamicRpm?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachDynamicRpm(inst)` 내부 destroy도 RAF cancel + 회전 reset + `inst.dynamicRpm = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/start/stop/isRunning/enable/disable/isEnabled/destroy` (#38 Pump + #39 Heatexchanger 동일) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview targetRpm slider 0~2000 ↔ `setTargetRpm`, inertia 0.1~5s ↔ `setInertia`, rpmPerUnit 0.01~0.5 ↔ `setRpmPerUnit`, axis 토글 x/y/z ↔ `setRotationAxis`, start/stop 버튼 ↔ `start/stop` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + 자동 setTargetRpm(1200), inertia=1.5s, axis='y' → mesh가 약 1.5s에 걸쳐 부드럽게 가속하여 명확히 회전 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**변경 항목(meshName='AHU103', 기본 RPM=1200, slider 상한=2000)이 8항목 중 어느 것도 깨뜨리지 않음.** 알고리즘·API 시그니처·RAF 정책·destroy 규약은 #38/#39 답습 그대로.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.ahuInst = wemb.getDesignComponent('AHU103');

// 텔레메트리 토픽 어댑터
const onAhuRpm = ({ response: data }) => {
    this.ahuInst.dynamicRpm.setTargetRpm(data.rpm);
};

// 외부 직접 제어
this.ahuInst.dynamicRpm.setInertia(2.0);          // 좀 더 느린 가속
this.ahuInst.dynamicRpm.setRotationAxis('y');     // 수직 샤프트 (기본)
this.ahuInst.dynamicRpm.setRpmPerUnit(0.05);      // 시각적 강조
```

---

## 모델 주의사항

- `models/AHU103/01_default/AHU103.gltf`의 단일 mesh 이름은 `'AHU103'`로 확정. dynamicRpm은 `getObjectByName('AHU103')`로 회전 대상 mesh를 직접 조회한다.
- GLTF에 AnimationClip이 정의되어 있지 않다 (`animations` 배열 비어있음) — 본 변형은 mesh.rotation 직접 갱신 방식으로 클립 의존이 없으므로 무방.
- AHU103은 root scale [1000, 1000, 1000] 업스케일 패턴이며 Standard preview는 `position.set(2,2,3)` + `far=100`으로 동작 중. 본 변형 preview는 바운드 기반 자동 거리(`maxDim*2.0`) 사용 (#39 Heatexchanger 답습).
- preview 카메라 기본 회전 축 'y'(수직)으로 회전이 시각적으로 잘 관찰되는 각도.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='AHU103'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장 (3개 임계점 명백히 초과)

- **Mixin 승격 강력 권장 — #38 Pump + #39 Heatexchanger + 본 변형(#40 AHU103) = 3개 컴포넌트 임계점 명백히 초과**: 본 변형은 #38/#39 답습이므로 단일 컴포넌트 전용 → 커스텀 규칙 + 신규 Mixin 금지 정책으로 완결. 그러나 **3개 동일 기법 도달은 임계점을 명백히 초과**, 메인 루프 외부에서 사용자가 즉시 `create-mixin-spec` → `implement-mixin` 호출로 `RotaryRpmMixin`(또는 더 일반적인 `MeshRotationMixin`) 승격 강력 권장.
- **#38/#39와의 차이는 meshName/기본 RPM/slider 상한뿐**: 알고리즘·API 시그니처·RAF 정책·destroy 규약·preview 구조는 동일. RotaryRpmMixin 승격 시 세 변형은 옵션값(meshName, defaultRpm) 차이로만 흡수 가능 — 본 사이클이 답습 패턴의 한계(동일 코드 3회 복제)를 명확히 노출.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + null 처리. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
