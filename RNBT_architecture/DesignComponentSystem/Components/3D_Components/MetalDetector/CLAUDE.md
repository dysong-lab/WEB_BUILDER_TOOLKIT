# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MetalDetector`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MetalDetector` (폴더명 = Node/Mesh 이름 일치) |

## 장비 개요

MetalDetector는 출입 게이트/보안 검사 지점에 설치되는 금속 탐지기를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/MetalDetector/01_default/MetalDetector.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `MetalDetector`(mesh 0) 하나만을 가진다. 폴더명과 Node/Mesh 이름이 동일(`MetalDetector`)하므로 LithiumionBattery의 "폴더-Node 대소문자 불일치" 같은 특이 케이스가 없고, MeetingSofa·ArmChair·Chair_Cafe 같은 선례의 "이름 일치형" 규약을 그대로 따른다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "MetalDetector"(mesh 0, 1 primitive, 1 material)`. Mesh Node에는 `translation`과 `rotation`이 모두 없으므로(기본값 = identity) 월드 변환은 루트 scale만 반영된다 — MeetingSofa의 Y축 -90도 회전(`rotation [0, -0.7071068, 0, 0.7071067]`)과 대비되는 "회전 없는 단순 배치" 케이스이다. LithiumionBattery의 "1-Node × 1-primitive × 1-material", ArmChair·MeetingSofa의 "1-Node × 1-primitive × 1-material"과 동일한 가장 단순한 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Material #29` 하나이며, baseColorTexture `textures/MetalDetector.jpg`를 참조한다. material 이름은 3ds Max 원본에서 생성된 숫자 일련번호 형식(`Material #NN`)으로 MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`와 동일한 명명 패턴이지만, 숫자 자릿수가 2자리로 가장 짧다(3ds Max의 서로 다른 세션에서 채번된 결과). metallicFactor 0.0, roughnessFactor 0.450053632로 **정상 범위 값**이다 (MeetingSofa·ArmChair와 동일 수치; LeakDetector·FLIREx 등 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(`-90.47056`)와 대비되는 정상 스칼라). generator 문자열 `babylon.js glTF exporter for 3dsmax 2023 v20221031.2`도 MeetingSofa와 동일한 파이프라인 산출물이다. MeshStateMixin은 `material.color` 채널만 갱신하므로 material 이름이 숫자 형식이어도 색상 치환 경로는 동일하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 930, 인덱스 930 — 단일 primitive). MeetingSofa(정점 395)의 약 2.35배, ArmChair(630 정점)의 약 1.48배, LithiumionBattery(25200 정점)의 약 0.037배로 본 저장소 개별 3D 컴포넌트 중 **낮은 정점 밀도**에 속한다(게이트형 구조물을 중간 수준으로 단순화한 모델). 정점 수와 인덱스 수가 동일하게 930이라는 점은 인덱스 재사용이 최소화된 평평한 삼각형 스트립 형태를 시사한다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.0069458, 0.0, -0.00249999971] ~ max [0.0069458, 0.0223500039, 0.00250000064] — 원시 크기 약 0.01389 × 0.02235 × 0.00500 단위. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **13.9 × 22.35 × 5.0 단위**로 MeetingSofa(~14.8 × 30 × 9.7)보다 전체적으로 작고 특히 Z축(두께)이 약 절반이다. 장비의 실제 형태(얇고 세로로 긴 게이트)와 일치한다. Mesh Node 회전이 없으므로 월드 바운드는 그대로 이 수치가 유지된다(회전에 따른 축 교체 없음). preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * distanceFactor`)이 이 수치를 수용한다.

**텍스처 폴더는 `textures/`** 이다. ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례와 동일한 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/MetalDetector.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `MetalDetector-P.png`도 존재한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MetalDetector` Mesh의 단일 material(`Material #29`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 ArmChair·MeetingSofa·LithiumionBattery와 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
