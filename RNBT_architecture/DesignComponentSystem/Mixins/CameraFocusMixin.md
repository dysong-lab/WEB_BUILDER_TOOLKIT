# CameraFocusMixin

## 설계 의도

카메라를 특정 대상으로 이동시킨다.

3D 장면에서 특정 메시나 좌표로 카메라를 부드럽게 이동시킨다. 포커스 대상 전환과 애니메이션을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 필수 | 의미 |
|------|------|------|
| `camera` | O | Three.js Camera 객체 |
| `controls` | X | OrbitControls 등 카메라 컨트롤 |
| `getMeshByName` | X | 메시 이름으로 객체를 찾는 함수 (focusOn 사용 시 필요) |
| `duration` | X | 애니메이션 시간 (ms, 기본값 1000) |

---

## 사용 예시

### register.js

```javascript
applyCameraFocusMixin(this, {
    camera: this.camera,
    controls: this.controls,
    getMeshByName: this.getMeshByName,
    duration: 1000
});
```

### 페이지에서 호출

```javascript
// 메시 이름으로 포커스
targetInstance.cameraFocus.focusOn('pump-01', { y: 5, z: 10 });

// 좌표로 포커스
targetInstance.cameraFocus.focusOnPosition(
    { x: 0, y: 10, z: 20 },    // 카메라 위치
    { x: 0, y: 0, z: 0 }       // 바라볼 위치
);

// 초기 위치로 복귀
targetInstance.cameraFocus.reset();
```

---

## 주입되는 네임스페이스

`this.cameraFocus`

| 속성/메서드 | 역할 |
|------------|------|
| `focusOn(meshName, offset)` | 대상 메시로 카메라 이동. offset으로 카메라 위치 조정 |
| `focusOnPosition(position, target)` | 지정 좌표로 카메라 이동 |
| `reset()` | 초기 카메라 위치로 복귀 |
| `destroy()` | 애니메이션 정리 + 모든 속성/메서드 정리 |

