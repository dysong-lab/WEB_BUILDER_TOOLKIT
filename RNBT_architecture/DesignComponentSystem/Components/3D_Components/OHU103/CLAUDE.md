# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `OHU103`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `OHU103` (폴더명·Node 이름·Mesh 이름 **완전 일치** — 영문 약어 + 숫자 조합의 짧은 식별자) |

## 장비 개요

OHU103은 공조(Outdoor Handling Unit 계열) 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/OHU103/01_default/OHU103.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `OHU103`(mesh 0) 하나만을 가진다. 폴더명·Node 이름·Mesh 이름이 모두 `OHU103`으로 **완전히 동일**하며 — MonnitTemperature_sensor의 밑줄(`_`)을 포함한 복합 식별자나 MetalSphere의 완전 불일치(`MetalSphere` ↔ `metal001`)와 달리 **영문 대문자 약어(OHU) + 숫자 모델 번호(103)의 짧은 식별자** 형식이다. LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake·MonnitTemperature_sensor 선례의 "이름 일치형" 규약에 속하며, `getObjectByName`은 폴더명 그대로 `'OHU103'`을 넘기면 된다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "OHU103"(mesh 0, 1 primitive, 1 material)`. Mesh Node에는 `rotation [0.0, -1.0, 0.0, 4.371139E-08]`이 존재한다 — 이는 쿼터니언 `(x, y, z, w) = (0, -1, 0, ~0)` 형태로, **Y축을 기준으로 정확히 180도 회전**된 상태를 나타낸다(w ≈ 4.37e-08는 `cos(π/2)`의 부동소수점 영점, y = -1은 `-sin(π/2)` = -1). 3ds Max → Babylon.js glTF exporter 파이프라인에서 3ds Max의 Z-forward/Y-forward 방향을 glTF의 -Z-forward 규약에 맞춰 보정한 결과로 보이며, 모델이 preview에서 "뒤돌아선" 상태로 로드되지 않도록 내부적으로 회전 보정을 적용한 케이스이다. MeshStateMixin은 material.color 채널만 갱신하므로 회전 값과 독립적으로 색상 치환 동작은 동일하다. Earthquake의 "2-Mesh Group"이나 LeakDetector의 "1-Mesh × 2-primitive × 2-material"과 달리 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere·MonnitTemperature_sensor와 동일한 가장 단순한 "1-Node × 1-primitive × 1-material" 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Material #42136` 하나이며, baseColorTexture `textures/OHU103.jpg`를 참조한다. material 이름은 3ds Max 원본에서 생성된 숫자 일련번호 형식(`Material #NN`)으로 MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`·MetalSphere의 `Material #14`·MetalDetector의 `Material #29`·MonnitTemperature_sensor의 `Material #26`과 동일한 명명 패턴이다. 숫자 자릿수는 **5자리(#42136)**로 MetalSphere(#14)·MetalDetector(#29)·MonnitTemperature_sensor(#26)의 2자리보다는 크고 MeetingSofa(#25192277)·ArmChair(#25191008)의 8자리보다는 작은 중간 규모 — 3ds Max 세션에서 채번된 일련번호의 자연스러운 편차이다. metallicFactor 0.0, **roughnessFactor 0.450053632**로 MetalSphere(0.45)·MetalDetector(0.45)와 거의 동일한 표준 roughness 값이며, MonnitTemperature_sensor의 0.0(완전 매끈)이나 LeakDetector·FLIREx의 범위 이탈 값(`-90.47056`)과는 다른 **정상적인 중간 roughness**이다. **doubleSided 설정이 없다** — MonnitTemperature_sensor가 doubleSided=true였던 것과 달리 일반 backface culling이 적용되는 두꺼운 박스형 공조 장비 외관에 적합하다. generator 문자열 `babylon.js glTF exporter for 3dsmax 2023 v20221031.2`는 선례들과 동일한 파이프라인 산출물이다. MeshStateMixin은 `material.color` 채널만 갱신하므로 roughness/metallic/doubleSided 값과 독립적으로 색상 치환 경로는 동일하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 80, 인덱스 120 — 단일 primitive). **인덱스 수(120)가 정점 수(80)의 정확히 1.5배**로, MonnitTemperature_sensor의 1.75배·MetalSphere의 5.15배·MetalDetector의 1.0배 중 **MetalDetector와 MonnitTemperature_sensor 사이의 낮은 인덱스 재사용** 수준을 보인다 — 단순한 박스형 공조 장비 외관(육면체 박스 + 약간의 패널 디테일) 지오메트리에서 면을 공유하는 정점이 제한적으로 존재하는 구조이다. 본 저장소 개별 3D 컴포넌트 중 **가장 저밀도 그룹**에 속하며(정점 80개), 공조 장비의 전형적인 외형을 최소 정점으로 표현한 경량 메시이다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.016, 0.0, -0.00525] ~ max [0.016, 0.0175965019, 0.00525000039] — 원시 크기 약 **0.032 × 0.0176 × 0.0105 단위**. Y축 최솟값이 정확히 `0.0`으로 **바닥(Y=0)에 앵커링된 설치형** 지오메트리이며 (MonnitTemperature_sensor·LeakDetector 선례와 동일한 앵커 방식), X·Z축은 원점 대칭이다. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **32 × 17.6 × 10.5 단위**로, **X축(폭) 방향이 가장 길고 Z축(깊이)이 가장 짧은** 전형적인 공조/룸에어 핸들링 유닛의 가로로 넓은 박스 프로포션이다. MonnitTemperature_sensor의 Y축 주축 수직 기립형(1.03 × 3.66 × 1.38)과 LeakDetector의 X축 주축 판상형(0.95 × 1.31 × 0.27)과 대비되는 **X축 주축의 가로 긴 박스형** — 공조 장비의 가로 길이가 강조된 wall-mount 또는 ceiling-mount 공조 유닛 외형이다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * distanceFactor`)이 X축 32 단위의 큰 크기를 수용한다.

**텍스처 폴더는 `textures/`** 이다. ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector·MetalSphere·MonnitTemperature_sensor 선례와 동일한 `textures/` 규약을 따른다 (LV 계열의 `maps/` 규약과 대비). GLTF 내부 `images[].uri`가 `textures/OHU103.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `OHU103-P.png`도 존재한다 (Earthquake·FLIREx·ElecPad·LeakDetector·MetalSphere·MonnitTemperature_sensor 선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `OHU103` Mesh의 단일 material(`Material #42136`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere·MonnitTemperature_sensor와 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/outdoorUnitPerformance | 완료 |

> **RotaryRpmMixin 승격 강력 권장 — #38 Pump + #39 Heatexchanger + #40 AHU103/dynamicRpm + 본 컴포넌트 outdoorUnitPerformance(#41) = 4개 컴포넌트 동일 회전 기법, 임계점을 두 번째로 명백히 초과.** setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/start/stop/enable/disable/destroy 시그니처 그대로 흡수 가능. 추가로 본 변형은 #13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + 본 변형 = **MeshTrackingHudMixin 승격 6번째 채택**. **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 강력 권장.**
