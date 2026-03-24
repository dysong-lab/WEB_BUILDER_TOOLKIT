# Mixin 명세서: MeshStateMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 (3D 메시의 시각 상태 변경) |
| **수단** | THREE.Object3D에서 메시를 이름으로 탐색하여 material.color를 변경한다 |
| **기능** | 데이터의 상태값에 따라 colorMap에서 색상을 찾아 메시에 적용한다. 개별 메시 상태 변경/조회도 지원한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | FieldRenderMixin (데이터를 보여준다) |
| **수단의 차이** | FieldRenderMixin은 DOM 요소의 textContent/dataset을 변경한다. MeshStateMixin은 3D 메시의 material.color를 변경한다. 대상이 DOM이 아닌 THREE.Object3D이며, cssSelectors 대신 colorMap으로 상태-색상 매핑을 정의한다. |

---

## 2. 인터페이스

### cssSelectors

해당 없음. 3D Mixin이므로 CSS 선택자를 사용하지 않는다. `instance.appendElement`가 THREE.Object3D이며, `getObjectByName`으로 메시를 탐색한다.

### datasetAttrs

해당 없음. 3D Mixin이므로 data-* 속성을 사용하지 않는다.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `colorMap` | O | 상태값 → 색상(hex) 매핑 |

```javascript
colorMap: {
    normal:   0x34d399,
    warning:  0xfbbf24,
    error:    0xf87171,
    offline:  0x6b7280
}
```

---

## 3. renderData 기대 데이터

### 데이터 형태

```
배열. 각 항목은 meshName(메시 이름)과 status(colorMap의 키)를 가진 객체.
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:
[
    { meshName: 'pump-01', status: 'normal' },
    { meshName: 'pump-02', status: 'warning' },
    { meshName: 'valve-03', status: 'error' }
]
```

### KEY 매칭 규칙

```
data 배열을 순회하며 각 항목에 대해 setMeshState(item.meshName, item.status)를 호출한다.

setMeshState 내부:
  1. instance.appendElement.getObjectByName(meshName)으로 메시를 탐색
  2. colorMap[status]로 색상을 조회
  3. mesh.material.color.setHex(color)로 색상 적용
  4. stateMap에 meshName → status 기록 (getMeshState에서 조회 가능)

meshName/status는 고정 KEY이다 (사용자가 변경할 수 없음).
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.meshState`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `renderData({ response })` | 메시 상태 배열을 받아 색상 일괄 적용 |
| `setMeshState(meshName, status)` | 개별 메시의 상태(색상) 변경 |
| `getMeshState(meshName)` | 개별 메시의 현재 상태 조회. 없으면 undefined |
| `destroy()` | 상태 맵 정리 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- stateMap.clear()
- ns.renderData = null
- ns.setMeshState = null
- ns.getMeshState = null
- instance.meshState = null
```

---

## 6. 사용 예시

### register.js

```javascript
// 3D 컴포넌트 자신의 메시 상태를 관리
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x34d399,
        warning:  0xfbbf24,
        error:    0xf87171,
        offline:  0x6b7280
    }
});

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData]
};
```

> HTML 예시 없음. 3D 컴포넌트는 HTML이 아닌 GLTF/OBJ 등의 3D 모델을 사용하며, `instance.appendElement`가 THREE.Object3D이다.

---
