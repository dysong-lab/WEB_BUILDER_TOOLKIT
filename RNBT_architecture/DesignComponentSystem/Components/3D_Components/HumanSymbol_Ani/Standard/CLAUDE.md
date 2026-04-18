# HumanSymbol_Ani — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `symbol`, `circle_A` Mesh의 material 색상 변경

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

- 경로: `models/HumanSymbol_Ani/01_default/HumanSymbol_Ani.gltf`
- meshName: `symbol`, `circle_A` (GLTF 최상위 `root` 아래 자식 Node/Mesh 2개)
- 구조: `root`(scale 1000x) → `symbol` Mesh + `circle_A` Mesh
- Material: 각 Mesh가 자체 PBR material 보유 (`Material #66` 등, `textures/symbol.jpg`, `textures/circle_A.png`)
- 애니메이션: GLTF 내부에 `All Animations` 클립이 존재하지만 Standard에서는 사용하지 않음 (상태 색상만 제어)
- MeshStateMixin은 각 meshName에 대해 `getObjectByName` → material clone + color 적용
