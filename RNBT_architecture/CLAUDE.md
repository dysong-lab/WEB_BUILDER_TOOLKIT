# CLAUDE.md - 런타임 프레임워크 작업 지침

## 개요

이 문서는 RNBT 런타임 프레임워크 작업 시 Claude Code가 따라야 할 **도메인 고유 지침**을 정의합니다.
일반적인 작업 태도/검증/추측 금지 원칙은 루트 `CLAUDE.md`를 따릅니다.

**설계 및 아키텍처 문서**: [README.md](/RNBT_architecture/README.md) 참조

---

## RNBT 고유 작업 규칙

### 관찰/의견과 지시를 구분합니다

런타임 작업 중 사용자는 코드를 읽으며 관찰을 공유하는 경우가 많습니다. 이것을 작업 지시로 오인하지 않습니다.

**예시**:
- ❌ 사용자: "loaded에서도 특별히 할일은 없어보이고," → 즉시 다음 작업 진행
- ✅ 사용자: "loaded에서도 특별히 할일은 없어보이고," → 동의하고 다음 지시 대기
- ❌ 사용자: "cleanup이 필요해보여" → 즉시 코드 수정
- ✅ 사용자: "cleanup이 필요해보여" → "추가할까요?" 확인 후 진행

### 작업의 목적에서 벗어나지 않습니다

- 현재 작업의 목적이 스타일링이 아니라면 스타일을 임의로 작성/수정하지 않습니다
- 목적에서 벗어나는 변경을 발견하면 스스로 점검하고 되돌립니다

### 기존 CSS/자산 파일이 있으면 그대로 사용합니다

- 새 스타일을 작성하기 전에 정적 CSS 파일이 이미 있는지 먼저 확인합니다
- 있으면 그대로 복사해서 사용합니다 (임의로 추가·삭제하지 않습니다)
- 가이드에 없는 스타일(background, box-shadow 등)을 임의로 추가하지 않습니다
- 셀렉터 변경 등 연결에 필수적인 수정만 합니다

### Advanced preview 상대경로를 깊이별로 검증합니다

- preview HTML을 만들 때 `preview_runtime.js`, `Mixins/*.js`, view/style 상대경로를 **폴더 깊이 기준으로 직접 계산**합니다
- 추측해서 Standard 경로를 복사하지 않습니다. `Standard/preview`와 `Advanced/<variant>/preview`는 깊이가 다릅니다
- **2D 컴포넌트 기준 규칙**
  - `Components/<Category>/<Component>/Standard/preview/*.html`
    - `preview_runtime.js` 경로: `../../../../../preview_runtime.js`
  - `Components/<Category>/<Component>/Advanced/<variant>/preview/*.html`
    - `preview_runtime.js` 경로: `../../../../../../preview_runtime.js`
    - `Mixins/*.js` 경로도 동일하게 `../../../../../../Mixins/...`
- `../views/...`, `../styles/...` 처럼 preview와 같은 세트 내부 파일은 현재 preview 폴더 기준으로 다시 계산합니다
- preview 작성 직후에는 최소한 다음 두 가지를 확인합니다
  - `<script src>` 상대경로가 실제 깊이와 일치하는가
  - `loadComponentAssets(..., "../views/...", "../styles/...")`가 현재 preview 폴더 기준으로 맞는가
- **금지 행위:** Standard preview의 `<script src>`를 Advanced preview에 그대로 복사
- **올바른 패턴:** “현재 파일이 `.../Advanced/<variant>/preview/` 아래에 있으므로 루트까지 6단계”처럼 계산 후 기입

---

*최종 업데이트: 2026-04-05*
