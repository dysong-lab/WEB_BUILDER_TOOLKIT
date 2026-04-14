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

## play options

| 옵션 | 필수 | 의미 |
|------|------|------|
| `loop` | X | THREE.LoopRepeat / THREE.LoopOnce / THREE.LoopPingPong (기본값 THREE.LoopRepeat) |
| `timeScale` | X | 재생 속도 배율 (기본값 1.0) |
| `clampWhenFinished` | X | LoopOnce 시 마지막 프레임 유지 여부 (기본값 false) |

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
