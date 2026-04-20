# LV01 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 본체 Mesh `LV01`과 유리 Mesh `glass_A`의 material 색상을 함께 변경

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

- 경로: `models/LV01/01_default/LV01.gltf`
- meshName: **`LV01`**, **`glass_A`** — GLTF Node/Mesh 이름이 폴더/컴포넌트 이름(`LV01`)과 본체 Mesh 이름(`LV01`) 및 커버 Mesh 이름(`glass_A`) 그대로이다.
- 구조: `scene → root(scale=1000) → [ "LV01"(mesh 0) , "glass_A"(mesh 1) ]`
- 정점 속성: 두 Mesh 모두 POSITION, NORMAL, TEXCOORD_0
- 재질:
  - `LV01` → material `LV01` (PBR, roughness 0.1, baseColorTexture `textures/1FS020.jpg`)
  - `glass_A` → material `glass_A` (PBR, roughness 0.8, baseColorTexture `textures/glass_A.png`, `alphaMode: BLEND`, `doubleSided: true`)
- 좌표 바운드(root scale=1000 적용 후): 약 [-4, -11.9, -9.6] ~ [4, 11.9, 9.6] (약 8 × 24 × 19 단위)
- MeshStateMixin은 각 meshName에 대해 `getObjectByName`으로 Mesh를 얻어 material을 clone 후 color를 적용한다. `glass_A`는 BLEND 모드이므로 색상 변경 후에도 반투명 특성이 유지된다.
- 구독 데이터 예: `[{ meshName: 'LV01', status }, { meshName: 'glass_A', status }]`
