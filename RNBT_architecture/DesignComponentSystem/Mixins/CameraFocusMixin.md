# CameraFocusMixin

## 설계 의도

보는 위치를 전환한다.

3D 장면에서 특정 메시나 좌표로 카메라를 부드럽게 이동시킨다. 포커스 대상 전환과 애니메이션을 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### 적용 시점 옵션 (기본값)

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `camera` | `THREE.Camera` | X | — | 기본 카메라. 호출 시 override 가능 |
| `controls` | `THREE.Controls` (OrbitControls 등) | X | — | 기본 컨트롤. `target` 속성 필요. 호출 시 override 가능 |
| `duration` | number (ms) | X | `1000` | 이징 애니메이션 시간 |

> `camera`/`controls`가 apply 시점에 미제공이어도 호출 시 매번 전달하면 동작한다. 두 시점 모두 미제공이면 해당 호출은 no-op.

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
| `reset({ camera, controls })` | 초기 카메라 위치로 복귀 (첫 호출 전까지는 no-op) |
| `destroy()` | 애니메이션 정리 + 모든 속성/메서드 정리 |

---

## 메서드 입력 포맷

모든 호출 메서드는 **단일 object 파라미터**를 받으며 내부에서 구조 분해한다. 반환은 모두 `void` (**Promise 아님** — `requestAnimationFrame` 기반 비동기이지만 완료를 await할 수단 없음).

### `focusOn(params)`

**`params` 형태**

```javascript
{
    container: THREE.Object3D,    // 필수
    meshName:  string,            // 필수
    offset?:   { x?: number, y?: number, z?: number },
    camera?:   THREE.Camera,
    controls?: THREE.Controls
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `container` | `THREE.Object3D` | ✓ | — | `container.getObjectByName(meshName)`으로 메시 탐색. 조회 실패 시 호출 전체 no-op |
| `meshName` | string | ✓ | — | 포커스 대상 메시 이름 |
| `offset` | object | X | `{ y: 5, z: 10 }` | 메시 중심 기준 카메라 위치 오프셋. 일부 축만 제공 시 **나머지 축은 0으로 간주** (`offset.x \|\| 0`). 미제공 시 Mixin 기본값 `{ x: 0, y: 5, z: 10 }` 적용 |
| `camera` | `THREE.Camera` | X | apply 시점 `camera` | 이번 호출에만 적용할 오버라이드 |
| `controls` | `THREE.Controls` | X | apply 시점 `controls` | 이번 호출에만 적용할 오버라이드 |

**반환**: `void`

### `focusOnPosition(params)`

**`params` 형태**

```javascript
{
    position:  THREE.Vector3,     // 필수
    target:    THREE.Vector3,     // 필수
    camera?:   THREE.Camera,
    controls?: THREE.Controls
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `position` | `THREE.Vector3` | ✓ | — | 카메라가 이동할 목표 위치. 내부에서 `lerpVectors`에 전달되므로 **`THREE.Vector3` 인스턴스여야 함** (plain `{x,y,z}` 객체 불가) |
| `target` | `THREE.Vector3` | ✓ | — | `controls.target`이 향할 지점. 마찬가지로 `THREE.Vector3` 필수 |
| `camera` | `THREE.Camera` | X | apply 시점 `camera` | 오버라이드 |
| `controls` | `THREE.Controls` | X | apply 시점 `controls` | 오버라이드 |

**반환**: `void`

### `reset(params?)`

**`params` 형태** (전체 선택)

```javascript
{
    camera?:   THREE.Camera,
    controls?: THREE.Controls
}
```

- `params` 자체를 생략 가능. 생략 시 apply 시점 기본값 사용.
- 첫 `focusOn`/`focusOnPosition` 호출이 일어나기 전까지는 저장된 `initialPosition`이 없어 **no-op**.

**반환**: `void`

### `destroy()`

파라미터 없음. 진행 중인 `requestAnimationFrame` 취소 + 초기 위치/타겟 null + 네임스페이스 메서드 null.

**반환**: `void`
