# Mixin 명세서: MeshHighlightMixin

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 선택한 대상을 시각적으로 강조한다 |
| **기능** | 3D 메시의 emissive 색상을 적용/해제하여 선택 상태를 시각적으로 피드백한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | 없음 |
| **기능의 차이** | MeshStateMixin은 "데이터를 보여준다"가 목적이며, 데이터 상태에 따라 `material.color`를 변경한다. MeshHighlightMixin은 "선택을 강조한다"가 목적이며, 사용자 조작에 따라 `material.emissive`를 변경한다. 목적이 다르고, 사용하는 material 채널도 다르므로(color vs emissive) 동시 적용 시 충돌하지 않는다. |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 메시를 탐색한다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `highlightColor` | X | 강조 시 적용할 emissive 색상 (hex, 기본값 `0xffaa00`) |
| `highlightIntensity` | X | emissive 강도 (기본값 `0.4`) |

```javascript
applyMeshHighlightMixin(this, {
    highlightColor: 0xffaa00,
    highlightIntensity: 0.4
});
```

---

## 3. renderData 기대 데이터

해당 없음. MeshHighlightMixin은 renderData 패턴을 사용하지 않는다. 대신 highlight, unhighlight, clearAll 메서드를 직접 호출하여 사용한다.

### highlight 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `meshName` | O | 강조할 메시 이름 (`instance.appendElement.getObjectByName`으로 탐색) |

### unhighlight 파라미터

| 파라미터 | 필수 | 의미 |
|---------|------|------|
| `meshName` | O | 강조 해제할 메시 이름 |

### 사용 흐름

```
renderData 패턴이 아닌 직접 호출 패턴:
  - 페이지 핸들러에서 3D 클릭 이벤트 수신 → highlight(meshName) 호출
  - 다른 메시 클릭 또는 빈 공간 클릭 → unhighlight(meshName) 또는 clearAll() 호출

내부 동작:
  1. highlight(meshName):
     - getObjectByName으로 메시 탐색
     - 이미 강조된 메시면 무시
     - 원본 emissive/emissiveIntensity 저장 (최초 1회만)
     - material.clone() 후 emissive.setHex(highlightColor), emissiveIntensity = highlightIntensity 적용
     - highlightMap에 meshName 기록

  2. unhighlight(meshName):
     - highlightMap에 없으면 무시
     - 저장된 원본 emissive/emissiveIntensity로 복원
     - highlightMap에서 제거

  3. clearAll():
     - highlightMap의 모든 meshName에 대해 unhighlight 호출
```

### MeshStateMixin과의 공존

MeshStateMixin은 `material.color.setHex()`를 사용하고, MeshHighlightMixin은 `material.emissive.setHex()`를 사용한다.

```
MeshStateMixin이 material.clone()을 수행하면:
  → 복제된 material에 color 적용
  → 이후 MeshHighlightMixin이 같은 material의 emissive를 변경

MeshHighlightMixin이 material.clone()을 수행하면:
  → MeshStateMixin이 적용한 color가 복제본에 유지됨
  → emissive만 추가로 변경
```

두 Mixin 모두 material.clone()을 수행하므로, **나중에 호출되는 쪽이 이전 Mixin의 변경을 포함한 복제본**을 만든다. 순서에 무관하게 color와 emissive가 독립적으로 적용된다.

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.meshHighlight`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `highlight(meshName)` | 지정 메시에 emissive 강조 적용. 이미 강조된 메시면 무시 |
| `unhighlight(meshName)` | 지정 메시의 emissive 강조 해제, 원본 복원. 강조되지 않은 메시면 무시 |
| `clearAll()` | 모든 강조된 메시의 emissive 강조 해제 |
| `isHighlighted(meshName)` | 지정 메시가 현재 강조 상태인지 조회 (boolean) |
| `destroy()` | 모든 강조 해제 + 원본 맵 정리 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- clearAll() 호출 (모든 강조 해제)
- highlightMap.clear()
- originalMap.clear()
- ns.highlight = null
- ns.unhighlight = null
- ns.clearAll = null
- ns.isHighlighted = null
- instance.meshHighlight = null
```

---

## 6. 사용 예시

### register.js

```javascript
applyMeshHighlightMixin(this, {
    highlightColor: 0xffaa00,
    highlightIntensity: 0.4
});
```

### 페이지 핸들러 (before_load.js)

```javascript
'@meshClicked': ({ event, targetInstance }) => {
    const meshName = targetInstance.resolveMeshName(event);
    if (!meshName) {
        targetInstance.meshHighlight.clearAll();
        return;
    }

    targetInstance.meshHighlight.clearAll();
    targetInstance.meshHighlight.highlight(meshName);

    // CameraFocusMixin과 조합 사용
    targetInstance.cameraFocus.focusOn({
        container: targetInstance.appendElement,
        meshName: meshName
    });
}
```

> HTML 예시 없음. 3D Mixin이며, 강조를 트리거하는 UI는 3D 클릭(Raycasting) 또는 별도 2D 컴포넌트가 담당한다.

---
