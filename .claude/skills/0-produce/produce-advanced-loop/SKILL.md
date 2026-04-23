---
name: produce-advanced-loop
description: 2D 컴포넌트의 Advanced 변형을 ADVANCED_QUEUE.md 순서대로 순차 생산합니다. 한 사이클에 하나의 변형을 생산하고, /compact 후 "계속"으로 다음 변형을 생산합니다.
---

# 2D Advanced 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components 아래의 2D 컴포넌트 Advanced 변형을 `ADVANCED_QUEUE.md` 순서대로 생산한다.
한 사이클에 하나의 Advanced 변형을 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 변형으로 진행한다.

---

## Standard 루프와의 차이

| 측면 | Standard 루프 | Advanced 루프 (이 문서) |
|------|--------------|------------------------|
| 대상 결정 | 폴더 알파벳 순회 | **ADVANCED_QUEUE.md 명시적 대기열** |
| 변형 이름 | 고정 (`Standard/`) | **컴포넌트별 고유** (예: `searchEmbedded`) |
| 공통 카탈로그 | 없음 (범주 자체가 카탈로그) | 없음 — 큐에 개별 등록 필요 |
| 출력 경로 | `<컴포넌트경로>/Standard/` | `<컴포넌트경로>/Advanced/<변형이름>/` |

> **`<컴포넌트경로>`** = depth 1은 `<범주>` (예: `AppBars`), depth 2는 `<범주>/<서브범주>` (예: `Buttons/SplitButtons`). 2D Phase 0 규칙과 동일([`_shared/phase0-2d.md`](../_shared/phase0-2d.md)).

2D Advanced는 3D와 달리 공통 변형 카탈로그가 없다. 각 변형은 컴포넌트별로 고유하게 기획되며, ADVANCED_QUEUE.md에 사전 등록된 항목만 생산한다.

---

## 사이클 절차

### Phase 0. 다음 대상 파악

1. ADVANCED_QUEUE.md 확인:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/ADVANCED_QUEUE.md
   ```

2. 상태가 "대기"인 첫 번째 항목 = 다음 대상
   - 예(depth 1): `AppBars | searchEmbedded | ... | 대기` → 대상: `AppBars/Advanced/searchEmbedded`
   - 예(depth 2): `Buttons/SplitButtons | dropdownMenu | ... | 대기` → 대상: `Buttons/SplitButtons/Advanced/dropdownMenu`

3. 완료된 Advanced 변형 교차 확인:
   ```bash
   find RNBT_architecture/DesignComponentSystem/Components -type d -path "*/Advanced/*" -not -path "*/3D_Components/*" | sort
   ```

4. **사용자에게 보고**: "다음 대상: {컴포넌트경로}/Advanced/{변형이름} — {설명}"

   큐가 비어있거나 "대기" 항목이 없으면: "ADVANCED_QUEUE.md에 대기 중인 항목이 없습니다. 신규 Advanced 변형이 필요하면 큐에 먼저 등록해주세요."

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**호출 스킬**: `create-2d-component`

**출력 경로**: `Components/{컴포넌트경로}/Advanced/{변형이름}/`

**Standard와의 분리 정당성 확인**: Advanced 변형은 Standard와 명백히 다른 register.js(Mixin 조합, 구독 토픽, 커스텀 메서드, 이벤트 중 하나 이상)를 가져야 한다. Step 2 기능 분석 시 이를 CLAUDE.md에 명시한다.

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

---

### Phase 1.5. 기존 변형과의 패턴 대조 (Commit 직전 필수)

Phase 1 생산이 끝나면 **커밋 직전에** 아래 체크리스트로 동일 범주(또는 유사 Mixin 조합) 기존 Advanced 변형과의 일관성을 검증한다. 이 단계를 생략하면 사소한 규약 drift가 commit 이후 별도 refactor 커밋으로 이어진다.

#### 1. 비교 대상 선정

- **동일 범주의 완료 Advanced 변형**이 있으면 최우선 기준으로 삼는다 (예: 신규가 `AppBars/Advanced/contextual` → 기준: `AppBars/Advanced/searchEmbedded`).
- 동일 범주에 없으면 **동일 Mixin 조합을 쓰는 다른 범주의 Advanced 변형**을 기준으로 삼는다.
- 어느 쪽도 없으면(최초 케이스) Standard register.js와의 차이점이 CLAUDE.md "Standard와의 분리 정당성"에 명시되었는지 확인한다.

#### 2. 대조 체크리스트

| # | 항목 | 관례 |
|---|------|------|
| 1 | **register.js 평탄 작성** | 저장소 전체 register.js는 top-level 평탄 작성이다. IIFE·수동 클로저로 감싸지 않는다. |
| 2 | **cssSelectors 계약** | CLAUDE.md에 선언된 KEY를 view HTML이 모두 제공하고, register.js의 Mixin 옵션이 동일 KEY 집합을 사용한다. |
| 3 | **subscriptions 핸들러 배선** | 구독 토픽이 실제 페이지에서 publish되는 이름과 일치하고, 핸들러가 Mixin이 제공하는 것(예: `this.xxx.renderData`)을 가리키는가. |
| 4 | **customEvents 이름 일관성** | `@camelCaseEvent` 규약 + CLAUDE.md "이벤트" 표와 실제 발행 이름 일치. |
| 5 | **beforeDestroy.js 정리 순서** | 구독 해제 → `removeCustomEvents` → `this.xxx?.destroy()` 순서. self-null을 수행하는 Mixin destroy는 호출만, 그렇지 않은 것은 beforeDestroy에서 명시 null. 기존 변형의 순서/방식과 대조. |
| 6 | **컨테이너 CSS 규칙** | `#[component]-container`의 width/height/overflow와 CSS nesting 패턴이 기존 변형과 같은 구조. preview에는 컨테이너 크기를 인라인으로 두지 않는다. |
| 7 | **manifest·ADVANCED_QUEUE 2중 등록** | 두 곳 모두에 변형이 기재되어 있고 spec/preview 경로가 실제 파일과 일치. |

#### 3. 실패 처리

항목 중 하나라도 drift가 있으면 **커밋 이전**에 정정한다. 커밋 이후 수정은 별도 refactor 커밋으로 git log를 늘린다.

---

### Phase 2. 커밋

생산 완료 후 커밋한다.

```
feat: {컴포넌트경로}/Advanced/{변형이름} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. ADVANCED_QUEUE.md 업데이트 + 사이클 종료

1. ADVANCED_QUEUE.md에서 해당 항목의 상태를 "완료"로 변경
2. 사용자에게 안내:

```
{컴포넌트경로}/Advanced/{변형이름} 생산 완료.
다음 대상: {다음 컴포넌트경로}/Advanced/{다음 변형}

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## ADVANCED_QUEUE.md 형식

```markdown
# 2D 컴포넌트 Advanced 생산 대기열

| 순번 | 컴포넌트경로 | 변형 이름 | 설명 | 상태 |
|------|-------------|----------|------|------|
| 1 | AppBars | searchEmbedded | 임베디드 검색 입력 AppBar | 완료 |
| 2 | Buttons/SplitButtons | ... | ... | 대기 |
```

**열 설명**:
- **컴포넌트경로**: `Components/` 아래 컴포넌트 루트 상대경로. depth 1 (예: `AppBars`, `Cards`) / depth 2 (예: `Buttons/SplitButtons`, `Chips/Assist`) 모두 이 한 컬럼으로 기재.
- **변형 이름**: Advanced 폴더명 (camelCase 권장, 예: `searchEmbedded`, `inlineEditable`)
- **설명**: 한 줄 기능 요약 (Standard와 분리해야 할 이유가 드러나야 함)
- **상태**: 대기 / 진행 중 / 완료

---

## 컨테이너 CSS 규칙

모든 컴포넌트는 다음 공통 구조를 따른다:

```css
#[component]-container {
    width: Npx;
    height: Npx;
    overflow: auto;

    .내부요소 {
        /* CSS nesting으로 내부 스타일 */
    }
}
```

프리뷰에서는 컨테이너 크기를 인라인으로 지정하지 않는다 (컴포넌트 CSS가 담당).

---

## 디자인 페르소나 & CSS 조달 규칙

4개 페르소나(`01_refined` ~ `04_operational`)의 정의 · 필수 참고 CSS · 시각 토큰 원칙은 `produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**이 단일 진실 소스다. Advanced 변형에서도 페르소나별 HTML/CSS를 생성할 때 동일하게 따른다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-2d-component` SKILL: `/.claude/skills/2-component/create-2d-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
