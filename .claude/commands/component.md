정적 HTML/CSS를 동적 RNBT 컴포넌트로 변환합니다.

## 사전 확인
1. 변환 대상 HTML/CSS 파일이 Figma_Conversion/에 존재하는지 확인
2. 컴포넌트 유형을 사용자에게 확인

## SKILL 선택
- 데이터 표시 (차트, 테이블, 로그 등) → `create-standard-component`
- SVG 심볼 색상/상태 제어 → `create-symbol-state-component`
- 3D 개별 장비 (1 GLTF = 1 Mesh) → `create-3d-component`
- 3D 컨테이너 (1 GLTF = N Mesh) → `create-3d-container-component`

사용자가 유형을 지정하지 않았으면 어떤 종류의 컴포넌트인지 먼저 물어보세요.
