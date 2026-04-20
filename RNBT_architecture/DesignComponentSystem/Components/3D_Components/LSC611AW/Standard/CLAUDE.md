# LSC611AW — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 Mesh `LSC611AW`의 material 색상을 변경

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

- 경로: `models/LSC611AW/01_default/LSC611AW.gltf`
- meshName: **`LSC611AW`** — GLTF 내부 Node/Mesh 이름이 폴더/컴포넌트 이름과 동일한 대소문자 `LSC611AW`이다.
- 구조: scene(root node 1개) → Mesh `LSC611AW` (단일 primitive, Material `RED`)
- 정점 속성: POSITION, NORMAL만 사용 (UV 없음)
- 텍스처: **GLTF에 `images`/`textures` 배열 없음** — 어떤 텍스처도 참조하지 않음
- 보조 자산: `LSC611AW-P.png` (파일만 존재, GLTF와 미연결)
- 좌표 바운드: 약 [-0.085, -0.170, -0.164] ~ [0.085, 0.170, 0.164] (반지름 ~0.17 단위, 루트 스케일 없음)
- MeshStateMixin은 `getObjectByName('LSC611AW')`로 단일 Mesh를 얻어 material을 clone 후 color 적용 (single-Mesh 처리 경로)
