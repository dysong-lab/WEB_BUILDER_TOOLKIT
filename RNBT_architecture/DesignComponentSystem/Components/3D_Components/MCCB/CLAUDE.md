# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 루트 Group `MCCB` × 3 child Mesh: `Object299`, `Object300`, `Rectangle180`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MCCB` (루트 Group 단일 타겟 — 자식 Mesh 일괄 적용) |

## 장비 개요

MCCB(Molded Case Circuit Breaker, 배선용 차단기)는 저압 배전반의 분기 회로에 설치되어 과부하/단락 시 회로를 차단하는 성형 케이스 차단기를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/MCCB/01_default/MCCB.gltf`)의 scene은 **루트 Group 노드 `MCCB`** 와 그 아래 세 개의 자식 Mesh Node(`Object299`, `Object300`, `Rectangle180`)로 구성된다. 자식 노드 이름이 3ds Max 기본 네이밍(숫자 접미 `Object###`, 원시체 타입명 `Rectangle###`)을 그대로 유지하고 있어 **의미 기반 이름이 아닌 도구 기본값**을 노출한다는 점이 특징이다. LithiumionBattery(`Lithiumionbattery` 단일 Mesh)나 Earthquake(`Earthquake`, `Earthquake_A` 의미명 2-Mesh Group)의 "자식 이름이 장비 의미를 반영"하는 선례와 달리, MCCB는 **루트 Group 이름만이 의미를 가지고 자식은 익명**인 구조다.

이 구조적 특성 때문에 **상태 색상 적용의 대상은 루트 Group `MCCB` 한 개**로 설정한다. MeshStateMixin은 `getObjectByName`으로 조회한 대상이 Group(자체 `material`이 없음)이면 `traverse`로 자식 Mesh들을 순회하여 material 색상을 일괄 적용하므로, `meshName: 'MCCB'` 한 항목으로 3개 자식 Mesh의 material(GRAY / MCCB / WHITE)이 동시에 상태 색상으로 치환된다. 자식 3개를 각각 구독 항목으로 나열하는 방법도 가능하나 — Earthquake가 `['Earthquake', 'Earthquake_A']`로 나열하는 방식 — MCCB의 자식은 의미 없는 도구 기본명이므로 **페이지가 `'Object299'` 같은 이름을 알아야 할 이유가 없다**. 장비 단위의 단일 상태로 루트 Group을 제어하는 것이 의미 경계와 일치한다.

GLTF 구조:
- `scene → "MCCB"(Group, 자식 3)`
  - `"Object299"(mesh 0, 1 primitive, material 0=GRAY)` — 정점 160, 인덱스 330 — MCCB 본체(케이스)로 추정되는 가장 큰 메시
  - `"Object300"(mesh 1, 1 primitive, material 1=MCCB)` — 정점 60, 인덱스 114 — baseColorTexture `textures/MCCB.png`를 사용하는 라벨/데칼 레이어(alphaMode `BLEND`, `doubleSided: true`)
  - `"Rectangle180"(mesh 2, 1 primitive, material 2=WHITE)` — 정점 132, 인덱스 228 — 토글 스위치/트립 레버로 추정되는 흰색 파트

자식 노드들은 각각 Z축 기준 약 90° 회전(`rotation: [0.7071, 0, 0, 0.7071]` = quaternion 형태의 X축 90° 회전)을 가지며, `Object300`과 `Rectangle180`은 소량의 translation으로 본체 위에 라벨·레버를 배치한다. 루트 Group `MCCB`에는 `scale`이 없어 좌표가 원시값 그대로 사용된다.

Material 3종:
- `GRAY` (material 0) — `baseColorFactor: [0.166, 0.166, 0.166, 1.0]`, `roughnessFactor: 0.5` — 정상 범위의 PBR 스칼라 (LeakDetector·FLIREx의 Babylon.js exporter 범위 이탈 값과 대비)
- `MCCB` (material 1) — `baseColorTexture: textures/MCCB.png`, `alphaMode: BLEND`, `doubleSided: true` — 라벨 데칼 투명도 합성을 위한 blend 모드
- `WHITE` (material 2) — `baseColorFactor: [0.744, 0.744, 0.744, 1.0]`, `roughnessFactor: 0.5`

MeshStateMixin은 Group에 대해 `traverse`로 내려가 각 자식 Mesh의 `material`을 clone 후 `color.setHex`를 적용하므로, 3개 자식의 서로 다른 material(GRAY baseColorFactor 방식, MCCB baseColorTexture 방식, WHITE baseColorFactor 방식)이 모두 상태 색상으로 일괄 치환된다. baseColorTexture가 있는 `Object300`의 material도 clone된 material의 `color`만 바뀌므로 텍스처 샘플링 결과에 color 승수가 곱해지는 결과가 된다 — 라벨 글자는 유지되고 배경 톤만 상태 색으로 변한다.

좌표 바운드(루트 스케일 없음):
- `Object299`: [-0.052, -0.045, -0.099] ~ [0.052, 0.045, 0.099] → ~0.103 × 0.090 × 0.199 단위
- `Object300`: [-0.052, -0.007, -0.098] ~ [0.052, 0.007, 0.098] → 얇은 판상
- `Rectangle180`: [-0.052, -0.008, -0.055] ~ [0.052, 0.008, 0.055] → 작은 토글체

전체 모델 크기는 약 **0.10 × 0.09 × 0.20 단위** 규모로 LithiumionBattery(root scale 1000 적용 후 ~434 × 228 × 108)·Earthquake(root scale 1000 적용 후 유사 대형) 같은 "scale 1000 적용형" 선례와 달리 LeakDetector(원시 ~1 단위)보다도 훨씬 작은 **소형 원시 좌표형**이다. preview의 카메라 거리 계산은 바운드 기반 자동 조정(`maxDim * 2.2 ≈ 0.44`)으로 이 소형 스케일을 수용한다.

**텍스처 폴더는 `textures/`** 이며, `MCCB.png` 한 장만 포함된다(`Object300`의 라벨 데칼). 폴더에는 보조 썸네일 `MCCB-P.png`도 존재한다. GLTF의 `images[].uri`가 `textures/MCCB.png`를 가리키므로 이 파일만 `01_default/textures/` 폴더에 유지한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 루트 Group `MCCB`의 3개 자식 Mesh(`Object299`·`Object300`·`Rectangle180`)의 material 색상을 **Mixin의 Group traverse 경로**를 통해 일괄 변경한다. Earthquake의 "개별 자식 2-Mesh 나열" 방식이나 LithiumionBattery의 "단일 Mesh × 단일 material 직접 치환"과 달리, MCCB는 "루트 Group 1-항목 × 자식 3-Mesh traverse 일괄 치환"이라는 세 번째 패턴을 실행한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
