# GeneratorSmall — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Generator Mesh의 색상 변경

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

- 경로: `models/GeneratorSmall/01_default/GeneratorSmall.gltf`
- meshName: `Generator` (GLTF 내부 단일 Mesh 이름; 폴더명 `GeneratorSmall`과 다름)
- 구조: `root`(scale 1000) → Mesh `Generator` (단일)
- 텍스처 폴더: `textures/` (`textures/Generator.jpg`)
