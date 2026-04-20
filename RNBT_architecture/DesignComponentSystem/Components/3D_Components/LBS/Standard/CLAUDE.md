# LBS — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LBS` Group 하위 Mesh들의 material 색상을 일괄 변경

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

- 경로: `models/LBS/01_default/LBS.gltf`
- meshName: `LBS` (최상위 Group Node — 4개 자식 Mesh를 포함)
- 구조: Group `LBS` → { `Line012`, `Circle073`, `Rectangle171`, `Circle071` } (각각 단일 Mesh)
- Materials: `metal03_Gold`(Line012, Circle073), `plastic01`(Rectangle171), `RED`(Circle071)
- 텍스처 폴더명: `textures/` (표준 표기) — GLTF `images[].uri`가 이 경로를 참조
- 폴더명과 최상위 Node명 일치 (`LBS` = `LBS`) — 이름 불일치 주의 없음
- MeshStateMixin은 `getObjectByName('LBS')`로 Group을 얻어 자식 Mesh들을 traverse하여 각 material을 clone 후 color 적용 (Group 처리 로직 활용)
