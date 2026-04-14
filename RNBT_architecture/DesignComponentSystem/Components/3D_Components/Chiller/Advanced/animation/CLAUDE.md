# Chiller — Advanced/animation

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'chiller' Mesh 색상 변경
2. **동작 재현** — equipmentStatus의 `runningClips` 배열에 지정된 AnimationClip만 재생하고, 배열에 없는 나머지는 정지

---

## 구현 명세

### Mixin

MeshStateMixin + AnimationMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData`, `this.updateEquipmentAnimation` |

### 이벤트 (customEvents)

없음

### 커스텀 메서드

#### `updateEquipmentAnimation({ response })`

equipmentStatus payload의 `runningClips: string[]`을 "현재 재생 중이어야 할 클립 목록"으로 해석한다.

payload 예시:

```json
{ "response": [{ "runningClips": ["FanRotation", "PumpRotation"] }] }
```

동작 (diff 방식):

- 배열에 포함되었고 현재 재생 중이 아닌 클립 → `LoopRepeat`으로 재생
- 배열에 없고 현재 재생 중인 클립 → 정지
- 배열에 포함되었고 이미 재생 중인 클립 → 변경 없음 (중복 reset 방지)
- `runningClips` 생략/빈 배열 → 전체 정지

클립 이름을 register 시점에 고정하지 않으므로, 서버가 내려주는 `runningClips` 값에 맞춰 동적으로 제어된다. GLTF에 존재하지 않는 이름이 포함되어도 `play`가 no-op으로 안전 처리된다.

---

## Mixin 공존

MeshState는 `material.color`를 다루고, Animation은 AnimationMixer로 bone/transform 트랙을 제어한다. 두 Mixin의 조작 대상이 완전히 분리되어 있어 충돌하지 않는다.
