# Tooltips — Standard

## 기능 정의

1. **라벨 텍스트 렌더링** — `tooltipInfo` 토픽으로 수신한 단일 객체(`label`)를 툴팁 라벨 영역의 textContent에 반영
2. **표시/숨김 상태 제어** — 페이지가 루트 요소의 `data-open` 속성을 토글하여 노출 여부 제어 (hover/focus 트리거, 자동 dismiss 타이머, 위치 계산 모두 페이지 책임)

---

## 구현 명세

### Mixin

FieldRenderMixin

- FieldRenderMixin — 라벨 텍스트 렌더링 (단일 객체: `label`)

> Tooltip Standard는 **Plain(label 텍스트만)** 유형이다. MD3 Rich(title + supporting + action)는 Advanced로 분리한다. 앵커 요소 기준 위치 지정은 페이지가 수행하고, 컴포넌트는 자신의 루트만 배치 스타일을 제공한다. Snackbar와 마찬가지로 inline 배치로 충분하여 ShadowPopupMixin을 사용하지 않는다.

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| tooltip | `.tooltip`        | 툴팁 루트 (페이지가 `data-open` 토글 대상 — 데이터 없이 참조만) |
| label   | `.tooltip__label` | 라벨 텍스트 (MD3 Plain의 label text) |

### datasetAttrs

없음 (dataset은 페이지가 직접 제어)

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tooltipInfo | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

없음

> MD3 Plain Tooltip은 버튼/링크 등 상호작용 요소를 포함하지 않는다. hover/focus/long-press 트리거 자체는 앵커(트리거) 요소의 책임이며, 툴팁 컴포넌트는 "라벨을 보여주는 것"만 담당한다.

### 커스텀 메서드

없음 (자동 dismiss 타이머, 위치 계산, 앵커 이벤트 바인딩은 페이지 책임)

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('tooltipInfo', this)──> [Tooltip] 라벨 렌더링
         publish data: { label: 'Save draft' }

[페이지] ──앵커 mouseenter/focus 시:──>
         1) 위치 계산 (앵커 bounding rect + placement)
         2) rootEl.style.left/top = 계산값
         3) rootEl.dataset.open = 'true'
         4) setTimeout(1500ms)으로 자동 dismiss 타이머 (MD3 기본)

[페이지] ──앵커 mouseleave/blur 또는 타이머 만료:──>
         rootEl.dataset.open = 'false'
```

> **자동 dismiss 1500ms** — MD3 기본 (Compose Material 3 `TooltipDefaults.DEFAULT_TOOLTIP_DURATION`). 페이지 레벨 `setTimeout` 체이닝으로 구현한다 (CODING_STYLE.md "주기적 실행" 패턴 참조).
>
> **위치 지정** — 앵커 요소의 `getBoundingClientRect()`와 placement(top/bottom/left/right)를 페이지가 계산한다. Standard는 caret(화살표)을 갖지 않는다 (caret은 Advanced/Rich 범주).

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 8px 라운드 알약형, 그라디언트 바탕 |
| 02_material    | B: Material Elevated | 인버스 서피스(다크), Roboto, border-radius 4px + shadow elevation |
| 03_editorial   | C: Minimal Editorial | 웜 아이보리 배경, Georgia 세리프, border-radius 0 + 헤어라인 테두리 |
| 04_operational | D: Dark Operational  | 다크 시안 컴팩트, JetBrains Mono, 2px 각진 테두리 + 고밀도 12px |

### MD3 근거

- Plain tooltips describe elements or actions of icon buttons; Rich tooltips provide more detail and may include optional title, link, and buttons.
- Tooltips are dismissed automatically after 1500 milliseconds, or on user touch, or manually from code.
- Anatomy: **container + label text** (+ optional caret — Advanced 범주).
- 출처: Material Design 3 Tooltips (m3.material.io/components/tooltips — SPA 렌더링으로 본문 WebFetch 실패), Compose Material 3 공식 레퍼런스 `TooltipBox` / `PlainTooltip` / `RichTooltip` 및 droidcon "Tooltips in Compose Material 3" (2025-05) 교차 검증. 자동 dismiss 1500ms는 Compose `TooltipDefaults.DEFAULT_TOOLTIP_DURATION` 값.
