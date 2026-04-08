---
name: create-html-css
description: Figma 없이 디자이너 성향 기반으로 HTML/CSS를 직접 작성합니다. DesignSystemGuide에서 추출한 색상 철학, 타이포그래피, 간격 리듬, 상태 표현, 레이아웃, 깊이감, Border Radius 등 7가지 경향을 내재화하여 브랜드 일관성을 유지합니다. Use when creating HTML/CSS from scratch without Figma designs.
---

# Figma 없이 HTML/CSS 작성 (디자이너 성향 기반)

Figma 디자인이 없을 때, DesignSystemGuide의 디자이너 경향을 기반으로 HTML/CSS를 직접 작성한다.
이 스킬의 출력은 `figma-to-html`과 동일한 형태이므로, `create-standard-component`가 동일하게 소비한다.

**핵심:** 가이드의 구체적 값(색상 코드, 간격 수치)을 기계적으로 따르는 것이 아니라, 그 값을 **선택한 디자이너의 경향**을 파악하여 "이 디자이너라면 이렇게 했을 것"이라는 판단을 한다.

> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
2. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — **CSS 원칙 섹션** (px 단위, Flexbox 우선)
3. [/Figma_Conversion/DesignSystemGuide/Design system01-Dark/Design system01-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Dark/Design%20system01-Dark.css) — 다크 테마 참고 표본
4. [/Figma_Conversion/DesignSystemGuide/Design system01-Light/Design system01-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Light/Design%20system01-Light.css) — 라이트 테마 참고 표본
5. [/Figma_Conversion/DesignSystemGuide/Design system02-Dark/Design system02-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Dark/Design%20system02-Dark.css) — 컴포넌트 패턴 참고 (패널, 그리드, 차트)
6. [/Figma_Conversion/DesignSystemGuide/Design system02-Light/Design system02-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Light/Design%20system02-Light.css) — 컴포넌트 패턴 참고 (라이트)

> **참고:** CSS 파일들은 값을 복사하기 위해서가 아니라, 디자이너의 감각을 매 작업마다 다시 느끼기 위해 읽는다. 해석의 틀은 이 SKILL.md가 제공하고, 실제 감각은 CSS 파일에서 온다.

---

## 출력 구조

`figma-to-html`과 동일한 경로에 출력한다. `create-standard-component`가 동일하게 소비할 수 있도록.

```
Figma_Conversion/Static_Components/
└── [프로젝트명]/
    └── [컴포넌트명]/
        ├── screenshots/
        │   └── impl.png
        ├── [컴포넌트명].html
        └── [컴포넌트명].css
```

---

## 디자인 성향 1 — 색상 철학

### 원칙: 색상은 의미(semantic)이고, 테마는 명도(luminance) 전환이다

이 디자이너는 색상을 장식이 아닌 **기능적 역할**로 사용한다. 모든 색상 팔레트는 5가지 기능적 역할로 구성된다:

| 역할 | 설명 | 기존 퍼플 팔레트 (참고) |
|------|------|------------------------|
| **Primary** | 채도 높은 주 강조. 버튼, 강조 바, 액센트 | `#502EE9` |
| **Primary-Hover** | Primary보다 **밝은** 변형. 초대하는 느낌 | `#92A8F4` |
| **Tertiary** | Primary의 어둡고 덜 채도 높은 변형. 패널 구분 | `#3D2F7E` |
| **Surface-Dark** | 다크 배경. 순수 검정이 아님 — **Primary 색조 포함** | `#191D50` |
| **Surface-Light** | 라이트 배경. 순수 흰색이 아님 — **Primary 색조 포함** | `#E8EDFF` |

### Light ↔ Dark 전환

색상(hue) 자체는 바꾸지 않는다. **명도만 반전**한다:
- Primary, Primary-Hover → 그대로 유지
- 배경 → Surface-Dark ↔ Surface-Light 교체
- 텍스트 → 다크 위 흰색, 라이트 위 어두운 색
- 테두리 → 다크에서만 추가 (라이트에서는 배경 대비로 충분)

### 그레이스케일에도 색조가 있다

이 디자이너의 그레이스케일은 **중립 회색이 아니라 Primary 색조를 품은 회색**이다:

```css
/* ✅ 퍼플 색조를 품은 그레이스케일 */
color: #373D56;  /* 짙은 — 파란 기운 */
color: #555770;  /* 중간 — 보라 기운 */
color: #707EB4;  /* 연한 — 라벤더 기운 */
color: #A6B3DE;  /* 최연한 — 라일락 기운 */

/* ❌ 중립 무채색 그레이스케일 */
color: #333333;
color: #666666;
color: #999999;
color: #cccccc;
```

### 이벤트/상태 색상은 테마 불변

```css
/* 이벤트 색상 — 모든 테마에서 동일 (데이터 의미를 전달하므로 변경 금지) */
--normal:   #32D28C;  /* 녹색 — 정상 */
--warning:  #2AE3FF;  /* 시안 — 경고 */
--major:    #FD7F04;  /* 오렌지 — 주요 */
--minor:    #FDD01F;  /* 노랑 — 경미 */
--critical: #F43031;  /* 빨강 — 치명 */
```

### 새 색상 팔레트를 만들 때

기존 퍼플이 아닌 **완전히 새로운 색상**이 필요할 때도 같은 구조적 논리를 적용한다:

```css
/* 예시: 틸(Teal) 기반 새 팔레트 도출 과정 */

/* 1. Primary — 채도 높은 주 강조 선택 */
--primary: #0EA5A5;

/* 2. Primary-Hover — Primary보다 밝게 (명도 올림, 채도 유지) */
--primary-hover: #5DD5D5;

/* 3. Tertiary — 채도 낮추고 어둡게 */
--tertiary: #1A5C5C;

/* 4. Surface-Dark — 틸 색조를 품은 어두운 배경 (순수 검정 아님) */
--surface-dark: #0D1F2D;

/* 5. Surface-Light — 틸 색조를 품은 밝은 배경 (순수 흰색 아님) */
--surface-light: #E8F5F5;

/* 6. 그레이스케일 — 틸 색조를 품은 회색 */
--gray-dark: #2D3D45;
--gray-mid: #506570;
--gray-light: #7CA0A0;

/* 7. 이벤트 색상 — 그대로 유지 (테마 불변) */
--normal: #32D28C;  --warning: #2AE3FF;  --major: #FD7F04;
--minor: #FDD01F;   --critical: #F43031;
```

### DO / DON'T

```css
/* ✅ 배경에 색조가 있다 */
background: #191D50;  /* 다크 — 남색 기운 */
background: #E8EDFF;  /* 라이트 — 라벤더 기운 */

/* ❌ 순수 무채색 배경 */
background: #000000;
background: #1a1a1a;
background: #ffffff;
background: #f5f5f5;

/* ✅ 호버 시 밝아진다 (초대하는 느낌) */
.btn--primary:hover { background: #92A8F4; }

/* ❌ 호버 시 어두워진다 (공격적) */
.btn--primary:hover { background: #3a1fb0; }

/* ✅ 비활성 = 완전한 탈채도 (색상 정보 없음) */
.btn--primary:disabled { background: #C8C5D6; color: #8E8EA0; }

/* ❌ 비활성을 opacity로 표현 */
.btn--primary:disabled { opacity: 0.5; }
```

---

## 디자인 성향 2 — 타이포그래피 전략

### 원칙: 계층은 크기로, 굵기는 절제한다

이 디자이너는 시각적 계층을 **font-size**로 만들고, **font-weight**는 최소한으로 사용한다. Pretendard에서 700(Bold) 이상을 쓰지 않는다.

### 서체 역할 분담

| 서체 | 역할 | 허용 weight |
|------|------|-------------|
| **Pretendard** | 한글 본문, 제목, UI 텍스트 | 400(Regular), 500(Medium), 600(SemiBold) — **700 이상 금지** |
| **Tomorrow** | 디스플레이, 영문 강조 | 300(Light), 400, 500, 700(Bold) — 차트 합계 등 제한적 사용 |
| **Roboto** | 숫자 데이터, 범례 | 400, 500, 700 — 데이터 맥락에서만 |

### 크기 단계 (참고표)

```
표시 대형    38px  Regular   (Display — 페이지 제목)
표시 중형    30px  Regular   (Sub-display — 부제목)
제목 1단계   28px  SemiBold  (Heading 1 — 섹션 제목)
제목 2단계   20px  SemiBold  (Heading 2 — 카테고리)
본문/버튼    18px  SemiBold  (Body/Button — 인터랙티브)
캡션         16px  SemiBold  (Caption — 보조 정보)
최소 텍스트  13px  SemiBold  (Minimum — 레이블)
```

이 단계는 **참고용**이다. 새 컴포넌트에서 정확히 이 값을 쓸 필요는 없으나, **크기 간격의 리듬**(큰 단계에서 작은 단계로 자연스럽게 줄어드는 흐름)을 유지한다.

### DO / DON'T

```css
/* ✅ 크기로 계층 구분 — weight는 절제 */
.title   { font-size: 28px; font-weight: 600; font-family: 'Pretendard', sans-serif; }
.body    { font-size: 16px; font-weight: 400; font-family: 'Pretendard', sans-serif; }
.data    { font-size: 18px; font-weight: 500; font-family: 'Tomorrow', sans-serif; }

/* ❌ weight로 계층 구분 — 크기 차이 부족 */
.title   { font-size: 18px; font-weight: 800; }
.body    { font-size: 16px; font-weight: 400; }

/* ✅ line-height: 1.3 기본 */
.text { line-height: 1.3; }

/* ❌ 과도한 line-height */
.text { line-height: 2.0; }
```

---

## 디자인 성향 3 — 간격 리듬

### 원칙: 간격은 요소 관계의 시각적 표현이다

이 디자이너는 간격을 기계적 그리드가 아닌 **의미론적 거리**로 사용한다.

| 관계 | 간격 범위 | 의미 | 예시 |
|------|----------|------|------|
| **밀접** (tight) | 8–14px | 직접 연관된 요소 | 아이콘↔레이블, 스워치↔텍스트, 버튼 내 아이콘↔텍스트(10px) |
| **중간** (medium) | 20–40px | 같은 그룹 내 하위 항목 | 버튼 행 간(20px), 폼 필드 간(24px), 카테고리 제목↔내용(27px) |
| **느슨** (loose) | 50–160px | 독립 섹션 간 구분 | 섹션 간 여백(50-100px), 대분류 간(133-160px) |

### gap 우선

```css
/* ✅ 형제 간격은 부모의 gap으로 */
.btn-group {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ❌ 형제 간격을 개별 margin으로 */
.btn-group .btn {
    margin-bottom: 20px;
}
.btn-group .btn:last-child {
    margin-bottom: 0;
}
```

### 4px/8px 기반이되 문맥 우선

간격의 대부분은 4px 또는 8px의 배수(8, 12, 16, 20, 24, 40, 48, 64)다. 그러나 이 디자이너는 문맥이 요구하면 **정확한 값을 쓴다** (9.333px, 14px, 53px 등). 시각적 관계가 맞다면 8px 배수에 강제로 맞추지 않는다.

---

## 디자인 성향 4 — 컴포넌트 상태 표현

### 원칙: 호버는 초대, 비활성은 정보 제거

| 상태 | 표현 방식 | 핵심 |
|------|----------|------|
| **Default** | 브랜드 색상 그대로 | 명확한 의도 전달 |
| **Hover** | **밝아짐** (명도 상승) | 초대하는 느낌 — 어둡게 하지 않음 |
| **Inactive** | 탈채도 회색 | 색상 정보 완전 제거 — opacity 아님 |
| **Outline Default** | 투명 배경 + 테두리 | 채움 색과 테두리 색 일치 |
| **Outline Hover** | 반투명 채움 추가 | `rgba(primary, 0.2)` — 관심을 표현 |

```css
/* ✅ Filled 버튼 3상태 */
.btn--primary         { background: #502EE9; color: #fff; }
.btn--primary:hover   { background: #92A8F4; color: #fff; }  /* 밝아짐 */
.btn--primary:disabled { background: #C8C5D6; color: #8E8EA0; }  /* 탈채도 */

/* ✅ Outline 버튼 3상태 */
.btn--outline         { background: transparent; border: 1px solid #502EE9; color: #502EE9; }
.btn--outline:hover   { background: rgba(131, 103, 236, 0.2); }  /* 반투명 채움 */
.btn--outline:disabled { border-color: #C8C5D6; color: #8E8EA0; }

/* ❌ 호버를 어둡게 */
.btn--primary:hover   { background: #3a20b0; }

/* ❌ 비활성을 opacity로 */
.btn--primary:disabled { opacity: 0.5; }
```

---

## 디자인 성향 5 — 레이아웃 접근법

### 원칙: 수직 흐름이 기본, 수평은 동등 비교일 때만

이 디자이너는 콘텐츠를 **위에서 아래로** 쌓는 것을 기본으로 한다. 수평 배치는 **동등한 항목을 나란히 비교**할 때만 사용한다.

```css
/* ✅ 기본: 수직 흐름 */
.panel {
    display: flex;
    flex-direction: column;
    gap: 26px;
}

/* ✅ 동등 항목 비교만 수평 */
.panel-cards {
    display: flex;
    gap: 53px;  /* 3개 패널 카드 나란히 */
}

/* ✅ 컨테이너 안에서 라벨-값 쌍은 수직 */
.info-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
```

### Flexbox Only

이 디자이너는 CSS Grid를 사용하지 않는다. 모든 레이아웃은 Flexbox로 구성한다.

```css
/* ✅ Flexbox로 카드 배치 */
.card-container {
    display: flex;
    gap: 20px;
}

/* ❌ Grid 사용 */
.card-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
}
```

### flex-shrink: 0

크기가 고정된 요소는 `flex-shrink: 0`으로 축소를 방지한다. 이 디자이너는 요소가 설계된 크기를 유지하는 것을 중요하게 여긴다.

```css
.fixed-panel {
    width: 370px;
    height: 204px;
    flex-shrink: 0;
}
```

---

## 디자인 성향 6 — 시각적 깊이

### 원칙: 깊이는 색상과 그라디언트로, 그림자는 쓰지 않는다

이 디자이너는 `box-shadow`를 사용하지 않는다. 깊이감은 **배경 색상 차이**와 **저 불투명도 그라디언트 오버레이**로 만든다.

### 그라디언트 방향 규칙

| 맥락 | 방향 | 예시 |
|------|------|------|
| 페이지 배경 | 수직 (`to bottom`) 또는 대각 | `linear-gradient(to left, #7159d0, #38278e)` |
| 데이터 영역 (그리드 셀, 테이블 행) | 수평 (`90deg`) | `linear-gradient(90deg, rgba(36,0,196,0.04), rgba(5,171,207,0.02))` |
| 헤더/오버레이 | 수평 + 저 불투명도 | `linear-gradient(90deg, rgba(232,237,255,0.24), rgba(232,237,255,0.09))` |

### 그라디언트 레이어링

단일 그라디언트가 아닌, **배경색 + 그라디언트 오버레이**를 겹쳐 깊이를 만든다:

```css
/* ✅ 레이어드 그라디언트 — 배경 + 반투명 오버레이 */
.data-cell {
    background: linear-gradient(90deg, rgba(36, 0, 196, 0.04) 0%, rgba(5, 171, 207, 0.02) 100%),
                #2A2063;
}

/* ✅ 페이지 배경 — 단일 그라디언트 (방향감 있는) */
.page-bg {
    background: linear-gradient(to left, #7159d0, #38278e);
}

/* ❌ box-shadow로 깊이감 */
.panel { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }

/* ❌ 높은 불투명도 장식 그라디언트 */
.header { background: linear-gradient(to right, #ff0000, #00ff00); }
```

### 불투명도 원칙

그라디언트의 불투명도는 **0.02 ~ 0.3** 범위다. 존재하되 주장하지 않는 수준.

---

## 디자인 성향 7 — Border Radius 체계

### 원칙: 둥글기는 요소의 역할에 따라 결정된다

| 요소 유형 | border-radius | 근거 |
|----------|---------------|------|
| **액션 요소** (버튼, 인풋) | `8px` | 친근하되 읽기 쉬운 정도 |
| **컨테이너 패널** | `20px` | 포용하는 느낌, 내부 요소와 시각적 분리 |
| **필(pill) 형태** (폼 필드, 그리드 레이블) | `30–50px` | 부드럽고 독립적인 단위 |
| **배경 판** | `0px` 또는 `100px` (비대칭) | 구조적 요소, 장식 아님 |

```css
/* ✅ 역할에 맞는 radius */
.btn         { border-radius: 8px; }
.panel       { border-radius: 20px; }
.form-field  { border-radius: 30px; }
.grid-label  { border-radius: 50px; }

/* ❌ 인터랙티브 요소에 0px (날카로운 모서리) */
.btn { border-radius: 0; }

/* ❌ 모든 요소에 같은 radius */
.btn   { border-radius: 12px; }
.panel { border-radius: 12px; }
.input { border-radius: 12px; }
```

---

## 워크플로우

### Step 1. 요구사항 분석

다음을 확인한다:
- **컴포넌트 종류**: 패널, 카드, 테이블, 폼, 차트 래퍼 등
- **테마**: 다크 / 라이트
- **색상 스킴**: 기존 퍼플 브랜드 사용 / 새 팔레트 도출

### Step 2. DesignSystemGuide 참조 읽기

작업 전 필수 확인 목록의 CSS 파일을 읽는다. 만들려는 컴포넌트와 가장 유사한 섹션을 중점적으로 참고:
- 패널 → Design system02의 section-panel
- 테이블/그리드 → Design system02의 section-grid
- 버튼/폼 → Design system01의 section-buttons, section-form
- 차트 → Design system02의 section-chart

### Step 3. 색상 팔레트 결정

**Case A: 기존 브랜드 사용**
DesignSystemGuide의 퍼플 팔레트를 참고하되, 디자인 성향 1의 원칙에 따라 적용한다.

**Case B: 새 팔레트 도출**
디자인 성향 1의 "새 색상 팔레트를 만들 때" 절차를 따른다:
1. Primary 선택
2. Primary-Hover 도출 (밝게)
3. Tertiary 도출 (어둡고 저채도)
4. Surface-Dark / Surface-Light 도출 (Primary 색조 포함)
5. 그레이스케일 도출 (Primary 색조를 품은 회색)
6. 이벤트 색상은 그대로

**사용자에게 팔레트를 제시하고 승인을 받은 후 다음 단계로 진행한다.**

### Step 4. HTML 구조 작성

- **BEM 네이밍**: `block__element--modifier`
- **기본 흐름**: `flex-direction: column` (수직 스택)
- **의미론적 구조**: 섹션 → 카테고리 → 항목의 계층

```html
<!-- BEM 네이밍 예시 -->
<div class="device-panel">
    <div class="device-panel__header">
        <span class="device-panel__title">장비 상태</span>
    </div>
    <div class="device-panel__content">
        <div class="device-panel__item">
            <span class="device-panel__label">-</span>
            <span class="device-panel__value" data-status="unknown">-</span>
        </div>
    </div>
</div>
```

### Step 5. CSS 작성

7가지 디자인 성향을 모두 적용하여 CSS를 작성한다:

```css
/* CSS 구조 순서 */

/* 1. 폰트 import (CDN) */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/...');

/* 2. 컴포넌트 컨테이너 */
.device-panel { ... }

/* 3. 내부 요소 — 계층 순서대로 */
.device-panel__header { ... }
.device-panel__content { ... }
.device-panel__item { ... }

/* 4. 상태 변형 */
.device-panel__item[data-status="normal"] { ... }
.device-panel__item[data-status="critical"] { ... }
```

**적용 체크리스트:**
- [ ] 배경에 Primary 색조가 있는가? (순수 무채색 아닌가?)
- [ ] 호버 시 밝아지는가?
- [ ] 비활성 시 탈채도 회색인가? (opacity 아닌가?)
- [ ] font-weight가 600 이하인가? (Pretendard 기준)
- [ ] 간격이 의미론적 3단계를 따르는가?
- [ ] gap을 사용하고 margin을 지양했는가?
- [ ] border-radius가 요소 역할에 맞는가?
- [ ] 깊이감이 그라디언트로 표현되었는가? (box-shadow 아닌가?)
- [ ] px 단위만 사용했는가?
- [ ] Flexbox만 사용했는가?

### Step 6. preview.html 작성

SHARED_INSTRUCTIONS.md의 preview.html 작성 규칙을 따른다.
- CSS는 `<style>` 태그로 인라인
- HTML 구조는 Step 4와 동일
- 외부 스타일시트 로컬 참조 금지 (CDN 폰트는 허용)

### Step 7. 스크린샷 검증

Figma 원본이 없으므로, **디자인 경향 체크리스트**로 자체 검증한다:

```
경향 체크리스트:
  □ 배경에 색조가 있는가? (순수 무채색이 아닌가?)
  □ 텍스트 계층이 크기로 구분되는가? (weight 과용 아닌가?)
  □ 간격이 관계를 반영하는가? (밀접/중간/느슨)
  □ 전체적으로 "절제된 기술적 미학"인가? (장식 과잉 아닌가?)
  □ 그라디언트가 분위기용인가? (장식 아닌가?)
  □ 모서리가 역할에 맞게 둥근가?
```

```
1. Playwright로 preview.html 스크린샷 캡처
2. 경향 체크리스트 대조
3. 위반 항목이 있으면 수정
4. 체크리스트 통과 후에만 완료
```

---

## 금지 사항

> 공통 금지 사항: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#금지-사항-전체-공통) 참조

- ❌ **`box-shadow` 사용 금지** — 깊이는 색상/그라디언트로 표현
- ❌ **순수 무채색 배경 금지** (`#000`, `#fff`, `#1a1a1a`, `#f5f5f5`) — 반드시 Primary 색조 포함
- ❌ **`font-weight: 700` 이상 금지** (Pretendard 기준) — Tomorrow/Roboto의 데이터 맥락은 예외
- ❌ **CSS Grid 사용 금지** — Flexbox만 사용
- ❌ **호버 시 어둡게 하기 금지** — 반드시 밝아져야 함
- ❌ **`opacity`로 비활성 표현 금지** — 탈채도 색상을 직접 지정
- ❌ **장식 목적의 그라디언트 금지** — 그라디언트는 분위기/깊이용, 불투명도 0.3 이하
- ❌ **`rem`/`em` 단위 금지** — px만 사용 (CODING_STYLE.md CSS 원칙)
- ❌ **중립 무채색 그레이스케일 금지** (`#333`, `#666`, `#999`) — Primary 색조를 품은 회색 사용
- ❌ **DesignSystemGuide 값을 기계적으로 복사 금지** — 값이 아니라 경향을 적용

---

## 다음 단계

HTML/CSS 작성이 완료되면 **create-standard-component** Skill을 사용하여
정적 HTML/CSS를 RNBT 동적 컴포넌트로 변환할 수 있다.

---

## 관련 자료

| 문서 | 위치 |
|------|------|
| 공통 규칙 | [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) |
| 코딩 스타일 | [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) |
| DesignSystemGuide (Dark 01) | [/Figma_Conversion/DesignSystemGuide/Design system01-Dark/Design system01-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Dark/Design%20system01-Dark.css) |
| DesignSystemGuide (Light 01) | [/Figma_Conversion/DesignSystemGuide/Design system01-Light/Design system01-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Light/Design%20system01-Light.css) |
| DesignSystemGuide (Dark 02) | [/Figma_Conversion/DesignSystemGuide/Design system02-Dark/Design system02-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Dark/Design%20system02-Dark.css) |
| DesignSystemGuide (Light 02) | [/Figma_Conversion/DesignSystemGuide/Design system02-Light/Design system02-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Light/Design%20system02-Light.css) |
| 표준 컴포넌트 생성 (다음 단계) | [/.claude/skills/2-component/create-standard-component/SKILL.md](/.claude/skills/2-component/create-standard-component/SKILL.md) |
| 디자인 변형 추가 | [/.claude/skills/2-component/add-design-variant/SKILL.md](/.claude/skills/2-component/add-design-variant/SKILL.md) |
| Figma to HTML (대안 경로) | [/.claude/skills/1-figma/figma-to-html/SKILL.md](/.claude/skills/1-figma/figma-to-html/SKILL.md) |
