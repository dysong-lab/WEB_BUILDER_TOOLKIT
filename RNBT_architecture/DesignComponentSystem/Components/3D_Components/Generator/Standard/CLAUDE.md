# Generator — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Generator 전체(자식 Mesh 일괄)의 색상 변경

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

- 경로: `models/Generator/01_default/Generator.gltf`
- meshName: `Generator` (루트 Group 노드 이름; MeshStateMixin이 Group을 감지하여 자식 Mesh 3개를 traverse로 일괄 색상 적용)
- 자식 Mesh: `Generator_mesh_A`, `Generator_blade`, `Generator`
- 텍스처 폴더: `maps/` (일반적 `textures/`와 다름 — GLTF 내부 URI도 `maps/...`로 참조)
