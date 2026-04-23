# MeshVisibilityMixin

## 설계 의도

3D 장면의 특정 부분을 선택적으로 보여준다.

메시의 visible 속성을 토글하여 show/hide를 제어한다. 층별 분리 보기, X-ray 뷰(외벽 숨기기) 등에서 사용한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

없음. MeshVisibilityMixin은 별도 옵션을 받지 않는다.

```javascript
applyMeshVisibilityMixin(this, {});
```

`instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 메시를 탐색한다.

---

## 사용 예시

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
}

// 전체 보기 복원
'@showAllClicked': ({ targetInstance }) => {
    targetInstance.meshVisibility.showAll();
}
```

---

## 주입되는 네임스페이스

`this.meshVisibility`

| 속성/메서드 | 역할 |
|------------|------|
| `show(meshName)` | 지정 메시를 보이게 한다 (자식 포함) |
| `hide(meshName)` | 지정 메시를 숨긴다 (자식 포함) |
| `toggle(meshName)` | 지정 메시의 가시성을 반전한다 |
| `showOnly(meshNames)` | 지정 목록의 메시만 보이게 하고 appendElement 하위의 나머지 named 객체는 숨긴다 |
| `showAll()` | appendElement 하위의 모든 named 객체를 보이게 한다 (root 제외) |
| `hideAll()` | appendElement 하위의 모든 named 객체를 숨긴다 (root 제외) |
| `isVisible(meshName)` | 지정 메시의 현재 가시성 조회 (boolean) |
| `destroy()` | 모든 메시 보이게 복원 + 상태 맵 정리 + 모든 속성/메서드 null 처리 |

### 일괄 메서드 (showAll / hideAll / showOnly) 주의사항

- 사전 `show/hide` 호출 없이 바로 사용 가능. `appendElement.traverse`로 모든 named 객체를 자율 탐색한다.
- **계층 구조 한계**: 모델이 `Group floor1 { Mesh wall1 }` 구조일 때 `hideAll()` 후 `show('floor1')`을 호출하면 Group만 visible=true로 복원되지만 자식 Mesh는 여전히 visible=false로 남아 실제로는 렌더되지 않는다. Three.js의 visible 상속 규칙상 필연. 계층 구조 모델에서는 자식 이름으로 직접 `show`를 호출하거나 `showOnly`를 사용해야 한다.
