# Local Guide Index

## 목적

이 문서는 upstream 문서와 별개로 유지하는 로컬 운영 가이드의 인덱스다.

원칙:

- upstream에서 내려오는 spec/README/CLAUDE 문서는 update 시 변경되거나 덮어써질 수 있다.
- 이 문서는 로컬 운영 규칙의 진입점으로 사용한다.
- 실제 생성 지침 본문은 개별 guide 문서에 두고, 여기서는 링크만 관리한다.

---

## 사용 방법

컴포넌트 생성, preview 생성, 로컬 운영 규칙 확인이 필요할 때는 먼저 이 문서를 확인한다.

특히 아래 상황에서는 반드시 참조한다.

- `3D_Components` 생성 또는 수정
- 2D 컴포넌트 생성 또는 수정
- `Advanced` preview 생성 또는 수정
- upstream spec은 유지한 채 로컬 생성물만 수정해야 할 때
- mixin API 계약과 preview 테스트 규칙을 함께 확인해야 할 때

---

## Guide 목록

### 3D Components

- [3D Component Generation Flow](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/RNBT_architecture/DesignComponentSystem/docs/guides/THREE_D_COMPONENT_GENERATION_FLOW.md)
  - `3D_Components` 전체 생성 흐름
  - `Standard`와 `Advanced`의 역할 분리
  - upstream spec과 로컬 운영 문서의 경계
  - 컨테이너형/단일 mesh형 분류 기준
  - preview 생성 순서와 최종 체크리스트

### 2D Components

- [2D Component Design Enforcement](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/RNBT_architecture/DesignComponentSystem/docs/guides/TWO_D_COMPONENT_DESIGN_ENFORCEMENT.md)
  - Codex의 2D 컴포넌트 생성/수정 시 디자인 스킬 강제 준수 규칙
  - 원본 spec 문서 수정 금지 원칙
  - `produce-component` Step 5-1 / `create-html-css` 기반 디자인 기준
  - DesignSystemGuide 4종 CSS 재독 의무
  - 구조 참고와 시각 참고의 분리 규칙
  - 최종 디자인 체크리스트

### Advanced

- [Advanced Preview Generation Guide](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/RNBT_architecture/DesignComponentSystem/docs/guides/ADVANCED_PREVIEW_GENERATION_GUIDE.md)
  - `Advanced` preview 생성 전용 세부 운영 규칙
  - spec 수정 금지 원칙
  - variant별 필수 버튼 규칙
  - 자동 상태 갱신 규칙
  - 컨테이너형 3D 컴포넌트 규칙
  - 최종 검수 체크리스트

---

## 운영 원칙

새 로컬 가이드를 추가할 때는 아래를 따른다.

1. upstream 문서와 충돌하지 않는 경로에 둔다.
2. 실제 규칙 문서는 `docs/guides/` 아래에 둔다.
3. 이 인덱스 문서에 링크를 추가한다.
4. 생성 작업을 시작할 때는 이 인덱스를 먼저 본다.

---

## 비고

이 문서는 로컬 운영 인덱스이므로 upstream pull 대상 문서에만 의존하지 않는다.
