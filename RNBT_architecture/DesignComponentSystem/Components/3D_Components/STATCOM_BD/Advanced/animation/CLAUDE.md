# STATCOM_BD — Advanced/animation

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 STATCOM_BD 컨테이너 내부 다수 Mesh 색상 변경
2. **GLTF 애니메이션 재생** — STATCOM_BD.gltf 내장 AnimationClip(node 18 rotation 채널 "All Animations") 재생/정지/속도 제어

---

## 구현 명세

### Mixin

MeshStateMixin + AnimationMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### AnimationMixin 옵션

없음. `instance.appendElement` → AnimationMixer, `instance.animations`에서 클립을 자동 획득한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음. 애니메이션은 clipName 기반 호출이므로 Mesh 클릭 이벤트는 불필요하다.

### 커스텀 메서드

없음. `this.animation.play/stop/stopAll/setSpeed/isPlaying/getClipNames` 네임스페이스로 충분하다.

페이지에서 `instance.animation.play(clipName, { loop, timeScale })` / `stop(clipName)` / `stopAll()`을 직접 호출한다.
데이터 연동이 필요하면 `subscriptions`에 커스텀 핸들러를 추가해 특정 값일 때 자동 재생/정지하도록 구성할 수 있다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| AnimationMixin | transform/morph (GLTF clip) | 연출/동작 재생 |

두 채널은 완전히 직교 — 상태 색상과 변환 애니메이션은 서로 간섭하지 않는다.

## 모델 주의사항

STATCOM_BD.gltf는 node 18의 rotation 단일 채널로 구성된 "All Animations" 클립 1개를 내장한다. 클립 이름은 모델 원본 그대로 사용되며, 페이지는 `this.animation.getClipNames()`로 런타임 조회 가능하다. 클립이 제거되거나 교체되더라도 `this.animation.*` 호출은 AnimationMixin의 graceful fallback으로 no-op 처리된다.
