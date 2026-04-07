# Converting Issue - Figma → HTML/CSS 변환 시 발생한 문제 케이스

> 변환 작업 중 발생한 문제를 기록합니다.
> 각 케이스는 **문제 상황 → 원인 → 해결** 구조로 정리합니다.

---

## Case 001: flex gap + margin 이중 간격으로 섹션 높이 초과

**날짜:** 2026-04-07
**프로젝트:** DesignSystemGuide / Design system01-Dark

### 문제 상황

Figma 디자인에서 Form 섹션 아래에 있어야 할 하단 여백(92px)이 구현물에서 사라졌다. `padding-bottom: 92px`을 추가하면 여백이 생기지만, Figma를 그대로 구현했다면 자연스럽게 존재해야 하는 여백이었다.

### 원인

`.category-title`에 `margin-bottom: 24px`이 전역으로 설정되어 있었고, 이 요소가 `gap`이 적용된 flex 컨테이너(`.btn-group`, `.form-group`) 안에 들어가면서 **간격이 이중 적용**되었다.

```
.category-title { margin-bottom: 24px; }
.btn-group { display: flex; flex-direction: column; gap: 20px; }

→ category-title 다음 간격: margin(24px) + gap(20px) = 44px
→ Figma 의도: gap(20px)만
→ 초과: +24px
```

이 초과가 Buttons(2그룹 × 24px = 48px)와 Form(3그룹 × 24px = 72px)에서 누적되어 총 ~120px 초과. 섹션들이 아래로 밀리면서 92px 하단 여백을 잡아먹었다.

### 해결

flex 컨테이너 안에서는 `gap`이 간격을 처리하므로 자식의 `margin-bottom`을 제거했다.

```css
/* flex 컨테이너 안에서는 margin-bottom 제거 — gap이 간격 처리 */
.btn-group .category-title,
.form-group .category-title {
  margin-bottom: 0;
}
```

### 근본 원인 추적 방법

`padding-bottom` 같은 반창고를 붙이기 전에 Playwright로 각 섹션의 렌더링 높이를 측정하여 Figma 프레임 높이와 비교했다.

```javascript
// Playwright로 섹션별 높이 측정
const heights = await page.evaluate(() => {
  const el = document.querySelector('.section-form');
  return el.getBoundingClientRect().height;
});
// Figma 높이(436px)와 비교 → 차이가 있으면 내부 요소 추적
```

```
Section     | Rendered | Figma | Diff
------------|----------|-------|------
buttons     | 767px    | 727px | +40px  ← 문제
form        | 484px    | 436px | +48px  ← 문제

수정 후:
buttons     | 719px    | 727px | -8px   ← 개선
form        | 436px    | 436px | 0px    ← 정확히 일치
```

### 교훈

- **증상을 보지 말고 원인을 추적하라**: "여백이 없다" → `padding-bottom` 추가가 아니라, 왜 여백이 사라졌는지 근본 원인을 찾아야 한다
- **flex gap + margin 조합 주의**: flex 컨테이너에 `gap`이 있으면, 자식의 `margin`은 gap 위에 추가로 적용된다 (margin collapse 없음)
- **Playwright로 높이 측정**: 섹션별 `getBoundingClientRect().height`를 Figma metadata의 프레임 높이와 비교하면 어디서 차이가 발생하는지 빠르게 찾을 수 있다

---

## Case 002: 이전 페이지 구조를 복사하여 배경 패널을 잘못 추가

**날짜:** 2026-04-07
**프로젝트:** DesignSystemGuide / Design system02-Dark

### 문제 상황

DS01 Dark를 먼저 변환하고, DS02 Dark를 "같은 방식으로" 변환했다. DS01에는 다크 네이비 배경 패널(`#191d50`, `border-radius: 100px 0 0 100px`)이 있었기 때문에, DS02에도 동일한 배경 패널을 추가했다. 결과물의 배경이 원본보다 훨씬 어둡게 렌더링되었다.

### 원인

DS01과 DS02는 **동일한 디자인 시스템 파일의 서로 다른 페이지**이지만, 배경 구조가 다르다.

- **DS01**: 보라색 페이지 그라디언트 + 다크 네이비 배경 패널(`#191d50`) 오버레이
- **DS02**: 보라색 페이지 그라디언트만 사용 (배경 패널 없음)

DS01의 구조를 그대로 복사해서 시작했기 때문에, MCP 메타데이터에서 배경 패널 노드가 없다는 것을 확인하지 않고 `.design-system__background` 요소를 그대로 포함시켰다.

```
DS01 MCP 메타데이터:
  - rounded-rectangle (배경 패널): top=120, width=1841, height=2938, bg=#191d50 ← 존재

DS02 MCP 메타데이터:
  - 배경 패널 노드 없음 ← 페이지 그라디언트만 적용
  - 유일한 rounded-rectangle(209:3196): 96×10px, hidden=true ← 다른 용도
```

### 해결

HTML에서 `.design-system__background` div 제거, CSS에서 관련 스타일 제거.

### 교훈

- **이전 페이지의 구조를 복사하지 마라**: 같은 디자인 시스템 파일이라도 페이지마다 레이아웃 구조가 다를 수 있다. 반드시 해당 페이지의 MCP 메타데이터를 확인하고 구조를 결정해야 한다.
- **MCP 데이터가 유일한 원본**: "비슷하니까 같겠지"라는 추측은 금물. MCP에서 노드가 없으면 없는 것이다.
- **시각적 비교를 생략하지 마라**: Playwright 정량적 검증(높이 비교)만으로는 배경색 같은 시각적 차이를 발견할 수 없다. 반드시 Figma 원본 스크린샷과 구현 스크린샷을 섹션별로 비교해야 한다.
