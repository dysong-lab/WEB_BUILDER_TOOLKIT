---
name: audit-project
description: WEB_BUILDER_TOOLKIT 프로젝트의 전체 건강 상태를 점검합니다. 목적·논리·효율·정합성을 계층적으로 진단합니다.
---

# 프로젝트 전체 점검 (Audit)

WEB_BUILDER_TOOLKIT 전체를 **목적 → 논리 → 효율 → 정합성** 순서로 계층적으로 점검한다.

> 이 SKILL은 코드를 수정하지 않는다. 점검 결과만 보고한다.
> 수정이 필요한 항목이 발견되면 사용자에게 보고하고 지시를 기다린다.

---

## 점검 계층

```
Layer 1: 목적    — 이 프로젝트는 무엇이며 무엇을 달성하려 하는가
Layer 2: 논리    — 목적을 달성하기 위한 수단이 논리적으로 타당한가
Layer 3: 효율    — 논리적 구성을 효율적으로 실현했는가
Layer 4: 정합성  — 모든 구성 요소가 서로 일관되는가
```

상위 계층에서 문제가 있으면 하위 계층의 정합성이 무의미할 수 있다. 따라서 반드시 순서대로 점검한다.

---

## Layer 1: 목적 파악

### 점검 내용

프로젝트의 정체, 목적, 파이프라인을 파악한다.

### 점검 방법

1. 루트 [CLAUDE.md](/CLAUDE.md)와 [README.md](/README.md) 읽기
2. [Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md) 읽기
3. [RNBT_architecture/CLAUDE.md](/RNBT_architecture/CLAUDE.md)과 [README.md](/RNBT_architecture/README.md) 읽기
4. 다음을 판단:
   - 프로젝트의 최종 소비자와 자동화 주체가 명확한가
   - 파이프라인(Figma → 정적 → 동적 → 프로젝트)이 문서에 명시되어 있는가
   - SKILL 선택 가이드가 존재하고 파이프라인 단계와 매핑되는가

### 보고 형식

```
■ Layer 1: 목적
  프로젝트 정체:      명확 / 모호
  파이프라인 정의:    명확 / 모호 / 부재
  SKILL 선택 가이드:  ✅ / ⚠️ / ❌
  비고:
```

---

## Layer 2: 논리성 검토

### 점검 내용

목적을 달성하기 위한 아키텍처, 설계 원칙, 데이터 흐름이 논리적으로 타당한지 확인한다.

### 점검 방법

1. [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 읽기
2. [WHY_MIXIN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/WHY_MIXIN.md) 읽기
3. [FUNCTION_PATTERN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/FUNCTION_PATTERN.md) 읽기
4. [SELECTORS_AS_CONTRACT.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/SELECTORS_AS_CONTRACT.md) 읽기
5. 다음을 판단:
   - **Mixin 설계 근거**: 프레임워크 제약 → function-based Mixin 선택이 필연적인가
   - **분류 기준**: "기능 = 목적 + 수단" 공식이 현재 Mixin 분류와 일치하는가
   - **데이터 흐름**: 페이지(오케스트레이터) → Topic pub-sub → 컴포넌트(수동적 구독자) 흐름이 일관되는가
   - **라이프사이클 대칭성**: 생성 순서(Mixin → 구독 → 이벤트)의 역순 정리가 설계에 명시되어 있는가
   - **Selector Contract**: cssSelectors/datasetAttrs 분리의 논리적 근거가 있는가

### 보고 형식

```
■ Layer 2: 논리성
  Mixin 설계 근거:       타당 / 불충분 / 부재
  분류 기준:             일관 / 불일치 N건
  데이터 흐름:           일관 / 불일치 N건
  라이프사이클 대칭성:    명시 / 미명시
  Selector Contract:     타당 / 긴장 지점 N건
  비고:
```

---

## Layer 3: 효율성 검토

### 점검 내용

논리적 구성이 효율적으로 실현되었는지 확인한다.

### 점검 방법

1. [.claude/skills/](/.claude/skills/) 전체 구조 확인
   - SKILL이 파이프라인 단계별로 분리되어 있는가
   - [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)로 공통 규칙을 한 곳에서 관리하는가
   - 각 SKILL에 사전 읽기 목록이 있어 필요한 컨텍스트만 로드하는가
2. [docs/](/RNBT_architecture/DesignComponentSystem/docs/) 구조 확인
   - 문서가 소비자별로 분류되어 있는가 (architecture → SKILL용, specs → Mixin개발용, reports → 사람용)
   - 같은 내용이 여러 곳에 중복 유지되는 지점이 있는가
3. [Examples/](/RNBT_architecture/DesignComponentSystem/Examples/) 구조 확인
   - 각 예제가 구별되는 목적을 가지는가 (테마 시연 / 커스텀 개발 시연 등)

### 보고 형식

```
■ Layer 3: 효율성
  SKILL 분리:         효율적 / 비효율 N건
  공통 규칙 관리:      집중 / 분산
  문서 분류:          소비자별 / 혼재
  문서 중복:          N건
  예제 목적 구분:      명확 / 모호
  비고:
```

---

## Layer 4: 정합성 검토

정합성은 7개 영역으로 나누어 순서대로 점검한다. 병렬 Agent를 활용하여 효율적으로 진행한다.

### 점검 범위

```
WEB_BUILDER_TOOLKIT/
├── Figma_Conversion/              ← 4-1: Figma 파이프라인
├── RNBT_architecture/
│   ├── Utils/                     ← 4-2: 런타임 유틸리티
│   └── DesignComponentSystem/
│       ├── Mixins/                ← 4-3: 구현-문서 일치
│       ├── Components/            ← 4-4: 컴포넌트 코드 전수 검증
│       ├── Examples/              ← 4-5: 예제 프로젝트
│       └── docs/                  ← 4-6: 설계 문서 일관성
├── .claude/skills/                ← 4-7: SKILL 정합성
└── (파이프라인 실증성)             ← 4-8: end-to-end 검증
```

---

### 4-1. Figma 파이프라인

#### 점검 방법

1. [Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md) 읽기
2. [Figma_Conversion/PUBLISHING_COMPONENT_STRUCTURE.md](/Figma_Conversion/PUBLISHING_COMPONENT_STRUCTURE.md) 읽기
3. Static_Components/ 디렉토리에 변환 결과물이 있는가 (TBD: 경로 재구성 예정)
4. 변환 결과물의 구조가 PUBLISHING_COMPONENT_STRUCTURE.md에서 정의한 형태와 일치하는가
5. SKILL(figma-to-html, figma-to-inline-svg)에서 참조하는 가이드 파일이 존재하는가

#### 보고 형식

```
■ 4-1 Figma 파이프라인
  CLAUDE.md:           ✅ / ⚠️
  컴포넌트 구조 문서:    ✅ / ⚠️
  변환 결과물:          N개 프로젝트, M개 컴포넌트
  가이드 파일:          ✅ 전부 존재 / ⚠️ N건 누락
  비고:
```

---

### 4-2. 런타임 유틸리티

#### 점검 방법

1. [Utils/](/RNBT_architecture/Utils/) 디렉토리의 .js 파일 목록
2. Mixin/예제에서 사용하는 전역 객체(GlobalDataPublisher, Wkit, Weventbus, fx)가 Utils/에 있는가
3. README.md의 Utils 설명이 현재 파일과 일치하는가

#### 보고 형식

```
■ 4-2 런타임 유틸리티
  Utils 파일:         N개 존재
  전역 객체 매핑:      ✅ / ⚠️
  README 일치:        ✅ / ⚠️
  비고:
```

---

### 4-3. 구현-문서 일치 (Mixin)

#### 점검 방법

[Mixins/](/RNBT_architecture/DesignComponentSystem/Mixins/) 디렉토리에서 모든 .js 파일을 찾고, 각각에 대해:

1. **파일 존재**: .js, .md, MIXIN_SPEC_EXAMPLE_*.md 세 파일이 모두 있는가
2. **목적 일치**: .js JSDoc의 목적 서술 ↔ 명세서 섹션 1 ↔ .md 설계 의도
3. **네임스페이스 일치**: .js의 `instance.xxx = ns` ↔ 명세서 섹션 4 ↔ .md
4. **메서드 완비**: .js의 `ns.xxx = function` 전부가 명세서 섹션 4 테이블에 있는가
5. **destroy 일치**: .js의 destroy 내부 정리 항목 ↔ 명세서 섹션 5 목록
6. **cssSelectors/datasetAttrs 정합성**: 다음을 확인한다
   - .js 코드에서 datasetAttrs 역할 설명이 실제 동작과 일치하는가
   - .md/.spec에서 순회 대상이 정확한가
   - itemKey가 datasetAttrs 안이 아닌 options 최상위에 있는가 (ListRenderMixin의 stateful 모드)
   - datasetAttrs의 key가 cssSelectors에도 존재하여 대상 요소를 찾을 수 있는가

#### 보고 형식

```
■ 4-3 구현-문서 일치

  | Mixin | 파일 | 목적 | NS | 메서드 | destroy | selectors | 판정 |
  |-------|------|------|-----|--------|---------|-----------|------|
  | FieldRender | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | PASS |
  | ...         |    |    |    |    |    |    |      |

  불일치: N건
  (불일치 항목이 있으면 파일:행 수준으로 상세 기술)
```

---

### 4-4. 컴포넌트 코드 전수 검증

#### 점검 내용

모든 컴포넌트의 register.js와 beforeDestroy.js를 **하나씩 실제로 읽어** 패턴 준수 여부를 확인한다.

#### 점검 방법

[Components/](/RNBT_architecture/DesignComponentSystem/Components/)와 [Examples/](/RNBT_architecture/DesignComponentSystem/Examples/) 내 모든 컴포넌트에 대해:

1. **register.js를 읽고 확인:**
   - 3단계 순서를 따르는가 (1. Mixin 적용 → 2. 구독 연결 → 3. 이벤트 바인딩)
   - Mixin 네임스페이스가 해당 Mixin 문서와 일치하는가
   - 구독에서 Mixin 메서드를 함수 참조로 연결하는가 (문자열이 아닌 `this.xxx.renderData`)
   - customEvents에서 cssSelectors를 computed property로 참조하는가

2. **beforeDestroy.js를 읽고 확인:**
   - register.js의 정확한 역순인가 (3. 이벤트 제거 → 2. 구독 해제 → 1. Mixin.destroy())
   - register.js에서 생성한 모든 것이 정리되는가 (누락 없음)
   - Mixin이 여러 개면 적용 역순으로 destroy하는가

3. **교차 검증:**
   - register.js에서 사용한 Mixin의 실제 .js 코드를 읽어, 문서가 주장하는 동작과 코드가 실제로 하는 동작이 일치하는지 코드 라인 레벨에서 확인

#### 보고 형식

```
■ 4-4 컴포넌트 코드 전수 검증

  | 컴포넌트 | Mixin | 네임스페이스 | 3단계 순서 | 역순 정리 | 판정 |
  |----------|-------|-------------|-----------|----------|------|
  | Header   | FieldRender | this.fieldRender | ✅ | ✅ | PASS |
  | ...      |       |             |           |          |      |

  불일치: N건
  (불일치 항목이 있으면 파일:행 수준으로 상세 기술)
```

---

### 4-5. 예제 프로젝트

#### 점검 방법

[Examples/](/RNBT_architecture/DesignComponentSystem/Examples/)의 모든 예제에 대해:

1. **페이지 스크립트**: before_load.js, loaded.js, before_unload.js가 README.md의 템플릿 패턴을 따르는가
2. **생성-정리 매칭**: loaded.js에서 생성한 모든 것이 before_unload.js에서 정리되는가
3. **mock_server**: 각 엔드포인트의 응답 구조가 대상 Mixin의 renderData가 기대하는 데이터 형태와 일치하는가
4. **datasetList.json**: 형식이 올바르고, topic 이름이 페이지 스크립트의 pageDataMappings와 일치하는가

#### 보고 형식

```
■ 4-5 예제 프로젝트
  페이지 스크립트 패턴:   ✅ / ⚠️ N건
  생성-정리 매칭:        ✅ / ⚠️ N건
  mock_server 응답:      ✅ / ⚠️ N건
  datasetList.json:      ✅ / ⚠️ N건
  비고:
```

---

### 4-6. 설계 문서 일관성

#### 점검 방법

[docs/](/RNBT_architecture/DesignComponentSystem/docs/) 디렉토리의 모든 .md 파일을 읽고:

1. **Mixin 수 일관성**: 모든 문서에서 Mixin 수가 동일한가
2. **목적 서술 일관성**: 같은 Mixin의 목적이 모든 문서에서 동일한가
3. **상호 참조 링크**: 마크다운 링크가 실제 존재하는 파일을 가리키는가
4. **날짜**: "최종 업데이트" 또는 "검토일"이 합리적인가
5. **reports/ 내용 정확성**: 리뷰 문서의 주장을 실제 코드와 대조하여 부정확한 기술이 없는지 확인

#### 보고 형식

```
■ 4-6 설계 문서 일관성
  Mixin 수:             ✅ 전체 일치 / ⚠️ 불일치 (어디서 몇 개)
  목적 서술:            ✅ 전체 일치 / ⚠️ N건 불일치
  상호 참조 링크:        ✅ 전부 유효 / ⚠️ N건 깨짐
  날짜:                 최신 갱신일: YYYY-MM-DD
  reports 정확성:        ✅ / ⚠️ N건 부정확
  비고:
```

---

### 4-7. SKILL 정합성

#### 점검 방법

[.claude/skills/](/.claude/skills/) 디렉토리의 모든 SKILL.md와 SHARED_INSTRUCTIONS.md를 읽고:

1. **용어 일치**: SKILL에서 사용하는 Mixin 이름, 네임스페이스, 함수명이 구현체와 일치하는가
2. **패턴 일치**: SKILL에서 안내하는 register.js, beforeDestroy.js 패턴이 실제 예제와 일치하는가
3. **역할 분담**: SKILL이 "공통 패턴"을, Mixin .md가 "구체 사용법"을 담당하는 구조가 명확한가
4. **참조 링크**: SKILL에서 참조하는 문서/예제 경로가 유효한가
5. **삭제된 경로**: SKILL이 삭제된 디렉토리를 참조하지 않는가

#### 보고 형식

```
■ 4-7 SKILL 정합성
  용어 일치:    ✅ / ⚠️ N건 불일치
  패턴 일치:    ✅ / ⚠️ N건 불일치
  역할 분담:    ✅ 명확 / ⚠️ 불명확
  참조 링크:    ✅ 전부 유효 / ⚠️ N건 깨짐
  삭제 경로:    ✅ 없음 / ⚠️ N건 발견
  비고:
```

---

### 4-8. 파이프라인 실증성

#### 점검 내용

문서가 정의한 파이프라인(Figma → 정적 → 동적)을 실제로 통과한 산출물이 존재하는지 확인한다.

#### 점검 방법

1. Static_Components/의 정적 컴포넌트 목록 확인 (TBD: 경로 재구성 예정)
2. [Components/](/RNBT_architecture/DesignComponentSystem/Components/)의 동적 컴포넌트 목록 확인
3. 다음을 판단:
   - 정적 컴포넌트 중 동적 컴포넌트로 변환된 것이 있는가 (같은 프로젝트의 같은 컴포넌트가 양쪽에 존재하는가)
   - 변환된 것이 있다면: 정적 HTML의 선택자가 동적 register.js의 cssSelectors와 매핑되는가
   - 변환된 것이 없다면: 파이프라인이 미검증 상태임을 보고

#### 보고 형식

```
■ 4-8 파이프라인 실증성
  정적 컴포넌트:     N개 (M개 프로젝트)
  동적 컴포넌트:     N개
  변환 실증 산출물:  N건 / 없음
  판정:             검증됨 / 미검증
  비고:
```

---

## 최종 보고 형식

모든 계층과 영역을 점검한 후, 다음 형식으로 최종 요약을 제시한다.

```
━━━━━━━━━━━━━━━━━━━━━━━━
프로젝트 전체 점검 결과
━━━━━━━━━━━━━━━━━━━━━━━━

점검일: YYYY-MM-DD

■ 계층별 판정

| 계층 | 판정 | 근거 |
|------|------|------|
| Layer 1: 목적 | ◎/○/△ | (한 줄 요약) |
| Layer 2: 논리 | ◎/○/△ | (한 줄 요약) |
| Layer 3: 효율 | ◎/○/△ | (한 줄 요약) |
| Layer 4: 정합성 | ◎/○/△ | (한 줄 요약) |

■ 정합성 세부 (Layer 4)

| 영역 | 판정 | 불일치 |
|------|------|--------|
| 4-1 Figma 파이프라인 | ✅/⚠️/❌ | N건 |
| 4-2 런타임 유틸리티 | ✅/⚠️/❌ | N건 |
| 4-3 구현-문서 일치 | ✅/⚠️/❌ | N건 |
| 4-4 컴포넌트 코드 전수 | ✅/⚠️/❌ | N건 |
| 4-5 예제 프로젝트 | ✅/⚠️/❌ | N건 |
| 4-6 설계 문서 일관성 | ✅/⚠️/❌ | N건 |
| 4-7 SKILL 정합성 | ✅/⚠️/❌ | N건 |
| 4-8 파이프라인 실증성 | ✅/⚠️/❌ | N건 |

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
- **컴포넌트 코드 전수 검증(4-4)은 반드시 실제 파일을 읽는다.** 파일 존재 확인이 아닌 코드 내용 확인이다.
- **reports/ 정확성 검증(4-6)은 코드와 대조한다.** 리뷰 문서가 주장하는 동작을 실제 코드 라인에서 확인한다.
- 이전 점검 결과와 비교하려면 [SYSTEM_READINESS_REVIEW.md](/RNBT_architecture/DesignComponentSystem/docs/reports/SYSTEM_READINESS_REVIEW.md)를 참조한다.

---
