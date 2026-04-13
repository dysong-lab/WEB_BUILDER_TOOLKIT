---
name: plan-advanced-queue
description: 2D 컴포넌트 Advanced 변형 후보를 발굴하여 ADVANCED_QUEUE.md에 등록합니다. 기존 Standard와의 분리 정당성을 검증한 후 사용자 승인을 거쳐 큐에 추가합니다. 생산은 담당하지 않습니다.
---

# Advanced 변형 기획 — ADVANCED_QUEUE.md 등록

## 목표

`Components/{범주}/Standard/`를 읽고, MD3 명세 및 업계 UI 패턴에서 Advanced 변형 후보를 발굴하여 `ADVANCED_QUEUE.md`에 "대기" 항목으로 등록한다.

**이 스킬은 큐 등록까지만 담당한다.** 생산은 `produce-advanced-loop`이 처리한다.

---

## 입력 모드

| 인수 | 의미 |
|------|------|
| (없음) | 모든 2D 범주를 일괄 탐색 |
| 범주명 (예: `Cards`) | 해당 범주만 탐색 |

사용자가 범주를 지정하지 않으면 일괄 모드로 진행한다.
범주명은 `Components/` 하위 폴더명과 일치해야 한다 (대소문자 구분).

---

## 절차

### Step 1. 현황 수집

1. ADVANCED_QUEUE.md 전체 읽기 — 기존 등록 항목(대기/진행 중/완료) 목록화
2. 대상 범주별로 다음 확인:
   ```
   Components/{범주}/CLAUDE.md
   Components/{범주}/Standard/CLAUDE.md   (있으면)
   Components/{범주}/Advanced/             (있으면 하위 변형 이름 수집)
   ```

**제외 대상**:
- 이미 `Advanced/{변형}/` 폴더가 존재하는 변형
- 이미 큐에 "대기"/"진행 중"/"완료"로 등록된 변형
- `Components/3D_Components/` 하위 범주 (3D 전용 큐 사용)

---

### Step 2. 후보 탐색 (Agent 위임)

Explore 에이전트에 위임하여 Advanced 후보를 발굴한다.

**위임 프롬프트 구성 요소**:
- 대상 범주 목록과 각 범주의 Standard CLAUDE.md 내용
- 제외 목록 (Step 1에서 수집한 기존 변형)
- MD3 (Material Design 3) 명세에서 해당 범주의 variant/pattern
- 업계 UI 라이브러리의 확장 변형 사례 (예: AppBar searchEmbedded, Cards expandable, Dialogs fullscreen)
- **Standard와 register.js 수준에서 다른 점이 있는 후보만 수집할 것**

**에이전트 반환 형식**: 각 후보에 대해
- 범주
- 변형 이름 (camelCase)
- 한 줄 설명
- Standard와의 차이 (Mixin 조합 / 구독 토픽 / 커스텀 메서드 / 발행 이벤트 중 어느 것)

**MD3 WebFetch 실패 시**: 학습 데이터 + WebSearch로 대체하고, 결과를 Step 4에서 사용자에게 검증받는다.

---

### Step 3. 분리 정당성 검증

각 후보를 다음 기준으로 평가한다:

| 질문 | 결과 |
|------|------|
| register.js가 Standard와 동일한가? (DOM/CSS만 다름) | → **제외** (Standard 내부 디자인 variant로 처리) |
| Mixin 조합, 구독 토픽, 커스텀 메서드, 발행 이벤트 중 **최소 하나** 다른가? | → 후보 유지 |

근거가 모호한 후보는 제외한다. "확실히 다른 register.js가 필요한 경우"만 통과시킨다.

---

### Step 4. 사용자 검토 요청

승인 후보를 표로 제시한다:

```
| # | 범주 | 변형 이름 | 설명 | 분리 근거 |
|---|------|----------|------|----------|
| 1 | AppBars | searchEmbedded | 임베디드 검색 입력 AppBar | @searchInputChanged/@searchCleared 이벤트 발행 |
| 2 | Cards  | expandable     | 클릭 시 상세 내용 확장 Card | toggle 커스텀 메서드 + 상태 관리 |
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
