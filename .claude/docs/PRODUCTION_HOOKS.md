# DesignComponent 생산 품질 보장 — Hook 설계

## 1. 목적

DesignComponent(Mixin + 컴포넌트)를 **일관된 품질로 대량 생산**하는 것이 이 프로젝트의 목표다.

생산 파이프라인:

```
Figma 디자인 → [1-figma] → 정적 HTML/CSS → [2-component] → 동적 컴포넌트
                                              ↑
                                         이 단계에서 register.js, beforeDestroy.js,
                                         preview.html이 반복 생성된다
```

Hook은 이 생산 과정에서 **반복적으로 발생하는 오류를 기계적으로 차단**하여, 사람의 감사에 의존하지 않고 품질을 보장한다.

---

## 2. 왜 텍스트 규칙만으로 부족한가

2026-03-31 전수 검토에서 실증되었다.

```
대상: 35개 컴포넌트 (Components/ 8개 + Examples/ 4 프로젝트)
발견: 17건의 규칙 위반
원인: 모든 규칙이 텍스트 문서에 존재했지만, 구현이 따르지 않음
```

텍스트 규칙의 구조적 한계:

- Claude가 참조 문서를 읽었더라도 **컨텍스트 압축 후 유실**될 수 있다
- 규칙을 "알고" 있어도 **실수로 위반**할 수 있다 (차트 4종의 Step 3 누락)
- 03-28 검토에서도 같은 파일을 읽고 **같은 위반을 놓쳤다** — 사람의 감사도 완벽하지 않다

결론: **규칙을 아는 것과 규칙을 지키는 것은 다르다.** 기계적 강제가 필요하다.

---

## 3. Hook의 역할

### Hook이 하는 것

**생산 과정에서 반복될 오류만 잡는 안전망.**

컴포넌트/Mixin을 하나 생산할 때마다 아래 파일들이 생성된다:

```
컴포넌트 생산 (create-standard-component)     Mixin 생산 (implement-mixin)
─────────────────────────────────────────     ──────────────────────────────
ComponentName/                                Mixins/
├── views/                                    ├── MixinName.js          ◀ Hook 검사 대상
│   └── 01_name.html         ◀ Hook 검사 대상 ├── MixinName.md          ◀ Hook 검사 대상
├── styles/                                   └── (5개 문서 갱신)
│   └── 01_name.css          ◀ Hook 검사 대상
├── scripts/
│   ├── register.js          ◀ Hook 검사 대상
│   └── beforeDestroy.js     ◀ Hook 검사 대상
└── preview/
    └── 01_name.html         ◀ Hook 검사 대상
```

이 파일들에서 동일한 실수가 반복될 수 있다. Hook은 파일이 쓰이는 시점에 자동으로 검사하여, 위반이 있으면 즉시 피드백한다.

```
Claude가 생산 파일 작성 (Write/Edit)
    ↓
[PostToolUse Hook] 자동 트리거 (LLM 토큰 소모 없음)
    ↓
셸 스크립트가 파일 내용 검사
    ↓
├── 통과 → exit 0 (아무 일도 안 일어남)
└── 위반 → exit 2 + stderr 피드백 → Claude가 다음 턴에서 수정
```

---

## 4. 생산 계약 (Production Contract)

생산된 파일이 품질 기준을 충족하는지 판단하는 전체 체크리스트다.
이 중 일부는 Hook으로 자동화하고, 나머지는 audit-project나 사람의 리뷰가 담당한다.

### 설계 철학 계약 — 모든 생산물의 전제

파일별 체크리스트보다 먼저, **설계 철학이 지켜지고 있는가**를 확인한다.
구문이 존재하는 것과 설계 의도대로 사용되는 것은 다르다.

#### Mixin 인터페이스는 실제로 동작해야 한다

```
설계 철학:
  HTML = 빈 껍데기 (약속된 선택자만 제공, 데이터는 비어있음)
  Mixin = 런타임에 데이터를 받아 DOM을 채움 (renderData)
  데이터 = API에서 옴 → 페이지가 발행 → Mixin이 렌더링
```

```
❌ 위반 — 형식만 지키고 설계를 무시:

  HTML에 데이터를 하드코딩:
    <span class="status" data-status="running">정상</span>

  register.js에 인터페이스를 "규칙을 지키기 위해" 정의:
    cssSelectors: { status: '.status' }
    datasetAttrs: { status: 'status' }

  → cssSelectors/datasetAttrs 객체는 존재하지만 장식품
  → renderData가 호출되어도 이미 있는 값 위에 덮어쓸 뿐
  → Mixin의 존재 이유가 소멸
```

```
✅ 올바른 사용 — 인터페이스가 실제로 데이터 흐름을 매개:

  HTML은 빈 상태 (약속된 선택자만 존재):
    <span class="status">-</span>

  register.js에서 Mixin이 데이터를 채우도록 연결:
    cssSelectors: { status: '.status' }
    datasetAttrs: { status: 'status' }
    → subscribe(topic, this, this.fieldRender.renderData)

  런타임 데이터 흐름:
    API 응답 { status: 'running' }
      → renderData가 호출됨
      → el.setAttribute('data-status', 'running')
      → CSS [data-status="running"] { color: green; }
```

이 계약은 Hook으로 자동 검출할 수 없다. **리뷰 시 가장 먼저 확인해야 할 항목**이다.

| 계약 | 자동화 |
|------|--------|
| HTML에 런타임 데이터가 하드코딩되어 있지 않은가 | 리뷰 |
| cssSelectors/datasetAttrs가 실제 데이터 흐름에 참여하는가 (장식이 아닌가) | 리뷰 |
| 데이터는 API → 페이지 발행 → Mixin renderData 경로로 흐르는가 | 리뷰 |

---

### 컴포넌트 생산

#### register.js — 조립 코드

| 계약 | 자동화 |
|------|--------|
| 3단계가 모두 존재하는가 (Mixin 적용 → 구독 → 이벤트) | Hook |
| 구독에서 함수 참조를 사용하는가 (문자열이 아닌) | 리뷰 |
| customEvents에서 computed property를 사용하는가 (하드코딩이 아닌) | 리뷰 |
| 렌더링 로직이 없는가 (innerHTML, DOM 조작 없음) | Hook |
| fetch 호출이 없는가 | Hook |
| var를 사용하지 않는가 | Hook |

#### beforeDestroy.js — 정리 코드

| 계약 | 자동화 |
|------|--------|
| register.js의 정확한 역순인가 (이벤트 제거 → 구독 해제 → Mixin destroy) | Hook |
| register.js에서 생성한 모든 것이 정리되는가 (누락 없음) | 리뷰 |
| 참조를 null 처리하는가 (customEvents, subscriptions) | Hook |

#### views/*.html — 디자인

| 계약 | 자동화 |
|------|--------|
| register.js의 cssSelectors에 선언된 선택자가 HTML에 존재하는가 | 리뷰 |
| ListRenderMixin 사용 시 `<template>` 태그가 있는가 | 리뷰 |
| 컨테이너 요소가 있는가 | 리뷰 |

#### styles/*.css — 스타일

| 계약 | 자동화 |
|------|--------|
| px 단위만 사용하는가 (rem/em 금지) | Hook |
| Flexbox를 사용하는가 (Grid/absolute 지양) | 리뷰 |
| 컨테이너 ID가 컴포넌트별 고유한가 (범용 금지) | 리뷰 |

#### preview/*.html — 독립 테스트

| 계약 | 자동화 |
|------|--------|
| CSS가 인라인인가 (로컬 `<link>` 금지) | Hook |
| 컨테이너에 Figma 치수가 명시되어 있는가 | 리뷰 |

### Mixin 생산

#### MixinName.js — 구현체

| 계약 | 자동화 |
|------|--------|
| var를 사용하지 않는가 | Hook |
| 네임스페이스를 주입하는가 (`instance.[ns] = ns`) | Hook |
| destroy가 주입한 모든 메서드/속성을 null 처리하는가 | 리뷰 |
| destroy 마지막에 `instance.[ns] = null`인가 | Hook |
| 에러를 throw하는가 (catch하지 않는가) | 리뷰 |
| 다른 Mixin을 참조하지 않는가 | 리뷰 |

---

## 5. Hook 선별

위 생산 계약에서 "Hook"으로 표시된 항목만 추출한 것이다.
선별 기준: **정규식으로 검출 가능하고, 생산 시 반복될 오류.**

| # | 대상 파일 | 계약 | 검출 방법 |
|---|----------|------|----------|
| 1 | `**/register.js` | 3단계 중 bindEvents 누락 | `bindEvents` 존재 확인 |
| 2 | `**/register.js` | 렌더링 로직 혼입 | `innerHTML` 존재 시 경고 |
| 3 | `**/register.js` | fetch 호출 | `fetch(` 존재 시 경고 |
| 4 | `**/beforeDestroy.js` | 역순 중 removeCustomEvents 누락 | `removeCustomEvents` 존재 확인 |
| 5 | `**/beforeDestroy.js` | 참조 null 미처리 | `= null` 존재 확인 |
| 6 | `**/*.js` | var 사용 | `\bvar\b` 검출 |
| 7 | `**/*.css` | rem/em 사용 | `\d+rem\b\|\d+em\b` 검출 |
| 8 | `**/preview*.html` | 로컬 CSS `<link>` | `<link.*href="styles/` 검출 |
| 9 | `**/Mixin*.js` | 네임스페이스 미주입 | `instance\.\w+ = ns` 존재 확인 |
| 10 | `**/Mixin*.js` | destroy 마지막 null 누락 | `instance\.\w+ = null` 존재 확인 |

---

*작성일: 2026-03-31*
*근거: 03-31 전수 검토 — 35개 컴포넌트에서 17건 위반 발견, 텍스트 규칙의 한계 실증*
