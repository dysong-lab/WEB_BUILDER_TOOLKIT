# Mixin 명세서: MeshVisibilityMixin

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 3D 장면의 특정 부분을 선택적으로 보여준다 |
| **기능** | 메시의 visible 속성을 토글하여 show/hide를 제어한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | MeshStateMixin은 "데이터를 보여준다"가 목적이며, `material.color`를 변경한다. MeshVisibilityMixin은 "보여줄 범위를 제어한다"가 목적이며, `mesh.visible`을 변경한다. 목적도 수단도 다르다. |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 메시를 탐색한다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션

없음. MeshVisibilityMixin은 별도 옵션을 받지 않는다.

```javascript
applyMeshVisibilityMixin(this, {});
```

---

## 3. renderData 기대 데이터

해당 없음. MeshVisibilityMixin은 renderData 패턴을 사용하지 않는다. 대신 show, hide, toggle, showOnly, showAll, hideAll 메서드를 직접 호출하여 사용한다.

### show / hide / toggle 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `meshName` | O | 대상 메시 이름 (`instance.appendElement.getObjectByName`으로 탐색) |

### showOnly 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `meshNames` | O | 보여줄 메시 이름 배열. 이 목록에 없는 메시는 모두 숨긴다 |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 페이지 핸들러 또는 UI 이벤트에서 호출
  - 층별 분리 보기: hideAll() → show('floor-3')
  - X-ray 뷰: hide('exterior-wall')
  - 선택적 표시: showOnly(['floor-3', 'floor-4'])

내부 동작:
  1. show(meshName): getObjectByName → mesh.visible = true (자식 포함)
  2. hide(meshName): getObjectByName → mesh.visible = false (자식 포함)
  3. toggle(meshName): 현재 visible 상태의 반전
  4. showOnly(meshNames): 전체 순회하여 목록에 있으면 show, 없으면 hide
  5. showAll(): 전체 순회하여 visible = true
  6. hideAll(): 전체 순회하여 visible = false

가시성 상태 추적:
  - visibilityMap(Map<string, boolean>)으로 각 메시의 가시성 상태를 기록
  - isVisible(meshName)로 현재 상태 조회
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.meshVisibility`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `show(meshName)` | 지정 메시를 보이게 한다 (자식 포함) |
| `hide(meshName)` | 지정 메시를 숨긴다 (자식 포함) |
| `toggle(meshName)` | 지정 메시의 가시성을 반전한다 |
| `showOnly(meshNames)` | 지정 목록의 메시만 보이게 하고 나머지는 숨긴다 |
| `showAll()` | 모든 추적 중인 메시를 보이게 한다 |
| `hideAll()` | 모든 추적 중인 메시를 숨긴다 |
| `isVisible(meshName)` | 지정 메시의 현재 가시성 조회 (boolean) |
| `destroy()` | 모든 메시 보이게 복원 + 상태 맵 정리 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- showAll() 호출 (숨겨진 메시 복원)
- visibilityMap.clear()
- ns.show = null
- ns.hide = null
- ns.toggle = null
- ns.showOnly = null
- ns.showAll = null
- ns.hideAll = null
- ns.isVisible = null
- instance.meshVisibility = null
```

---

## 6. 사용 예시

### register.js

```javascript
applyMeshVisibilityMixin(this, {});
```

### 페이지 핸들러 (before_load.js)

```javascript
// 층별 분리 보기
'@floorSelected': ({ event, targetInstance }) => {
    const floorName = event.detail.floorName;
    targetInstance.meshVisibility.hideAll();
    targetInstance.meshVisibility.show(floorName);

    targetInstance.cameraFocus.focusOn({
        container: targetInstance.appendElement,
        meshName: floorName
    });
}

// 전체 보기 복원
'@showAllClicked': ({ targetInstance }) => {
    targetInstance.meshVisibility.showAll();
    targetInstance.cameraFocus.reset();
}
```

> HTML 예시 없음. 3D Mixin이며, 가시성 제어를 트리거하는 UI는 별도 2D 컴포넌트(예: 층 선택 패널)가 담당한다.

---
