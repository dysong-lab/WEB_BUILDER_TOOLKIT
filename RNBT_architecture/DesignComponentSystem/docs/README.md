# docs/

| 폴더 | 질문 | 소비자 |
|------|------|--------|
| **architecture/** | 이것이 무엇이고 왜 이렇게 만들었는가 | SKILL, 개발자 |
| **specs/** | 각 Mixin을 어떻게 만들었는가 | create-mixin-spec, implement-mixin |
| **reports/** | 현재 상태가 괜찮은가 | 사용자 (판단용) |

---

## architecture/ — 설계 원본

변하지 않는 원칙과 구조를 정의한다. SKILL이 코드 생성 전 읽는 문서.

| 문서 | 내용 |
|------|------|
| COMPONENT_SYSTEM_DESIGN.md | 기능의 정의, 핵심 구조, 10가지 원칙, Mixin/컴포넌트 관계 |
| SELECTORS_AS_CONTRACT.md | cssSelectors/datasetAttrs key 공유 메커니즘 명세 |
| WHY_MIXIN.md | 왜 클래스가 아닌 함수 기반 Mixin인가 (프레임워크 제약 논증) |
| FUNCTION_PATTERN.md | "기능 = 목적 + 수단" 원칙의 순수함수 유추 검증 |

## specs/ — Mixin 명세

각 Mixin의 계약(인터페이스, 데이터 형태, destroy 범위)을 정의한다.

| 문서 | 내용 |
|------|------|
| MIXIN_SPEC_TEMPLATE.md | 빈 템플릿 (6개 섹션) |
| MIXIN_SPEC_EXAMPLE_*.md (10건) | 기존 Mixin별 모범답안 |

## reports/ — 검토/평가

특정 시점의 판단과 분석. 사용자가 방향을 결정할 때 참고.

| 문서 | 내용 |
|------|------|
| MIXIN_REVIEW.md | Mixin 범용성 감사 — 제약과 확장 후보 |
| SYSTEM_READINESS_REVIEW.md | 공식 도입 준비 평가 |
| REVIEW_KEY_SHARING_DESIGN.md | key 공유 설계 검토 (CTO 관점) |
| REVIEW_SELECTOR_CONTRACT.md | 선택자 계약 역할 및 합당성 분석 |
| REVIEW_COMMIT_DIRECTION.md | 문서 정제 작업의 실효성 비평 |
