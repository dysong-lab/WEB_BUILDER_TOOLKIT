# area_01 — Advanced/clipping

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **3D 단면 절단** — 축 기반(x/y/z) 평면으로 컨테이너 모델을 절단하여 내부 구조 노출
   - 건물 단면 분석, 층 단면 뷰, X-ray 스타일 내부 관찰
3. **절단면 위치 애니메이션** — 지정 구간을 부드럽게 보간하여 "층 드러내기" 연출

---

## 구현 명세

### Mixin

MeshStateMixin + ClippingPlaneMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### ClippingPlaneMixin 옵션

| 옵션 | 값 |
|------|-----|
| `renderer` | `wemb.threeElements.renderer` (필수 — 미제공 시 런타임 오류) |

`apply` 시점에 `renderer.localClippingEnabled = true`로 설정된다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음. 절단 제어는 페이지 레벨에서 `this.clipping.*`을 직접 호출한다 (슬라이더/버튼/토글).

### 커스텀 메서드

없음. `this.clipping.setPlane/setPlaneFromNormal/enable/disable/isEnabled/animate` 네임스페이스로 충분하다.

---

## 페이지 측 제어 패턴

```javascript
// before_load.js
'@clippingAxisChanged': ({ event, targetInstance }) => {
    const axis = event.target.value; // 'x' | 'y' | 'z'
    const pos = parseFloat(event.target.dataset.position) || 0;
    targetInstance.clipping.setPlane(axis, pos);
}

'@clippingPositionChanged': ({ event, targetInstance }) => {
    const axis = event.target.dataset.axis || 'y';
    const pos = parseFloat(event.target.value);
    targetInstance.clipping.setPlane(axis, pos);
}

'@clippingToggleClicked': ({ targetInstance }) => {
    if (targetInstance.clipping.isEnabled()) {
        targetInstance.clipping.disable();
    } else {
        targetInstance.clipping.enable();
    }
}

'@clippingAnimateClicked': ({ event, targetInstance }) => {
    const from = parseFloat(event.target.dataset.from) || 0;
    const to   = parseFloat(event.target.dataset.to)   || 10;
    targetInstance.clipping.animate(from, to, 800);
}
```

> `animate(from, to, duration?)`는 **`disabled` 상태에서 호출되어도 내부적으로 `enabled = true`로 강제 활성화**된다. 애니메이션 후에도 활성 상태로 남으므로, 필요 시 완료 시점에 별도로 `disable()`을 호출해야 한다. `animate`는 `requestAnimationFrame` 기반이며 Promise가 아니므로 `await` 할 수 없다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| ClippingPlaneMixin | material.clippingPlanes | 단면 노출 제어 |

두 Mixin은 동일한 `material` 객체에 접근하지만 서로 다른 속성에만 기록한다. ClippingPlaneMixin은 `applyClippingToMeshes` 호출 시 `mesh.material = mesh.material.clone()`으로 머티리얼을 분기 복제하므로, 이 시점 이전에 MeshStateMixin이 적용한 색상은 그대로 승계되어 손실되지 않는다.

## 모델 주의사항

area_01.glb의 bounding box는 GLTFLoader 로드 후 `THREE.Box3.setFromObject(model)`로 조회할 수 있다. 절단 위치 슬라이더의 min/max는 모델 높이(Y축 기준)에 맞춰 선정하는 것이 시각적으로 의미있다 — 모델 외부 범위의 값은 절단면이 화면 밖에 놓여 시각 변화가 없다.

`setPlane(axis, position)`에서 `axis`가 'x'/'y'/'z' 이외의 값이면 법선이 `(0,0,0)`이 되어 절단이 무효화되므로, 입력 검증은 페이지 레벨에서 수행한다.
