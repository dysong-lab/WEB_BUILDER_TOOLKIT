# Chiller — Advanced/clipping

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'chiller' Mesh 색상 변경
2. **3D 단면 절단** — 축 기반(x/y/z) 평면으로 압축기 모델을 절단하여 내부 구조(코일·압축기·튜브 등) 노출
   - 압축기 내부 단면 분석, 정비 시 X-ray 뷰, 부품 배치 검증
3. **절단면 위치 애니메이션** — 지정 구간을 부드럽게 보간하여 "내부 드러내기" 연출

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

> 개별 단위(meshName이 확정된 1 GLTF = 1 Mesh) 컴포넌트이므로 `@meshClicked` 같은 동적 식별 이벤트가 불필요하다. 단면 절단은 메시 단위가 아닌 모델 전체에 대한 평면 연산이므로, 페이지가 외부 트리거(슬라이더/축 버튼/토글/Reveal 버튼)로 `instance.clipping.setPlane/enable/disable/animate`를 직접 호출한다.

### 커스텀 메서드

없음. 순수 Mixin 조합. `this.clipping.setPlane/setPlaneFromNormal/enable/disable/isEnabled/animate` 네임스페이스로 충분하다.

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/clipping |
|------|----------|-------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyClippingPlaneMixin` | ✗ | ✓ (추가) |
| `wemb.threeElements.renderer` 의존 | 없음 | 필수 (renderer 미주입 시 apply 단계에서 throw) |
| `this.clipping` 네임스페이스 | 없음 | `setPlane/setPlaneFromNormal/enable/disable/isEnabled/animate/destroy` 노출 |
| beforeDestroy | meshState만 정리 | clipping(역순) → meshState 정리 |

Standard는 색상 채널만 데이터에 결합한다. Advanced/clipping은 추가로 `material.clippingPlanes` 채널을 페이지에 노출하여, 동일 컴포넌트가 단면 분석 시퀀스(축 슬라이더·Reveal 애니메이션)에 참여할 수 있게 한다. register.js에 Mixin 적용/정리, 그리고 `renderer` 옵션 의존이 추가되므로 별도 폴더로 분리한다.

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

'@clippingRevealClicked': ({ event, targetInstance }) => {
    const from = parseFloat(event.target.dataset.from) || 0;
    const to   = parseFloat(event.target.dataset.to)   || 1;
    targetInstance.clipping.animate(from, to, 800);
}
```

> `animate(from, to, duration?)`는 **`disabled` 상태에서 호출되어도 내부적으로 `enabled = true`로 강제 활성화**된다. 애니메이션 후에도 활성 상태로 남으므로, 필요 시 완료 시점에 별도로 `disable()`을 호출해야 한다. `animate`는 `requestAnimationFrame` 기반이며 Promise가 아니므로 `await`할 수 없다.

---

## 두 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| ClippingPlaneMixin | material.clippingPlanes | 단면 노출 제어 |

두 Mixin은 동일한 `material` 객체에 접근하지만 서로 다른 속성에만 기록한다. ClippingPlaneMixin은 `enable()` 시 `mesh.material = mesh.material.clone()`으로 머티리얼을 분기 복제하므로, 이 시점 이전에 MeshStateMixin이 적용한 색상은 그대로 승계되어 손실되지 않는다.

---

## 모델 주의사항

`models/Chiller/01_default/Chiller.gltf`의 단일 메시 이름은 `'chiller'`로 확정되어 있다. ClippingPlane은 메시 단위가 아닌 모델 전체에 적용되므로 컨테이너 컴포넌트(`meshesArea/area_01`)와 동일하게 모델 bounding box를 기준으로 슬라이더 범위를 결정한다.

GLTFLoader 로드 후 `THREE.Box3.setFromObject(model)`로 X/Y/Z 범위를 조회하여 페이지 슬라이더의 `min/max`를 모델 크기에 맞춘다. 모델 외부 범위의 값은 절단면이 화면 밖에 놓여 시각 변화가 없다.

`setPlane(axis, position)`에서 `axis`가 'x'/'y'/'z' 이외의 값이면 법선이 `(0,0,0)`이 되어 절단이 무효화되므로, 입력 검증은 페이지 레벨에서 수행한다.

---

## 미래 시나리오 메모

압축기 정비 시 특정 부위만 분리해서 보고 싶다는 요구가 반복되면, 메시 단위 단면 노출(특정 mesh의 `material.clippingPlanes`만 제어)을 추상화한 별도 메서드/Mixin이 필요할 수 있다. 본 변형은 그 단계 이전, ClippingPlaneMixin이 모델 전체에 일괄 적용하는 단순 패턴까지 다룬다.
