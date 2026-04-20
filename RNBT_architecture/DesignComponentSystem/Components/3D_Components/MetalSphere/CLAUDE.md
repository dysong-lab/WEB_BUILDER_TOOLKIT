# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `metal001`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `metal001` (폴더명 `MetalSphere`와 **완전 상이** — Node/Mesh 이름은 텍스처 파일명(`metal001.jpg`)과 동일한 소문자+숫자 형식) |

## 장비 개요

MetalSphere는 재질 샘플/환경 반사 테스트 지점을 표현하는 구형 3D 컴포넌트이다. 단일 GLTF(`models/MetalSphere/01_default/MetalSphere.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `metal001`(mesh 0) 하나만을 가진다. **폴더명과 Node/Mesh 이름이 완전히 다른** 케이스로, 폴더는 `MetalSphere`(카멜케이스)이지만 내부 Node/Mesh 이름은 `metal001`(소문자 + 3자리 숫자)로 명명되어 있다 — LithiumionBattery가 순수 대소문자 차이(`LithiumionBattery` → `Lithiumionbattery`)인 것과 달리 MetalSphere는 **명명 체계 자체가 다른** 더 강한 불일치이다. Node/Mesh 이름이 텍스처 이미지 파일명 `metal001.jpg`와 동일하게 부여된 점으로 보아 3ds Max에서 재질 라이브러리의 material 이름을 기반으로 자동 생성된 Node 이름으로 추정된다. `getObjectByName`은 대소문자를 구분하므로 반드시 `'metal001'`로 조회해야 한다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "metal001"(mesh 0, 1 primitive, 1 material)`. Mesh Node에는 `rotation [-0.7071068, 0, 0, 0.7071067]`이 설정되어 있다 — 이는 **X축 -90도 회전** 쿼터니언으로, MeetingSofa의 Y축 -90도 회전(`[0, -0.7071068, 0, 0.7071067]`)과 축이 다른 회전이다. 3ds Max의 Z-up 좌표계를 glTF의 Y-up으로 보정하는 전형적 패턴(Y↔Z 축 교체)이다. Mesh 자체가 대칭적인 구(sphere)이므로 회전이 시각적으로 드러나진 않지만, UV 매핑의 방향은 회전에 의해 달라질 수 있다. `translation`은 없다. LithiumionBattery·MetalDetector·ArmChair와 동일한 "1-Node × 1-primitive × 1-material" 가장 단순한 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Material #14` 하나이며, baseColorTexture `textures/metal001.jpg`를 참조한다. material 이름은 3ds Max 원본에서 생성된 숫자 일련번호 형식(`Material #NN`)으로 MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`·MetalDetector의 `Material #29`와 동일한 명명 패턴이며, 숫자 자릿수는 2자리로 MetalDetector와 동일하게 짧다(3ds Max 서로 다른 세션에서 채번된 결과). metallicFactor 0.0, roughnessFactor 0.450053632로 **정상 범위 값**이다 (MeetingSofa·ArmChair·MetalDetector와 완전히 동일한 수치; LeakDetector·FLIREx 등 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(`-90.47056`)와 대비되는 정상 스칼라). generator 문자열 `babylon.js glTF exporter for 3dsmax 2023 v20221031.2`도 MetalDetector와 동일한 파이프라인 산출물이다. 구(sphere)임에도 metallicFactor 0.0이 설정된 것은 이 컴포넌트의 시각 표현을 텍스처 맵 기반(`metal001.jpg`)으로 위임한다는 뜻이며, MeshStateMixin은 `material.color` 채널만 갱신하므로 material 이름이 숫자 형식이어도, metallic 값과도 독립적으로 색상 치환 경로는 동일하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 559, 인덱스 2880 — 단일 primitive). 정점 559개는 구(sphere) 지오메트리의 위/경도 분할(예: 약 20×24 세그먼트 규모)을 시사한다. MetalDetector(930 정점, 인덱스 930)와 달리 **인덱스 수(2880)가 정점 수(559)의 약 5.15배**로 인덱스 재사용이 활발한 닫힌 구 지오메트리의 전형적인 특징이다 (MetalDetector는 정점 수 = 인덱스 수로 인덱스 재사용이 최소화된 평평한 구조였다). 본 저장소 개별 3D 컴포넌트 중 MeetingSofa(395)·MetalDetector(930) 사이의 중간 규모 정점 밀도이다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.02500001, -0.0249999985, -0.0249999985] ~ max [0.0249999855, 0.0249999985, 0.0249999985] — 원시 크기 약 0.05 × 0.05 × 0.05 단위(완벽한 **정육면체 바운드** = 구의 외접 큐브). 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **50 × 50 × 50 단위**로 반지름 약 25 단위의 구이다. Mesh Node에 X축 -90도 회전이 있지만 바운드가 정확히 정육면체(±0.025 모든 축 동일)이므로 회전 후 월드 바운드는 그대로 50 × 50 × 50을 유지한다 — MeetingSofa처럼 회전에 따른 축별 크기 교체가 발생해도 정육면체 바운드에서는 시각적으로 동일하다. MetalDetector(13.9 × 22.35 × 5.0)보다 X/Z축으로 크고 Y축으로 훨씬 큰 등방(isotropic) 형태이다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * distanceFactor`)이 이 수치를 수용한다.

**텍스처 폴더는 `textures/`** 이다. ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector 선례와 동일한 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/metal001.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `MetalSphere-P.png`도 존재한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `metal001` Mesh의 단일 material(`Material #14`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector와 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
