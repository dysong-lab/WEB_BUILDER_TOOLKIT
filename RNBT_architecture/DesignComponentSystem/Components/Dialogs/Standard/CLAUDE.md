# Dialogs — Standard

## 기능 정의

1. **대화상자 표시/숨김** — `openDialog()`과 `closeDialog()`로 Shadow DOM 기반 모달을 열고 닫는다
2. **대화상자 내용 반영** — headline, supportingText, confirmLabel, cancelLabel 데이터를 팝업 내부 요소에 반영한다
3. **사용자 액션 이벤트** — scrim, 취소, 확인, 닫기 버튼 클릭 시 각각 대응 이벤트를 발행한다

---

## 구현 명세

### Mixin

ShadowPopupMixin, FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#dialog-popup-template` | Shadow DOM 템플릿 (규약) |
| overlay | `.dialog__overlay` | scrim 클릭 감지 |
| surface | `.dialog__surface` | 대화상자 패널 |
| headline | `.dialog__headline` | 제목 텍스트 |
| supportingText | `.dialog__supporting-text` | 본문 텍스트 |
| closeBtn | `.dialog__close` | 닫기 버튼 |
| cancelBtn | `.dialog__cancel` | 취소 버튼 |
| confirmBtn | `.dialog__confirm` | 확인 버튼 |

### 구독 (subscriptions)

해당 없음. 페이지에서 `openDialog({ response })` 또는 `closeDialog()`를 직접 호출한다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `overlay` (popup selector) | `@dialogDismissed` |
| click | `closeBtn` (popup selector) | `@dialogClosed` |
| click | `cancelBtn` (popup selector) | `@dialogCancelled` |
| click | `confirmBtn` (popup selector) | `@dialogConfirmed` |

### 자체 속성

| 속성 | 용도 |
|------|------|
| `this._popupScope` | Shadow DOM 내부 렌더링용 래퍼 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.openDialog(payload)` | payload의 `response`를 렌더링하고 팝업 표시 |
| `this.closeDialog()` | 팝업 숨김 |

### 페이지 연결 사례

```javascript
pageEventBusHandlers['@deleteRequested'] = ({ targetInstance }) => {
    targetInstance.openDialog({
        response: {
            headline: 'Delete this device?',
            supportingText: 'This action cannot be undone.',
            confirmLabel: 'Delete',
            cancelLabel: 'Keep'
        }
    });
};

pageEventBusHandlers['@dialogConfirmed'] = ({ targetInstance }) => {
    targetInstance.closeDialog();
    // 삭제 실행
};

pageEventBusHandlers['@dialogCancelled'] = ({ targetInstance }) => {
    targetInstance.closeDialog();
};
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 보랏빛 대비와 부드러운 글로우를 가진 다크 다이얼로그 |
| 02_material | B: Material Elevated | 라이트 서피스와 블루 액션 톤의 MD3 정석형 |
| 03_editorial | C: Minimal Editorial | 넓은 여백과 세리프 제목 중심의 편집형 |
| 04_operational | D: Dark Operational | 경고성 액션 대비가 강한 컴팩트 운영형 |
