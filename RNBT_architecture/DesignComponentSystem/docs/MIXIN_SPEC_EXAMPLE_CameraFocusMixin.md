# Mixin 명세서: CameraFocusMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 보는 위치를 전환한다 |
| **기능** | 3D 장면에서 특정 메시나 좌표로 카메라를 애니메이션 이동시키고, 초기 위치로 복귀할 수 있다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | - |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션 (적용 시점 기본값)

| 옵션 | 필수 | 의미 |
|------|------|------|
| `camera` | X | Three.js Camera 객체 (기본값, 호출 시 override 가능) |
| `controls` | X | OrbitControls 등 카메라 컨트롤 (기본값, 호출 시 override 가능) |
| `duration` | X | 애니메이션 시간 (ms, 기본값 1000) |

---

## 3. renderData 기대 데이터

해당 없음. CameraFocusMixin은 renderData 패턴을 사용하지 않는다. 대신 focusOn, focusOnPosition, reset 메서드를 직접 호출하여 사용한다.

### focusOn 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `container` | O | 메시를 찾을 3D 컨테이너 (THREE.Object3D) |
| `meshName` | O | 포커스 대상 메시 이름 (`container.getObjectByName`으로 탐색) |
| `offset` | X | 카메라 오프셋 `{ x, y, z }`. 없으면 기본값 `{ y: +5, z: +10 }` |
| `camera` | X | 기본값 override |
| `controls` | X | 기본값 override |

### focusOnPosition 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `position` | O | 카메라 위치 `{ x, y, z }` |
| `target` | O | 카메라가 바라볼 위치 `{ x, y, z }` |
| `camera` | X | 기본값 override |
| `controls` | X | 기본값 override |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 페이지 핸들러에서 이벤트 수신 → focusOn/focusOnPosition 호출
  - 초기 위치로 돌아갈 때 → reset 호출

초기 카메라 위치는 첫 focusOn/focusOnPosition 호출 시 자동 저장된다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.cameraFocus`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `focusOn({ container, meshName, offset, camera, controls })` | container에서 meshName을 찾아 카메라를 애니메이션 이동 |
| `focusOnPosition({ position, target, camera, controls })` | 지정 좌표로 카메라를 애니메이션 이동 |
| `reset({ camera, controls })` | 초기 카메라 위치로 애니메이션 복귀 |
| `destroy()` | 진행 중 애니메이션 취소 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- cancelAnimationFrame(animationId)
- animationId = null
- initialPosition = null
- initialTarget = null
- ns.focusOn = null
- ns.focusOnPosition = null
- ns.reset = null
- instance.cameraFocus = null
```

---

## 6. 사용 예시

### register.js

```javascript
applyCameraFocusMixin(this, {
    camera: this.camera,
    controls: this.controls,
    duration: 1000
});
```

### 페이지 핸들러 (before_load.js)

```javascript
'@cameraFocusClicked': ({ event, targetInstance }) => {
    const meshName = event.target.dataset.target;
    targetInstance.cameraFocus.focusOn({
        container: gltfInstance.appendElement,
        meshName: meshName
    });
}

'@cameraResetClicked': ({ targetInstance }) => {
    targetInstance.cameraFocus.reset();
}
```

> HTML 예시 없음. 3D Mixin이며, 카메라 이동을 트리거하는 UI는 별도 컴포넌트(예: 2D 패널의 버튼)가 담당한다.

---
