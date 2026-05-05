# Chiller — Advanced/dynamicRpm

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'chiller' Mesh 색상 변경
2. **RPM 비례 동작 속도 제어** — 외부에서 입력된 RPM 값에 비례하여 GLTF AnimationClip의 `timeScale`을 동적으로 조정하여 압축기/팬의 회전 속도를 실시간 반영
3. **관성 감쇠** — 목표 timeScale로 즉시 점프하지 않고 매 프레임 `lerp(currentScale, targetScale, rate)`로 점진 이동하여 회전체 관성 표현
4. **0 RPM = 정지** — RPM 0 입력 시 timeScale도 0에 수렴 → 시각적으로 회전이 멈춘 상태가 자연스럽게 관찰 가능

---

## 구현 명세

### Mixin

MeshStateMixin + AnimationMixin + 커스텀 `this.dynamicRpm` API (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### AnimationMixin 옵션

필수 옵션 없음. `instance.appendElement` 및 `instance.animations`에서 자동 획득.

### 커스텀 네임스페이스 `this.dynamicRpm`

| 메서드 | 동작 |
|--------|------|
| `start(clipName)` | AnimationMixin으로 클립 `play`(LoopRepeat, timeScale=0) → RAF 루프 시작. 동일 clipName 중복 호출은 no-op |
| `stop(clipName)` | AnimationMixin으로 클립 `stop` → 활성 클립이 모두 사라지면 RAF 정지 |
| `setRpm(clipName, rpm)` | 목표 RPM 설정. 다음 RAF tick부터 `currentScale`이 매핑값으로 lerp 수렴 |
| `setRange(rpmMin, rpmMax, scaleMin, scaleMax)` | RPM → timeScale 선형 매핑 범위 전역 설정. 기본 `(0, 3000) → (0, 3.0)` |
| `setInertia(rate)` | 매 프레임 lerp 비율 (0~1, 기본 0.05). 1에 가까울수록 즉시 반응, 0에 가까울수록 느린 관성 |
| `getMeshNames()` | 현재 등록된 clipName 배열 반환 (메서드명은 `pipeFlow` 시그니처와의 동사 일관성 유지) |
| `destroy()` | RAF 취소 + 등록된 클립 stop + AnimationMixin 정리는 위임(`this.animation.destroy()`는 호출하지 않음, 외부 beforeDestroy가 직접 호출) + 마지막 줄 `this.dynamicRpm = null` (self-null) |

### 매핑 공식

```
ratio       = clamp((rpm - rpmMin) / (rpmMax - rpmMin), 0, 1)
targetScale = scaleMin + ratio * (scaleMax - scaleMin)
currentScale ← lerp(currentScale, targetScale, inertiaRate)   (매 프레임)
this.animation.setSpeed(clipName, currentScale)
```

기본 매핑: `rpm 0 ~ 3000` → `timeScale 0 ~ 3.0`. 1500 RPM = timeScale 1.5(기본 속도의 1.5배).

### 메서드명 표기 — `clipName` vs `meshName`

`pipeFlow` 패턴은 mesh name을 식별자로 사용하지만, 본 변형은 AnimationMixin 위에서 동작하므로 자연 식별자가 **AnimationClip 이름**이다. 외부 시그니처는 `pipeFlow`의 동사 일관성(`start/stop/setSpeed-류/getMeshNames/destroy`)을 유지하되, 인자 의미는 clipName이다 — `getMeshNames`는 이름 호환을 위해 그대로 두고 내부적으로 clip name 배열을 반환한다 (운영/문서에서는 clip name임을 명시).

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

`rpm`은 별도 토픽이 아니라 페이지가 외부 트리거(슬라이더/실측 데이터/계산값)로 `instance.dynamicRpm.setRpm(clipName, rpm)`을 직접 호출한다. `pipeFlow` 패턴과 동일한 외부 명령형 API.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='chiller' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`는 API만 등록한다. **자동 `start()` 호출하지 않음** (AnimationMixin/pipeFlow와 동일 규약)
- 페이지 `loaded.js` 또는 호스트 코드에서 `instance.dynamicRpm.start(clipName)` 호출로 구동

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/dynamicRpm |
|------|----------|---------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyAnimationMixin` | ✗ | ✓ (추가) |
| `this.dynamicRpm` 네임스페이스 | 없음 | `start/stop/setRpm/setRange/setInertia/getMeshNames/destroy` 노출 |
| RAF 루프 | 없음 | dynamicRpm 자체 관리 (lerp 진행 시에만 유지) |
| beforeDestroy | meshState만 정리 | dynamicRpm → animation → meshState 역순 정리 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/dynamicRpm은 추가로 (a) AnimationMixer를 통한 클립 재생, (b) timeScale 동적 제어, (c) 관성 감쇠 RAF 루프 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 정의 + 정리가 모두 추가되므로 별도 폴더로 분리한다.

---

## AnimationMixin과의 timeScale 연동 방식

AnimationMixin은 외부에 `setSpeed(clipName, speed)` API를 제공한다 (`Mixins/AnimationMixin.js:136`).

> 단, `setSpeed`는 `action.isRunning() === false`이면 no-op이다. 따라서 dynamicRpm 커스텀 메서드는 다음 순서를 강제한다:
> 1. `start(clipName)` 시점에 AnimationMixin `play(clipName, { loop: LoopRepeat, timeScale: 0 })` 호출 — 클립을 "재생 중·속도 0" 상태로 진입
> 2. 이후 RAF tick에서 `setSpeed(clipName, currentScale)` 호출로 동적 변경

이 방식으로 AnimationMixin의 mixer/clock/RAF 라이프사이클(클립 재생/정지)을 그대로 위임하고, dynamicRpm은 RPM 매핑·lerp 누적·setSpeed 호출만 담당한다. mixer 객체에 직접 접근하지 않는다.

---

## 세 채널 공존

| Mixin / API | 채널 | 용도 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 표현 |
| AnimationMixin | AnimationMixer (bone/transform) + 내부 RAF | 클립 재생/정지 |
| dynamicRpm (커스텀) | `action.timeScale` (AnimationMixin setSpeed 경유) + 자체 lerp RAF | RPM 비례 속도 제어 |

color, transform, timeScale은 완전 직교 — 서로 간섭 없음. 두 RAF 루프가 공존하지만 각각 독립 cancel/restart하므로 leakage 없음.

---

## 모델 주의사항

`models/Chiller/01_default/Chiller.gltf`의 GLTF 클립이 존재하지 않거나 페이지에서 `start(clipName)` 호출 없이 `setRpm`만 호출한 경우, `this.animation.setSpeed`가 no-op이므로 dynamicRpm은 안전하게 무동작 처리된다. `getMeshNames()`로 런타임 등록 상태를 확인할 수 있다.

GLTF에 정의된 클립 이름은 페이지 로드 시 `instance.animation.getClipNames()`로 조회 가능. 본 변형은 클립 이름을 register 시점에 고정하지 않고 페이지가 외부에서 지정한다.

---

## 발견한 문제 (Phase 1.5 자율검증)

- **Mixin 승격 후보**: dynamicRpm — Pump/Heatexchanger/AHU103 등 회전 장비 공통 적용 가능. 큐 순번 38·39·40에 동일 패턴 등록되어 있으므로 2번째 컴포넌트(Pump 등) 등록 시점에 `RpmDrivenAnimationMixin`(가칭) 승격 검토 필요. 본 사이클에서는 ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 커스텀 메서드로 완결.

---

## 미래 시나리오 메모

페이지에서 RPM 데이터 토픽이 표준화(예: `equipmentRpm: { clipName, rpm }[]`)되면, dynamicRpm 등록 시 자체 구독 핸들러(`updateEquipmentRpm`)를 추가하여 외부 명령형 API 호출 부담을 줄일 수 있다. 본 변형은 그 단계 이전, 페이지가 직접 `setRpm`을 호출하는 단순 패턴까지만 다룬다.
