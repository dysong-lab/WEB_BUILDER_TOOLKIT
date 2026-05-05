# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = **1 Mesh Node** `PCS`) — `root(scale [1000,1000,1000])` 컨테이너의 단일 자식 Mesh |
| 기본 Mixin | MeshStateMixin |
| meshName | `PCS` — **단일 Mesh Node**. 폴더명(`PCS`) = GLTF Mesh Node 이름(`PCS`) = mesh 이름(`PCS`) = material 이름(`PCS`) **네 이름이 모두 동일**. MeshStateMixin의 단일-Mesh 경로(`obj.isMesh ? applyColor(obj) : traverse`)에서 Mesh 브랜치로 직진. |

## 장비 개요

PCS는 배전/스위치기어 계열의 **단일 Mesh 소형 장비**를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/PCS/01_default/PCS.gltf`)의 scene은 `root`(scale [1000, 1000, 1000]) 컨테이너 Node를 최상위로 가지고 그 아래에 단 하나의 자식 Mesh Node `PCS`(mesh 0)가 배치된다. **폴더명 `PCS`와 Mesh Node 이름 `PCS`, mesh 이름 `PCS`, material 이름 `PCS`가 모두 완전히 일치**하는 "4-이름 일치형" 규약으로, `getObjectByName('PCS')`가 단일 Mesh를 직접 반환하여 MeshStateMixin의 Mesh 브랜치(`obj.material` 직접 clone + color 치환)로 단일 호출 경로를 탄다 — Group 아래 자식을 traverse하는 P300C·P2400CH 패턴이나 자식 이름을 배열로 열거하는 Earthquake 패턴과 달리, 이름 하나로 Mesh 하나를 직접 가리키는 **가장 단순한 개별 단위** 패턴이다.

GLTF 구조: `scene → root(Node, scale [1000, 1000, 1000], children [1]) → "PCS"(Mesh Node, mesh 0, 1 primitive, 1 material)`. **root에 `scale [1000, 1000, 1000]` 보정이 명시**되어 있어, 원본 mesh 좌표(POSITION min/max ≈ ±0.01 × ±0.011 × ±0.006)가 scene 스케일 단계에서 1000배 확대되어 **실제 장면 크기 약 20.3 × 22.8 × 12.6 단위**로 렌더된다. Earthquake·OHU103·ElecPad 선례의 `root(scale [1000, 1000, 1000])` 패턴과 동일한 "원본 미리미터 → 장면 단위" 변환 케이스이며, P300C·P2400CH의 "root scale 없음 → 초소형 0.15 단위" 케이스와 대비된다. babylon.js glTF exporter for 3dsmax 2023 v20240312.5로 생성되었으며 P300C와 동일한 파이프라인(3dsmax 2023 + babylon 2024년 초 빌드 계열)이지만 P300C가 scale 보정 없이 원본 유닛을 유지한 것과 달리 PCS는 root scale 1000으로 업스케일된다.

Mesh 정점 밀도: POSITION 680 · 인덱스 1320 — 재사용 비율 약 1.94배(서브박스 집합체). 단일 primitive에 1개 material만 참조하므로 서브메시 분할이 없는 **단순 구조**. POSITION/NORMAL/TEXCOORD_0의 표준 속성 셋만 가진다(COLOR_0 없음, OHU103·P2400CH와 동일한 표준 패턴). 바운드 좌표는 원본 로컬에서 X ≈ ±0.0102, Y ≈ ±0.0114, Z ≈ ±0.0063 — 즉 **Y축이 주축**이며 약간 세로로 긴 박스 형상이고, root scale 1000 적용 후 대략 20 × 23 × 13 단위로 확대된다.

Material은 1개 PBR material이며 **mesh와 동일한 이름 `PCS`**를 사용한다:
- `PCS` (material 0) — 단일 Mesh `PCS`에 적용. baseColorTexture `textures/1FS090.jpg`(PCS 폴더 안의 유일한 텍스처), `metallicFactor` 0.2(약한 금속감), `roughnessFactor` 0.5(중간 거칠기), **doubleSided 속성 미지정**(암묵적 false = single-sided). `babylonSeparateCullingPass: false` 확장만 extras로 선언되며, baseColorFactor나 emissive 등의 factor 오버라이드는 없이 **순수 텍스처 기반 셰이딩**이다. MeshStateMixin은 이 material을 clone한 뒤 color만 setHex로 치환하므로 원본 baseColorTexture 경로·metallicFactor·roughnessFactor·extras는 모두 그대로 유지된 채 color 채널만 상태색으로 갱신된다.

**P300C와의 material 차이**: P300C가 세 material(`P300C`/`plastic01`/`black`)을 자식 Mesh별로 분리 적용한 것과 달리, PCS는 **단일 material**만 보유한다. P300C의 `P300C` material(baseColorTexture + doubleSided)과 비교하면 PCS `PCS` material은 doubleSided 선언이 없고 metallicFactor가 명시(0.2)된다. 세 이름이 모두 의미 있는 문자열(`PCS`)이며, 모델러가 mesh·node·material에 동일한 이름을 부여한 "자기-지시적 명명" 케이스 — OHU103(`Material #42136`)·OutdoorConditioner_Ani(`Material #42064`)의 3ds Max 숫자 일련번호 규약과 달리 모델러가 수동 명명하여 장비 코드를 그대로 전파한 케이스이다.

좌표 바운드(root scale 1000 적용 후 장면 단위):
- Mesh `PCS`: 대략 [-10.15, -11.42, -6.32] ~ [10.15, 11.42, 6.32] — **약 20.3 × 22.8 × 12.6 단위**
- X·Y·Z 축이 모두 원점 대칭이며, Y축이 가장 긴 주축(약간 세로로 긴 박스)

**root scale 1000이 적용되므로 실제 장면 크기도 약 20 × 23 × 13 단위**의 중소형이다. Earthquake·OHU103·ElecPad와 동일한 스케일 특성이므로 preview 카메라 near/far 및 grid 사이즈는 Earthquake 선례와 동일한 "root scale 1000 + far 100 + position ≈ 2~3" 패턴으로 구성한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'PCS'`로 단일 Mesh 색상을 변경한다. MeshStateMixin은 `getObjectByName('PCS')`로 단일 Mesh를 얻은 뒤 `obj.isMesh`가 true이므로 Mesh 브랜치로 직진하여 `obj.material`을 clone하고 color만 setHex로 치환한다. 단일 material이며 배열이 아니므로 `Array.isArray(node.material)` 분기 없이 직접 color 치환이 가능하다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/powerFlowIndicator | 완료 |

> **PowerFlowIndicatorMixin 즉시 승격 권장 — 임계점 2개 도달 (#50 Inverter + #51 PCS).** 본 변형(#51 PCS/powerFlowIndicator)은 **#50 Inverter/Advanced/powerFlowIndicator를 시그니처 100% 답습** (`_meshName` 기본값만 `'PCS'`로 차이, 나머지 옵션 기본값/시그니처 20개 메서드/RAF 정책/destroy 규약 모두 동일). #50과 #51이 시그니처 100% 동일함을 본 사이클로 입증했으므로 다음 사이클에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `PowerFlowIndicatorMixin` 승격을 검토 권장. 시그니처(`setDirection/setPowerKw/setMaxKw/setMaxArrows/setArrowAxis/setArrowSpan/setArrowSpacing/setArrowSpeed/setArrowOffset/setBaseScale/setMaxThicknessScale/setColors/setMeshName/getDirection/getPowerKw/getActiveCount/enable/disable/isEnabled/destroy`) 그대로 흡수 가능 + 충/방전(in/out/none) 도메인이 ESS/Inverter/PCS 전반에 동일하므로 후속 변형(BatteryPack/UPS 등)에도 즉시 재사용 가능.
