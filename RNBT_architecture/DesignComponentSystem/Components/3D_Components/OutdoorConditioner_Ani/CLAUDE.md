# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 3 Mesh: `winConditioner`, `metalFan03`, `metalFan04`) |
| 기본 Mixin | MeshStateMixin |

## 장비 개요

OutdoorConditioner_Ani는 실외기(창호형/벽부형 Outdoor Conditioner)를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/OutdoorConditioner_Ani/01_default/OutdoorConditioner_Ani.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000]) 아래에 세 개의 자식 Node를 가진다 — 실외기 본체 `winConditioner`(mesh 0), 팬1 `metalFan03`(mesh 1), 팬2 `metalFan04`(mesh 2). 각 Node는 동일 이름의 단일 Mesh를 참조한다. 폴더명 `OutdoorConditioner_Ani`와 GLTF 내부 Node/Mesh 이름이 **불일치**하며(HumanSymbol_Ani 선례와 동일), register.js는 세 Mesh 이름을 직접 하드코딩한다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → winConditioner(mesh 0) + metalFan03(mesh 1) + metalFan04(mesh 2)`. 세 자식 Node 모두 `rotation [0, -0.7071068, 0, 0.7071067]`(쿼터니언 Y축 +90도 회전)과 `scale [0.149999991, ...]`이 적용되어 있다. 3ds Max → Babylon.js glTF exporter가 공조 장비의 방향·크기를 실외기 배치 규약에 맞춰 보정한 결과이다. 각 Node는 `translation`이 다르게 설정되어 본체 위에 좌우로 팬 2개가 올라가는 배치를 구성한다 — `winConditioner`(Y≈0.0086), `metalFan03`(X≈-0.00445, Y≈0.01625), `metalFan04`(X≈+0.00445, Y≈0.01625).

각 Mesh는 단일 primitive × 단일 material 구조이다 — `winConditioner`는 `Material #42064`(baseColorTexture `textures/OutdoorConditioner.jpg`), `metalFan03`·`metalFan04`는 **동일한** `Material #42066`(baseColorTexture `textures/fan.jpg`)을 공유한다. 두 팬이 material을 공유하지만 GLTF 로더는 Node별로 별도 Mesh 인스턴스로 생성하므로, MeshStateMixin의 `getObjectByName` 경로로 각각 독립적으로 색상 치환이 가능하다(Mixin이 내부적으로 material을 clone하여 적용하기 때문). material 이름은 3ds Max 숫자 일련번호 형식(`Material #NN`)이며 5자리(`#42064`, `#42066`)로 OHU103의 `#42136`와 인접한 번호대 — 동일 세션에서 채번된 관련 공조 계열 자산임을 시사한다. metallicFactor 0.0, roughnessFactor 0.450053632로 OHU103·MetalSphere·MetalDetector의 표준 중간 roughness와 동일. doubleSided 설정 없음(일반 backface culling). baseColorTexture는 `textures/` 폴더에 2개(`OutdoorConditioner.jpg`, `fan.jpg`)가 존재하며 보조 썸네일 `OutdoorConditioner_Ani-P.png`도 모델 폴더에 있다.

Mesh 정점 속성: POSITION, NORMAL, **COLOR_0**, TEXCOORD_0. `winConditioner`는 정점 3352·인덱스 15498(재사용 비율 ≈ 4.62배), `metalFan03`·`metalFan04`는 각각 정점 1058·인덱스 4068(재사용 비율 ≈ 3.85배) — 원형 팬 블레이드 특유의 대칭 구조에서 정점을 많이 공유한다. COLOR_0 정점 색상 속성이 세 Mesh 모두에 존재한다 — OHU103(POSITION/NORMAL/TEXCOORD_0만)이나 MonnitTemperature_sensor 선례와 달리 3ds Max에서 정점 컬러가 export된 케이스이다. MeshStateMixin은 material.color 채널만 갱신하므로 정점 COLOR_0 속성과 독립적으로 색상 치환 경로는 동일하다(단, 렌더러가 vertexColors 옵션을 사용하지 않는 한 material.color가 최종 색상을 결정).

좌표 바운드(자식 Node scale/rotation 적용 전 로컬 원시값):
- `winConditioner`: POSITION [-0.04097, -0.05756, -0.06460] ~ [0.04097, 0.05756, 0.06460] — 약 0.082 × 0.115 × 0.129 단위(로컬)
- `metalFan03`·`metalFan04`: POSITION [-0.02317, -0.0021, -0.02317] ~ [0.02317, 0.0021, 0.02317] — 약 0.046 × 0.004 × 0.046 단위(로컬, 원판형)

자식 Node scale 0.15과 root scale 1000을 모두 적용하면 실제 장면 크기는 대략 본체 `winConditioner`가 약 12 × 17 × 19 단위, 각 팬이 약 7 × 0.6 × 7 단위의 얇은 원판 형태이다. Y축 기준 팬이 본체 상단에 얹히는 실외기 전형적 배치이다.

**애니메이션**: GLTF 내부에 단일 애니메이션 `Ani01` 클립이 존재한다. `metalFan03`(node 2)과 `metalFan04`(node 3)의 `rotation` path를 target으로 41개 키프레임(입력 범위 [0, 1.33333337]초, VEC4 쿼터니언 출력)으로 팬 회전을 제어한다. **Standard에서는 재생하지 않는다** — 애니메이션 재생은 Advanced 변형(예: `animation`)에서 AnimationMixin 조합으로 처리한다. 이 원칙은 HumanSymbol_Ani 선례와 동일하며, `_Ani` 접미는 Advanced 애니메이션 변형 후보를 시사할 뿐 Standard의 구현 범위에 포함되지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 세 Mesh(`winConditioner`, `metalFan03`, `metalFan04`)의 material 색상을 일괄 변경한다. 각 Mesh가 단일 material을 가지므로 MeshStateMixin의 단일 material 경로(객체 material clone + color 적용)를 탄다. `metalFan03`과 `metalFan04`가 동일한 소스 material(`Material #42066`)을 공유하더라도 Three.js의 GLTFLoader는 Node별 Mesh 인스턴스에 material 참조를 분배하며, MeshStateMixin은 각 Mesh에 대해 material을 clone한 뒤 color를 설정하므로 한쪽 팬의 색상 변경이 다른 쪽에 전파되지 않는다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
