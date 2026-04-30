# 2D Component Design Enforcement

## 목적

이 문서는 Codex가 `DesignComponentSystem`의 2D 컴포넌트를 생성하거나 수정할 때,
upstream 컴포넌트 문서를 수정하지 않고도 반드시 따라야 하는 **로컬 디자인 준수 규칙**을 정의한다.

이 문서는 upstream spec을 대체하지 않는다.
기능과 구조는 upstream 문서를 따르고, 디자인 생성 방식은 이 문서를 따른다.

---

## 적용 대상

- `Components/**/Standard/*`
- `Components/**/Advanced/*`
- 2D 컴포넌트의 `views/*.html`
- 2D 컴포넌트의 `styles/*.css`
- 2D preview (`preview/*.html`)
- 3D가 아닌 모든 HTML/CSS 기반 컴포넌트 생성 작업

---

## 원칙

### 1. 원본 spec 문서는 수정 금지

아래 문서는 **원본 spec**으로 취급한다.

- `Components/**/CLAUDE.md`
- `Components/**/Standard/CLAUDE.md`
- `Components/**/Advanced/**/CLAUDE.md`
- `.claude/skills/**/*.md`

역할:

- 무엇을 만들어야 하는가
- 어떤 기능과 Mixin 계약을 가져야 하는가
- 어떤 variant가 존재하는가

원칙:

- 읽기 전용
- 로컬 운영 규칙을 추가하려면 이 문서가 아니라 `docs/guides/` 아래 로컬 문서에 기록한다

---

## Codex 강제 규칙

### 2. 디자인 기준은 기존 컴포넌트가 아니라 디자인 스킬 문서다

Codex는 2D 컴포넌트 생성 시 아래 문서를 **디자인 기준의 단일 진실 소스**로 취급한다.

1. [/.claude/skills/0-produce/produce-component/SKILL.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/skills/0-produce/produce-component/SKILL.md)
   - 특히 **Step 5-1. 디자인 페르소나 & CSS 조달 규칙**
2. [/.claude/skills/6-design/create-html-css/SKILL.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/skills/6-design/create-html-css/SKILL.md)
3. [/.claude/skills/SHARED_INSTRUCTIONS.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/skills/SHARED_INSTRUCTIONS.md)
4. [/.claude/guides/CODING_STYLE.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/guides/CODING_STYLE.md)

금지:

- 기존 `Standard` 구현을 시각 기준으로 그대로 복제
- 기존 preview를 사실상의 디자인 원본처럼 취급
- `CLAUDE.md`의 variant 표만 보고 CSS를 임의 추론

허용:

- 기존 구현은 **구조 참고**로만 사용
- 선택자 계약, Mixin 연결, preview wiring 확인 용도로만 사용

정리:

- 기능 기준: upstream spec
- 디자인 기준: `produce-component` Step 5-1 + `create-html-css` 스킬

---

### 3. CSS 작업 전 필수 선행 읽기

Codex는 2D 컴포넌트의 HTML/CSS를 만들거나 수정하기 전에 아래 파일을 반드시 다시 읽는다.

1. [/.claude/skills/6-design/create-html-css/SKILL.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/skills/6-design/create-html-css/SKILL.md)
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/skills/SHARED_INSTRUCTIONS.md)
3. [/.claude/guides/CODING_STYLE.md](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/.claude/guides/CODING_STYLE.md)
4. [/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design system01-Dark/Design system01-Dark.css](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design%20system01-Dark/Design%20system01-Dark.css)
5. [/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design system01-Light/Design system01-Light.css](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design%20system01-Light/Design%20system01-Light.css)
6. [/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design system02-Dark/Design system02-Dark.css](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design%20system02-Dark/Design%20system02-Dark.css)
7. [/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design system02-Light/Design system02-Light.css](/Users/dayoung/Documents/GitHub/WEB_BUILDER_TOOLKIT_SYNC/Figma_Conversion/DesignSystemGuide/Design%20system02-Light/Design%20system02-Light.css)

이 단계는 생략할 수 없다.

---

### 4. 페르소나별 디자인은 문서 프로파일을 직접 따라야 한다

파일명과 실제 디자인 프로파일의 매핑은 아래로 고정한다.

- `01_refined` → Persona A: Refined Technical
- `02_material` → Persona B: Material Elevated
- `03_editorial` → Persona C: Minimal Editorial
- `04_operational` → Persona D: Dark Operational

Codex는 각 페르소나에 대해 아래 항목을 직접 체크한다.

- 색상 철학
- 타이포그래피
- 간격 리듬
- 상태 표현
- 레이아웃 도구
- 시각적 깊이
- border radius
- 모션

즉, variant 파일명만 맞는 상태는 불충분하다.
실제 CSS가 해당 페르소나 프로파일을 읽히게 만들어야 한다.

---

### 5. 구조 참고와 시각 참고를 분리한다

기존 컴포넌트를 읽을 때는 아래처럼 목적을 분리한다.

#### 기존 구현에서 가져와도 되는 것

- HTML 구조의 대분류
- cssSelectors 계약
- register.js / beforeDestroy.js 연결 패턴
- preview에서 event bus를 묶는 방식
- manifest 연결 방식

#### 기존 구현에서 그대로 가져오면 안 되는 것

- 색상값
- radius 값
- 간격 체계
- 그림자/그라디언트 방식
- 타이포 스케일
- hover 감각

위 항목은 반드시 디자인 스킬 문서와 DesignSystemGuide를 기준으로 다시 판단한다.

---

### 6. Preview도 디자인 산출물로 취급한다

preview는 단순 테스트 셸이 아니라 디자인 검수물이다.

원칙:

- preview의 인라인 CSS도 해당 페르소나의 감각을 따라야 한다
- 컨테이너 width/height는 컴포넌트 CSS가 소유하고, preview는 데모 배경/설명/로그만 추가한다
- preview에서 컴포넌트를 왜곡하는 임시 스타일을 넣지 않는다

금지:

- preview에서만 컴포넌트 간격/크기를 별도 보정
- preview 인라인 스타일로 실제 컴포넌트 문제를 가리기

---

## 작업 순서

Codex가 2D 컴포넌트 생성 또는 수정 시 따를 순서는 아래로 고정한다.

1. upstream spec 확인
2. 대상 `register.js`와 기존 `views/` 구조 확인
3. `produce-component` Step 5-1 재확인
4. `create-html-css` 스킬과 DesignSystemGuide 4종 CSS 재독
5. 페르소나별 시각 방향 확정
6. `views/*.html` 작성 또는 수정
7. `styles/*.css` 작성 또는 수정
8. preview 작성 또는 수정
9. manifest 연결 확인
10. 디자인 체크리스트 기반 검수

---

## 최종 체크리스트

작업 완료 전 아래를 모두 확인한다.

- [ ] 원본 spec 문서를 수정하지 않았는가?
- [ ] 디자인 기준을 기존 `Standard` 구현이 아니라 스킬 문서에서 가져왔는가?
- [ ] DesignSystemGuide 4개 CSS를 이번 작업 직전에 다시 읽었는가?
- [ ] 4개 variant가 각 페르소나 프로파일을 실제로 반영하는가?
- [ ] 기존 구현은 구조 참고로만 사용했고, 시각 토큰은 새로 판단했는가?
- [ ] preview가 컴포넌트 디자인을 왜곡하지 않는가?
- [ ] `git diff --check`를 통과하는가?

---

## 비고

이 문서는 Codex 전용 로컬 운영 가이드다.
upstream pull 대상 문서가 아니며, 원본 생성 규칙을 보완하는 목적만 가진다.
