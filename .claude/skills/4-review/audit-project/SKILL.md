---
name: audit-project
description: WEB_BUILDER_TOOLKIT 프로젝트의 전체 건강 상태를 점검합니다. Figma 변환, 컴포넌트 시스템, SKILL, 문서 일관성을 종합 진단합니다.
---

# 프로젝트 전체 점검 (Audit)

WEB_BUILDER_TOOLKIT 전체의 구조, 구현, 문서, SKILL이 일관되고 합리적인 상태인지 종합 점검한다.

> 이 SKILL은 코드를 수정하지 않는다. 점검 결과만 보고한다.
> 수정이 필요한 항목이 발견되면 사용자에게 보고하고 지시를 기다린다.

---

## 점검 범위

```
WEB_BUILDER_TOOLKIT/
├── Figma_Conversion/              ← 영역 1: Figma 파이프라인
├── RNBT_architecture/
│   ├── Utils/                     ← 영역 2: 런타임 유틸리티
│   └── DesignComponentSystem/     ← 영역 3: 컴포넌트 시스템
│       ├── Mixins/                ← 영역 3-1: 구현-문서 일치
│       ├── Components/            ← 영역 3-2: 컴포넌트 카탈로그
│       ├── Examples/              ← 영역 3-3: 예제 프로젝트
│       └── docs/                  ← 영역 3-4: 설계 문서 일관성
├── .claude/skills/                ← 영역 4: SKILL 정합성
├── CLAUDE.md                      ← 영역 5: 루트 문서
└── README.md                      ← 영역 5: 루트 문서
```

7개 영역을 순서대로 점검한다. 각 영역의 결과를 개별 보고한 후 최종 요약을 제시한다.

---

## 1. Figma 파이프라인 (Figma_Conversion)

### 점검 내용

Figma → 정적 HTML/CSS 변환 파이프라인이 정상 상태인지 확인한다.

### 점검 방법

1. [Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md) 읽기
2. [Figma_Conversion/PUBLISHING_COMPONENT_STRUCTURE.md](/Figma_Conversion/PUBLISHING_COMPONENT_STRUCTURE.md) 읽기
3. Static_Components/ 디렉토리에 변환 결과물이 있는가
4. 변환 결과물의 구조가 PUBLISHING_COMPONENT_STRUCTURE.md에서 정의한 형태와 일치하는가
5. SKILL(figma-to-html, figma-to-inline-svg)에서 참조하는 가이드 파일이 존재하는가
   - `/.claude/guides/FIGMA_MCP_GUIDE.md`
   - `/.claude/guides/FIGMA_IMPLEMENTATION_GUIDE.md`
   - `/.claude/guides/CODING_STYLE.md`

### 보고 형식

```
■ Figma 파이프라인
  CLAUDE.md:      ✅ / ⚠️
  컴포넌트 구조 문서: ✅ / ⚠️
  변환 결과물:    N개 프로젝트, M개 컴포넌트
  가이드 파일:    ✅ 전부 존재 / ⚠️ N건 누락
  비고: (문제가 있으면 구체적으로)
```

---

## 2. 런타임 유틸리티 (Utils)

### 점검 내용

런타임 유틸리티가 존재하고, Mixin/예제에서 참조하는 함수가 실제로 존재하는지 확인한다.

### 점검 방법

1. [RNBT_architecture/Utils/](/RNBT_architecture/Utils/) 디렉토리의 .js 파일 목록
2. Mixin/예제에서 사용하는 전역 객체(GlobalDataPublisher, Wkit, Weventbus, fx)가 Utils/에 있는가
3. [RNBT_architecture/README.md](/RNBT_architecture/README.md)의 Utils 설명이 현재 파일과 일치하는가

### 보고 형식

```
■ 런타임 유틸리티
  Utils 파일:         N개 존재
  전역 객체 매핑:     ✅ / ⚠️
  README 일치:        ✅ / ⚠️
  비고: (문제가 있으면 구체적으로)
```

---

## 3. 구조 합리성 (Strategy Validation)

### 점검 내용

N + M 전략이 여전히 유효한지 확인한다.

### 점검 방법

1. [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 읽기
2. 다음을 확인:
   - Mixin(기능)과 Design(시각)의 직교성 원칙이 유지되는가
   - "조립 코드 주도 원칙"이 명시되어 있는가
   - 확장 경로(Mixin 확장, 컴포넌트 확장)가 현재 상태와 맞는가
   - 미구현 후보 목록이 이미 구현된 Mixin을 포함하고 있지 않은가

### 보고 형식

```
■ 구조 합리성
  직교성 원칙:     ✅ / ⚠️ / ❌
  조립 코드 주도:  ✅ / ⚠️ / ❌
  확장 경로:       ✅ / ⚠️ / ❌
  미구현 후보:     ✅ / ⚠️ / ❌
  비고: (문제가 있으면 구체적으로)
```

---

## 4. 구현-문서 일치 (Implementation-Document Sync)

### 점검 내용

모든 Mixin의 구현체(.js), API 문서(.md), 명세서(MIXIN_SPEC_EXAMPLE_*.md)가 일치하는지 확인한다.

### 점검 방법

[Mixins/](/RNBT_architecture/DesignComponentSystem/Mixins/) 디렉토리에서 모든 .js 파일을 찾고, 각각에 대해:

1. **파일 존재**: .js, .md, MIXIN_SPEC_EXAMPLE_*.md 세 파일이 모두 있는가
2. **목적 일치**: .js JSDoc의 목적 서술 ↔ 명세서 섹션 1 ↔ .md 설계 의도
3. **네임스페이스 일치**: .js의 `instance.xxx = ns` ↔ 명세서 섹션 4 ↔ .md
4. **메서드 완비**: .js의 `ns.xxx = function` 전부가 명세서 섹션 4 테이블에 있는가
5. **destroy 일치**: .js의 destroy 내부 정리 항목 ↔ 명세서 섹션 5 목록
6. **cssSelectors/datasetAttrs 정합성**: 다음을 확인한다
   - .js 코드에서 datasetAttrs 역할 설명이 실제 동작과 일치하는가 (위치는 cssSelectors가 담당, datasetAttrs는 속성명 지정)
   - .md/.spec에서 순회 대상이 정확한가 (cssSelectors를 순회하는지, datasetAttrs를 순회하는지)
   - itemKey가 datasetAttrs 안이 아닌 options 최상위에 있는가 (StatefulListRenderMixin)
   - datasetAttrs의 key가 cssSelectors에도 존재하여 대상 요소를 찾을 수 있는가

### 보고 형식

```
■ 구현-문서 일치

  | Mixin | 파일 | 목적 | NS | 메서드 | destroy | selectors | 판정 |
  |-------|------|------|-----|--------|---------|-----------|------|
  | FieldRender | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
  | ...         |    |    |    |    |    |    |      |

  불일치: N건
  (불일치 항목이 있으면 파일:행 수준으로 상세 기술)
```

---

## 5. 설계 문서 일관성 (Design Document Consistency)

### 점검 내용

docs/ 디렉토리의 모든 문서가 서로 일관되는지 확인한다.

### 점검 방법

[docs/](/RNBT_architecture/DesignComponentSystem/docs/) 디렉토리의 모든 .md 파일을 읽고:

1. **Mixin 수 일관성**: 모든 문서에서 Mixin 수가 동일한가
   - COMPONENT_SYSTEM_DESIGN.md의 테이블들
   - SYSTEM_READINESS_REVIEW.md의 수치
   - MIXIN_REVIEW.md의 항목 수
   - Mixins/README.md의 목록

2. **목적 서술 일관성**: 모든 문서에서 같은 Mixin의 목적이 동일한가
   - COMPONENT_SYSTEM_DESIGN.md (기능 정의 테이블, 카탈로그 테이블)
   - FUNCTION_PATTERN.md (비교 테이블)
   - SYSTEM_READINESS_REVIEW.md (목적 테이블)
   - 각 MIXIN_SPEC_EXAMPLE_*.md (섹션 1)
   - 각 Mixin .md (설계 의도)
   - 각 Mixin .js (JSDoc 헤더)

3. **상호 참조 링크**: 마크다운 링크가 실제 존재하는 파일을 가리키는가

4. **날짜**: "최종 업데이트" 또는 "검토일"이 합리적인가

### 보고 형식

```
■ 설계 문서 일관성
  Mixin 수:        ✅ 전체 일치 / ⚠️ 불일치 (어디서 몇 개)
  목적 서술:       ✅ 전체 일치 / ⚠️ N건 불일치
  상호 참조 링크:  ✅ 전부 유효 / ⚠️ N건 깨짐
  날짜:            최신 갱신일: YYYY-MM-DD
  비고: (문제가 있으면 구체적으로)
```

---

## 6. SKILL 정합성 (Skill Coverage)

### 점검 내용

SKILL 파일들이 현재 시스템 상태와 일치하는지 확인한다.

### 점검 방법

[.claude/skills/](/.claude/skills/) 디렉토리의 모든 SKILL.md와 SHARED_INSTRUCTIONS.md를 읽고:

1. **용어 일치**: SKILL에서 사용하는 Mixin 이름, 네임스페이스, 함수명이 구현체와 일치하는가
2. **패턴 일치**: SKILL에서 안내하는 register.js, beforeDestroy.js 패턴이 실제 예제와 일치하는가
3. **역할 분담**: SKILL이 "공통 패턴"을, Mixin .md가 "구체 사용법"을 담당하는 구조가 명확한가. SHARED_INSTRUCTIONS.md에 Mixin 문서 확인 규칙이 있는가.
4. **참조 링크**: SKILL에서 참조하는 문서/예제 경로가 유효한가
5. **삭제된 경로**: SKILL이 삭제된 디렉토리(Projects/, tests/ 등)를 참조하지 않는가

### 보고 형식

```
■ SKILL 정합성
  용어 일치:    ✅ / ⚠️ N건 불일치
  패턴 일치:    ✅ / ⚠️ N건 불일치
  역할 분담:    ✅ 명확 / ⚠️ 불명확
  참조 링크:    ✅ 전부 유효 / ⚠️ N건 깨짐
  삭제 경로:    ✅ 없음 / ⚠️ N건 발견
  비고: (문제가 있으면 구체적으로)
```

---

## 7. 프로젝트 건강 (Project Health)

### 점검 내용

프로젝트의 나머지 구성 요소를 점검한다.

### 점검 방법

1. **Components 디렉토리**: 등록된 컴포넌트가 있으면 register.js/beforeDestroy.js 패턴이 올바른지 확인. README.md가 현재 상태를 반영하는지 확인.

2. **Examples 디렉토리**: SimpleDashboard 등 예제 프로젝트의 구조가 올바른지 확인.
   - mock_server: 각 엔드포인트의 응답 구조가 대상 믹스인의 renderData가 기대하는 데이터 형태와 일치하는가
   - preview_runtime.js: _datasetRegistry에 모든 데이터셋이 등록되어 있는가
   - 각 컴포넌트의 register.js/beforeDestroy.js가 3단계 패턴을 따르는가
   - preview HTML이 독립 실행 가능한 구조인가

3. **Mixins/README.md**: 목록이 실제 .js 파일과 일치하는가. 상세 문서 링크가 유효한가.

4. **루트 문서**: WEB_BUILDER_TOOLKIT/CLAUDE.md와 README.md가 현재 프로젝트 구조를 반영하는가. 삭제된 디렉토리(Projects/, tests/)를 참조하지 않는가.

5. **RNBT_architecture 문서**: RNBT_architecture/CLAUDE.md와 README.md가 현재 상태와 일치하는가.

### 보고 형식

```
■ 프로젝트 건강
  Components:             ✅ / ⚠️ (상세)
  Examples:               ✅ / ⚠️ (상세)
  Mixins/README.md:       ✅ / ⚠️ (상세)
  루트 문서 (CLAUDE/README): ✅ / ⚠️ (상세)
  RNBT 문서 (CLAUDE/README): ✅ / ⚠️ (상세)
```

---

## 최종 보고 형식

7개 영역을 모두 점검한 후, 다음 형식으로 최종 요약을 제시한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━
프로젝트 전체 점검 결과
━━━━━━━━━━━━━━━━━━━━━━━━

점검일: YYYY-MM-DD

| 영역 | 판정 | 불일치 |
|------|------|--------|
| Figma 파이프라인 | ✅ / ⚠️ / ❌ | N건 |
| 런타임 유틸리티 | ✅ / ⚠️ / ❌ | N건 |
| 구조 합리성 | ✅ / ⚠️ / ❌ | N건 |
| 구현-문서 일치 | ✅ / ⚠️ / ❌ | N건 |
| 설계 문서 일관성 | ✅ / ⚠️ / ❌ | N건 |
| SKILL 정합성 | ✅ / ⚠️ / ❌ | N건 |
| 프로젝트 건강 | ✅ / ⚠️ / ❌ | N건 |

총 불일치: N건
  심각: N건
  경미: N건

(각 불일치 항목을 파일:행 수준으로 나열)
```

---

## 주의사항

- 이 SKILL은 **읽기 전용**이다. 코드나 문서를 수정하지 않는다.
- 발견한 문제는 사용자에게 보고하고, 수정 여부와 방향은 사용자가 결정한다.
- 점검 범위가 넓으므로, 병렬 Agent를 활용하여 효율적으로 진행한다.
- 이전 점검 결과와 비교하려면 [SYSTEM_READINESS_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/reports/SYSTEM_READINESS_REVIEW.md)를 참조한다.

---
