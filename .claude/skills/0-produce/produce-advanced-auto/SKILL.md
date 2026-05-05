---
name: produce-advanced-auto
description: 2D Advanced 변형을 ADVANCED_QUEUE.md 순서대로 서브에이전트 기반 완전 자동 생산합니다. 메인은 Phase 0(큐 파싱) → Agent 호출 → Phase 2(검증+커밋+큐업데이트) → 반복.
---

# 2D Advanced 컴포넌트 완전 자동 생산

## 목표

`RNBT_architecture/DesignComponentSystem/Components/ADVANCED_QUEUE.md`에 등록된 2D Advanced 변형을 순번 순서대로 생산한다.
한 번 실행하면 **남은 모든 "대기" 항목**을 순차로 소화한다.
각 사이클은 **독립된 서브에이전트**가 처리하므로 메인 컨텍스트는 누적되지 않는다.

기존 `produce-advanced-loop`(수동, 승인 기반)의 완전 자동 대체 버전.

---

## 구조 원칙

```
[메인 루프]
    │
    ├─ Phase 0: ADVANCED_QUEUE.md에서 "대기" 첫 항목 추출 → {경로}/{변형이름}/{설명} 변수화
    ├─ Phase 1: Agent(subagent_type=general-purpose) 호출 → 단일 변형 생산 위임
    ├─ Phase 2: 결과 확인 + 큐 상태 업데이트 + 커밋
    └─ Phase 3: 다음 대상으로 반복 (남은 "대기" 항목이 없을 때까지)
```

- **매 사이클마다 새 Agent 호출** — 서브에이전트는 독립된 컨텍스트에서 실행되고, 완료 후 요약만 반환
- **사용자 승인 포인트 없음** — 서브에이전트가 기능 분석/Mixin 매핑/CLAUDE.md/코드/manifest까지 자율 결정
- **Phase 1.5 패턴 대조도 Agent 자율 검증** — 메인 프롬프트에 7항목 체크리스트 통째 포함, Agent가 기준 변형을 선정해 직접 대조 후 결과를 반환에 1줄로 보고
- **큐 상태 업데이트는 메인이 담당** — Agent는 ADVANCED_QUEUE.md를 직접 수정하지 않는다. Phase 2 검증 통과 후 메인이 "대기" → "완료"로 Edit (Agent 실패 시 큐 상태가 의도치 않게 변하는 것을 방지)
- **실패 시 즉시 중단** — Hook 검증 실패, manifest JSON 오류, Agent 실패 보고 → 메인이 중단하고 큐 상태는 "대기"로 유지

---

## 메인 루프 절차

### Phase 0. 다음 대상 파악

매 사이클 시작 시 실행한다.

1. ADVANCED_QUEUE.md 읽기:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/ADVANCED_QUEUE.md
   ```

2. **표 형식** (5열):
   ```
   | 순번 | 컴포넌트경로 | 변형 이름 | 설명 | 상태 |
   ```

3. 표 행 중 **상태가 "대기"인 첫 행**을 다음 대상으로 삼는다. 다음 변수를 추출:
   - `{컴포넌트경로}` — 예: `AppBars`, `Buttons/SplitButtons`
   - `{변형이름}` — 예: `searchEmbedded`, `dropdownMenu`
   - `{설명}` — 한 줄 요약 (그대로 Agent 프롬프트에 주입)

4. 출력 폴더 사전 점검:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/{컴포넌트경로}/Advanced/{변형이름}/scripts/register.js 2>/dev/null
   ```
   이미 register.js가 있으면 큐 상태가 잘못된 것으로 판단하고 중단, 사용자에게 "이미 생산됨: {경로}/Advanced/{변형이름} — 큐 상태가 '대기'인데 파일이 존재합니다. 수동 확인 필요" 보고.

5. **"대기" 항목 없음** → 전체 루프 종료, 사용자에게 완료 보고:
   ```
   ✅ 2D Advanced 전체 생산 완료.
   생산된 변형: N개
   커밋: N개
   ```

---

### Phase 1. 서브에이전트 호출

`Agent` 도구로 `subagent_type=general-purpose`에 위임한다.

**프롬프트 템플릿** (매 사이클 `{컴포넌트경로}` / `{변형이름}` / `{설명}` 교체):

```
대상: 2D 컴포넌트 `{컴포넌트경로}/Advanced/{변형이름}`를 처음부터 끝까지 생산한다.
변형 설명(큐): {설명}

## 배경

Renobit 웹 빌더의 DesignComponentSystem은 Mixin 기반 2D 컴포넌트 집합이다.
너는 단일 Advanced 변형 하나를 완결하여 생산하고 요약만 반환한다.
사용자 승인이 필요 없는 완전 자동 모드로 동작한다.

## 필수 읽어야 할 문서 (순서대로)

1. `/.claude/skills/SHARED_INSTRUCTIONS.md` — 공통 규칙
2. `/.claude/skills/0-produce/produce-component/SKILL.md` — 생산 프로세스. **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"이 4종 페르소나 / 필수 참고 CSS / 시각 토큰 원칙의 진실 소스다.** 해당 섹션이 지시하는 문서들을 모두 읽어라.
3. `/.claude/skills/0-produce/produce-advanced-loop/SKILL.md` — Advanced 변형의 분리 정당성·Phase 1.5 체크리스트 원전(이 프롬프트가 인용)
4. `/.claude/skills/2-component/create-2d-component/SKILL.md` — 2D 구현
5. `/.claude/guides/CODING_STYLE.md` — 코딩 스타일
6. `/RNBT_architecture/DesignComponentSystem/Mixins/README.md` — Mixin 카탈로그
7. `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md` — 시스템 설계
8. `Components/{컴포넌트경로}/CLAUDE.md` — 컴포넌트 역할 (이미 존재 시) + Standard register.js (이미 존재 시)

## 산출물 (모두 자동으로 작성)

1. `Advanced/{변형이름}/CLAUDE.md` — 기능 정의 + 구현 명세 + **Standard와의 분리 정당성**(register.js 차이를 명시)
2. `Advanced/{변형이름}/scripts/register.js` — Mixin 조립 + 구독 + 이벤트 (top-level 평탄 작성, IIFE 금지)
3. `Advanced/{변형이름}/scripts/beforeDestroy.js` — 정리 코드 (구독 해제 → removeCustomEvents → this.xxx?.destroy() 순서)
4. `Advanced/{변형이름}/views/0{1..4}_{persona}.html` — 4개 페르소나 변형
5. `Advanced/{변형이름}/styles/0{1..4}_{persona}.css` — 4개 페르소나 변형
6. `Advanced/{변형이름}/preview/0{1..4}_{persona}.html` — 4개 독립 실행 프리뷰. **`<script>` 내부 코드는 [`_shared/preview-area-labeling.md`](/.claude/skills/0-produce/_shared/preview-area-labeling.md)의 4종 라벨(`[PREVIEW 인프라]` / `[PAGE]` / `[COMPONENT register.js 본문]` / `[PREVIEW 전용]`)로 영역 분리 필수 — 빌더가 페이지 작성 코드와 컴포넌트 register.js 본문을 한눈에 구분할 수 있도록.
   **`<script src>`의 ../개수는 [`_shared/preview-area-labeling.md`](/.claude/skills/0-produce/_shared/preview-area-labeling.md)의 "Preview script src 상대경로" 표를 따른다 — 동일 깊이 기준 변형의 첫 두 줄을 verbatim 복사하고 직접 셈하지 말 것.** Hook P3-5(`check-preview-script-depth.sh`)가 정적 검증하여 회귀 시 exit 2로 차단한다. 회귀 사례: 50% 확률로 ../개수가 1 부족하게 작성됨(Cards/expandable + swipeAction 8 파일 → `loadComponentAssets is not defined`).
7. `DesignComponentSystem/manifest.json` — 해당 컴포넌트의 `sets[Advanced].items[]`에 `{ name: "{변형이름}", spec, previews }` 항목 추가

## 페르소나 4종 — 정의 출처

`produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**을 그대로 따른다. 4종 페르소나(01_refined ~ 04_operational) ↔ `create-html-css/SKILL.md` Persona A~D 매핑 · 필수 참고 CSS · 시각 토큰 원칙의 단일 진실 소스.

## Phase 1.5 — 기존 변형과의 패턴 대조 (자율 검증, 커밋 직전 필수)

생산 완료 후 **반드시 자체 검증을 수행한 뒤** 결과를 반환에 1줄로 보고하라.

### 1. 기준 변형 자동 선정

다음 우선순위로 비교 기준 파일을 선택:

1. **동일 범주의 완료 Advanced 변형**이 있으면 최우선 (예: 신규가 `AppBars/Advanced/contextual` → 기준: `AppBars/Advanced/searchEmbedded`)
2. 동일 범주에 없으면 **동일 Mixin 조합을 쓰는 다른 범주의 Advanced 변형**
3. 어느 쪽도 없으면(최초 케이스) → CLAUDE.md "Standard와의 분리 정당성" 항목으로 대체

`find Components -type d -path "*/Advanced/*" -not -path "*/3D_Components/*"`로 완료 변형 목록 확인 가능.

### 2. 대조 체크리스트 8항목

| # | 항목 | 관례 |
|---|------|------|
| 1 | **register.js 평탄 작성** | top-level 평탄 작성. IIFE/수동 클로저로 감싸지 않는다 |
| 2 | **cssSelectors 계약** | CLAUDE.md에 선언된 KEY를 view HTML이 모두 제공하고, register.js의 Mixin 옵션이 동일 KEY 집합을 사용 |
| 3 | **subscriptions 핸들러 배선** | 구독 토픽이 페이지에서 publish되는 이름과 일치하고, 핸들러가 Mixin이 제공하는 것(예: `this.xxx.renderData`)을 가리킨다 |
| 4 | **customEvents 이름 일관성** | `@camelCaseEvent` 규약 + CLAUDE.md "이벤트" 표 ↔ 실제 발행 이름 일치 |
| 5 | **beforeDestroy.js 정리 순서** | 구독 해제 → `removeCustomEvents` → `this.xxx?.destroy()`. self-null을 수행하는 Mixin destroy는 호출만, 그렇지 않은 것은 명시 null |
| 6 | **컨테이너 CSS 규칙** | `#[component]-container { width/height/overflow + nesting }` 패턴이 기존 변형과 같은 구조. preview에는 컨테이너 크기를 인라인으로 두지 않는다 |
| 7 | **manifest·ADVANCED_QUEUE 2중 등록** | manifest.json의 `sets[Advanced].items[]`에 등록되었는가. ADVANCED_QUEUE.md는 메인이 업데이트하므로 너는 **수정하지 않는다** (확인만) |
| 8 | **demo 라벨/hint의 변형 의도·도메인 컨텍스트 명시** | preview는 시각만으로 "이 변형이 Standard와 무엇이 다른지 / 이 demo 버튼이 어떤 사용 시나리오인지" 추론 가능해야 한다. 컨텍스트 누락(예: AppBars/contextual을 단순 색만 보여주고 "선택 모드 진입 시 맥락 액션" 의미 빠뜨림)은 Standard 답습 변형으로 가치 0 수렴. **두 채널 중 최소 한 개**: ① `demo-label`/섹션 제목에 변형 의도 한 줄(예: `"Contextual AppBar (선택 모드 진입 시 액션 표시)"`), ② `demo-hint`에 시연 시나리오 1~2문장(원래 화면 → 트리거 → 변경 화면 / 또는 데이터 형태 → 렌더 결과). 회귀 사례: 3D #14 (IRISID_iCAM7/detectionMarker)에서 demo-label="Detection Markers" 일반어 + 도메인(홍채 인식 카메라) 누락으로 "마커 의미 모르겠다" 지적 → 2D 답습 위험 차단을 위해 일반화. |
| 9 | **preview `<script src>` 깊이 == 폴더 깊이** | `<script src="../.../preview_runtime.js">`의 ../개수가 폴더 깊이와 정확히 일치 — `Components/<범주>/Advanced/<변형>/preview` = 5단계, `Components/<범주>/<서브범주>/Advanced/<변형>/preview` = 6단계, `Components/<범주>/Standard/preview` = 4단계. **계산하지 말고 동일 깊이 기준 변형 첫 두 줄을 verbatim 복사**할 것. Hook P3-5가 정적 검증(exit 2). 회귀 사례: Cards/expandable + swipeAction 8 파일이 4단계로 잘못 작성되어 `loadComponentAssets is not defined` 발생. 같은 Cards 안에서도 #19/#22(틀림) ↔ #20/#21(맞음)으로 50% 확률 회귀 — 에이전트가 매 사이클 깊이를 직접 셈하기 때문. verbatim 복사로 자율 판단 제거. |
| 10 | **`GlobalDataPublisher.publish` 사용 금지 — preview 시뮬은 instance 메서드 직접 호출** | `GlobalDataPublisher.publish(topic, payload)`는 **존재하지 않는 환상의 메서드**다 — prod(`Utils/GlobalDataPublisher.js`) / preview 시뮬(`preview_runtime.js`) 둘 다 `registerMapping` / `subscribe` / `fetchAndPublish` 만 노출. preview에서 페이지 publish 시뮬은 **instance의 핸들러 직접 호출**로: `GlobalDataPublisher.publish('searchInfo', { response: data })` ❌ → `instance.fieldRender.renderData({ response: data })` ✅. 자체 핸들러 메서드가 있으면 그것을 호출(`instance._renderColoredChips({ response })`); 일반 dispatch가 필요하면 `instance.subscriptions[topic].forEach(h => h.call(instance, payload))`. 회귀 사례 — **두 번째 회귀**: ① b086c613(#1 searchEmbedded) 1차 도입 → a05bbb10(#2 contextual) 정정 — SKILL 미명시로 차단 실패. ② 본 사이클 #25~#75 + 일부 이전 변형까지 126 파일 cascade. **두 번째 회귀로 SKILL 정식 등재** — verbatim 복사 시 본문 코드의 publish 호출도 검증 필수. |

### 3. SKILL 자가 보강 규율 — 1번 회귀 = 즉시 일반화 검토

Phase 1.5 항목은 회귀 사례에서 역공학적으로 추가된다. 그러나 **3번째 사고를 기다리지 않는다** — 동일 카테고리 회귀가 1번 관측되면 즉시 일반화 가능성을 검토하여 SKILL 항목으로 승격한다.

**판단 기준**:
- **일반화 가능** (다른 컴포넌트에서 같은 패턴으로 재발 가능 — 예: cssSelectors KEY 누락이 컴포넌트 A → B로 답습되는 일반 룰) → 즉시 Phase 1.5 항목 추가 + retroactive 적용 백로그 등록
- **일반화 불가** (단발 사고, 도메인 특이성, 1회성 외부 변경) → commit 메시지에만 기록

**근거 — 이 규율이 없었으면 답습된 회귀** (3D Advanced 사례, **2D Advanced에도 동등 적용**):
- **3D #12 (preview 데모 버튼 CSS 색 완전성)**: b3574572 OHU103 1차 → 30d73dbd Marker_* 2차(답습 실패) → 9dc951e5 zonalHeatmap 3차(답습 실패) → 비로소 SKILL 추가. **3 사이클 낭비**. 1차 시점에 일반화 검토했다면 2·3차 차단 가능했음.
- **3D #13 (라이프사이클 토글 라벨 명시)**: zonalHeatmap Start 의미 오해 1번 발생 → 즉시 일반화 + retroactive 11개 일괄 처리. **본 규율 첫 적용 사례**.
- **3D #14 / 2D #8 (demo 도메인 컨텍스트 명시)**: IRISID_iCAM7/Advanced/detectionMarker에서 사용자 *"마커 의미 모르겠다"* 1번 발생 → 즉시 3D #14 신설 + 2D에도 #8로 동등 일반화(2D 답습 위험 사전 차단). 본 규율 두 번째 적용 사례.
- 동일 답습 패턴이 2D에서도 발생 가능 — 예: cssSelectors 계약 누락, customEvents 이름 불일치, beforeDestroy 정리 순서 drift, demo 의도 누락 등이 컴포넌트 간 답습되면 같은 규율로 차단.

**예외**: 기능 추가 사이클 도중 발견된 사고는 그 사이클 commit에서 fix까지만 처리, SKILL 추가는 다음 사이클 시작 시점에 일괄 검토 (cycle 내부 동선 산만 방지). 단, 다음 사이클 시작 시 누락 없이 검토되어야 한다 — commit 메시지에 "SKILL 보강 후보" 태그를 남겨 추적성 확보.

### 4. 실패 처리

항목 중 하나라도 drift가 있으면 **반환 직전에** 정정한다. 정정 불가하면 반환의 "발견한 문제"에 명시.

## 필수 제약

- MD3 명세가 필요하면 WebFetch → 실패 시 WebSearch로 대체. 근거를 명시.
- 컴포넌트 CLAUDE.md의 cssSelectors 계약을 HTML과 JS에서 일치시킨다.
- CSS는 `#{component}-container { ... nesting ... }` 형태 (컨테이너 크기는 CSS가 소유).
- Hook 검증(P0~P3) 통과를 보장한다.
- manifest.json 수정 후 `node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8'))"`로 JSON 유효성을 직접 검증한다.
- 기존 완성된 컴포넌트 파일은 수정하지 않는다.
- 커밋은 하지 않는다 (메인 루프가 커밋한다).
- **ADVANCED_QUEUE.md는 수정하지 않는다** (메인 루프가 상태 업데이트).
- **신규 Mixin 생성 금지.** 기존 Mixin + 커스텀 메서드 조합으로만 해결한다. 반복 패턴이 의심되어도 이 사이클에서는 커스텀 메서드로 완결하고, 반환의 "발견한 문제/의문점"에 `반복 패턴 후보: {설명}`으로 기록만 남긴다. `create-mixin-spec` / `implement-mixin` 스킬은 호출하지 않는다.

## 반환 형식 (200단어 이내)

- 생산한 변형 경로
- 선택한 Mixin 조합 + 근거 1줄
- 주요 cssSelectors KEY 목록
- 주요 이벤트 / 구독 토픽 1줄씩
- 4개 변형 페르소나 근거 1~2줄
- Standard와의 분리 정당성 1줄
- **Phase 1.5 자율검증 결과 1줄** (예: "기준=AppBars/Advanced/searchEmbedded, 7항목 통과")
- 특이 결정사항
- 발견한 문제/의문점 (있으면)
```

**호출**:

```javascript
Agent({
    description: "{컴포넌트경로}/Advanced/{변형이름} 생산",
    subagent_type: "general-purpose",
    prompt: "(위 템플릿)"
})
```

---

### Phase 2. 결과 확인 + 큐 업데이트 + 커밋

Agent 반환 후 다음 순서로 진행:

1. **생성된 파일 존재 확인**:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/{컴포넌트경로}/Advanced/{변형이름}/{scripts,views,styles,preview}/
   ```
   `register.js`, `beforeDestroy.js`, `CLAUDE.md`, 4개 view/style/preview 파일이 모두 존재해야 한다.

2. **manifest.json JSON 유효성 재확인**:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('RNBT_architecture/DesignComponentSystem/manifest.json','utf8')); console.log('OK')"
   ```

3. **ADVANCED_QUEUE.md 상태 업데이트**:
   - 해당 행의 마지막 컬럼(`상태`)을 `대기` → `완료`로 Edit (정확한 행 매칭을 위해 `| {순번} | {컴포넌트경로} | {변형이름} |` 접두를 포함한 unique한 패턴으로 교체)

4. **커밋**:
   ```
   feat: {컴포넌트경로}/Advanced/{변형이름} 컴포넌트 자동 생산 — {Agent 요약 첫 줄}
   ```
   커밋에는 산출물 파일 + manifest.json + ADVANCED_QUEUE.md를 모두 포함.

5. **실패 감지 — 즉시 중단**:
   - 파일 누락 → "Phase 2 파일 검증 실패: {누락 목록}" 보고
   - JSON 오류 → "manifest.json 파손: {오류}" 보고
   - Agent가 실패를 보고 → Agent 요약 그대로 사용자에게 전달
   - 실패 시 ADVANCED_QUEUE.md 상태는 **변경하지 않는다** (재실행 가능 보장)

---

### Phase 3. 다음 사이클

남은 "대기" 항목이 있으면 Phase 0부터 다시 실행. 없으면 종료.

---

## 종료 보고

모든 대상 소화 완료 시:

```
✅ 2D Advanced 전체 생산 완료.
생산된 변형: N개
커밋: N개
```

중단 시:

```
⚠️ 중단: {사유}
현재까지 생산: N개
마지막 대상: {경로}/Advanced/{변형이름}
큐 상태: "대기" 유지 (재실행 가능)
재개하려면 `/produce-advanced-auto`를 다시 실행하세요.
```

---

## 금지 사항

- ❌ 사용자에게 중간 승인 요청 (완전 자동 모드)
- ❌ 한 사이클 안에서 여러 변형 생산 (Agent는 반드시 1 변형만)
- ❌ Agent 호출 없이 메인이 직접 변형 생산
- ❌ 실패를 덮고 다음 사이클 진행
- ❌ Agent가 ADVANCED_QUEUE.md를 직접 수정 (메인 전담)
- ❌ 신규 Mixin 생성 (반복 패턴은 반환 메모로만)

---

## 참조 문서

- 수동 버전: `/.claude/skills/0-produce/produce-advanced-loop/SKILL.md` (승인 기반, 기존 유지)
- Phase 1.5 체크리스트 원전: 위 문서 lines 72~96
- 큐 후보 발굴: `/.claude/skills/0-produce/plan-advanced-queue/SKILL.md`
- 생산 프로세스: `/.claude/skills/0-produce/produce-component/SKILL.md`
- 2D 구현: `/.claude/skills/2-component/create-2d-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
