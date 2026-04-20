# GIPAM115 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group(`GIPAM115`) 하위 Mesh들의 색상을 일괄 변경

---

## 구현 명세

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

### 모델 참조

- 경로: `models/GIPAM115/01_default/GIPAM115.gltf`
- meshName: `GIPAM115` (GLTF 루트 Group 노드 이름; MeshStateMixin이 Group을 traverse하여 자식 Mesh인 `Rectangle120`, `Rectangle119`의 material color를 일괄 적용)
