# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository Entry

이 저장소는 Figma 산출물과 RNBT 런타임 컴포넌트 생산 흐름을 함께 다룬다.

- `Figma_Conversion/` — Figma 기반 정적 HTML/CSS 추출
- `RNBT_architecture/` — 정적 산출물을 런타임 컴포넌트/페이지로 변환

세부 설명은 각 하위 문서를 우선 참조한다.

- Figma 변환: `/Figma_Conversion/CLAUDE.md`
- RNBT 변환: `/RNBT_architecture/CLAUDE.md`
- 공통 스킬 인덱스: `/.claude/skills/SHARED_INDEX.md`
- 공통 코드 패턴: `/.claude/skills/SHARED_PATTERNS.md`
- Hook 설계 문서: `/.claude/hooks/HOOKS_DESIGN.md`

## Skill Entry Points

- 새 컴포넌트 생산: `produce-component`
- 2D 컴포넌트 구현: `create-2d-component`
- 3D 컴포넌트 구현: `create-3d-component`, `create-3d-container-component`
- 페이지 생성: `create-project`
- 디자인 직접 작성: `create-html-css`
- 전체 점검: `audit-project`

## Working Rules

정확성을 위해 아래 원칙을 하나로 묶어 적용한다.

1. 추측하지 않는다. 용어, 동작, 함수, 구조는 실제 문서나 코드에서 확인 후 답한다.
2. 스크린샷, 사용자 피드백, 오류 보고도 사실로 확정하지 않고 실제 코드/결과를 확인한다.
3. 기존 유틸리티나 함수는 존재 여부를 확인한 뒤 사용한다. 이름을 추측해 쓰지 않는다.
4. 문제가 없으면 없다고 말하고, 문제가 있으면 구체 원인과 위치를 말한다.
5. Git 충돌이나 위험한 상태 변경은 사용자 확인 없이 임의로 해결하지 않는다.
6. 빠르게 결론내리기보다 단계적으로 확인하고, 확인 결과를 근거로 설명한다.

## Output Rule

긴 한글 설명이나 긴 문서를 그대로 출력할 때는 코드 블록을 우선 사용한다. 터미널에서 일반 텍스트가 잘릴 수 있다.

*최종 업데이트: 2026-04-10*
