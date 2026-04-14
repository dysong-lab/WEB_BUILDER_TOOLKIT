# Menus — Standard

## 기능 정의

1. **메뉴 표시/숨김** — `openMenu()`와 `closeMenu()`로 Shadow DOM 기반 팝업을 열고 닫는다
2. **항목 목록 렌더링** — 배열 데이터를 template 기반으로 메뉴 항목으로 반복 렌더링한다
3. **항목 비활성화** — `disabled: true`인 항목은 클릭 불가 상태로 표시한다
4. **항목 선택 이벤트** — 활성화된 항목 클릭 시 `@menuItemSelected` 이벤트를 발행한다
5. **외부 클릭 닫기** — overlay 영역(surface 바깥) 클릭 시 메뉴를 닫고 `@menuDismissed`를 발행한다

---

## 구현 명세

### Mixin

ShadowPopupMixin, ListRenderMixin (팝업 내부)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#menu-popup-template` | Shadow DOM 템플릿 (규약) |
| overlay | `.menu__overlay` | 전체 화면 ooverlay (scrim) |
| surface | `.menu__surface` | 메뉴 패널 |
| item | `.menu__item` | 개별 메뉴 항목 (이벤트 위임 대상) |
| container | `.menu__list` | ListRenderMixin 컨테이너 |
| itemTemplate | `#menu-item-template` | ListRenderMixin 항목 템플릿 |
| icon | `.menu__item-icon` | 항목 아이콘 |
| label | `.menu__item-label` | 항목 레이블 |

### 구독 (subscriptions)

해당 없음. 페이지에서 `openMenu({ response })` 또는 `closeMenu()`를 직접 호출한다.

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `overlay` (popup 내부, surface 바깥) | `@menuDismissed` |
| click | `item` (disabled가 아닌 항목) | `@menuItemSelected` |

### 자체 속성

| 속성 | 용도 |
|------|------|
| `this._popupScope` | Shadow DOM 내부 렌더링용 래퍼 (ListRenderMixin 적용) |
| `this._motionDuration` | 닫힘 애니메이션 지속 시간 (ms) |
| `this._motionTimer` | 닫힘 타이머 핸들 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.openMenu(payload)` | `payload.response.items` 배열로 항목을 렌더링하고 팝업 표시 |
| `this.closeMenu()` | 애니메이션 후 팝업 숨김 |

### 데이터 계약

```javascript
{
  items: [
    { id: "edit",      icon: "✎", label: "Edit",      disabled: false },
    { id: "duplicate", icon: "⧉", label: "Duplicate", disabled: false },
    { id: "archive",   icon: "⊟", label: "Archive",   disabled: false },
    { id: "delete",    icon: "⊗", label: "Delete",    disabled: true  }
  ]
}
```

### 표시 규칙

- `id`는 필수이며 항목 고유값으로 사용한다
- `icon`이 없으면 아이콘 영역을 빈 상태로 표시한다
- `disabled: true`인 항목은 `data-disabled="true"` 속성을 적용하고 클릭을 무시한다
- `label`이 없으면 빈 문자열로 처리한다

### 페이지 연결 사례

```javascript
pageEventBusHandlers['@rowActionRequested'] = ({ targetInstance }) => {
    targetInstance.openMenu({
        response: {
            items: [
                { id: 'edit',   icon: '✎', label: 'Edit',   disabled: false },
                { id: 'delete', icon: '⊗', label: 'Delete', disabled: false }
            ]
        }
    });
};

pageEventBusHandlers['@menuItemSelected'] = ({ targetInstance, itemId }) => {
    // itemId는 Shadow DOM 내부에서 미리 추출되어 전달됨
    // (Shadow DOM 경계 밖에서 event.target으로 접근하면 retarget되어 id를 읽을 수 없음)
    console.log('[Page] menu selected:', itemId);
    targetInstance.closeMenu();
};

pageEventBusHandlers['@menuDismissed'] = ({ targetInstance }) => {
    targetInstance.closeMenu();
};
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 보랏빛 글로우와 글래스 서피스의 다크 컨텍스트 메뉴 |
| 02_material | B: Material Elevated | 라이트 서피스와 MD3 표준 밀도의 메뉴 |
| 03_editorial | C: Minimal Editorial | 넓은 여백과 세리프 타이포 중심의 미니멀 메뉴 |
| 04_operational | D: Dark Operational | 고대비 다크 베이스의 컴팩트 운영형 메뉴 |
