# ClippingPlaneMixin

## 설계 의도

3D 모델의 내부를 보여준다.

ClippingPlane으로 특정 평면 기준 절단면을 표시하고, 절단 위치를 애니메이션으로 이동시킨다. `instance.appendElement`를 순회하여 대상 메시들의 `material.clippingPlanes`에 Plane을 할당한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `renderer` | `THREE.WebGLRenderer` | ✓ | — | apply 시 `renderer.localClippingEnabled = true`로 설정됨. 미제공 시 런타임 오류 (`Cannot read properties of undefined`) |

**초기 평면**: `new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)` — Y축 음수 법선 + constant 0. `enable()` 호출 전까지는 적용되지 않음.

---

## 사용 예시

### register.js

```javascript
applyClippingPlaneMixin(this, {
    renderer: wemb.threeElements.renderer
});
```

### 페이지 핸들러 (before_load.js)

```javascript
'@floorSliderChanged': ({ event, targetInstance }) => {
    const floorY = parseFloat(event.target.value);
    targetInstance.clipping.setPlane('y', floorY);
}

'@clippingToggleClicked': ({ targetInstance }) => {
    if (targetInstance.clipping.isEnabled()) {
        targetInstance.clipping.disable();
    } else {
        targetInstance.clipping.enable();
    }
}

'@showFloorClicked': ({ event, targetInstance }) => {
    const fromY = 0;
    const toY = parseFloat(event.target.dataset.floorHeight);
    targetInstance.clipping.animate(fromY, toY, 500);
}
```

---

## 주입되는 네임스페이스

`this.clipping`

| 속성/메서드 | 역할 |
|------------|------|
| `setPlane(axis, position)` | 축 기반 절단면 설정. axis는 'x'/'y'/'z' |
| `setPlaneFromNormal({ normal, constant })` | 임의 법선 벡터 기반 절단면 설정 |
| `enable()` | 절단 활성화. 대상 메시들의 material.clippingPlanes에 Plane 할당 |
| `disable()` | 절단 비활성화. material.clippingPlanes = [] |
| `isEnabled()` | 현재 절단 활성 상태 조회 (boolean) |
| `animate(from, to, duration)` | Plane constant를 from→to로 애니메이션 보간 (기본값 1000ms) |
| `destroy()` | 애니메이션 중단 + 모든 메시 clippingPlanes 해제 + null 처리 |

---

## 메서드 입력 포맷

### 단순 시그니처

| 메서드 | 파라미터 | 타입 | 필수 | 기본값 | 의미 | 반환 |
|--------|----------|------|------|--------|------|------|
| `setPlane` | `axis` | `'x' \| 'y' \| 'z'` | ✓ | — | 축 문자열. 다른 값이면 법선 `(0,0,0)`이 되어 절단 무의미 | `void` |
| `setPlane` | `position` | number | ✓ | — | `plane.constant`에 대입. `enable` 상태이면 즉시 재적용 | — |
| `enable` | — | — | — | — | 모든 Mesh의 `material.clippingPlanes = [plane]` (재할당 전에 material clone) | `void` |
| `disable` | — | — | — | — | `material.clippingPlanes = []` | `void` |
| `isEnabled` | — | — | — | — | 현재 활성 플래그 반환 | `boolean` |
| `destroy` | — | — | — | — | RAF 중단 + 모든 Mesh의 `clippingPlanes = []` + 네임스페이스 null | `void` |

### `setPlaneFromNormal(params)`

**`params` 형태**

```javascript
{
    normal:   { x: number, y: number, z: number },   // plain 객체 가능
    constant: number
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `normal` | `{x,y,z}` (plain 또는 THREE.Vector3) | ✓ | — | `plane.normal.set(x, y, z)`로 대입. `THREE.Vector3` 불필요 — 필드만 있으면 됨 |
| `constant` | number | ✓ | — | 원점에서 평면까지 부호 있는 거리 |

**반환**: `void`

### `animate(from, to, duration?)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `from` | number | ✓ | — | 애니메이션 시작 `plane.constant` 값 |
| `to` | number | ✓ | — | 끝 값 |
| `duration` | number (ms) | X | `1000` | 애니메이션 시간. `0`/`undefined` 전달 시 기본값 1000 사용 |

**반환**: `void` — Promise 아님. 완료를 await할 수단 없음 (`requestAnimationFrame` 기반).

**부수 효과**: `enabled === false`라도 호출 시 내부적으로 `enabled = true`로 강제 활성화. 호출 전 disable 상태였다면 애니메이션 후에도 활성 상태로 남음 — 필요 시 별도로 `disable()` 호출.
