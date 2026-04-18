# 2D Phase 0 — 다음 대상 파악 (공통 규칙)

> 이 문서는 `produce-standard-loop` / `produce-standard-auto`가 공통으로 참조하는 Phase 0 대상 결정 규칙이다. 두 SKILL 모두 이 규칙을 따른다.

## 대상 범위

- **대상 루트**: `RNBT_architecture/DesignComponentSystem/Components/`
- **제외 범주**: `3D_Components/`, `Charts/`

## 범주 깊이 판별

범주 폴더 안에 **서브범주**(`Standard/`, `Advanced/` 이외의 하위 디렉토리)가 있으면 **depth 2**, 없으면 **depth 1**로 자동 판별한다.

- depth 1 예: `AppBars`, `Badges`, `Cards`, `Dialogs` (범주 바로 밑에 Standard/ Advanced/)
- depth 2 예: `Buttons/SplitButtons`, `Chips/Assist`, `Navigation/NavigationRail` (범주 밑에 서브범주가 있고, 서브범주 밑에 Standard/)

하드코딩 목록을 두지 않는다 — 새 범주/서브범주가 추가되면 자동으로 감지된다.

## 순회 스크립트

1. **전체 대상 목록 수집 (알파벳 순)** — 세션 cwd를 바꾸지 않기 위해 서브셸로 격리한다:
   ```bash
   (cd RNBT_architecture/DesignComponentSystem/Components && for d in */; do
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
   done | sort)
   ```
   결과 = `{컴포넌트경로}` 후보 목록 (예: `AppBars`, `Badges`, `Buttons/SplitButtons`, `Chips/Assist`).

2. **각 후보에 대해 Standard 완료 여부 확인**:
   ```bash
   ls RNBT_architecture/DesignComponentSystem/Components/{컴포넌트경로}/Standard/scripts/register.js 2>/dev/null
   ```
   `register.js`가 없는 첫 번째 항목 = **다음 대상**.

3. 남은 대상이 없으면 **전체 루프 종료**.

## 경로 변수

- `{컴포넌트경로}`: 위 스크립트 결과의 한 항목. `Components/` 아래 컴포넌트 루트 상대경로.
  - depth 1: `{범주}` (예: `AppBars`)
  - depth 2: `{범주}/{서브범주}` (예: `Buttons/SplitButtons`)

> 호출 SKILL은 Phase 0 완료 후 사용자에게 `"다음 대상: {컴포넌트경로}/Standard"` 형태로 보고한다.
