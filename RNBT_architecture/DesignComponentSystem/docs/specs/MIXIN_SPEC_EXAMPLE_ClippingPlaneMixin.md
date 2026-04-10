# Mixin 명세서: ClippingPlaneMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 3D 모델의 내부를 보여준다 |
| **기능** | ClippingPlane으로 특정 평면 기준 절단면을 표시하고, 절단 위치를 애니메이션으로 이동시킨다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | MeshVisibilityMixin은 메시 단위로 보이기/숨기기를 제어한다. ClippingPlaneMixin은 평면 기준으로 모델을 잘라 내부 구조를 노출한다 |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `renderer` | O | THREE.WebGLRenderer 인스턴스. `renderer.localClippingEnabled = true` 설정에 필요 |

Mixin 내부에서 `instance.appendElement`를 순회하여 대상 메시들의 `material.clippingPlanes`에 Plane 배열을 할당한다.

---

## 3. renderData 기대 데이터

해당 없음. ClippingPlaneMixin은 renderData 패턴을 사용하지 않는다. 대신 setPlane, enable, disable, animate 등 메서드를 직접 호출하여 사용한다.

### setPlane 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `axis` | O | 절단 축 ('x', 'y', 'z') |
| `position` | O | 절단 위치 (number). 해당 축에서의 Plane constant 값 |

### setPlaneFromNormal 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `normal` | O | 평면 법선 벡터 `{ x, y, z }` |
| `constant` | O | 평면까지의 거리 (number) |

### animate 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `from` | O | 시작 position (number) |
| `to` | O | 끝 position (number) |
| `duration` | X | 애니메이션 시간 (ms, 기본값 1000) |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 사용자 슬라이더 조작 → setPlane('y', value) 호출
  - 층별 보기 버튼 → animate(fromY, toY, 500) 호출
  - enable/disable로 절단 활성화/비활성화 토글

내부 동작:
  - setPlane() 시 THREE.Plane 생성/업데이트
  - enable() 시 대상 메시들의 material.clippingPlanes에 Plane 할당
  - disable() 시 material.clippingPlanes = [] 로 해제
  - animate() 시 내부 RAF 루프로 Plane constant 보간
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.clipping`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `setPlane(axis, position)` | 축 기반 절단면 설정. axis는 'x'/'y'/'z' |
| `setPlaneFromNormal({ normal, constant })` | 임의 법선 벡터 기반 절단면 설정 |
| `enable()` | 절단 활성화. 대상 메시들의 material.clippingPlanes에 Plane 할당 |
| `disable()` | 절단 비활성화. material.clippingPlanes = [] |
| `isEnabled()` | 현재 절단 활성 상태 조회 (boolean) |
| `animate(from, to, duration)` | Plane constant를 from→to로 애니메이션 보간 |
| `destroy()` | 애니메이션 중단 + 모든 메시 clippingPlanes 해제 + null 처리 |

---

## 5. destroy 범위

```
- cancelAnimationFrame(rafId)
- rafId = null
- 대상 메시들의 material.clippingPlanes = []
- plane = null
- ns.setPlane = null
- ns.setPlaneFromNormal = null
- ns.enable = null
- ns.disable = null
- ns.isEnabled = null
- ns.animate = null
- instance.clipping = null
```

---

## 6. 사용 예시

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

> HTML 예시 없음. 3D Mixin이며, 절단면 제어는 별도 UI 컴포넌트(슬라이더, 버튼)에서 트리거된다.

---
