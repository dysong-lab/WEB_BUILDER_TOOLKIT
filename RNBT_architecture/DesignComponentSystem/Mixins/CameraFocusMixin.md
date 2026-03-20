# CameraFocusMixin

## 설계 의도

카메라를 특정 대상으로 이동시킨다.

3D 장면에서 특정 메시나 좌표로 카메라를 부드럽게 이동시킨다. 포커스 대상 전환과 애니메이션을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### 적용 시점 옵션 (기본값)

| 옵션 | 필수 | 의미 |
|------|------|------|
| `camera` | X | Three.js Camera 객체 (기본값, 호출 시 override 가능) |
| `controls` | X | OrbitControls 등 카메라 컨트롤 (기본값, 호출 시 override 가능) |
| `duration` | X | 애니메이션 시간 (ms, 기본값 1000) |

### 호출 시점 파라미터 (focusOn)

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `container` | O | 메시를 찾을 3D 컨테이너 (THREE.Object3D) |
| `meshName` | O | 포커스 대상 메시 이름 (container.getObjectByName으로 탐색) |
| `offset` | X | 카메라 오프셋 { x, y, z } |
| `camera` | X | 기본값 override |
| `controls` | X | 기본값 override |

---

## 사용 예시

### register.js

```javascript
applyCameraFocusMixin(this, {
    camera: this.camera,
    controls: this.controls,
    duration: 1000
});
```

### 페이지 핸들러

```javascript
'@cameraFocusClicked': ({ event, targetInstance }) => {
    const meshName = event.target.dataset.target;
    targetInstance.cameraFocus.focusOn({
        container: gltfInstance.appendElement,
        meshName: meshName
    });
}
```

---

## 주입되는 네임스페이스

`this.cameraFocus`

| 속성/메서드 | 역할 |
|------------|------|
| `focusOn({ container, meshName, offset, camera, controls })` | container에서 meshName을 찾아 카메라 이동 |
| `focusOnPosition({ position, target, camera, controls })` | 지정 좌표로 카메라 이동 |
| `reset({ camera, controls })` | 초기 카메라 위치로 복귀 |
| `destroy()` | 애니메이션 정리 + 모든 속성/메서드 정리 |
