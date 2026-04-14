---
name: create-html-css
description: Figma 없이 디자인 페르소나 기반으로 HTML/CSS를 직접 작성합니다. 4개 디자인 페르소나(Refined Technical, Material Elevated, Minimal Editorial, Dark Operational) 중 하나를 선택하고, 8가지 경향(색상, 타이포, 간격, 상태, 레이아웃, 깊이, 모서리, 모션)을 페르소나별 프로파일에 따라 적용합니다. Use when creating HTML/CSS from scratch without Figma designs.
---

# Figma 없이 HTML/CSS 작성 (디자인 페르소나 기반)

Figma 디자인이 없을 때, **디자인 페르소나**를 선택하고 해당 페르소나의 경향에 따라 HTML/CSS를 직접 작성한다.
이 스킬의 출력은 `figma-to-html`과 동일한 형태이므로, `create-2d-component`가 동일하게 소비한다.

**핵심:** 하나의 고정된 미학을 따르는 것이 아니라, **선택된 페르소나의 성격**에 따라 "이 페르소나라면 이렇게 했을 것"이라는 판단을 한다. 같은 컴포넌트도 페르소나가 다르면 완전히 다른 디자인이 나온다.

> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**

1. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
2. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — **CSS 원칙 섹션** (px 단위, Flexbox 우선)
3. [/Figma_Conversion/DesignSystemGuide/Design system01-Dark/Design system01-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Dark/Design%20system01-Dark.css) — 다크 테마 참고 표본
4. [/Figma_Conversion/DesignSystemGuide/Design system01-Light/Design system01-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system01-Light/Design%20system01-Light.css) — 라이트 테마 참고 표본
5. [/Figma_Conversion/DesignSystemGuide/Design system02-Dark/Design system02-Dark.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Dark/Design%20system02-Dark.css) — 컴포넌트 패턴 참고 (패널, 그리드, 차트)
6. [/Figma_Conversion/DesignSystemGuide/Design system02-Light/Design system02-Light.css](/Figma_Conversion/DesignSystemGuide/Design%20system02-Light/Design%20system02-Light.css) — 컴포넌트 패턴 참고 (라이트)

> **참고:** CSS 파일들은 값을 복사하기 위해서가 아니라, 디자인 경향의 감각을 매 작업마다 다시 느끼기 위해 읽는다. 해석의 틀은 이 SKILL.md가 제공하고, 실제 감각은 CSS 파일에서 온다.

---

## 디자인 페르소나

페르소나는 **시각적 성격의 묶음**이다. 각 페르소나는 8가지 경향에 대해 고유한 프로파일을 가진다.
워크플로우 Step 1에서 사용자와 합의하여 페르소나를 선택한다.

### Persona A: "Refined Technical" (DesignSystemGuide 원본)

산업용 모니터링 대시보드. 절제된 기술적 미학.

| 경향 | 프로파일 |
|------|---------|
| 깊이 | 그라디언트 + 색상 (box-shadow 금지) |
| 레이아웃 | Flexbox only (CSS Grid 금지) |
| 호버 | 밝아짐 (어둡게 금지) |
| 굵기 | Pretendard 600 이하 (700+ 금지) |
| 모서리 | 역할별 (8/20/30-50px) |
| 서체 | Pretendard + Tomorrow + Roboto |
| 그레이스케일 | Primary 색조를 품은 회색 |
| 모션 | 최소 (hover transition만, 애니메이션 없음) |
| 밀도 | Comfortable (기본) |

### Persona B: "Material Elevated"

Material Design 영감의 카드 기반 UI. 깨끗하고 구조적.

| 경향 | 프로파일 |
|------|---------|
| 깊이 | box-shadow 기반 elevation (0/1/2/3/4 단계) |
| 레이아웃 | Flexbox + CSS Grid 모두 허용 |
| 호버 | 밝아짐 또는 elevation 상승 |
| 굵기 | 400-700 범위 자유 |
| 모서리 | 균일하게 작음 (4-8px), 컨테이너도 8-12px |
| 서체 | Pretendard + Roboto (Tomorrow 비사용) |
| 그레이스케일 | 중립 회색 허용 (색조 선택적) |
| 모션 | 표준 (hover 200ms, 패널 300ms ease-in-out) |
| 밀도 | Comfortable 또는 Compact |

### Persona C: "Minimal Editorial"

넓은 여백과 세리프 타이포. 콘텐츠 중심의 편집 미학.

| 경향 | 프로파일 |
|------|---------|
| 깊이 | 배경 색상 차이만 (그라디언트/shadow 모두 최소) |
| 레이아웃 | Flexbox 기본, CSS Grid 허용 |
| 호버 | 밝아짐 또는 밑줄/테두리 변화 |
| 굵기 | 세리프 700 허용, 산세리프 400-500 절제 |
| 모서리 | 0-4px (샤프하거나 미세하게) |
| 서체 | 세리프 (제목) + 산세리프 (본문) — 자유 선택 |
| 그레이스케일 | 중립 또는 따뜻한 회색 |
| 모션 | 없음 (정적, hover시 color 변화만) |
| 밀도 | Expanded (넓은 여백) |

### Persona D: "Dark Operational"

관제실/오퍼레이터 대시보드. 밀집되고 기능적.

| 경향 | 프로파일 |
|------|---------|
| 깊이 | 배경 색상 단계 + 미세 테두리 (그라디언트/shadow 선택적) |
| 레이아웃 | Flexbox + CSS Grid 모두 허용 |
| 호버 | 밝아짐 또는 테두리 강조 |
| 굵기 | 모노스페이스 자유, 산세리프 400-600 |
| 모서리 | 2-4px (작고 각진 느낌) |
| 서체 | 모노스페이스 (데이터) + 산세리프 (UI) — 자유 선택 |
| 그레이스케일 | 쿨 톤 (파랑/시안 기운) |
| 모션 | 상태 표시용 (펄스, 깜빡임, 점진적 색상 변화) |
| 밀도 | Compact (작고 밀집) |

### 페르소나 선택 기준

| 맥락 | 추천 페르소나 |
|------|-------------|
| 기존 DesignSystemGuide 브랜드 유지 | A: Refined Technical |
| 카드/패널 중심 대시보드, 깨끗한 구조 | B: Material Elevated |
| 콘텐츠 중심, 보고서, 프레젠테이션 | C: Minimal Editorial |
| 관제실, 실시간 모니터링, 오퍼레이터 | D: Dark Operational |

> **페르소나는 출발점이지 감옥이 아니다.** 사용자의 요구에 따라 프로파일의 개별 항목을 조정할 수 있다. 단, 조정 사항은 Step 1에서 명시적으로 합의한다.

---

## 출력 구조

`figma-to-html`과 동일한 경로에 출력한다. `create-2d-component`가 동일하게 소비할 수 있도록.

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

## 디자인 경향 1 — 색상 철학

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

### 그레이스케일 — 페르소나별

| 페르소나 | 그레이스케일 특성 |
|----------|----------------|
| **A: Refined Technical** | Primary 색조를 품은 회색 (중립 무채색 금지) |
| **B: Material Elevated** | 중립 회색 허용, 색조 선택적 |
| **C: Minimal Editorial** | 중립 또는 따뜻한 회색 (베이지/웜 그레이) |
| **D: Dark Operational** | 쿨 톤 (파랑/시안 기운의 회색) |

```css
/* ✅ Persona A — Primary 색조를 품은 그레이스케일 */
color: #373D56;  /* 짙은 — 파란 기운 */
color: #555770;  /* 중간 — 보라 기운 */
color: #707EB4;  /* 연한 — 라벤더 기운 */

/* ✅ Persona B — 중립 회색도 허용 */
color: #424242;
color: #757575;
color: #bdbdbd;

/* ✅ Persona C — 따뜻한 회색 */
color: #3d3833;
color: #6b6560;
color: #a09890;

/* ✅ Persona D — 쿨 톤 회색 */
color: #1a2030;
color: #3d4f65;
color: #7a8fa5;
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

## 디자인 경향 2 — 타이포그래피 전략

### 원칙: 계층은 크기로 만들되, 서체 선택은 페르소나에 따라

공통 원칙: 시각적 계층을 **font-size**로 만든다. **font-weight**만으로 계층을 구분하지 않는다.

### 페르소나별 서체 프로파일

| 페르소나 | 제목 서체 | 본문/UI 서체 | 데이터 서체 | weight 범위 |
|----------|----------|-------------|-----------|------------|
| **A: Refined Technical** | Pretendard (600 이하) | Pretendard | Tomorrow, Roboto | 400-600 (Pretendard 700 금지) |
| **B: Material Elevated** | Pretendard 또는 Roboto | Pretendard | Roboto | 400-700 자유 |
| **C: Minimal Editorial** | 세리프 자유 선택 (700 허용) | 산세리프 (400-500 절제) | 산세리프 | 제목 700, 본문 400-500 |
| **D: Dark Operational** | 산세리프 (600 이하) | 산세리프 | 모노스페이스 자유 | 400-600 |

> **서체 선택이 자유인 페르소나 (B/C/D)**: 기본 서체 세트(Pretendard/Tomorrow/Roboto) 외에 다른 서체를 사용할 수 있다. 단, Google Fonts CDN에서 제공하는 서체만 사용한다.

### 크기 단계 (참고표 — Persona A 기준)

```
표시 대형    38px  Regular   (Display — 페이지 제목)
표시 중형    30px  Regular   (Sub-display — 부제목)
제목 1단계   28px  SemiBold  (Heading 1 — 섹션 제목)
제목 2단계   20px  SemiBold  (Heading 2 — 카테고리)
본문/버튼    18px  SemiBold  (Body/Button — 인터랙티브)
캡션         16px  SemiBold  (Caption — 보조 정보)
최소 텍스트  13px  SemiBold  (Minimum — 레이블)
```

이 단계는 **참고용**이다. **크기 간격의 리듬**(큰 단계에서 작은 단계로 자연스럽게 줄어드는 흐름)을 유지하면 된다.

### DO / DON'T

```css
/* ✅ 크기로 계층 구분 — weight는 절제 */
.title   { font-size: 28px; font-weight: 600; font-family: 'Pretendard', sans-serif; }
.body    { font-size: 16px; font-weight: 400; font-family: 'Pretendard', sans-serif; }
.data    { font-size: 18px; font-weight: 500; font-family: 'Tomorrow', sans-serif; }

/* ✅ Persona C — 세리프 제목 + 산세리프 본문 */
.title   { font-size: 32px; font-weight: 700; font-family: 'DM Serif Display', serif; }
.body    { font-size: 16px; font-weight: 400; font-family: 'Inter', sans-serif; }

/* ✅ Persona D — 모노스페이스 데이터 */
.data-value { font-size: 14px; font-weight: 500; font-family: 'IBM Plex Mono', monospace; }

/* ❌ weight만으로 계층 구분 — 크기 차이 부족 (모든 페르소나) */
.title   { font-size: 18px; font-weight: 800; }
.body    { font-size: 16px; font-weight: 400; }

/* ✅ line-height: 1.3 기본 */
.text { line-height: 1.3; }

/* ❌ 과도한 line-height */
.text { line-height: 2.0; }
```

---

## 디자인 경향 3 — 간격 리듬

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

### 밀도(Density) — 페르소나별 기본 밀도

간격의 절대값은 밀도에 따라 조정된다:

| 밀도 | 밀접 (tight) | 중간 (medium) | 느슨 (loose) | 기본 페르소나 |
|------|-------------|--------------|-------------|-------------|
| **Compact** | 4–8px | 12–20px | 24–40px | D: Dark Operational |
| **Comfortable** | 8–14px | 20–40px | 50–160px | A, B (기본값) |
| **Expanded** | 12–20px | 30–60px | 80–200px | C: Minimal Editorial |

> 밀도는 페르소나별 기본값이 있지만, 사용자 요구에 따라 조정할 수 있다.

### 4px/8px 기반이되 문맥 우선

간격의 대부분은 4px 또는 8px의 배수(8, 12, 16, 20, 24, 40, 48, 64)다. 그러나 문맥이 요구하면 **정확한 값을 쓴다** (9.333px, 14px, 53px 등). 시각적 관계가 맞다면 8px 배수에 강제로 맞추지 않는다.

---

## 디자인 경향 4 — 컴포넌트 상태 표현

### 원칙: 호버는 초대, 비활성은 정보 제거

| 상태 | 표현 방식 | 핵심 |
|------|----------|------|
| **Default** | 브랜드 색상 그대로 | 명확한 의도 전달 |
| **Hover** | 페르소나별 (아래 표 참조) | 사용자를 초대하는 느낌 |
| **Inactive** | 탈채도 회색 | 색상 정보 완전 제거 — opacity 아님 |
| **Outline Default** | 투명 배경 + 테두리 | 채움 색과 테두리 색 일치 |
| **Outline Hover** | 반투명 채움 추가 | `rgba(primary, 0.2)` — 관심을 표현 |

### 페르소나별 호버 방식

| 페르소나 | 호버 표현 | 예시 |
|----------|----------|------|
| **A: Refined Technical** | 밝아짐 (명도 상승만) | `background: #92A8F4` |
| **B: Material Elevated** | 밝아짐 또는 elevation 상승 | `box-shadow` 단계 상승 |
| **C: Minimal Editorial** | 밝아짐, 밑줄, 테두리 변화 | `border-bottom: 2px solid` |
| **D: Dark Operational** | 밝아짐 또는 테두리 강조 | `border-color: #4dd0e1` |

```css
/* ✅ Persona A — 밝아짐 */
.btn--primary:hover   { background: #92A8F4; color: #fff; }

/* ✅ Persona B — elevation 상승 */
.card:hover { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }

/* ✅ Persona C — 밑줄/테두리 변화 */
.link:hover { border-bottom: 2px solid currentColor; }

/* ✅ Persona D — 테두리 강조 */
.panel:hover { border-color: rgba(77, 208, 225, 0.5); }

/* ✅ 공통: 비활성 = 탈채도 (opacity 아님) */
.btn--primary:disabled { background: #C8C5D6; color: #8E8EA0; }

/* ❌ 모든 페르소나: 비활성을 opacity로 */
.btn--primary:disabled { opacity: 0.5; }
```

---

## 디자인 경향 5 — 레이아웃 접근법

### 원칙: 수직 흐름이 기본, 레이아웃 도구는 페르소나에 따라

| 페르소나 | 레이아웃 도구 | CSS Grid |
|----------|-------------|----------|
| **A: Refined Technical** | Flexbox only | 금지 |
| **B: Material Elevated** | Flexbox + Grid | 허용 (카드 그리드, 균등 타일) |
| **C: Minimal Editorial** | Flexbox 기본 + Grid | 허용 (콘텐츠 레이아웃) |
| **D: Dark Operational** | Flexbox + Grid | 허용 (대시보드 패널 배치) |

### 공통: 수직 흐름 기본

모든 페르소나에서 콘텐츠는 **위에서 아래로** 쌓는 것이 기본이다:

```css
/* ✅ 기본: 수직 흐름 */
.panel {
    display: flex;
    flex-direction: column;
    gap: 26px;
}

/* ✅ 동등 항목은 수평 */
.panel-cards {
    display: flex;
    gap: 53px;
}
```

### Persona B/C/D — CSS Grid 허용 시

```css
/* ✅ 균등 카드 그리드 (Persona B/D) */
.card-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
}

/* ✅ 콘텐츠 레이아웃 (Persona C) */
.article-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 40px;
}
```

### flex-shrink: 0

크기가 고정된 요소는 `flex-shrink: 0`으로 축소를 방지한다:

```css
.fixed-panel {
    width: 370px;
    height: 204px;
    flex-shrink: 0;
}
```

---

## 디자인 경향 6 — 시각적 깊이

### 원칙: 깊이를 만드는 도구는 페르소나에 따라 다르다

| 페르소나 | 깊이 도구 | 핵심 |
|----------|----------|------|
| **A: Refined Technical** | 그라디언트 + 색상 차이 (box-shadow 금지) | 저 불투명도 오버레이로 은은한 깊이 |
| **B: Material Elevated** | box-shadow elevation 단계 (0-4) | `0 1px 3px`, `0 4px 12px` 등 높이감 |
| **C: Minimal Editorial** | 배경 색상 차이만 (그라디언트/shadow 모두 최소) | 여백과 색상 대비로 구분 |
| **D: Dark Operational** | 배경 색상 단계 + 미세 테두리 | `border: 1px solid rgba(...)` + 색상 층 |

### Persona A — 그라디언트 깊이 (DesignSystemGuide 기준)

```css
/* ✅ 레이어드 그라디언트 — 배경 + 반투명 오버레이 */
.data-cell {
    background: linear-gradient(90deg, rgba(36, 0, 196, 0.04) 0%, rgba(5, 171, 207, 0.02) 100%),
                #2A2063;
}

/* ✅ 페이지 배경 — 방향감 있는 그라디언트 */
.page-bg {
    background: linear-gradient(to left, #7159d0, #38278e);
}
```

그라디언트 방향: 페이지=수직/대각, 데이터 영역=수평(`90deg`), 헤더=수평+저 불투명도.
불투명도 범위: **0.02 ~ 0.3**. 존재하되 주장하지 않는 수준.

### Persona B — Shadow elevation

```css
/* ✅ elevation 단계 */
.card--flat    { box-shadow: none; }
.card--raised  { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08); }
.card--elevated { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
.card:hover    { box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18); }
```

### Persona C — 색상 대비만

```css
/* ✅ 배경 색상 차이로 구분 */
.section { background: #fafaf8; }
.section--alt { background: #ffffff; }
/* 그라디언트, shadow 모두 불필요 */
```

### Persona D — 테두리 + 색상 층

```css
/* ✅ 미세 테두리 + 배경 색상 단계 */
.panel { background: #0d1117; border: 1px solid rgba(99, 199, 255, 0.12); }
.panel--inner { background: #161b22; }
```

### 공통 금지 (모든 페르소나)

```css
/* ❌ 높은 불투명도 장식 그라디언트 — 분위기/깊이용만 허용 */
.header { background: linear-gradient(to right, #ff0000, #00ff00); }
```

---

## 디자인 경향 7 — Border Radius 체계

### 원칙: 둥글기는 페르소나의 성격과 요소의 역할에 따라 결정된다

| 페르소나 | 버튼/인풋 | 컨테이너 | 특징 |
|----------|----------|----------|------|
| **A: Refined Technical** | 8px | 20px | 필(pill) 30-50px, 배경판 0/100px |
| **B: Material Elevated** | 4-8px | 8-12px | 균일하게 작음, 깨끗한 직선 느낌 |
| **C: Minimal Editorial** | 0-4px | 0-4px | 샤프하거나 미세하게, 편집적 긴장감 |
| **D: Dark Operational** | 2-4px | 2-4px | 각지고 기능적, 군더더기 없음 |

```css
/* ✅ Persona A — 역할별 차이가 큼 */
.btn         { border-radius: 8px; }
.panel       { border-radius: 20px; }
.form-field  { border-radius: 30px; }

/* ✅ Persona B — 균일하게 작음 */
.btn         { border-radius: 8px; }
.card        { border-radius: 8px; }
.input       { border-radius: 4px; }

/* ✅ Persona C — 거의 직각 */
.btn         { border-radius: 2px; }
.card        { border-radius: 0; }
.input       { border-radius: 0; }

/* ✅ Persona D — 작고 각진 */
.btn         { border-radius: 4px; }
.panel       { border-radius: 4px; }
.input       { border-radius: 2px; }

/* ❌ 모든 요소에 같은 radius (페르소나 불문) */
.btn   { border-radius: 12px; }
.panel { border-radius: 12px; }
.input { border-radius: 12px; }
```

---

## 디자인 경향 8 — 모션과 트랜지션

### 원칙: 모션은 페르소나의 성격을 강화한다

| 페르소나 | 모션 수준 | 핵심 |
|----------|----------|------|
| **A: Refined Technical** | 최소 | hover transition만 (150ms), 애니메이션 없음 |
| **B: Material Elevated** | 표준 | hover 200ms, 패널 300ms, elevation 변화에 ease-in-out |
| **C: Minimal Editorial** | 없음 | 정적. color/opacity 변화만 (150ms) |
| **D: Dark Operational** | 상태 표시용 | 펄스, 깜빡임, 점진적 색상 변화 (상태 인디케이터) |

### Persona A/B — Transition

```css
/* ✅ Persona A — 최소 transition */
.btn { transition: background-color 150ms ease-out; }

/* ✅ Persona B — 표준 transition */
.card { transition: box-shadow 200ms ease-in-out, transform 200ms ease-in-out; }
.card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
```

### Persona D — 상태 애니메이션

```css
/* ✅ 상태 인디케이터 — 펄스 */
.status-dot--critical {
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

/* ✅ 실시간 데이터 — 점진적 색상 전환 */
.data-value {
    transition: color 500ms ease;
}
```

### 공통 금지

```css
/* ❌ 불필요한 화려한 애니메이션 */
.btn { animation: bounce 0.5s ease; }

/* ❌ 과도한 transform */
.card:hover { transform: scale(1.1) rotate(2deg); }
```

---

## 워크플로우

### Step 1. 요구사항 분석 + 페르소나 선택

다음을 확인한다:
- **컴포넌트 종류**: 패널, 카드, 테이블, 폼, 차트 래퍼 등
- **테마**: 다크 / 라이트
- **색상 스킴**: 기존 퍼플 브랜드 사용 / 새 팔레트 도출
- **디자인 페르소나**: A/B/C/D 중 선택 (위 "페르소나 선택 기준" 참조)
- **페르소나 커스터마이징**: 기본 프로파일에서 변경할 항목이 있는지

**사용자에게 페르소나와 색상 스킴을 제시하고 승인을 받은 후 다음 단계로 진행한다.**

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
디자인 경향 1의 "새 색상 팔레트를 만들 때" 절차를 따른다:
1. Primary 선택
2. Primary-Hover 도출 (밝게)
3. Tertiary 도출 (어둡고 저채도)
4. Surface-Dark / Surface-Light 도출 (Primary 색조 포함)
5. 그레이스케일 도출 (페르소나별 특성에 따라 — 경향 1의 페르소나별 표 참조)
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

선택된 페르소나의 프로파일에 따라 8가지 디자인 경향을 적용하여 CSS를 작성한다:

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
- [ ] 선택된 페르소나의 프로파일을 따르고 있는가?
- [ ] 깊이 표현이 페르소나 프로파일에 맞는가?
- [ ] 레이아웃 도구가 페르소나 허용 범위 내인가?
- [ ] 호버 방식이 페르소나 프로파일에 맞는가?
- [ ] 비활성 시 탈채도 회색인가? (opacity 아닌가?)
- [ ] 서체와 weight가 페르소나 프로파일에 맞는가?
- [ ] 간격이 의미론적 3단계를 따르는가?
- [ ] gap을 사용하고 margin을 지양했는가?
- [ ] border-radius가 페르소나와 요소 역할에 맞는가?
- [ ] px 단위만 사용했는가?
- [ ] 그레이스케일이 페르소나 특성에 맞는가?

### Step 6. preview.html 작성

SHARED_INSTRUCTIONS.md의 preview.html 작성 규칙을 따른다.
- CSS는 `<style>` 태그로 인라인
- HTML 구조는 Step 4와 동일
- 외부 스타일시트 로컬 참조 금지 (CDN 폰트는 허용)

### Step 7. 스크린샷 검증

Figma 원본이 없으므로, **디자인 경향 체크리스트**로 자체 검증한다:

```
경향 체크리스트:
  □ 선택된 페르소나의 성격이 일관되게 표현되는가?
  □ 텍스트 계층이 크기로 구분되는가? (weight 과용 아닌가?)
  □ 간격이 관계를 반영하는가? (밀접/중간/느슨)
  □ 깊이 표현이 페르소나 프로파일에 맞는가?
  □ 모서리가 페르소나와 역할에 맞는가?
  □ 그레이스케일이 페르소나 특성을 따르는가?
  □ 전체적으로 페르소나의 성격이 느껴지는가?
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

### 모든 페르소나 공통 금지

- ❌ **`opacity`로 비활성 표현 금지** — 탈채도 색상을 직접 지정
- ❌ **장식 목적의 그라디언트 금지** — 그라디언트는 분위기/깊이용, 불투명도 0.3 이하
- ❌ **`rem`/`em` 단위 금지** — px만 사용 (CODING_STYLE.md CSS 원칙)
- ❌ **DesignSystemGuide 값을 기계적으로 복사 금지** — 값이 아니라 경향을 적용
- ❌ **weight만으로 계층 구분 금지** — 크기 차이가 반드시 있어야 함

### 페르소나별 제약

| 제약 | A: Refined | B: Material | C: Minimal | D: Operational |
|------|-----------|-------------|------------|----------------|
| `box-shadow` | ❌ 금지 | ✅ 허용 | ⚠️ 최소만 | ⚠️ 선택적 |
| CSS Grid | ❌ 금지 | ✅ 허용 | ✅ 허용 | ✅ 허용 |
| `font-weight: 700+` (Pretendard) | ❌ 금지 | ✅ 허용 | ✅ 세리프만 | ❌ 금지 |
| 순수 무채색 배경 | ❌ 금지 | ⚠️ 가능 | ✅ 허용 | ❌ 금지 |
| 중립 무채색 그레이스케일 | ❌ 금지 | ✅ 허용 | ✅ 허용 | ❌ 금지 |
| 호버 시 어둡게 | ❌ 금지 | ❌ 금지 | ⚠️ 선택적 | ⚠️ 선택적 |

> **⚠️ = 사용 가능하지만 기본값은 아님.** 맥락상 필요할 때만 사용.

---

## 다음 단계

HTML/CSS 작성이 완료되면 **create-2d-component** Skill을 사용하여
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
| 2D 컴포넌트 생성 (다음 단계) | [/.claude/skills/2-component/create-2d-component/SKILL.md](/.claude/skills/2-component/create-2d-component/SKILL.md) |
| Figma to HTML (대안 경로) | [/.claude/skills/1-figma/figma-to-html/SKILL.md](/.claude/skills/1-figma/figma-to-html/SKILL.md) |
