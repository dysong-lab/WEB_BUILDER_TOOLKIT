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
| 출력 경로 | `<범주>/Standard/` | `<범주>/Advanced/<변형이름>/` |

2D Advanced는 3D와 달리 공통 변형 카탈로그가 없다. 각 변형은 컴포넌트별로 고유하게 기획되며, ADVANCED_QUEUE.md에 사전 등록된 항목만 생산한다.

---

## 사이클 절차

### Phase 0. 다음 대상 파악

1. ADVANCED_QUEUE.md 확인:
   ```
   경로: RNBT_architecture/DesignComponentSystem/Components/ADVANCED_QUEUE.md
   ```

2. 상태가 "대기"인 첫 번째 항목 = 다음 대상
   - 예: `AppBars | searchEmbedded | 임베디드 검색 입력 AppBar | 대기` → 대상: AppBars/Advanced/searchEmbedded

3. 완료된 Advanced 변형 교차 확인:
   ```bash
   find RNBT_architecture/DesignComponentSystem/Components -type d -path "*/Advanced/*" -not -path "*/3D_Components/*" | sort
   ```

4. **사용자에게 보고**: "다음 대상: {범주}/Advanced/{변형이름} — {설명}"

   큐가 비어있거나 "대기" 항목이 없으면: "ADVANCED_QUEUE.md에 대기 중인 항목이 없습니다. 신규 Advanced 변형이 필요하면 큐에 먼저 등록해주세요."

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**호출 스킬**: `create-2d-component`

**출력 경로**: `Components/{범주}/Advanced/{변형이름}/`

**Standard와의 분리 정당성 확인**: Advanced 변형은 Standard와 명백히 다른 register.js(Mixin 조합, 구독 토픽, 커스텀 메서드, 이벤트 중 하나 이상)를 가져야 한다. Step 2 기능 분석 시 이를 CLAUDE.md에 명시한다.

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

---

### Phase 2. 커밋

생산 완료 후 커밋한다.

```
feat: {범주}/Advanced/{변형이름} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. ADVANCED_QUEUE.md 업데이트 + 사이클 종료

1. ADVANCED_QUEUE.md에서 해당 항목의 상태를 "완료"로 변경
2. 사용자에게 안내:

```
{범주}/Advanced/{변형이름} 생산 완료.
다음 대상: {다음 범주}/Advanced/{다음 변형}

`/compact` 실행 후 "계속"을 입력해주세요.
```

---

## ADVANCED_QUEUE.md 형식

```markdown
# 2D 컴포넌트 Advanced 생산 대기열

| 순번 | 범주 | 변형 이름 | 설명 | 상태 |
|------|------|----------|------|------|
| 1 | AppBars | searchEmbedded | 임베디드 검색 입력 AppBar | 완료 |
| 2 | ... | ... | ... | 대기 |
```

**열 설명**:
- **범주**: `Components/{범주}/Advanced/`의 범주명 (예: AppBars, Cards, Dialogs)
- **변형 이름**: Advanced 폴더명 (camelCase 권장, 예: searchEmbedded, inlineEditable)
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
