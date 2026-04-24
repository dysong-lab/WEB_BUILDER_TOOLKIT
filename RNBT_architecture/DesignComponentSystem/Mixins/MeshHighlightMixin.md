# MeshHighlightMixin

## 설계 의도

선택한 대상을 시각적으로 강조한다.

3D 메시의 emissive 색상을 적용/해제하여 선택 상태를 시각적으로 피드백한다. MeshStateMixin이 `material.color`를 사용하므로, 이 Mixin은 `material.emissive`를 사용하여 두 Mixin이 동시에 적용되어도 충돌하지 않는다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `highlightColor` | hex (number) | X | `0xffaa00` | 강조 시 적용할 emissive 색상 |
| `highlightIntensity` | number | X | `0.4` | emissive 강도 (0.0 ~ 1.0) |

3D 컴포넌트의 메시 선택을 시각적으로 강조한다. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 메시를 탐색한다.

### highlightColor / highlightIntensity

```javascript
applyMeshHighlightMixin(this, {
    highlightColor: 0xffaa00,     // 주황색 발광
    highlightIntensity: 0.4       // 발광 강도
});
```

---

## MeshStateMixin과의 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 표현 (normal/warning/error) |
| MeshHighlightMixin | `material.emissive` | 사용자 선택 피드백 |

두 채널은 독립적으로 동작한다. 상태가 "warning"(노란색)인 메시를 선택하면, color는 노란색 + emissive는 주황색 발광이 동시에 적용된다.

---

## 사용 예시

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
}
```

---

## 주입되는 네임스페이스

`this.meshHighlight`

| 속성/메서드 | 역할 |
|------------|------|
| `highlight(meshName)` | 지정 메시에 emissive 강조 적용. 이미 강조된 메시면 무시 |
| `unhighlight(meshName)` | 지정 메시의 emissive 강조 해제, 원본 복원. 강조되지 않은 메시면 무시 |
| `clearAll()` | 모든 강조된 메시의 emissive 강조 해제 |
| `isHighlighted(meshName)` | 지정 메시가 현재 강조 상태인지 조회 (boolean) |
| `destroy()` | 모든 강조 해제 + 원본 맵 정리 + 모든 속성/메서드 null 처리 |

---

## 메서드 입력 포맷

모든 메서드는 단순 시그니처이므로 표로 기술.

| 메서드 | 파라미터 | 타입 | 필수 | 기본값 | 의미 | 반환 |
|--------|----------|------|------|--------|------|------|
| `highlight` | `meshName` | string | ✓ | — | `instance.appendElement.getObjectByName(meshName)`으로 조회되는 메시 이름. 조회 실패 또는 `material` 없음이면 무시 | `void` |
| `unhighlight` | `meshName` | string | ✓ | — | 해제 대상 메시 이름. 현재 강조되지 않았거나 조회 실패면 무시 | `void` |
| `clearAll` | — | — | — | — | 현재 강조된 모든 메시 일괄 해제 | `void` |
| `isHighlighted` | `meshName` | string | ✓ | — | 조회 대상 메시 이름 | `boolean` |
| `destroy` | — | — | — | — | 모든 강조 해제 + 내부 Set/Map 초기화 + 네임스페이스 null | `void` |

**`meshName`의 출처**: 페이지 핸들러에서 보통 `targetInstance.resolveMeshName(event)`로 얻는다. 사용자 클릭 대상 메시의 `mesh.name`(THREE.js `Object3D.name`) 값.
