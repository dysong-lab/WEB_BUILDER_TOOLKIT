# LV_2P_11 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-H1-D028` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_11/01_default/LV_2P_11.gltf`
- meshName: **`LV-H1-D028`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_11`)과 다르므로 주의. `getObjectByName('LV-H1-D028')`로 Mesh를 얻는다. **LV_2P_02의 `LV-H1-D029`·LV_2P_09의 `LV-H1-D012`·LV_2P_10의 `LV-H1-D013`과 동일한 `LV-H1-D###` 접두 패밀리**이며 접미 숫자만 다르다(028 vs 029 vs 012 vs 013). 접미 숫자 028은 LV_2P_02의 029 바로 앞 번호이며, LV_2P_10의 013·LV_2P_09의 012와는 연속되지 않는 별도 영역의 번호이다. LV 1P/2P 계열의 다른 meshName(`LV-2D2`/`LV-2D4`/`LV-2D13`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, `LV-2C1-U`, `LV-2H3`, `LV-2F3`, `LV-2J7`, `LV-B1-U`, `LV-D2-U`, `LV-F1-U`)은 접두 패밀리가 다르다. Blank_Panel_03의 `LV-F3`와도 접두가 다르다.
- 구조: `scene → "LV-H1-D028"(mesh 0, rotation=[0,-1,0,1.19248806e-8])` — 단일 Node, 단일 Mesh (LV_2P_01·LV_2P_07·LV_2P_08과 달리 `VRayLight001` 보조 Node 없음, LV_2P_02/LV_2P_09/LV_2P_10과 동일 패턴)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 46, 인덱스 84 — LV_2P_10·LV_2P_09·LV_2P_02와 정확히 일치)
- 재질: 단일 PBR material `Material #342540210` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true). LV_2P_10의 `Material #342540208`에서 2 증가한 번호.
- 텍스처 폴더: `maps/` (`maps/LV_UPS09.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.399998665, -1.275, -1.09999979] ~ [0.399998665, 1.275, 1.09999967] (약 0.8 × 2.55 × 2.2 단위 — LV_2P_10·LV_2P_09·LV_2P_02와 정확히 동일)
- MeshStateMixin은 `getObjectByName('LV-H1-D028')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-H1-D028', status }]`
