---
name: produce-standard-loop
description: DesignComponentSystem/Components 아래의 2D 컴포넌트를 폴더 알파벳 순서대로 Standard 생산합니다. 한 사이클에 하나를 생산하고, /compact 후 "계속"으로 다음 컴포넌트를 생산합니다.
---

# 2D Standard 컴포넌트 순차 생산

## 목표

DesignComponentSystem/Components 아래의 2D 컴포넌트를 폴더 알파벳 순서대로 Standard 생산한다.
한 사이클에 하나의 컴포넌트를 생산하고, 사용자가 `/compact` 후 "계속"을 입력하면 다음 컴포넌트를 생산한다.

---

## 사이클 절차

### Phase 0. 다음 대상 파악

범주 목록을 하드코딩하지 않고 **폴더 구조를 동적 감지**한다. 범주 폴더 안에 서브범주(Standard/Advanced 이외의 하위 디렉토리)가 있으면 depth 2, 없으면 depth 1로 자동 판별. `3D_Components`, `Charts`는 제외.

1. 전체 대상 목록 수집 (알파벳 순):
   ```bash
   cd RNBT_architecture/DesignComponentSystem/Components
   for d in */; do
       name="${d%/}"
       case "$name" in 3D_Components|Charts) continue ;; esac
       has_sub="N"
       for sub in "$d"*/; do
           [ -d "$sub" ] || continue
           subname="$(basename "$sub")"
           case "$subname" in Standard|Advanced) continue ;; esac
           has_sub="Y"
           echo "$name/$subname"
       done
       [ "$has_sub" = "N" ] && echo "$name"
   done | sort
   ```
   결과: `{컴포넌트경로}` 후보들 (예: `AppBars`, `Badges`, `Buttons/SplitButtons`, `Chips/Assist`).

2. 각 후보에 대해 Standard 완료 여부 확인:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/{컴포넌트경로}/Standard/scripts/register.js 2>/dev/null
   ```
   `register.js`가 없는 첫 번째 항목 = **다음 대상**.

3. **사용자에게 보고**: "다음 대상: {컴포넌트경로}/Standard"

---

### Phase 1. produce-component 실행

`produce-component` SKILL.md의 Step 1~5를 따른다.

**중요 — 승인 없이 진행하지 않는다:**
- Step 2 기능 분석 결과 → 사용자 승인
- Step 4 CLAUDE.md → 사용자 승인

**승인 축약 모드**: 사용자가 "ㅇ", "응", "확인", "ㄱ" 등 짧은 긍정 응답을 하면 승인으로 간주하고 다음으로 진행한다.

---

### Phase 2. 커밋

생산 완료 후 커밋한다.

```
feat: {컴포넌트경로} 컴포넌트 생산 — {한줄 설명}
```

---

### Phase 3. 사이클 종료

사용자에게 안내:

```
✅ {컴포넌트명}/Standard 생산 완료.
다음 대상: {다음 컴포넌트명}/Standard

`/compact` 실행 후 "계속"을 입력해주세요.
```

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

4개 페르소나(`01_refined` ~ `04_operational`)의 정의 · 필수 참고 CSS · 시각 토큰 원칙은 `produce-component/SKILL.md` **Step 5-1 "디자인 페르소나 & CSS 조달 규칙"**이 단일 진실 소스다. HTML/CSS 생성 사이클에서는 이 섹션이 지시하는 문서들을 모두 읽고 그 원칙을 따른다.

---

## 참조 문서 (매 사이클 읽기)

- `produce-component` SKILL: `/.claude/skills/0-produce/produce-component/SKILL.md`
- `create-2d-component` SKILL: `/.claude/skills/2-component/create-2d-component/SKILL.md`
- SHARED_INSTRUCTIONS: `/.claude/skills/SHARED_INSTRUCTIONS.md`
- CODING_STYLE: `/.claude/guides/CODING_STYLE.md`
- Mixin 카탈로그: `/RNBT_architecture/DesignComponentSystem/Mixins/README.md`
- 시스템 설계: `/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md`
