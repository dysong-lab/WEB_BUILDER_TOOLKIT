# AutomaticDoor2P — Advanced/doorOpenClose

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `automaticDoor`(프레임)·`doorGlass_A`(유리 패널) 두 mesh의 색상 변경 (Standard 승계, `material.color` 채널)
2. **문 개폐 슬라이드** — `closed` ↔ `opening` ↔ `open` ↔ `closing` 4-state machine. `doorGlass_A.position[axis]`를 RAF 기반으로 `_slideDistance` 만큼 보간하여 부드럽게 슬라이드. easing은 easeInOutQuad
3. **출입 불허 경광 펄스** — `triggerDenied()` 호출 시 `automaticDoor`(프레임) material `emissive`를 sine wave로 주기적으로 변조하여 적색 펄스. `_denyPulseDuration` ms 후 자동 종료 + emissive 원본 복원
4. **RAF idle 일시정지** — `_state in {'closed','open'}` (정적 상태) + `_denying === false` 일 때 RAF stop (비용 0). open()/close()/triggerDenied() 호출로 활성 상태 진입 시 RAF 재시작
5. **외부 명령형 API** — 페이지가 `instance.doorOpenClose.open/close/setState/toggle/triggerDenied/setSlideAxis/setSlideDistance/setSlideDuration/setDenyPulseDuration/setDenyPulseColor/setFrameMeshName/setDoorMeshName/getState/isAnimating/enable/disable/isEnabled/destroy`를 직접 호출하여 문/펄스 제어

---

## AutomaticDoor2P mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/AutomaticDoor2P/01_default/AutomaticDoor2P.gltf` |
| GLTF 구조 | `root` (scale [1000,1000,1000]) → `automaticDoor`(mesh 0, 프레임), `doorGlass_A`(mesh 1, 유리 패널) — 자식 2개, 자식 없음 |
| 슬라이드 대상 mesh | **`doorGlass_A`** (유리 패널 — `position[axis]` 채널) |
| 펄스 대상 mesh | **`automaticDoor`** (프레임 — `material.emissive` 채널) |
| 결정 | **개별 단위 (1 GLTF = 2 Mesh, 자식 없음)** — 두 mesh 직접 조회 (`getObjectByName`) |

근거: GLTF의 `nodes` 배열은 root + 자식 2개(`automaticDoor`, `doorGlass_A`)로 구성된다. 각 자식은 `mesh` 인덱스를 직접 참조하는 리프 mesh이며 별도의 자식 노드를 갖지 않는다 (Standard CLAUDE.md의 `유형 = 개별 (1 GLTF = 2 Mesh)`와 정합). 이 구조에서 슬라이드 대상은 `doorGlass_A`(유리 패널), 펄스 대상은 `automaticDoor`(프레임)으로 자연스럽게 분리된다 — 유리는 움직이고 프레임은 발광한다는 시각 의미가 mesh 분리와 정합.

GLTF 구조 상세:
- `root` (scale [1000,1000,1000])
  - `automaticDoor` (mesh 0, 1 primitive, material `automaticDoor`, baseColorTexture, metallic 0.4, roughness 0.3) — 프레임. POSITION min `[-0.020, -0.0152, -0.00065]` max `[0.020, 0.0152, 0.00074]` → 폭 0.040 × 높이 0.030 × 깊이 0.0014
  - `doorGlass_A` (mesh 1, 1 primitive, material `doorGlass_A`, baseColorTexture, alphaMode `BLEND`, metallic 0, roughness 0.3) — 유리 패널. POSITION min `[-0.0193, -0.0135, -0.00022]` max `[0.0193, 0.0135, 0.00022]` → 폭 0.0387 × 높이 0.0271

GLTF의 `animations` 배열은 비어있다 — 본 변형은 mesh.position 직접 갱신 + emissive 직접 변조 방식으로 클립 의존이 없으므로 무방.

### 2P 단일 패널 한계 — 명시

본 GLTF는 이름이 `AutomaticDoor2P`(2-panel)이지만 **유리 mesh는 `doorGlass_A` 하나뿐**이며 `doorGlass_B` 같은 대칭 패널이 분리되어 있지 않다. 진정한 양문형 자동문(좌우 패널이 반대 방향으로 슬라이드)은 본 모델로 구현 불가하며, 본 변형은 **단일 패널이 한 방향으로 슬라이드**하는 시각 효과로 한정한다. 페이지가 두 번째 패널을 추가 구현하려면 별도 GLTF 변종(`02_2panel/`)이 필요하나 본 사이클 범위 외.

### slideAxis 선정 근거

`_slideAxis` 기본값은 **`'x'`** 이다. GLTF의 `doorGlass_A` POSITION 분포를 보면 X축이 폭(0.0387, 가장 큼), Y축이 높이(0.0271), Z축이 거의 0(0.00043 — 패널 두께)이다. 자동문은 일반적으로 좌우 슬라이드(X축)이며, 본 모델의 가장 긴 변이 X축 폭과 일치하므로 X 슬라이드가 시각적으로 자연스럽다 (Y는 위아래 = 차고문 / Z는 패널 두께 방향 = 의미 없음). 페이지가 다른 축 사용을 원하면 `setSlideAxis('y'|'z')`로 1회 호출 가능.

### slideDistance 기본값 결정

`_slideDistance` 기본값은 **`0.04`** (mesh-local 단위)이다. 이는 `doorGlass_A`의 X축 폭(0.0387)과 거의 일치하므로 패널이 한 폭 분량 슬라이드하면 프레임 밖으로 완전히 빠져나가는 시각적 "완전 개방" 상태가 된다 (브리프의 코드 스켈레톤은 0.5를 예시했으나 본 GLTF의 mesh-local 좌표는 ~0.04 단위라 0.5는 12배 과대 — 모델 좌표계에 맞춰 0.04 채택). root scale [1000,1000,1000]이 적용되어 world에서는 40 단위 슬라이드로 카메라 가시 영역 대비 명확히 인지 가능. 페이지가 다른 GLTF 변종에서 다른 스케일을 사용하면 `setSlideDistance(0.5)` 등으로 변경.

---

## 답습 모범 — MCCB/Advanced/breaker_leverPosition + AHU103/Advanced/dynamicRpm

본 변형은 **두 개의 답습 축**을 결합한다:
- **state machine + 펄스 채널**: MCCB/Advanced/breaker_leverPosition의 **state machine + emissive sine wave + 원본 보관/복원 + RAF self-null** 패턴을 그대로 답습.
- **RAF idle 일시정지**: AHU103/Advanced/dynamicRpm의 **idle 진입/재시작 정책 + RAF lifecycle** 패턴을 그대로 답습.

| 답습 | 항목 |
|------|------|
| `MCCB/Advanced/breaker_leverPosition` | **state machine + emissive sine 펄스 + 원본 보관/복원 + 채널 분리(MeshState ↔ transform/emissive)** |
| `AHU103/Advanced/dynamicRpm` | **RAF idle 일시정지 + ensureLoop/stopLoop + autoEnable on mount** |
| `BATT/Advanced/alarmPulse` | emissive sine 변조 + 매 tick mesh.material 재조회 (stale clone 회피) |

### MCCB와의 알고리즘 차이

| 항목 | MCCB breaker_leverPosition | AutomaticDoor2P doorOpenClose |
|------|---------------------------|-------------------------------|
| state machine | 3-state (`ON/OFF/TRIP`) — 정적 각도 | **4-state (`closed/opening/open/closing`)** — 트랜지션 명시 |
| 보간 방식 | 1차 시스템 응답 (`+= (target - current) * dt/inertia`) | **easeInOutQuad** (시작/종료 시간 기반) |
| 갱신 채널 | `rotation[axis]` 절대 갱신 | **`position[axis]`** 절대 갱신 |
| 펄스 트리거 | state === 'TRIP' (지속) | **`triggerDenied()` 1회성 (duration 후 자동 종료)** |
| 펄스 대상 | 회전 대상과 동일 (`Rectangle180`) | **회전과 분리 — 프레임(`automaticDoor`)** |
| idle 조건 | `|target - current| < eps && !TRIP` | `state in {closed, open} && !_denying` |

### Mixin 승격 메모

본 변형은 자동문 도메인에서 1차 등장. SpeedGate(현재 Standard 미생산) 등 후속 출입 통제 컴포넌트 등장 시 `DoorOpenCloseMixin` 답습 가능성 — 단 1차 등장이므로 **단일 컴포넌트 전용 커스텀 메서드** 채택 (신규 Mixin 금지 정책 + 1차 등장 임계점 미도달).

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.doorOpenClose` (신규 Mixin 없음 — 1차 등장)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: doorOpenClose는 (a) `doorGlass_A.position[axis]` (transform) 채널 + (b) `automaticDoor.material.emissive` (발광) 채널만 사용한다. MeshStateMixin이 사용하는 `material.color` 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (두 mesh 각각) | 데이터 상태 색상 (Standard 승계) |
| doorOpenClose (슬라이드) | `doorGlass_A.position[axis]` | open/close 트랜지션 (easeInOutQuad 보간) |
| doorOpenClose (펄스) | `automaticDoor.material.emissive` + `emissiveIntensity` | triggerDenied 시 sine wave 적색 발광 |

세 채널은 직교 — 색상·transform·발광이 서로 간섭하지 않는다. MeshStateMixin이 매 status 갱신마다 두 mesh의 material을 clone해도 (a) `doorGlass_A.position`은 transform이라 영향 없음, (b) `automaticDoor.emissive`는 MeshState가 건드리지 않으므로 clone 후에도 보존됨. **단** `automaticDoor`는 MeshState traverse 대상이므로 매 RAF tick에서 `getObjectByName('automaticDoor').material`을 재조회하여 stale clone을 회피한다 (BATT/alarmPulse, MCCB/breaker_leverPosition 동일 정책).

### easeInOutQuad + state machine 알고리즘

```
state machine:
  closed ─open()─→ opening ─(슬라이드 완료)─→ open
                      │
                  close()
                      ▼
                  closing ─(슬라이드 완료)─→ closed

매 RAF tick (now = performance.now()):
  // 1) 슬라이드 (state in {opening, closing})
  if (_state === 'opening' || _state === 'closing') {
      const elapsed = now - _slideStartTime
      const t       = clamp(elapsed / _slideDuration, 0, 1)
      const eased   = easeInOutQuad(t)   // t<0.5 ? 2t² : 1 - (-2t+2)²/2
      const pos     = lerp(_slideStartPos, _slideTargetPos, eased)
      doorGlass_A.position[axis] = pos

      if (t >= 1) {
          doorGlass_A.position[axis] = _slideTargetPos
          _state = (_state === 'opening') ? 'open' : 'closed'
      }
  }

  // 2) 경광 펄스 (_denying === true)
  if (_denying) {
      const elapsed = now - _denyPulseStartTime
      if (elapsed >= _denyPulseDuration) {
          // 종료 — emissive 원복
          frame.material.emissive.copy(_savedEmissive)
          frame.material.emissiveIntensity = _savedIntensity
          _denying = false
      } else {
          const phase     = (now / 200) * 2π   // 200ms 주기 sine
          const intensity = lerp(0, _denyPulseMaxIntensity, (sin(phase) + 1) / 2)
          frame.material.emissive.setHex(_denyPulseColor)
          frame.material.emissiveIntensity = intensity
      }
  }

  // 3) idle 일시정지 — 정적 state + 펄스 비활성
  if ((_state === 'closed' || _state === 'open') && !_denying) {
      RAF stop
  }
```

### 커스텀 네임스페이스 `this.doorOpenClose`

| 메서드 | 동작 |
|--------|------|
| `open()` | 현재 state가 `closed`/`closing`이면 `opening`으로 전환. `_slideStartTime=now`, `_slideStartPos=현재 position`, `_slideTargetPos=initial+_slideDistance`. RAF 재시작 |
| `close()` | 현재 state가 `open`/`opening`이면 `closing`으로 전환. `_slideStartTime=now`, `_slideStartPos=현재 position`, `_slideTargetPos=initial`. RAF 재시작 |
| `setState(state)` | `'closed'`/`'open'` 받아 즉시 점프(보간 없음, 데모/초기화용). 그 외 무시 |
| `toggle()` | `_state === 'closed'`/`'closing'` 이면 `open()`, 아니면 `close()` |
| `triggerDenied()` | `_denying=true`, `_denyPulseStartTime=now` — RAF에서 sine 펄스 시작. 펄스 중 재호출 시 시작 시각 갱신(연장) |
| `setSlideAxis(a)` | `'x'`/`'y'`/`'z'` 받아 슬라이드 축 변경. 잘못된 값 무시. 변경 시 기존 축의 position을 initial로 reset 후 새 축에 적용 |
| `setSlideDistance(d)` | 슬라이드 거리 (mesh-local 단위, 양수). 잘못된 값 무시. open 상태 유지 시 즉시 새 거리로 재설정 |
| `setSlideDuration(ms)` | 슬라이드 지속 시간 (양수 ms). 잘못된 값 무시 |
| `setDenyPulseDuration(ms)` | 펄스 총 지속 시간 (양수 ms). 잘못된 값 무시 |
| `setDenyPulseColor(hex)` | 펄스 색상 (0x000000 ~ 0xffffff). 잘못된 값 무시 |
| `setFrameMeshName(name)` | 펄스 대상 mesh를 외부에서 지정 (기본 `'automaticDoor'`). 다른 GLTF 변종 답습 시 사용. 변경 시 기존 frame emissive 복원 후 새 mesh로 재캡처 |
| `setDoorMeshName(name)` | 슬라이드 대상 mesh를 외부에서 지정 (기본 `'doorGlass_A'`). 변경 시 기존 door position 복원 후 새 mesh로 재캡처 |
| `getState()` | 현재 state (`'closed'`/`'opening'`/`'open'`/`'closing'`) |
| `isAnimating()` | `_state in {'opening', 'closing'}` 또는 `_denying === true` |
| `enable()` / `disable()` / `isEnabled()` | 전체 채널 토글. disable 시 RAF stop + (옵션) 펄스 종료 + emissive 원복 |
| `destroy()` | RAF cancel + `doorGlass_A.position` 원본 복원 + `automaticDoor.emissive`/`emissiveIntensity` 원본 복원 + 모든 reference null + 마지막 줄 `this.doorOpenClose = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| `_state` (초기) | `'closed'` | 마운트 시 닫힘 위치(initial position) |
| `_frameMeshName` | `'automaticDoor'` | GLTF 자식 mesh 0 (프레임) |
| `_doorMeshName` | `'doorGlass_A'` | GLTF 자식 mesh 1 (유리 패널) |
| `_slideAxis` | `'x'` | 좌우 슬라이드 — GLTF X축 폭(0.04)이 가장 길어 자연 |
| `_slideDistance` | `0.04` (mesh-local) | 유리 패널 폭(0.0387)과 일치 — 한 폭 슬라이드 = 완전 개방 |
| `_slideDuration` | `800` (ms) | 자동문 일반 동작 시간 — 빠르지도 느리지도 않음 |
| `_denyPulseDuration` | `1500` (ms) | 1.5초 펄스 — 출입 거부 알림으로 충분 |
| `_denyPulseColor` | `0xff3333` | 적색 발광 — 출입 거부의 시각 관습 |
| `_denyPulseMaxIntensity` | `1.5` | BATT/alarmPulse·MCCB/breaker_leverPosition와 동일 (ACESFilmic 톤매핑 1.2 환경 기준) |
| 펄스 sine 주기 | `200` (ms) | 빠른 펄스 — 1.5초 동안 7~8회 깜빡 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~ 동일 정책) |

> **자동 데모 정책**: register.js는 자동 open/close/triggerDenied 호출하지 않음. preview에서 마운트 직후 시퀀스로 `closed→1.5s→open()→3s→close()→5s→triggerDenied()→7s→open()`을 호출하여 시각 관찰 보장. 운영에서는 페이지가 출입 데이터·인증 결과로 메서드 호출.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만, 두 mesh 각각) |

문 개폐/펄스는 페이지가 외부 명령형으로 직접 호출 (`instance.doorOpenClose.open(...)` 등). 색상과 개폐는 직교 토픽 — 같은 자동문에서 색상은 normal/warning/error/offline, 개폐는 closed/opening/open/closing. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.doorOpenClose` API 등록 + (THREE 가용 시) 자동 enable + equipmentStatus 구독. 초기 state=`'closed'`로 시작 (door는 initial position 유지). RAF는 idle (정적 state + `_denying=false`)
- 페이지가 `instance.doorOpenClose.open()` 등 호출로 슬라이드/펄스 트리거
- `beforeDestroy.js`: 구독 해제 → `this.doorOpenClose?.destroy()` (RAF cancel + position/emissive 복원 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/doorOpenClose |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ (두 mesh 각각 색상) | ✓ (동일) |
| `this.doorOpenClose` 네임스페이스 | 없음 | `open/close/setState/toggle/triggerDenied/setSlideAxis/setSlideDistance/setSlideDuration/setDenyPulseDuration/setDenyPulseColor/setFrameMeshName/setDoorMeshName/getState/isAnimating/enable/disable/isEnabled/destroy` 노출 |
| 4-state machine | 없음 | `closed/opening/open/closing` |
| RAF 매 프레임 easeInOutQuad 보간 + emissive sine 변조 | 없음 | 있음 — 정적 state + 펄스 비활성 시 idle 일시정지 |
| `doorGlass_A.position[axis]` 채널 사용 | 없음 | 사용 (절대 갱신 + destroy reset) |
| `automaticDoor.material.emissive` 채널 사용 | 없음 | triggerDenied 시 sine wave 변조 |
| beforeDestroy | meshState만 정리 | doorOpenClose(RAF + position reset + emissive 복원) → meshState 역순 |
| 화면 표시 | 단일 색상 자동문 본체 | 단일 색상 + 유리 패널 슬라이드 + 출입 거부 시 프레임 적색 펄스 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/doorOpenClose는 추가로 (a) `doorGlass_A.position[axis]` 채널 (b) `automaticDoor.material.emissive` 펄스 채널 (c) `open/close/triggerDenied/...` 외부 명령형 API (d) RAF 매 프레임 easeInOutQuad 보간 (e) idle 일시정지 — 다섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (MCCB/breaker_leverPosition 답습) |
| 2 | self-null `this.doorOpenClose = null` + RAF cancel + position/emissive 복원 | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + doorGlass_A.position 원본 복원 + automaticDoor.emissive 원본 복원 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.doorOpenClose?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachDoorOpenClose(inst)` 내부 destroy도 RAF cancel + position/emissive 복원 + `inst.doorOpenClose = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setXxx/get*/enable/disable/isEnabled/destroy` (MCCB/breaker_leverPosition + AHU103/dynamicRpm 시그니처 그룹 일관) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Status 4버튼 ↔ `meshState.renderData`, Open/Close/Denied 3버튼 ↔ `open/close/triggerDenied`, axis 토글 x/y/z ↔ `setSlideAxis`, duration 슬라이더 ↔ `setSlideDuration` |
| 7 | 기본값 시각 관찰 | OK — 마운트 직후 자동 enable + 시퀀스 데모(`closed→1.5s→open→3s→close→5s→triggerDenied→7s→open`)로 슬라이드+펄스 명확히 관찰 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

**8항목 모두 통과.** 알고리즘·API 시그니처·RAF 정책·destroy 규약은 MCCB/breaker_leverPosition + AHU103/dynamicRpm 답습 그대로.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.doorInst = wemb.getDesignComponent('AutomaticDoor2P');

// 출입 카드 인증 토픽 어댑터
const onAccessRequest = ({ response: data }) => {
    // data: { granted: boolean }
    if (data.granted) {
        this.doorInst.doorOpenClose.open();
        // 일정 시간 후 자동 close
        setTimeout(() => this.doorInst.doorOpenClose.close(), 5000);
    } else {
        this.doorInst.doorOpenClose.triggerDenied();
    }
};

// 외부 직접 제어
this.doorInst.doorOpenClose.setSlideDuration(1200);   // 좀 더 느린 슬라이드
this.doorInst.doorOpenClose.setDenyPulseColor(0xff8800); // 노란-주황 경광
```

---

## 모델 주의사항

- `models/AutomaticDoor2P/01_default/AutomaticDoor2P.gltf`의 두 자식 mesh 이름은 `'automaticDoor'`/`'doorGlass_A'`로 확정. 본 변형은 `getObjectByName(...)`로 두 mesh를 직접 조회한다.
- root scale [1000, 1000, 1000] 업스케일 패턴이 적용되어 있어 mesh-local 0.04 슬라이드 = world 40 단위. preview 카메라 거리(`maxDim*2.2 ≈ 88`)에서 슬라이드가 명확히 인지된다.
- GLTF에 AnimationClip이 정의되어 있지 않다 (`animations` 배열 비어있음) — 본 변형은 mesh.position 직접 갱신·emissive 직접 변조 방식으로 클립 의존이 없으므로 무방.
- **2P 단일 패널 한계**: GLTF 자체에 `doorGlass_B` 같은 대칭 패널이 없어 진정한 양문 슬라이드는 불가. 단일 패널 슬라이드로 한정.
- **[MODEL_READY] placeholder 사용 안 함** — meshName(`'automaticDoor'`/`'doorGlass_A'`)은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 메모

- **자동문 도메인 1차 등장**: 본 변형은 `doorOpenClose` 도메인의 1차 등장. SpeedGate(현재 Standard 미생산) 등 후속 출입 통제 컴포넌트가 등장하면 **`DoorOpenCloseMixin`** 답습 가능성 — state machine + position transform + emissive 펄스 시그니처 흡수 가능. 단 1차 등장 단계이므로 임계점 미도달 → **단일 컴포넌트 전용 커스텀 메서드 채택**.
- **MCCB/breaker_leverPosition와의 차이**: 알고리즘 핵심(state machine + RAF idle pause + emissive 펄스 + RAF self-null)은 동일하나 **(a) state 수**(3 vs 4), **(b) 보간 함수**(1차 시스템 vs easeInOutQuad), **(c) 갱신 채널**(rotation vs position), **(d) 펄스 트리거**(state 지속 vs 1회성 duration)가 모두 다르다. 두 변형을 한 Mixin으로 통합하면 옵션 분기 폭발 — 별도 Mixin이 자연스럽다.
- **RAF 메모리 누수 방지**: destroy/disable에서 반드시 cancelAnimationFrame + doorGlass_A.position 원본 복원 + automaticDoor.emissive/emissiveIntensity 원본 복원. enable은 RAF 재진입 안전(중복 시작 방지 — `rafId !== null`이면 ensureLoop no-op).
