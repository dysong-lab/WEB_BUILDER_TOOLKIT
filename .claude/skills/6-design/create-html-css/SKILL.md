---
name: create-html-css
description: Figma 없이 디자인 페르소나 기반으로 HTML/CSS를 직접 작성합니다. 인덱스만 먼저 읽고, 선택된 페르소나 문서만 추가로 읽습니다.
---

# Figma 없이 HTML/CSS 작성

Figma 디자인이 없을 때, 디자인 페르소나를 선택하고 해당 문서만 추가로 읽어 HTML/CSS를 작성한다.

> 공통 인덱스: [SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md)
> 공통 패턴: [SHARED_PATTERNS.md](/.claude/skills/SHARED_PATTERNS.md)

## 작업 전 필수 확인

1. [/.claude/skills/SHARED_INDEX.md](/.claude/skills/SHARED_INDEX.md)
2. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md)
3. [design-primitives.md](./design-primitives.md) — 공통 색상/타이포/상태 원칙
4. 선택된 페르소나 문서 1개:
   - [personas/refined.md](./personas/refined.md)
   - [personas/material.md](./personas/material.md)
   - [personas/editorial.md](./personas/editorial.md)
   - [personas/operational.md](./personas/operational.md)

## 페르소나 선택 기준

| 맥락 | 추천 페르소나 |
|------|-------------|
| 기존 DesignSystemGuide 브랜드 유지 | Refined Technical |
| 카드/패널 중심 대시보드 | Material Elevated |
| 콘텐츠 중심 리포트/프레젠테이션 | Minimal Editorial |
| 관제실/실시간 모니터링 | Dark Operational |

## 출력 구조

`figma-to-html`과 동일한 구조를 따른다.

```text
Figma_Conversion/Static_Components/[프로젝트명]/[컴포넌트명]/
├── screenshots/impl.png
├── [컴포넌트명].html
└── [컴포넌트명].css
```

## 핵심 규칙

- 선택하지 않은 페르소나 문서는 읽지 않는다.
- CSS는 `px` 기준, Flexbox 우선
- preview 작성 시 공통 preview 규칙을 따른다.
- 디자인 판단은 페르소나 문서 + `design-primitives.md` 조합으로 결정한다.
