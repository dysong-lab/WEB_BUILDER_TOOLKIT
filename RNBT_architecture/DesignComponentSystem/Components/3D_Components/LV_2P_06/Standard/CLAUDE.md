# LV_2P_06 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-B1-U` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_06/01_default/LV_2P_06.gltf`
- meshName: **`LV-B1-U`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_06`)과 다르므로 주의. `getObjectByName('LV-B1-U')`로 Mesh를 얻는다. LV 1P/2P 계열의 다른 meshName(`LV-2D2`/`LV-2D4`/`LV-2D13`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, `LV-2C1-U`, `LV-H1-D029`, `LV-2H3`, `LV-2F3`, `LV-2J7`)과 전혀 다른 **`LV-B` 접두 패밀리**의 첫 엔트리로, 접미 토큰은 `1-U`이다 (LV_2P_01의 `-U` 접미와 동일 토큰 조합).
- 구조: `scene → "LV-B1-U"(mesh 0, rotation=[0,-1,0,1.19248806e-08])` — 단일 Node, 단일 Mesh (LV_2P_02/LV_2P_03/LV_2P_04/LV_2P_05와 동일하게 `VRayLight001` 보조 Node 없음)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 66, 인덱스 120 — LV_2P_05보다 복잡)
- 재질: 단일 PBR material `Material #342540144` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV01.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.550003052, -1.47500134, -1.10000026] ~ [0.550003052, 1.47500086, 1.10000026] (약 1.1 × 2.95 × 2.2 단위 — LV_2P_01/LV_2P_04와 동일)
- MeshStateMixin은 `getObjectByName('LV-B1-U')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-B1-U', status }]`
