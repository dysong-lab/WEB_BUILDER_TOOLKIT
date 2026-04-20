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

> **일괄 모드 주의**: 일괄 모드는 "여러 UI 컴포넌트에 공통 적용 가능한 패턴"(= 기존 Mixin) 쪽으로 사고가 밀린다. 컴포넌트별 고유 상호작용(드래그 정렬, 제스처, 복잡 상태 머신, 애니메이션 전이 등)은 공통 패턴이 아니므로 레이더에서 밀릴 위험이 있다. 일괄 모드 실행 후 각 범주 대표 1~2개를 골라 단건 모드로 2차 탐색을 돌리는 **2단계 전략**을 권장한다.

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
- **이 단계에서 Mixin 카탈로그를 읽거나 참조하지 않는다.** 아래 ②의 수단 목록을 미리 보는 것도 금지.
- 위반 경보: "어떤 Mixin을 쓸까", "FieldRender로 될까"로 사고가 흐르면 즉시 멈추고 "이 컴포넌트에 어떤 사용자 경험이 필요한가"로 리셋.
- 예시 탐색축: 사용자가 하는 행위(클릭·드래그·스와이프·키입력) / 컴포넌트 상태 전이(확장·접힘·선택·로딩) / 발생하는 이벤트(외부 알림) / 외부에서 받는 데이터(토픽 구독) / 시간 기반 동작(애니메이션·자동 갱신).

**② 구현 수단 매핑** — ① 결과가 확정된 뒤에만 수행. 각 기능을 다음 중 하나로 분류:
- **기존 Mixin / Mixin 조합** — FieldRender, ListRender, ShadowPopup 등 이미 있는 Mixin으로 충족
- **커스텀 메서드** — 기존 Mixin으로 표현 불가, 컴포넌트 내부 메서드로 해결
- **신규 Mixin 필요** — 공통 재사용 가치가 있는 새 기능, 생산 시 `create-mixin-spec` 선행

참고용 Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`

**위임 프롬프트 배치 규칙** (중요):

Explore 에이전트는 프롬프트 상단에 배치된 내용을 앵커로 삼아 탐색 공간을 좁힌다. 아래 순서를 역순으로 배치하면 에이전트가 기존 Mixin에 편향되어 커스텀/신규 후보를 놓친다.

1. **상단**: 기능 발굴 원칙 + 컴포넌트 특성 + MD3/업계 UI 패턴 예시. 이 블록 내에 **"Mixin 존재 여부 고려 금지"** 문구를 명시.
2. **중단**: 사고 순서(① 기능 발굴 → ② 구현 수단 매핑).
3. **하단**: 참조용 Mixin 목록. 반드시 "**② 단계에서만 참조**"라는 주석과 함께.

**위임 프롬프트 구성 요소** (위 배치 순서로 작성):
- 대상 컴포넌트 목록과 각 컴포넌트의 Standard CLAUDE.md 내용
- 제외 목록 (Step 1에서 수집한 기존 변형)
- MD3 (Material Design 3) 명세에서 해당 컴포넌트의 variant/pattern
- 업계 UI 라이브러리의 확장 변형 사례 (예: AppBar searchEmbedded, Cards expandable/sortable, Dialogs fullscreen, Tables virtualScroll, Inputs masking)
- **Standard와 register.js 수준에서 다른 점이 있는 후보만 수집할 것** (Mixin 조합 / 구독 토픽 / 커스텀 메서드 / 발행 이벤트 중 하나 이상)
- **커스텀 메서드/신규 Mixin 후보도 동등하게 포함할 것** — 기존 Mixin으로 표현 가능한 것만 찾지 말 것

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

### Step 3.5. 탐색 커버리지 검증 (편향 경보)

Step 3 통과 후보 집합에서 구현 수단별 개수를 집계한다:

- 기존 Mixin / Mixin 조합
- 커스텀 메서드
- 신규 Mixin 필요

**편향 경보 조건**: `커스텀 메서드 + 신규 Mixin` 합계가 **0** 이면 탐색이 기존 Mixin에 편향되었을 가능성이 높다.

> Mixin 카탈로그가 미성숙한 단계에서 수십 종 UI 컴포넌트의 모든 Advanced 기능이 기존 N개 Mixin으로 커버된다면, 이는 성과가 아니라 **탐색 실패 신호**다. "100% 커버"를 긍정 신호로 읽지 않는다.

경보 발생 시 다음 중 하나를 반드시 수행:

1. **2차 패스 재탐색**: Explore에 "기존 Mixin으로 표현 불가한 기능만 찾아달라"는 별도 프롬프트로 재위임. 드래그 정렬, 제스처 인식, 키보드 네비게이션 확장, 가상 스크롤, 복잡 상태 머신 전이, 마스킹/포맷 입력 등 구체 예시 포함.
2. **사용자 보고**: Step 4 제시 전에 "커스텀/신규 0개 — 탐색이 기존 Mixin에 편향되었을 수 있음. 재탐색 진행 여부"를 명시적으로 확인.

경보 없이 Step 4로 진행하지 않는다.

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

**탐색 커버리지 요약** (표 아래에 의무적으로 함께 제시):

```
- 기존 Mixin / Mixin 조합: N개
- 커스텀 메서드:           N개
- 신규 Mixin 필요:         N개
```

커스텀 메서드 + 신규 Mixin 합계가 **0**이면 한 줄로 "⚠ 탐색 편향 경보 — 기존 Mixin에 한정된 결과" 명시한다 (Step 3.5에서 이미 재탐색/사용자 확인을 수행했더라도 Step 4 요약에 재기재).

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
