# MeshStateMixin

## 설계 의도

3D 메시의 시각 상태를 데이터에 따라 변경한다.

데이터의 상태값에 따라 메시의 색상을 변경한다. 상태 → 색상 매핑은 colorMap으로 정의한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `colorMap` | `{ [status: string]: number (hex) }` | X | `{}` | 상태값(키) → 색상(hex number) 매핑. 빈 객체면 어느 status도 매칭되지 않아 색상 변경 없음 (상태만 stateMap에 저장) |

3D 컴포넌트 자신의 메시 상태를 관리한다. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 오브젝트를 탐색한다. 대상이 Mesh이면 직접 material 색상을 변경하고, Group이면 자식 Mesh들을 traverse하여 일괄 변경한다.

Mesh의 `material`이 단일 Material 객체인 경우와 배열(multi-material mesh, 서브메시별로 다른 material)인 경우를 모두 지원한다. 배열이면 각 material을 clone 후 color를 일괄 적용한다.

### colorMap

```javascript
colorMap: {
    normal:   0x34d399,
    warning:  0xfbbf24,
    error:    0xf87171,
    offline:  0x6b7280
}
```

### renderData가 기대하는 데이터

메시 상태 매핑 배열. 각 항목은 meshName(메시 이름)과 status(상태값)를 포함한다.

```javascript
[
    { meshName: 'pump-01', status: 'normal' },
    { meshName: 'pump-02', status: 'warning' },
    { meshName: 'valve-03', status: 'error' }
]
```

---

## 사용 예시

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

---

## 주입되는 네임스페이스

`this.meshState`

| 속성/메서드 | 역할 |
|------------|------|
| `renderData({ response })` | 메시 상태 배열을 받아 색상 일괄 적용 |
| `setMeshState(meshName, status)` | 개별 메시의 상태(색상) 변경. Group이면 자식 Mesh 일괄 적용 |
| `getMeshState(meshName)` | 개별 메시의 현재 상태 조회 |
| `destroy()` | 상태 맵 정리 + 모든 속성/메서드 정리 |

---

## 메서드 입력 포맷

### `renderData(payload)`

**`payload` 형태**

```javascript
{
    response: Array<{
        meshName: string,   // getObjectByName 대상
        status:   string    // colorMap의 키
    }>
}
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `response` | `Array<{meshName,status}>` | ✓ | — | 각 항목에 대해 `setMeshState(meshName, status)` 호출. 다음 경우 **Error throw**: `null` (`data is null`), 배열 아님 (`data is not an array`) |

**반환**: `void`

### `setMeshState(meshName, status)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `meshName` | string | ✓ | — | `instance.appendElement.getObjectByName(meshName)` 대상. 조회 실패 시 무시 |
| `status` | string | ✓ | — | `colorMap[status]` 조회 key. 미정의 상태면 색상 변경 없이 `stateMap`에만 기록 |

**처리 분기**

| 대상 타입 | 처리 |
|----------|------|
| Mesh (단일 material) | `material.clone()` → `color.setHex(color)` |
| Mesh (material 배열 — multi-material) | 각 material을 `clone()` 후 `color.setHex(color)` 일괄 적용 |
| Group/Object3D (material 없음) | `traverse()`로 모든 자식 Mesh에 반복 적용 |

**반환**: `void`

### `getMeshState(meshName)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `meshName` | string | ✓ | — | 조회 대상 |

**반환**: `string | undefined` — 한 번도 `setMeshState`로 설정되지 않은 메시면 `undefined`.

### `destroy()`

파라미터 없음. `stateMap.clear()` + 네임스페이스 null.

**반환**: `void`
