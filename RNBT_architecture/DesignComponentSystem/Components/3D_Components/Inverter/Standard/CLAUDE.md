# Inverter — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `Inverter` Mesh의 material 색상 변경

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

- 경로: `models/Inverter/01_default/Inverter.gltf`
- meshName: `Inverter` (GLTF 최상위 `root` 아래 단일 자식 Node/Mesh)
- 구조: `root`(scale 1000x) → `Inverter` Node (translation≈0) → Mesh `Inverter` (단일 primitive)
- Material: 단일 material(`Inverter`, metallicFactor 0.2 / roughnessFactor 0.5), 텍스처 `textures/1FS100.jpg`
- 텍스처 폴더명: `textures/` (표준 표기) — GLTF 내부가 이 경로를 참조
- 폴더명과 meshName 일치 (`Inverter` = `Inverter`) — 이름 불일치 주의 없음
- MeshStateMixin은 meshName에 대해 `getObjectByName` → material clone + color 적용
