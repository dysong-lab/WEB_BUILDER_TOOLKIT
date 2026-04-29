# Preview 4종 라벨 retroactive 일괄 적용

이미 생산된 preview.html에 [`_shared/preview-area-labeling.md`](/.claude/skills/0-produce/_shared/preview-area-labeling.md) 4종 라벨(`[PREVIEW 인프라]` / `[PAGE]` / `[COMPONENT register.js 본문]` / `[PREVIEW 전용]`)을 컴포넌트 단위 무인 루프로 일괄 적용. 첫 5 cycle 후 검수 게이트, 통과 시 `resume` 인자로 잔여 처리.

자세한 절차는 `/.claude/skills/4-review/apply-preview-labels-auto/SKILL.md`를 읽고 따릅니다.
