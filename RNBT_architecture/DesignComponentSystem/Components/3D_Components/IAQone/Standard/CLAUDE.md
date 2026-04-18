# IAQone — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `IAQone` Mesh의 material 색상 변경

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

- 경로: `models/IAQone/01_default/IAQone.gltf`
- meshName: `IAQone` (GLTF 최상위 `root` 아래 단일 자식 Node/Mesh)
- 구조: `root`(scale 1000x) → `IAQone` Mesh (단일)
- Material: 단일 PBR material(`Material #25192306`), 텍스처 `textures/IAQone.jpg`
- MeshStateMixin은 meshName에 대해 `getObjectByName` → material clone + color 적용
