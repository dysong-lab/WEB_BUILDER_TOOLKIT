# LEVELMonnit_Sensors — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 Mesh `LEVELMonnit_Sensors`의 material 색상을 변경

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

- 경로: `models/LEVELMonnit_Sensors/01_default/LEVELMonnit_Sensors.gltf`
- meshName: `LEVELMonnit_Sensors` (단일 Mesh Node)
- 구조: `root`(scale 1000) → Mesh `LEVELMonnit_Sensors` (단일 primitive, Material #36)
- 텍스처: `textures/LEVELMonnit_Sensors.jpg` (UV 매핑, GLTF images 참조). `LEVELMonnit_Sensors-P.png`는 보조 맵으로 파일만 존재 (GLTF 미참조)
- 폴더명과 최상위 Mesh 노드명이 `LEVELMonnit_Sensors`로 일치 — 이름 불일치 주의 없음
- MeshStateMixin은 `getObjectByName('LEVELMonnit_Sensors')`로 단일 Mesh를 얻어 material을 clone 후 color 적용 (single-Mesh 처리 경로)
