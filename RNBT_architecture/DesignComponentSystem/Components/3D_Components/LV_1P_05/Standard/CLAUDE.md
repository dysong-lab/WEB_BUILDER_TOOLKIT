# LV_1P_05 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-LO1` Mesh의 material 색상을 변경

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

- 경로: `models/LV_1P_05/01_default/LV_1P_05.gltf`
- meshName: **`LV-LO1`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_1P_05`)과 다르므로 주의. `getObjectByName('LV-LO1')`로 Mesh를 얻는다. LV_1P_02~04의 `LV-J1/J2/J3` 패턴과 달리 `LV-LO1`을 사용한다.
- 구조: `scene → "LV-LO1"(mesh 0, rotation=[0,-1,0,1.19e-8])` — 루트 스케일 노드 없이 단일 Mesh, 라이트 메타 Node 없음
- 정점 속성: POSITION, NORMAL, TEXCOORD_0
- 재질: 단일 PBR material `Material #342540199` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV14.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.5500021, -1.4750011, -1.09999967] ~ [0.5500021, 1.4750011, 1.09999967] (약 1.1 × 2.95 × 2.2 단위)
- MeshStateMixin은 `getObjectByName('LV-LO1')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-LO1', status }]`
