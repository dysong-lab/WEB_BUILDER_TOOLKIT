# LV02 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 본체 Mesh `LV02`의 material 색상을 변경

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

- 경로: `models/LV02/01_default/LV02.gltf`
- meshName: **`LV02`** — GLTF Node/Mesh 이름이 폴더/컴포넌트 이름 그대로이다.
- 구조: `scene → root(scale=1000) → "LV02"(mesh 0)`
- 정점 속성: POSITION, NORMAL, TEXCOORD_0
- 재질: material `LV02` (PBR, metallicFactor 0.2, roughnessFactor 0.5, baseColorTexture `textures/1FS050.jpg`)
- 좌표 바운드(root scale=1000 적용 후): 약 [-4, -11.9, -9.6] ~ [4, 11.9, 9.6] (약 8 × 24 × 19 단위)
- MeshStateMixin은 `getObjectByName('LV02')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV02', status }]`
