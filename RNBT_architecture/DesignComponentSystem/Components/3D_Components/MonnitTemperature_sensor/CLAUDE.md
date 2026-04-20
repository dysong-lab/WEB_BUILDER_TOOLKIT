# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MonnitTemperature_sensor`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MonnitTemperature_sensor` (폴더명·Node 이름·Mesh 이름 **완전 일치** — 밑줄을 포함한 풀 네이밍을 3ds Max Node 이름으로 그대로 사용) |

## 장비 개요

MonnitTemperature_sensor는 Monnit 사의 무선 온도 센서 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/MonnitTemperature_sensor/01_default/MonnitTemperature_sensor.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `MonnitTemperature_sensor`(mesh 0) 하나만을 가진다. 폴더명·Node 이름·Mesh 이름이 모두 `MonnitTemperature_sensor`로 **완전히 동일**하며 — 밑줄(`_`)을 포함한 식별자를 3ds Max Node 이름으로 그대로 승계한 케이스다. LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake 선례의 "이름 일치형" 규약에 속하되, 이들이 단일 단어 카멜케이스(`LeakDetector`·`FLIREx` 등)인 것과 달리 **브랜드(`Monnit`) + 속성(`Temperature`) + 카테고리(`_sensor`)의 복합 식별자**를 사용한다는 점이 특징이다. MetalSphere의 "완전 불일치(`MetalSphere` ↔ `metal001`)"나 LithiumionBattery의 "대소문자 차이(`LithiumionBattery` ↔ `Lithiumionbattery`)" 같은 명명 체계 차이가 없으므로 `getObjectByName`은 폴더명 그대로 `'MonnitTemperature_sensor'`를 넘기면 된다 (대소문자·밑줄 그대로).

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "MonnitTemperature_sensor"(mesh 0, 1 primitive, 1 material)`. Mesh Node에는 `rotation`이 없고(식별 행렬) `translation [0.0, 0.0, -7.989568E-11]`만 존재한다 — Z축 오프셋 값이 `-7.99e-11`로 **부동소수점 epsilon 범위**이며, 3ds Max → Babylon.js glTF exporter 파이프라인이 원점에 정렬된 Node를 내보낼 때 발생한 수치적 잔여(float 정밀도 한계)이다. 실질적으로는 원점(0,0,0)에 놓인 것과 동일하게 취급되며 시각적으로 구분되지 않는다. MetalSphere의 X축 -90도 회전이나 MeetingSofa의 Y축 -90도 회전 같은 **Z-up → Y-up 좌표계 보정 회전이 없는** 케이스로, 모델러가 glTF Y-up 좌표계에 맞춘 상태로 3ds Max에서 제작하여 축 교체가 불필요한 구조이거나, exporter가 axis 변환을 최종 vertex 단계에서 베이크했음을 시사한다. LeakDetector의 "1-Mesh × 2-primitive × 2-material"이나 Earthquake의 "2-Mesh Group"과 달리 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere와 동일한 가장 단순한 "1-Node × 1-primitive × 1-material" 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Material #26` 하나이며, baseColorTexture `textures/MonnitTemperature_sensor.jpg`를 참조한다. material 이름은 3ds Max 원본에서 생성된 숫자 일련번호 형식(`Material #NN`)으로 MeetingSofa의 `Material #25192277`·ArmChair의 `Material #25191008`·MetalSphere의 `Material #14`·MetalDetector의 `Material #29`와 동일한 명명 패턴이며, 숫자 자릿수는 2자리로 MetalSphere(#14)·MetalDetector(#29)와 동일하게 짧다(3ds Max 서로 다른 세션에서 채번된 결과). metallicFactor 0.0, **roughnessFactor 0.0**, **doubleSided=true**로 MetalSphere(roughness 0.45)·ArmChair·MeetingSofa·MetalDetector(roughness 0.45)와는 roughness 값이 다르다 — roughnessFactor 0.0은 "완전 매끈한(glossy) 표면"을 의미하며, 플라스틱 케이싱 센서의 반짝이는 베이스컬러 표현에 적합하다. LeakDetector·FLIREx의 범위 이탈 roughness(`-90.47056`)와 대비되는 **정상 범위 하한(0.0) 값**이며, Three.js PBR 렌더러에서 있는 그대로 완전 매끈 표면으로 해석된다. doubleSided=true는 얇은 케이싱 면의 backface culling 회피 설정이다. generator 문자열 `babylon.js glTF exporter for 3dsmax 2023 v20221031.2`는 MetalDetector·MetalSphere·LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake·MeetingSofa·ArmChair 등과 동일한 파이프라인 산출물이다. MeshStateMixin은 `material.color` 채널만 갱신하므로 roughness 값이 0.0이어도, metallic 값과도 독립적으로 색상 치환 경로는 동일하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 260, 인덱스 456 — 단일 primitive). **인덱스 수(456)가 정점 수(260)의 약 1.75배**로, MetalSphere의 5.15배(닫힌 구 지오메트리)와 MetalDetector의 1.0배(정점 수 = 인덱스 수, 인덱스 재사용 최소)의 중간에 해당하는 **중간 수준의 인덱스 재사용**을 보인다 — 직육면체·원기둥 조합형 케이싱 지오메트리에서 면을 공유하는 정점이 일부 존재하는 전형적인 특징이다. 본 저장소 개별 3D 컴포넌트 중 저밀도 그룹(LV 계열 ~46) 상위에 위치하며 MeetingSofa(395)·MetalDetector(930)·MetalSphere(559)보다 낮은 정점 밀도로, 단순한 센서 케이싱 형상에 걸맞은 경량 메시이다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.0005156, 0.0, -0.0006873] ~ max [0.0005156, 0.00365560013, 0.0006873001] — 원시 크기 약 **0.001031 × 0.003656 × 0.001375** 단위. Y축 최솟값이 정확히 `0.0`으로 **바닥(Y=0)에 앵커링된 수직 기립형** 지오메트리임을 알 수 있다 (X·Z축은 원점 대칭). 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **1.031 × 3.656 × 1.375 단위**로, **Y축 방향(높이)으로 길쭉한** 센서 본체(작은 플라스틱 박스 + 안테나/표시부)의 전형적인 프로포션이다. LeakDetector의 판상형(0.95 × 1.31 × 0.27, Y축 주축)과 Y축 주축이라는 점은 공유하지만 LeakDetector보다 **Y축으로 약 2.8배 더 길고** X·Z는 유사한 규모로, 높이가 강조된 수직 기립 장비다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * distanceFactor`)이 이 수치를 수용한다.

**텍스처 폴더는 `textures/`** 이다. ArmChair·MeetingSofa·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·MetalDetector·MetalSphere 선례와 동일한 `textures/` 규약을 따른다 (LV 계열의 `maps/` 규약과 대비). GLTF 내부 `images[].uri`가 `textures/MonnitTemperature_sensor.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `MonnitTemperature_sensor-P.png`도 존재한다 (Earthquake·FLIREx·ElecPad·LeakDetector·MetalSphere 선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MonnitTemperature_sensor` Mesh의 단일 material(`Material #26`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 ArmChair·MeetingSofa·LithiumionBattery·MetalDetector·MetalSphere와 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
