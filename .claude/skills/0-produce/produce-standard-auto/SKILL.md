---
name: produce-standard-auto
description: 2D Standard 컴포넌트를 서브에이전트 기반으로 한 컴포넌트씩 독립 컨텍스트에서 완전 자동 생산합니다. 메인은 Phase 0(대상 파악) → Agent 호출 → Phase 2(커밋) → 반복.
---

# 2D Standard 컴포넌트 완전 자동 생산

## 목표

DesignComponentSystem/Components 아래의 2D 컴포넌트를 폴더 알파벳 순서대로 Standard 생산한다.
한 번 실행하면 **남은 모든 2D Standard 대상**을 순차로 소화한다.
각 사이클은 **독립된 서브에이전트**가 처리하므로 메인 컨텍스트는 누적되지 않는다.

기존 `produce-standard-loop`(수동, 승인 기반)의 완전 자동 대체 버전.

---

## 구조 원칙

```
[메인 루프]
    │
    ├─ Phase 0: 다음 대상 파악
    ├─ Phase 1: Agent(subagent_type=general-purpose) 호출 → 단일 컴포넌트 생산 위임
    ├─ Phase 2: 커밋
    └─ Phase 3: 다음 대상으로 반복 (남은 대상이 없을 때까지)
```

- **매 사이클마다 새 Agent 호출** — 서브에이전트는 독립된 컨텍스트에서 실행되고, 완료 후 요약만 반환
- **사용자 승인 포인트 없음** — 서브에이전트가 기능 분석/Mixin 매핑/CLAUDE.md/코드/manifest까지 자율 결정
- **실패 시 즉시 중단** — Hook 검증 실패, manifest JSON 오류, Agent 실패 보고 → 메인이 중단하고 사용자에게 알림

---

## 메인 루프 절차

### Phase 0. 다음 대상 파악

매 사이클 시작 시 실행한다. 대상 결정 규칙은 [`_shared/phase0-2d.md`](../_shared/phase0-2d.md)를 따른다. 범주 폴더 구조를 동적 감지하여 `{컴포넌트경로}` 후보 목록을 만들고, `register.js`가 없는 첫 번째 항목을 **다음 대상**으로 삼는다. 남은 대상이 없으면 **전체 루프 종료** 후 사용자에게 완료 보고.

---

### Phase 1. 서브에이전트 호출

`Agent` 도구로 `subagent_type=general-purpose`에 위임한다.

**프롬프트 템플릿** (매 사이클 `{컴포넌트경로}`만 교체):

```
대상: 2D 컴포넌트 `{컴포넌트경로}/Standard`를 처음부터 끝까지 생산한다.
예: Buttons/SplitButtons/Standard

## 배경

Renobit 웹 빌더의 DesignComponentSystem은 Mixin 기반 2D 컴포넌트 집합이다.
너는 단일 컴포넌트 하나를 완결하여 생산하고 요약만 반환한다.
사용자 승인이 필요 없는 완전 자동 모드로 동작한다.

## 필수 읽어야 할 문서 (순서대로)

1. `/.claude/skills/SHARED_INSTRUCTIONS.md` — 공통 규칙
2. `/.claude/skills/0-produce/produce-component/SKILL.md` — 생산 프로세스. **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"이 4종 페르소나 / 필수 참고 CSS / 시각 토큰 원칙의 진실 소스다. 반드시 해당 섹션이 지시하는 문서들을 모두 읽어라.**
3. `/.claude/skills/2-component/create-2d-component/SKILL.md` — 2D 구현
4. `/.claude/guides/CODING_STYLE.md` — 코딩 스타일
5. `/RNBT_architecture/DesignComponentSystem/Mixins/README.md` — Mixin 카탈로그
6. `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md` — 시스템 설계
7. `Components/{범주}/CLAUDE.md` — 범주 역할
8. `Components/{범주}/{컴포넌트}/CLAUDE.md` — MD3 정의 + 역할 (이미 존재)

## 참고 사례 (직전 완성품) — 구조적 참고만

> CSS 시각 토큰 원칙은 `produce-component/SKILL.md` Step 5-1을 따른다. 아래 사례는 **구조적 참고용**(Mixin 조립 · HTML 구조 · cssSelectors 계약 · 이벤트 패턴)이며, 색/타이포/간격/그림자/모서리 같은 시각 토큰은 Persona 프로파일이 최종 근거다.

- `Components/Buttons/ButtonGroups/Standard/` — ListRenderMixin 패턴 (항목 배열 렌더 + 선택)
- `Components/Buttons/IconButtons/Standard/` — FieldRenderMixin 패턴 (단일 객체 렌더 + 클릭)
- `Components/Buttons/SegmentedButtons/Standard/` — ListRenderMixin + Connected 스타일
- `Components/Buttons/SplitButtons/Standard/` — FieldRender + ListRender 조립
- `Components/Cards/Standard/` — FieldRender(본문) + ListRender(액션) 조립
- `Components/Checkbox/Standard/` — ListRender + tri-state(data-checked) + 인라인 SVG 체크마크

## 산출물 (모두 자동으로 작성)

1. `Standard/CLAUDE.md` — 기능 정의 + 구현 명세
2. `Standard/scripts/register.js` — Mixin 조립 + 구독 + 이벤트
3. `Standard/scripts/beforeDestroy.js` — 정리 코드
4. `Standard/views/0{1..4}_{persona}.html` — 4개 페르소나 변형
5. `Standard/styles/0{1..4}_{persona}.css` — 4개 페르소나 변형
6. `Standard/preview/0{1..4}_{persona}.html` — 4개 독립 실행 프리뷰
7. `DesignComponentSystem/manifest.json` — `{컴포넌트}`의 `sets` 배열에 Standard 엔트리 추가

## 페르소나 4종 — 정의 출처

`produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**을 그대로 따른다. 해당 섹션이 4종 페르소나(01_refined ~ 04_operational) ↔ `create-html-css/SKILL.md` Persona A~D 매핑 · 필수 참고 CSS · 시각 토큰 원칙의 단일 진실 소스다.

## 필수 제약

- MD3 명세가 필요하면 WebFetch → 실패 시 WebSearch로 대체. 근거를 명시.
- 컴포넌트 CLAUDE.md의 cssSelectors 계약을 HTML과 JS에서 일치시킨다.
- CSS는 `#{component}-container { ... nesting ... }` 형태 (컨테이너 크기는 CSS가 소유).
- Hook 검증(P0~P3) 통과를 보장한다.
- manifest.json 수정 후 `node -e "JSON.parse(...)"`로 JSON 유효성을 직접 검증한다.
- 기존 완성된 컴포넌트 파일은 수정하지 않는다.
- 커밋은 하지 않는다 (메인 루프가 커밋한다).
- **신규 Mixin 생성 금지.** 기존 Mixin + 커스텀 메서드 조합으로만 해결한다. 반복 패턴이 의심되어도 이 사이클에서는 커스텀 메서드로 완결하고, 반환의 "발견한 문제/의문점"에 `반복 패턴 후보: {설명}`으로 기록만 남긴다. `create-mixin-spec` / `implement-mixin` 스킬은 호출하지 않는다.

## 반환 형식 (200단어 이내)

- 생산한 컴포넌트 경로
- 선택한 Mixin + 근거 1줄
- 주요 cssSelectors KEY 목록
- 주요 이벤트 / 구독 토픽 1줄씩
- 4개 변형 요약 (각 변형의 의도 1줄)
- 페르소나 근거: 각 변형에서 SKILL.md Persona A~D의 어떤 항목(예: "깊이=그라디언트", "모서리=0~4px", "밀도=Compact")을 핵심 근거로 삼았는지 1~2줄
- 특이 결정사항 (체크마크, 외부 폰트, 색상 팔레트 선택 등)
- 발견한 문제/의문점 (있으면)
```

**호출**:

```javascript
Agent({
    description: "{컴포넌트경로} Standard 생산",
    subagent_type: "general-purpose",
    prompt: "(위 템플릿)"
})
```

---

### Phase 2. 결과 확인 + 커밋

Agent 반환 후:

1. 생성된 파일 존재 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/{경로}/Standard/{scripts,views,styles,preview}/
   ```
   
2. manifest.json JSON 유효성 재확인:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8')); console.log('OK')"
   ```

3. 커밋:
   ```
   feat: {컴포넌트경로}/Standard 컴포넌트 자동 생산 — {Agent 요약 첫 줄}
   ```

4. 실패 감지:
   - 파일 누락 → 중단, 사용자에게 "Phase 2 파일 검증 실패: {누락 목록}" 보고
   - JSON 오류 → 중단, 사용자에게 "manifest.json 파손: {오류}" 보고
   - Agent가 실패를 보고 → 중단, Agent 요약 그대로 사용자에게 전달

---

### Phase 3. 다음 사이클

남은 대상이 있으면 Phase 0부터 다시 실행. 없으면 종료.

---

## 종료 보고

모든 대상 소화 완료 시:

```
✅ 2D Standard 전체 생산 완료.
생산된 컴포넌트: N개
커밋: N개
```

중단 시:

```
⚠️ 중단: {사유}
현재까지 생산: N개
마지막 대상: {경로}
재개하려면 `/produce-standard-auto`를 다시 실행하세요.
```

---

## 금지 사항

- ❌ 사용자에게 중간 승인 요청 (완전 자동 모드)
- ❌ 한 사이클 안에서 여러 컴포넌트 생산 (Agent는 반드시 1 컴포넌트만)
- ❌ Agent 호출 없이 메인이 직접 컴포넌트 생산
- ❌ 실패를 덮고 다음 사이클 진행

---

## 참조 문서

- 수동 버전: `/.claude/skills/0-produce/produce-standard-loop/SKILL.md` (승인 기반, 기존 유지)
- 생산 프로세스: `/.claude/skills/0-produce/produce-component/SKILL.md`
- 2D 구현: `/.claude/skills/2-component/create-2d-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
