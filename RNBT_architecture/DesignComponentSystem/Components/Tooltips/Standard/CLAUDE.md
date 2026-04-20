# Tooltips — Standard

## 기능 정의

1. **툴팁 내용 렌더링** — 짧은 레이블과 보조 설명을 임시 표면에 반영
2. **Trigger 기반 표시/숨김** — hover와 focus 진입 시 열고, 이탈 시 닫음
3. **배치 상태 반영** — `top`, `right`, `bottom`, `left` 배치를 dataset으로 반영
4. **표시/숨김 이벤트 발행** — 툴팁이 열리거나 닫힐 때 이벤트를 발행
5. **비모달 임시 표면 관리** — Shadow DOM 기반 툴팁 표면의 생성/정리와 애니메이션을 관리

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.tooltip-host` | 트리거 루트 |
| trigger | `.tooltip-host__trigger` | 툴팁을 여는 대상 |
| template | `#tooltip-popup-template` | 팝업 템플릿 |
| overlay | `.tooltip__overlay` | 팝업 레이어 |
| surface | `.tooltip__surface` | 툴팁 표면 |
| label | `.tooltip__label` | 주 텍스트 |
| supportingText | `.tooltip__supporting` | 보조 텍스트 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| tooltipInfo | `this.renderTooltipInfo` |

### 이벤트 (customEvents)

없음. 표시/숨김은 hover/focus 핸들러 안에서 직접 `Weventbus`로 발행한다.

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.normalizeTooltipInfo(payload)` | 텍스트와 배치 정보를 정규화 |
| `this.renderTooltipInfo(payload)` | 툴팁 텍스트와 배치를 반영 |
| `this.openTooltip()` | 툴팁을 표시 |
| `this.closeTooltip(reason)` | 툴팁을 숨김 |

### 데이터 계약

```javascript
{
  label: "Copy link",
  supportingText: "Create a shareable URL for this page.",
  placement: "top"
}
```

### 표시 규칙

- `label`이 비어 있으면 툴팁을 열지 않음
- `supportingText`가 비어 있으면 숨김 처리
- `placement`는 `top`, `right`, `bottom`, `left`만 허용하며 그 외 값은 `top`
- 표시 상태는 `surface[data-open]`, 배치는 `surface[data-placement]`에 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 글래스 블루 느낌의 floating tooltip |
| 02_material | B: Material Balance | 밝은 서피스 기반 기본 tooltip |
| 03_editorial | C: Editorial Utility | 타이포 중심의 절제된 tooltip |
| 04_operational | D: Operational Console | 다크 콘솔용 상태 강조 tooltip |
