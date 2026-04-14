# ClippingPlaneMixin

## 설계 의도

3D 모델의 내부를 보여준다.

ClippingPlane으로 특정 평면 기준 절단면을 표시하고, 절단 위치를 애니메이션으로 이동시킨다. `instance.appendElement`를 순회하여 대상 메시들의 `material.clippingPlanes`에 Plane을 할당한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 필수 | 의미 |
|------|------|------|
| `renderer` | O | THREE.WebGLRenderer 인스턴스. `renderer.localClippingEnabled = true` 설정에 필요 |

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
