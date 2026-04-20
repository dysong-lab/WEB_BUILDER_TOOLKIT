# LV_2P_08 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-F1-U` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_08/01_default/LV_2P_08.gltf`
- meshName: **`LV-F1-U`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_08`)과 다르므로 주의. `getObjectByName('LV-F1-U')`로 Mesh를 얻는다. LV 1P/2P 계열의 다른 meshName(`LV-2D2`/`LV-2D4`/`LV-2D13`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, `LV-2C1-U`, `LV-H1-D029`, `LV-2H3`, `LV-2F3`, `LV-2J7`, `LV-B1-U`, `LV-D2-U`)과 전혀 다른 **`LV-F` 접두 패밀리**의 첫 엔트리로, 접미 토큰은 `1-U`이다 (LV_2P_01의 `LV-2C1-U`, LV_2P_06의 `LV-B1-U`, LV_2P_07의 `LV-D2-U` 접미 `-U`와 동일 토큰 조합). Blank_Panel_03의 `LV-F3`와 접두는 같으나 접미 `-U`가 없어 서로 다른 meshName이다.
- 구조: `scene.nodes = [0, 1]` — Node 0 `"LV-F1-U"`(mesh 0, rotation=[0,-1,0,1.19248806e-08]), Node 1 `"VRayLight001"`(mesh 없음, translation/rotation만). 2-Node 구조 (LV_2P_01·LV_2P_07과 동일). `VRayLight001`은 mesh가 없어 색상 변경 대상에서 자동 제외된다.
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 66, 인덱스 120 — LV_2P_06·LV_2P_07과 동일)
- 재질: 단일 PBR material `Material #342540147` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV02.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.399999619, -1.47500229, -1.1000005] ~ [0.399999619, 1.47500277, 1.1000005] (약 0.8 × 2.95 × 2.2 단위 — LV_2P_07과 동일)
- MeshStateMixin은 `getObjectByName('LV-F1-U')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-F1-U', status }]`
