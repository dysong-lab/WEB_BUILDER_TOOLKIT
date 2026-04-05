---
name: add-design-variant
description: 기존 컴포넌트에 새로운 디자인 변형(views/styles/preview)을 추가합니다. register.js는 불변 — 선택자 계약만 유지하면 HTML/CSS는 자유롭게 변경 가능합니다. Use when applying a different design to an existing component.
---

# 디자인 변형 추가

기존 컴포넌트의 register.js(조립 코드)를 그대로 두고, 새로운 HTML/CSS 디자인만 추가한다.
핵심 원칙: **선택자 계약을 유지하면 디자인은 자유롭다.**

> 설계 문서: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. **대상 컴포넌트의 `scripts/register.js`** — 선택자 계약 추출 (최우선)
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
3. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
4. **대상 컴포넌트의 기존 views/ 파일** — 현재 변형 현황 파악
5. **새 디자인 소스** — Figma_Conversion 정적 HTML/CSS (있는 경우)

---

## 핵심 원칙

### 선택자 계약 = 불변 인터페이스

register.js의 `cssSelectors`와 `datasetAttrs`는 HTML이 반드시 충족해야 하는 **계약**이다.

```
register.js가 선언한 계약:
  cssSelectors: { name: '.system-info__name', status: '.system-info__status', ... }
  datasetAttrs: { status: 'status' }

→ 새 HTML에 반드시 있어야 하는 것:
  • .system-info__name 클래스를 가진 요소
  • .system-info__status 클래스를 가진 요소
  • data-status 속성을 가진 요소 (datasetAttrs에 대응)
```

### 불변 파일

```
scripts/register.js      ← 절대 수정 안 함
scripts/beforeDestroy.js  ← 절대 수정 안 함
```

이 스킬에서 scripts/ 디렉토리의 파일은 읽기만 한다. 수정하지 않는다.

### 자유로운 것

```
HTML 구조 (div 배치, 중첩 깊이, wrapper 요소)  ← 자유
CSS 스타일 (색상, 레이아웃, 애니메이션)          ← 자유
추가 요소 (아이콘, 장식, 구분선)                ← 자유
```

---

## 워크플로우

### Step 1. 선택자 계약 추출

대상 컴포넌트의 `scripts/register.js`를 읽고 계약을 추출한다.

```javascript
// register.js에서 추출할 것:

// (A) cssSelectors — KEY: 계약명, VALUE: CSS 선택자
applyFieldRenderMixin(this, {
    cssSelectors: {
        name:        '.system-info__name',      // ← 이 선택자가 HTML에 있어야 함
        status:      '.system-info__status',
        version:     '.system-info__version',
        uptime:      '.system-info__uptime'
    },
    datasetAttrs: {
        status:      'status'                   // ← data-status 속성이 HTML에 있어야 함
    }
});

// (B) ListRenderMixin이면 template 태그도 계약에 포함
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-log__list',          // ← 리스트 컨테이너
        item:      '.event-log__item',          // ← 반복 항목
        template:  '#event-log-item-template',  // ← template 태그 (id)
        level:     '.event-log__level',
        time:      '.event-log__time',
        message:   '.event-log__message'
    }
});
```

**추출 결과를 명시적으로 정리한다:**

```
선택자 계약:
  ✅ .system-info__name     (cssSelectors.name)
  ✅ .system-info__status   (cssSelectors.status + datasetAttrs.status → data-status)
  ✅ .system-info__version  (cssSelectors.version)
  ✅ .system-info__uptime   (cssSelectors.uptime)
```

### Step 2. 기존 변형 현황 파악

views/ 디렉토리에서 현재 변형 목록과 다음 번호를 확인한다.

```
기존:
  views/01_bar.html
  views/02_card.html

→ 다음 번호: 03
→ 새 파일명: views/03_[name].html, styles/03_[name].css, preview/03_[name].html
```

### Step 3. 새 디자인 소스 확인

**Case A: Figma 정적 HTML/CSS가 있는 경우**

Figma_Conversion에서 검증된 HTML/CSS를 가져온다.

- HTML 구조를 가져오되, 선택자 계약에 맞게 클래스/속성을 **추가** 또는 **매핑**한다
- CSS는 정적 CSS 복사 규칙을 적용한다 (SHARED_INSTRUCTIONS.md 참조)

**Case B: Figma 없이 직접 작성하는 경우**

- 사용자의 요구사항(레이아웃, 스타일)에 따라 새 HTML/CSS를 작성한다
- 선택자 계약만 유지하면 구조는 자유롭다

### Step 4. HTML 작성

새 views/NN_[name].html을 작성한다.

**필수 확인 — 선택자 매핑:**

원본 디자인의 요소와 선택자 계약을 매핑한다. 모든 계약 선택자가 HTML에 존재해야 한다.

```html
<!-- 예: 03_minimal.html — 극단적으로 다른 구조여도 선택자 계약만 유지 -->
<div class="system-info">
    <span class="system-info__name">-</span>
    <span class="system-info__status" data-status="unknown">-</span>
    <span class="system-info__version">-</span>
    <span class="system-info__uptime">-</span>
</div>
```

**ListRenderMixin 사용 컴포넌트일 경우:**

template 태그도 반드시 포함한다. template의 id와 내부 선택자가 계약과 일치해야 한다.

```html
<div class="event-log__list"></div>

<template id="event-log-item-template">
    <div class="event-log__item">
        <span class="event-log__level" data-level=""></span>
        <span class="event-log__time"></span>
        <span class="event-log__message"></span>
    </div>
</template>
```

### Step 5. CSS 작성

새 styles/NN_[name].css를 작성한다.

- **Figma 소스가 있으면**: 정적 CSS 복사 규칙 적용 (reset/body 제외, 나머지 복사)
- **직접 작성이면**: CODING_STYLE.md의 CSS 원칙 준수 (px 단위, Flexbox 우선)

### Step 6. preview.html 작성

SHARED_INSTRUCTIONS.md의 preview.html 작성 규칙을 따른다.

- CSS는 `<style>` 태그로 인라인
- HTML 구조는 views/ 의 HTML과 동일
- Mixin 정의 인라인 포함
- 최소 런타임 시뮬레이션

### Step 7. 선택자 검증 (필수)

**코드 작성 후 반드시 검증한다.** 이 단계를 생략하지 않는다.

register.js의 모든 계약 선택자가 새 HTML에 존재하는지 확인한다.

```
검증 체크리스트:
  □ cssSelectors의 모든 VALUE가 HTML에 존재하는가?
  □ datasetAttrs의 모든 VALUE가 HTML에 data-* 속성으로 존재하는가?
  □ ListRenderMixin이면 template 태그가 존재하고 id가 일치하는가?
  □ template 내부의 선택자도 모두 존재하는가?
```

**검증 방법: grep으로 직접 확인**

```bash
# 각 선택자가 HTML에 존재하는지 확인
grep "system-info__name" views/03_minimal.html
grep "system-info__status" views/03_minimal.html
grep "data-status" views/03_minimal.html
```

**누락이 발견되면 즉시 수정한다.** 검증을 통과하기 전에 완료라고 말하지 않는다.

### Step 8. 스크린샷 검증

```
1. Playwright로 preview.html 스크린샷 캡처
2. 디자인 소스(Figma 스크린샷 또는 사용자 기대)와 비교
3. 시각적 차이가 있으면 수정
4. 차이점 없음 확인 후에만 완료
```

---

## 예제: SystemInfo에 03_minimal 변형 추가

### register.js에서 추출한 계약

```
cssSelectors:
  name:        '.system-info__name'
  status:      '.system-info__status'
  statusLabel: '.system-info__status'
  version:     '.system-info__version'
  uptime:      '.system-info__uptime'

datasetAttrs:
  status:      'status'  → data-status
```

### 기존 변형

```
views/01_bar.html    — 가로 바 (다크 배경, 인라인 배치)
views/02_card.html   — 세로 카드 (라이트 배경, 아이콘 포함)
```

### 새 변형: 03_minimal

```html
<!-- views/03_minimal.html -->
<!-- 03_minimal: 텍스트만 (장식 없음, 한 줄) -->
<div class="system-info">
    <span class="system-info__name">-</span>
    <span class="system-info__status" data-status="unknown">-</span>
    <span class="system-info__version">-</span>
    <span class="system-info__uptime">-</span>
</div>
```

### 검증

```
✅ .system-info__name     → <span class="system-info__name">
✅ .system-info__status   → <span class="system-info__status" data-status="unknown">
✅ .system-info__version  → <span class="system-info__version">
✅ .system-info__uptime   → <span class="system-info__uptime">
✅ data-status            → data-status="unknown"
```

---

## 금지 사항

> 공통 금지 사항: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#금지-사항-전체-공통) 참조

- **scripts/ 수정 금지** — register.js, beforeDestroy.js는 이 스킬에서 절대 수정하지 않는다
- **선택자 계약 누락 금지** — 계약된 선택자가 하나라도 빠지면 Mixin이 동작하지 않는다
- **검증 생략 금지** — Step 7 선택자 검증을 반드시 수행한다
- **선택자 변경 금지** — 기존 선택자의 클래스명/id를 바꾸지 않는다 (register.js와 불일치)
- **검증된 CSS를 "비슷하게" 새로 작성 금지** — Figma 소스가 있으면 복사한다

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) |
| 표준 컴포넌트 생성 | [/.claude/skills/2-component/create-standard-component/SKILL.md](/.claude/skills/2-component/create-standard-component/SKILL.md) |
| 예제 (SystemInfo 3변형) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/SystemInfo/) |
| 예제 (EventLog 3변형) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/EventLog/) |
| 예제 (StatusCards 3변형) | [/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/page/components/StatusCards/) |
| 정적 CSS 복사 규칙 | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#정적-css-복사-규칙-figma--rnbt-변환-시) |
| preview.html 작성 규칙 | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#previewhtml-작성-규칙) |
