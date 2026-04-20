# GateWay_Sensor — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`GateWaySensor`)의 색상 변경

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

- 경로: `models/GateWay_Sensor/01_default/GateWay_Sensor.gltf`
- meshName: `GateWaySensor` (GLTF 내 단일 Mesh 노드 이름; MeshStateMixin이 해당 Mesh의 material color를 직접 적용)
- 폴더명(`GateWay_Sensor`)과 meshName(`GateWaySensor`)이 다르다는 점에 유의(언더스코어 유무) — 코드에서는 `GateWaySensor`를 사용한다.
