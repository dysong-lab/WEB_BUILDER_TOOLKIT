# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-2D4`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-2D4` |

## 장비 개요

LV_01은 3D 씬에서 단일 장비 하나에 대응하는 저전압(Low Voltage) 계열 컴포넌트이다. 단일 GLTF(`models/LV_01/01_default/LV_01.gltf`)는 내부에 Node 하나만 가지며, 이 Node가 그대로 Mesh 하나를 참조하는 단순 구조이다. Standard 변형은 이 단일 Mesh를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-2D4"(mesh 0, rotation=[0,-1,0,1.19e-8])`. 최상위 Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV03와 달리 `root(scale=1000)` 랩퍼가 없음). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. material은 `Material #342540165`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV03.jpg`를 참조한다 (파일명은 LV03.jpg이지만 다른 LV 계열과 공유되는 텍스처이다).

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_01`이지만, GLTF 내부 Node/Mesh 이름은 `LV-2D4`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-2D4`** 이어야 한다. 이 매핑은 `Standard/CLAUDE.md`의 모델 참조 섹션에 고정되어 있다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.4, -1.475, -1.1] ~ max [0.4, 1.475, 1.1] → 실제 장면 크기 약 0.8 × 2.95 × 2.2 단위. preview 카메라는 이 작은 바운드에 맞춰 근거리로 배치한다.

> 텍스처 폴더는 `maps/` (HV_1P_06 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV03.jpg`로 참조되므로 폴더명을 유지한다. 보조 자산 `LV_01-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-2D4` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
