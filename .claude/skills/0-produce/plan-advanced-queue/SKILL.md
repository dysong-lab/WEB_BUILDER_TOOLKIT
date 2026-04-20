---
name: plan-advanced-queue
description: 2D 컴포넌트 Advanced 변형 후보를 발굴하여 ADVANCED_QUEUE.md에 등록합니다. 기존 Standard와의 분리 정당성을 검증한 후 사용자 승인을 거쳐 큐에 추가합니다. 생산은 담당하지 않습니다.
---

# Advanced 변형 기획 — ADVANCED_QUEUE.md 등록

## 목표

`Components/{컴포넌트경로}/Standard/`를 읽고, MD3 명세 및 업계 UI 패턴에서 Advanced 변형 후보를 발굴하여 `ADVANCED_QUEUE.md`에 "대기" 항목으로 등록한다.

**이 스킬은 큐 등록까지만 담당한다.** 생산은 `produce-advanced-loop`이 처리한다.

> **`{컴포넌트경로}`** = `Components/` 아래 컴포넌트 루트 상대경로. depth 1은 `<범주>` (예: `AppBars`), depth 2는 `<범주>/<서브범주>` (예: `Buttons/SplitButtons`). 2D Phase 0 규칙(`_shared/phase0-2d.md`)과 동일 표기.

### 스킬의 1차 목적: 기능 발굴 (Mixin 조합이 아님)

이 스킬의 목적은 **컴포넌트에 현실적으로 필요한 기능을 발굴하는 것**이다. Mixin 조합이나 기존 구현 수단은 사고의 출발점이 아니다.

- 먼저 "이 UI 컴포넌트에 어떤 확장 변형(상호작용/이벤트/상태)이 필요한가?"를 묻는다.
- 필요한 기능이 기존 Mixin 조합으로 표현 가능하면 → Mixin 조합으로 기재
- 기존 Mixin으로 표현 불가하면 → **커스텀 메서드** 또는 **신규 Mixin 필요**로 기재 (생산 시 `create-mixin-spec` 선행)

기존 Mixin 목록을 필터로 써서 후보를 한정하지 않는다. Mixin이 없는 기능도 빠짐없이 포함한다.

---

## 입력 모드

| 인수 | 의미 |
|------|------|
| (없음) | 모든 2D 컴포넌트를 일괄 탐색 |
| 컴포넌트경로 (예: `Cards`, `Buttons/SplitButtons`) | 해당 컴포넌트만 탐색 |

사용자가 컴포넌트경로를 지정하지 않으면 일괄 모드로 진행한다.
컴포넌트경로는 `Components/` 하위 실제 폴더 구조와 일치해야 한다 (대소문자 구분).

---

## 절차

### Step 1. 현황 수집

1. ADVANCED_QUEUE.md 전체 읽기 — 기존 등록 항목(대기/진행 중/완료) 목록화
2. 대상 컴포넌트별로 다음 확인:
   ```
   Components/{컴포넌트경로}/CLAUDE.md
   Components/{컴포넌트경로}/Standard/            (존재 여부 확인 — 필터 기준)
   Components/{컴포넌트경로}/Standard/CLAUDE.md   (있으면)
   Components/{컴포넌트경로}/Advanced/            (있으면 하위 변형 이름 수집)
   ```

   대상 컴포넌트 목록은 2D Phase 0 규칙(`_shared/phase0-2d.md`)의 순회 스크립트로 수집한다. depth 1 (예: `AppBars`) / depth 2 (예: `Buttons/SplitButtons`) 모두 동일 변수로 처리.

**Standard 선행 필터** (중요):
- **Standard 폴더가 없는 컴포넌트는 Advanced 후보 발굴 대상에서 제외한다.**
- Standard 구현 없이 Advanced를 기획하면 분리 정당성(register.js 차이)을 검증할 수 없기 때문.
- 제외된 컴포넌트는 Step 6에서 "Standard 선행 필요 — `produce-standard-loop`로 Standard 생산 후 `plan-advanced-queue` 재실행 권장" 안내와 함께 별도 보고한다.

**제외 대상**:
- **Standard 폴더가 존재하지 않는 컴포넌트** (위 필터)
- 이미 `Advanced/{변형}/` 폴더가 존재하는 변형
- 이미 큐에 "대기"/"진행 중"/"완료"로 등록된 변형
- `Components/3D_Components/` 하위 (3D 전용 큐 사용)

---

### Step 2. 후보 탐색 (Agent 위임)

Explore 에이전트에 위임하여 Advanced 후보를 발굴한다.

**사고 순서** (반드시 이 순서로):

**① 기능 발굴** — "이 UI 컴포넌트에 어떤 상호작용/상태/이벤트 확장이 필요한가?"
- MD3 variant/pattern, 업계 UI 라이브러리 패턴, 실제 사용 맥락에서 도출
- 이 단계에서는 **Mixin 존재 여부를 고려하지 않는다.** 기능이 먼저, 구현 수단은 그 다음.

**② 구현 수단 매핑** — 각 기능을 다음 중 하나로 분류:
- **기존 Mixin / Mixin 조합** — FieldRender, ListRender, ShadowPopup 등 이미 있는 Mixin으로 충족
- **커스텀 메서드** — 기존 Mixin으로 표현 불가, 컴포넌트 내부 메서드로 해결
- **신규 Mixin 필요** — 공통 재사용 가치가 있는 새 기능, 생산 시 `create-mixin-spec` 선행

**위임 프롬프트 구성 요소**:
- 대상 컴포넌트 목록과 각 컴포넌트의 Standard CLAUDE.md 내용
- 제외 목록 (Step 1에서 수집한 기존 변형)
- MD3 (Material Design 3) 명세에서 해당 컴포넌트의 variant/pattern
- 업계 UI 라이브러리의 확장 변형 사례 (예: AppBar searchEmbedded, Cards expandable, Dialogs fullscreen)
- **Standard와 register.js 수준에서 다른 점이 있는 후보만 수집할 것** (Mixin 조합 / 구독 토픽 / 커스텀 메서드 / 발행 이벤트 중 하나 이상)

**에이전트 반환 형식**: 각 후보에 대해
- 컴포넌트경로
- 변형 이름 (camelCase)
- **기능 설명** (무엇을 하는가)
- **구현 수단** (기존 Mixin 조합 / 커스텀 메서드 / 신규 Mixin 필요 중 하나, 개요 명시)
- Standard와의 차이 (Mixin 조합 / 구독 토픽 / 커스텀 메서드 / 발행 이벤트 중 어느 것)

**MD3 WebFetch 실패 시**: 학습 데이터 + WebSearch로 대체하고, 결과를 Step 4에서 사용자에게 검증받는다.

---

### Step 3. 분리 정당성 검증

각 후보를 다음 기준으로 평가한다:

| 질문 | 결과 |
|------|------|
| register.js가 Standard와 동일한가? (DOM/CSS만 다름) | → **제외** (Standard 내부 디자인 variant로 처리) |
| Mixin 조합, 구독 토픽, 커스텀 메서드, 발행 이벤트, 신규 Mixin 필요성 중 **최소 하나** 다른가? | → 후보 유지 |

**"기존 Mixin 없음" 자체는 탈락 사유가 아니다.** 커스텀 메서드로 해결하는 후보, 신규 Mixin 개발이 필요한 후보도 동등하게 통과시킨다. 분리의 핵심은 "register.js가 Standard와 다른가" 하나다.

근거가 모호한 후보는 제외한다. "확실히 다른 register.js가 필요한 경우"만 통과시킨다.

---

### Step 4. 사용자 검토 요청

승인 후보를 표로 제시한다. **기능 설명과 구현 수단을 분리**하여 기능 우선으로 읽히게 한다:

```
| # | 컴포넌트경로 | 변형 이름 | 기능 설명 | 구현 수단 | 분리 근거 |
|---|-------------|----------|----------|----------|----------|
| 1 | AppBars | searchEmbedded | 임베디드 검색 입력 AppBar | 커스텀 메서드 + 이벤트 발행 | @searchInputChanged/@searchCleared 이벤트 |
| 2 | Cards  | expandable     | 클릭 시 상세 내용 확장 Card | 커스텀 메서드 + 상태 관리 | toggle 메서드 추가 |
| 3 | Buttons/SplitButtons | dropdownMenu | 보조 액션 드롭다운 | 기존 Mixin: ShadowPopup + 이벤트 | 팝업 상태 관리 + 이벤트 |
| 4 | Cards | sortable | 드래그로 카드 순서 변경 | 신규 Mixin 필요 (DragSortMixin) | 신규 Mixin + 발행 이벤트 |
```

사용자에게 다음 중 선택받는다:
- 전체 승인 / 특정 번호만 승인 / 전체 거부
- 추가로 변형 이름/설명 수정 요청이 있으면 반영한다

**승인 축약 모드**: "ㅇ", "응", "확인", "ㄱ" = 전체 승인. 번호 나열(예: "1,3")은 해당 번호만 승인.

---

### Step 5. 큐 등록

승인된 항목만 ADVANCED_QUEUE.md 생산 대기열 표에 추가한다:

- 순번: 기존 최대 번호 + 1부터 증가
- 상태: `대기`
- 기존 항목은 건드리지 않는다

---

### Step 6. 완료 보고

```
{N}개 항목을 ADVANCED_QUEUE.md에 등록했습니다.
다음 단계: `/produce-advanced-loop`으로 순차 생산 시작.
```

**Standard 미구현 컴포넌트가 있었던 경우** 별도 섹션으로 함께 보고:

```
Standard 선행 필요 (Advanced 후보 발굴 제외):
- Cards, Lists, Buttons/SplitButtons, ...

해당 컴포넌트는 `produce-standard-loop`로 Standard를 먼저 생산한 뒤
`plan-advanced-queue`를 재실행하면 Advanced 후보가 발굴됩니다.
```

---

## Standard 내부 variant vs Advanced 판정 예시

| 변형 | 판정 | 이유 |
|------|------|------|
| AppBar small/medium/large (높이만 다름) | Standard variant | register.js 동일 |
| AppBar searchEmbedded | Advanced | 검색 입력 이벤트 추가 |
| Cards 색상/테두리 스타일 | Standard variant | DOM/CSS만 다름 |
| Cards expandable (클릭 시 확장) | Advanced | 커스텀 메서드 + 상태 관리 추가 |
| Dialogs 배경/크기 | Standard variant | 동일 register.js |
| Dialogs fullscreen (layout 변형 + 이벤트) | Advanced | register.js 차이 |

---

## 참조 문서

- ADVANCED_QUEUE.md: `/RNBT_architecture/DesignComponentSystem/Components/ADVANCED_QUEUE.md`
- 생산 루프: `/.claude/skills/0-produce/produce-advanced-loop/SKILL.md`
- 분리 정당성 기준 (Components CLAUDE.md): `/RNBT_architecture/DesignComponentSystem/Components/CLAUDE.md`
- MD3 참조: https://m3.material.io/
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
