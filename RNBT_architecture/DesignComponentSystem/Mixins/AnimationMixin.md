# AnimationMixin

## 설계 의도

3D 모델의 동작을 재현한다.

GLTF AnimationClip을 AnimationMixer로 재생/정지/속도 제어한다. `instance.appendElement`로 Mixer를 생성하고, `instance.animations`에서 클립을 자동 획득하므로 필수 옵션이 없다. 재생 중인 Action이 있을 때만 내부 RAF 루프를 유지한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

필수 옵션 없음.

Mixin 내부에서 자동 획득:
- `instance.appendElement` → `new THREE.AnimationMixer(instance.appendElement)`
- `instance.animations` → `THREE.AnimationClip[]`

---

## 사용 예시

### register.js

```javascript
applyAnimationMixin(this);
```

### 페이지 핸들러 (before_load.js)

```javascript
'@equipmentStarted': ({ targetInstance }) => {
    targetInstance.animation.play('FanRotation', {
        loop: THREE.LoopRepeat,
        timeScale: 1.5
    });
}

'@equipmentStopped': ({ targetInstance }) => {
    targetInstance.animation.stop('FanRotation');
}
```

### 데이터 연동 (register.js에서 변환 메서드)

```javascript
this.updateEquipmentState = function({ response: data }) {
    if (data.running) {
        this.animation.play('FanRotation');
    } else {
        this.animation.stop('FanRotation');
    }
};

this.subscriptions = {
    equipmentStatus: [this.updateEquipmentState]
};
```

---

## 주입되는 네임스페이스

`this.animation`

| 속성/메서드 | 역할 |
|------------|------|
| `play(clipName, options)` | 지정 클립 재생. 이미 재생 중이면 무시 |
| `stop(clipName)` | 지정 클립 정지. 재생 중이 아니면 무시 |
| `setSpeed(clipName, speed)` | 재생 중인 클립의 속도 변경. 재생 중이 아니면 무시 |
| `stopAll()` | 모든 클립 정지 |
| `isPlaying(clipName)` | 지정 클립이 현재 재생 중인지 조회 (boolean) |
| `getClipNames()` | 사용 가능한 클립 이름 목록 반환 (string[]) |
| `destroy()` | RAF 중단 + mixer 정리 + actionMap 정리 + null 처리 |

---

## 메서드 입력 포맷

### `play(clipName, options?)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `clipName` | string | ✓ | — | `THREE.AnimationClip.findByName(instance.animations, clipName)` 조회 대상. 미발견 시 무시 |
| `options` | `object` | X | `undefined` | 아래 참고 |

**`options` 형태**

```javascript
{
    loop?:              number,   // THREE.LoopRepeat | LoopOnce | LoopPingPong
    timeScale?:         number,   // 재생 속도 배율
    clampWhenFinished?: boolean   // LoopOnce 시 마지막 프레임 유지
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `loop` | number (THREE 상수) | X | `THREE.LoopRepeat` | 루프 모드 |
| `timeScale` | number | X | `1.0` | 재생 속도 배율 (음수면 역재생) |
| `clampWhenFinished` | boolean | X | `false` | `LoopOnce` 종료 시 마지막 프레임 유지 여부 |

**반환**: `void`

**비고**: `instance.animations`가 비어 있거나 `clipName`이 일치하는 클립이 없으면 **무시**(no-op, 오류 아님). 이미 재생 중이면 재시작 없이 무시.

### 단순 시그니처

| 메서드 | 파라미터 | 타입 | 필수 | 기본값 | 의미 | 반환 |
|--------|----------|------|------|--------|------|------|
| `stop` | `clipName` | string | ✓ | — | 해당 클립의 Action 정지 + actionMap 제거. 활성 Action 0이면 내부 RAF 중단 | `void` |
| `setSpeed` | `clipName` | string | ✓ | — | 재생 중인 Action에만 적용. 미재생 시 무시 | `void` |
| `setSpeed` | `speed` | number | ✓ | — | `action.timeScale`에 대입 | — |
| `stopAll` | — | — | — | — | 모든 Action `stop()` + actionMap clear + RAF 중단 | `void` |
| `isPlaying` | `clipName` | string | ✓ | — | Action 존재 + `isRunning()` | `boolean` |
| `getClipNames` | — | — | — | — | `instance.animations[].name` 배열 반환. 클립 없으면 `[]` | `string[]` |
| `destroy` | — | — | — | — | RAF 중단 + `mixer.stopAllAction()` + `mixer.uncacheRoot()` + actionMap clear + 네임스페이스 null | `void` |
