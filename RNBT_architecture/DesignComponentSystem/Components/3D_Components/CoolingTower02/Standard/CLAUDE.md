# CoolingTower02 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경

---

## 구현 명세

### meshName

`root` (GLTF 최상위 Group 노드 — 자식 메시 CT31__1__CT31(본체), CT31_ladder_A(사다리)를 포함)

> GLTF 구조상 최상위 Group 이름이 `root`로 저장되어 있다. MeshStateMixin이 Group을 traverse하여 자식 Mesh들의 material을 일괄 변경하므로 `root`를 meshName으로 사용하면 장비 전체 색상이 변경된다.

### Mixin

MeshStateMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음

### 커스텀 메서드

없음
