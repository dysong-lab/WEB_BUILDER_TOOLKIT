# BottomSheets — Standard

## 기능 정의

1. **하단 시트 표시/숨김** — `openBottomSheet()`와 `closeBottomSheet()`로 Shadow DOM 기반 하단 시트를 열고 닫는다
2. **시트 내용 반영** — headline, supportingText, body, primaryLabel, secondaryLabel 데이터를 팝업 내부 요소에 반영한다
3. **사용자 액션 이벤트** — scrim, 닫기, 보조 액션, 주요 액션 클릭 시 각각 대응 이벤트를 발행한다

---

## 구현 명세

### Mixin

ShadowPopupMixin, FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#bottom-sheet-popup-template` | Shadow DOM 템플릿 (규약) |
| overlay | `.bottom-sheet__overlay` | scrim 및 정렬 컨테이너 |
| surface | `.bottom-sheet__surface` | 하단 시트 패널 |
| headline | `.bottom-sheet__headline` | 제목 텍스트 |
| supportingText | `.bottom-sheet__supporting-text` | 보조 설명 |
| body | `.bottom-sheet__body` | 본문 텍스트 |
| closeBtn | `.bottom-sheet__close` | 닫기 버튼 |
| secondaryBtn | `.bottom-sheet__secondary` | 보조 액션 버튼 |
| primaryBtn | `.bottom-sheet__primary` | 주요 액션 버튼 |

### 구독 (subscriptions)

해당 없음. 페이지에서 `openBottomSheet({ response })` 또는 `closeBottomSheet()`를 직접 호출한다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `overlay` (popup selector) | `@bottomSheetDismissed` |
| click | `closeBtn` (popup selector) | `@bottomSheetClosed` |
| click | `secondaryBtn` (popup selector) | `@bottomSheetSecondaryAction` |
| click | `primaryBtn` (popup selector) | `@bottomSheetPrimaryAction` |

### 자체 속성

| 속성 | 용도 |
|------|------|
| `this._popupScope` | Shadow DOM 내부 렌더링용 래퍼 |
| `this._closeTimer` | 닫힘 애니메이션 타이머 |
| `this._sheetMotionDuration` | 열림/닫힘 애니메이션 시간 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderBottomSheetContent(payload)` | payload의 response를 팝업 요소에 반영하고 빈 필드 hidden 상태를 동기화 |
| `this.openBottomSheet(payload)` | payload를 렌더링하고 하단 시트를 표시 |
| `this.closeBottomSheet()` | 애니메이션 후 하단 시트를 숨김 |

### 데이터 계약

```javascript
{
  headline: "Report actions",
  supportingText: "Choose what to do with the selected report.",
  body: "Exports keep the current filters and annotations.",
  primaryLabel: "Run export",
  secondaryLabel: "Later"
}
```

### 페이지 연결 사례

```javascript
pageEventBusHandlers['@reportActionRequested'] = ({ targetInstance }) => {
    targetInstance.openBottomSheet({
        response: {
            headline: 'Report actions',
            supportingText: 'Choose what to do with the selected report.',
            body: 'Exports keep the current filters and annotations.',
            primaryLabel: 'Run export',
            secondaryLabel: 'Later'
        }
    });
};

pageEventBusHandlers['@bottomSheetPrimaryAction'] = ({ targetInstance }) => {
    targetInstance.closeBottomSheet();
};

pageEventBusHandlers['@bottomSheetSecondaryAction'] = ({ targetInstance }) => {
    targetInstance.closeBottomSheet();
};

pageEventBusHandlers['@bottomSheetDismissed'] = ({ targetInstance }) => {
    targetInstance.closeBottomSheet();
};
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 기술적 색조와 라운드 대형 서피스의 다크 하단 시트 |
| 02_material | B: Material Elevated | MD3 카드 감각의 라이트 하단 시트 |
| 03_editorial | C: Minimal Editorial | 넓은 여백과 샤프한 비율의 에디토리얼 하단 시트 |
| 04_operational | D: Dark Operational | 컴팩트한 정보 밀도의 관제형 하단 시트 |
