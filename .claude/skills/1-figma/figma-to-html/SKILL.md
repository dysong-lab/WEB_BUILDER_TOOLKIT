---
name: figma-to-html
description: Figma 디자인을 정적 HTML/CSS로 변환합니다. Figma 링크나 node-id가 제공되면 MCP를 통해 디자인 정보를 가져와 정확한 코드를 생성합니다. Use when converting Figma designs to HTML/CSS, or when user mentions Figma links, design conversion, or static HTML implementation.
---

# Figma to HTML/CSS 변환

Figma 디자인을 **정적 HTML/CSS**로 변환하는 Skill입니다.
스크립트 작업은 하지 않습니다 (순수 퍼블리싱).

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**

1. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) - 공통 규칙
2. [/Figma_Conversion/CLAUDE.md](/Figma_Conversion/CLAUDE.md) - 핵심 원칙, 구현 체크리스트
3. [/.claude/guides/FIGMA_MCP_GUIDE.md](/.claude/guides/FIGMA_MCP_GUIDE.md) - MCP 도구, 에셋 규칙, dirForAssetWrites
4. [/.claude/guides/FIGMA_IMPLEMENTATION_GUIDE.md](/.claude/guides/FIGMA_IMPLEMENTATION_GUIDE.md) - 구현 주의사항, 변환 워크플로우, Playwright
5. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) - **CSS 원칙 섹션만** (px 단위, Flexbox 우선)
6. [/.claude/guides/CONVERTING_ISSUE.md](/.claude/guides/CONVERTING_ISSUE.md) - 변환 시 발생했던 문제 케이스 (실전 교훈)

> **참고:** 이 스킬은 순수 퍼블리싱입니다. JS 패턴(register.js, beforeDestroy, fx.go)은 읽을 필요 없습니다.

---

## 사전 조건

- Figma Desktop 앱 실행 중
- 대상 Figma 파일이 열려 있음
- Figma MCP 서버 등록됨

```bash
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp
```

---

## 출력 폴더 구조

```
Figma_Conversion/Static_Components/         # TBD: 경로 재구성 예정
└── [프로젝트명]/
    └── [컴포넌트명]/
        ├── assets/              # SVG, 이미지 에셋 (자동 다운로드)
        ├── screenshots/         # 구현물 스크린샷
        │   └── impl.png
        ├── [컴포넌트명].html
        └── [컴포넌트명].css
```

---

## overflow 적용 규칙

**핵심 원칙:** 동적 데이터가 렌더링되는 영역을 파악하여 적절한 위치에 overflow 적용

**동적 데이터 영역 식별:**
- 테이블의 목록 (list, tbody)
- 카드 목록 (card-list, grid)
- 반복 렌더링되는 아이템 컨테이너

```css
/* 케이스 1: 내부 목록만 스크롤 */
.component-container {
  overflow: hidden;
}
.component__list {
  overflow-y: auto;
}

/* 케이스 2: 전체 컨테이너 스크롤 (컨테이너 자체가 동적 영역일 때) */
.component-container {
  overflow: auto;
}
```

**판단 기준:**
- 컨테이너 내에 고정 헤더/푸터가 있고 목록만 스크롤 → 목록에 overflow
- 컨테이너 전체가 스크롤 대상 → 컨테이너에 overflow

---

## 다음 단계

변환이 완료되면 **create-2d-component** Skill을 사용하여
정적 HTML/CSS를 RNBT 동적 컴포넌트로 변환할 수 있습니다.
