# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh `Heatexchanger`) |
| 기본 Mixin | MeshStateMixin |
| meshName | Heatexchanger |

## 장비 개요

Heatexchanger는 냉매/유체의 열 교환을 수행하는 열교환기 유닛을 표현하는 3D 컴포넌트이다. GLTF 내부는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `Heatexchanger`를 가지며, 해당 Node는 단일 Mesh `Heatexchanger`를 직접 참조한다. MeshStateMixin의 단일 Mesh 경로가 그대로 적용된다 — `getObjectByName('Heatexchanger')`로 Mesh를 찾고, material을 clone하여 color를 교체한다.

Material은 단일 PBR material(`Heatexchanger`)이며 `textures/Heatexchanger.jpg` 텍스처를 사용한다 (`metallicFactor: 0.0`).

> **명명 일치**: 폴더명 `Heatexchanger`와 GLTF 내부 Node/Mesh 이름 `Heatexchanger`가 완전히 일치한다. register.js의 하드코딩 meshName은 `'Heatexchanger'`를 그대로 사용한다.

> 텍스처 폴더는 `textures/` (일반적 구조). GLTF 내부 `images[].uri`가 `textures/Heatexchanger.jpg`로 참조된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
