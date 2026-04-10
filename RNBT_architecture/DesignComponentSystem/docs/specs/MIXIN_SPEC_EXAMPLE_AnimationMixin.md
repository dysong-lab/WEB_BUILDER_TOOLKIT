# Mixin 명세서: AnimationMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 3D 모델의 동작을 재현한다 |
| **기능** | GLTF AnimationClip을 AnimationMixer로 재생/정지/속도 제어한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | 기존 3D Mixin은 시각 상태(MeshState), 강조(MeshHighlight), 가시성(MeshVisibility), 카메라(CameraFocus)를 다룬다. AnimationMixin은 GLTF에 포함된 AnimationClip의 재생을 제어한다 |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션

필수 옵션 없음.

Mixin 내부에서 다음을 자동으로 획득한다:
- `instance.appendElement` → `new THREE.AnimationMixer(instance.appendElement)` 로 Mixer 생성
- `instance.animations` → `THREE.AnimationClip[]` 에서 클립 획득

---

## 3. renderData 기대 데이터

해당 없음. AnimationMixin은 renderData 패턴을 사용하지 않는다. 대신 play, stop, setSpeed 등 메서드를 직접 호출하여 사용한다.

### play 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `clipName` | O | 재생할 AnimationClip 이름 (`instance.animations`에서 탐색) |
| `options` | X | 재생 옵션 객체 |
| `options.loop` | X | THREE.LoopRepeat / THREE.LoopOnce / THREE.LoopPingPong (기본값 THREE.LoopRepeat) |
| `options.timeScale` | X | 재생 속도 배율 (기본값 1.0) |
| `options.clampWhenFinished` | X | LoopOnce 시 마지막 프레임 유지 여부 (기본값 false) |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 데이터 상태 변경 → play/stop 호출 (예: 팬 가동 상태 → play('FanRotation'))
  - 페이지 핸들러에서 이벤트 수신 → play/stop 호출
  - 컴포넌트 해제 시 → destroy 호출 (자동 정리)

내부 렌더 루프:
  - play() 시 내부 RAF 루프 시작 (THREE.Clock으로 delta 계산 → mixer.update(delta))
  - 모든 Action이 정지되면 RAF 루프 자동 중단
  - destroy() 시 RAF 루프 강제 중단
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.animation`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `play(clipName, options)` | 지정 클립 재생. 이미 재생 중이면 무시. options로 loop/timeScale/clampWhenFinished 설정 |
| `stop(clipName)` | 지정 클립 정지. 재생 중이 아니면 무시 |
| `setSpeed(clipName, speed)` | 재생 중인 클립의 속도 변경. 재생 중이 아니면 무시 |
| `stopAll()` | 모든 클립 정지 |
| `isPlaying(clipName)` | 지정 클립이 현재 재생 중인지 조회 (boolean) |
| `getClipNames()` | 사용 가능한 클립 이름 목록 반환 (string[]) |
| `destroy()` | RAF 중단 + mixer.stopAllAction() + mixer.uncacheRoot() + actionMap 정리 + null 처리 |

---

## 5. destroy 범위

```
- cancelAnimationFrame(rafId)
- rafId = null
- clock = null
- mixer.stopAllAction()
- mixer.uncacheRoot(instance.appendElement)
- mixer = null
- actionMap (Map) clear + null
- ns.play = null
- ns.stop = null
- ns.setSpeed = null
- ns.stopAll = null
- ns.isPlaying = null
- ns.getClipNames = null
- instance.animation = null
```

---

## 6. 사용 예시

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

> HTML 예시 없음. 3D Mixin이며, 애니메이션 재생은 데이터 상태나 사용자 이벤트에 의해 트리거된다.

---
