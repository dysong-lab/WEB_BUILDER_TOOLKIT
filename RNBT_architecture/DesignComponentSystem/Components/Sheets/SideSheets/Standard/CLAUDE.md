# SideSheets — Standard

## 기능 정의

1. **측면 시트 표시/숨김** — `openSideSheet()`와 `closeSideSheet()`로 Shadow DOM 기반 측면 시트를 열고 닫는다
2. **시트 내용 반영** — headline, supportingText, body, primaryLabel, secondaryLabel 데이터를 팝업 내부 요소에 반영한다
3. **사용자 액션 이벤트** — scrim, 닫기, 보조 액션, 주요 액션 클릭 시 각각 대응 이벤트를 발행한다

---

## 구현 명세

### Mixin

ShadowPopupMixin, FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#side-sheet-popup-template` | Shadow DOM 템플릿 (규약) |
| overlay | `.side-sheet__overlay` | scrim 및 정렬 컨테이너 |
| surface | `.side-sheet__surface` | 측면 시트 패널 |
| headline | `.side-sheet__headline` | 제목 텍스트 |
| supportingText | `.side-sheet__supporting-text` | 보조 설명 |
| body | `.side-sheet__body` | 본문 텍스트 |
| closeBtn | `.side-sheet__close` | 닫기 버튼 |
| secondaryBtn | `.side-sheet__secondary` | 보조 액션 버튼 |
| primaryBtn | `.side-sheet__primary` | 주요 액션 버튼 |

### 구독 (subscriptions)

해당 없음. 페이지에서 `openSideSheet({ response })` 또는 `closeSideSheet()`를 직접 호출한다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `overlay` (popup selector) | `@sideSheetDismissed` |
| click | `closeBtn` (popup selector) | `@sideSheetClosed` |
| click | `secondaryBtn` (popup selector) | `@sideSheetSecondaryAction` |
| click | `primaryBtn` (popup selector) | `@sideSheetPrimaryAction` |

### 자체 속성

| 속성 | 용도 |
|------|------|
| `this._popupScope` | Shadow DOM 내부 렌더링용 래퍼 |
| `this._closeTimer` | 닫힘 애니메이션 타이머 |
| `this._sheetMotionDuration` | 열림/닫힘 애니메이션 시간 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderSideSheetContent(payload)` | payload의 response를 팝업 요소에 반영하고 빈 필드 hidden 상태를 동기화 |
| `this.openSideSheet(payload)` | payload를 렌더링하고 측면 시트를 표시 |
| `this.closeSideSheet()` | 애니메이션 후 측면 시트를 숨김 |

### 데이터 계약

```javascript
{
  headline: "Device details",
  supportingText: "Optional context stays visible beside the main view.",
  body: "The selected feeder is currently operating in supervised mode.",
  primaryLabel: "Inspect",
  secondaryLabel: "Dismiss"
}
```

### 페이지 연결 사례

```javascript
pageEventBusHandlers['@devicePeekRequested'] = ({ targetInstance }) => {
    targetInstance.openSideSheet({
        response: {
            headline: 'Device details',
            supportingText: 'Optional context stays visible beside the main view.',
            body: 'The selected feeder is currently operating in supervised mode.',
            primaryLabel: 'Inspect',
            secondaryLabel: 'Dismiss'
        }
    });
};

pageEventBusHandlers['@sideSheetPrimaryAction'] = ({ targetInstance }) => {
    targetInstance.closeSideSheet();
};

pageEventBusHandlers['@sideSheetSecondaryAction'] = ({ targetInstance }) => {
    targetInstance.closeSideSheet();
};

pageEventBusHandlers['@sideSheetDismissed'] = ({ targetInstance }) => {
    targetInstance.closeSideSheet();
};
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 깊이감 있는 기술형 우측 시트 |
| 02_material | B: Material Elevated | MD3 패널 감각의 라이트 측면 시트 |
| 03_editorial | C: Minimal Editorial | 넓은 여백과 정적 타이포 중심의 측면 시트 |
| 04_operational | D: Dark Operational | 밀집된 정보 확인용 관제형 측면 시트 |
