# MeshStateMixin

## 설계 의도

3D 메시의 시각 상태를 데이터에 따라 변경한다.

데이터의 상태값에 따라 메시의 색상을 변경한다. 상태 → 색상 매핑은 colorMap으로 정의한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### options

| 옵션 | 필수 | 의미 |
|------|------|------|
| `colorMap` | O | 상태값 → 색상(hex) 매핑 |

3D 컴포넌트 자신의 메시 상태를 관리한다. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName`으로 메시를 탐색한다.

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
| `setMeshState(meshName, status)` | 개별 메시의 상태(색상) 변경 |
| `getMeshState(meshName)` | 개별 메시의 현재 상태 조회 |
| `destroy()` | 상태 맵 정리 + 모든 속성/메서드 정리 |
