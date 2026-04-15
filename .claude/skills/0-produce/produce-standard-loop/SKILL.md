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

1. 완료된 컴포넌트 확인:
   ```bash
   find RNBT_architecture/DesignComponentSystem/Components -name "register.js" -path "*/Standard/scripts/*" | sort
   ```

2. 전체 2D 범주 폴더 확인 (3D_Components, Charts 제외):
   ```bash
   ls -d RNBT_architecture/DesignComponentSystem/Components/*/
   ```

3. depth 2 범주(하위 범주가 있는 것)는 하위 범주 각각을 순회:
   - Buttons: ButtonGroups, Buttons, ExtendedFABs, FAB, FABMenu, IconButtons, SegmentedButtons, SplitButtons
   - Chips: Assist, Filter, Input, Suggestion
   - Loading: LoadingIndicator, ProgressIndicators
   - Navigation: NavigationBar, NavigationDrawer, NavigationRail
   - Sheets: BottomSheets, SideSheets
   - Sliders: Basic, Centered, Range

4. 알파벳 순서 전체 목록에서 register.js가 없는 첫 번째 항목 = 다음 대상

5. **사용자에게 보고**: "다음 대상: {범주}/{하위범주 또는 컴포넌트명}/Standard"

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

## 전체 진행표 (참조용)

사이클 시작 시 Phase 0에서 동적으로 파악하므로 이 표는 참조용이다.

```
depth 1 (하위 범주 없음):
  AppBars, Cards, Checkbox, Dialogs, Divider, Lists, Menus,
  Radio, Search, Snackbar, Switch, Tables, Tabs,
  TextFields, Toolbars, Tooltips, Trees

depth 2 (하위 범주 순회):
  Buttons/{ButtonGroups,Buttons,ExtendedFABs,FAB,FABMenu,IconButtons,SegmentedButtons,SplitButtons}
  Chips/{Assist,Filter,Input,Suggestion}
  Loading/{LoadingIndicator,ProgressIndicators}
  Navigation/{NavigationBar,NavigationDrawer,NavigationRail}
  Sheets/{BottomSheets,SideSheets}
  Sliders/{Basic,Centered,Range}
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
