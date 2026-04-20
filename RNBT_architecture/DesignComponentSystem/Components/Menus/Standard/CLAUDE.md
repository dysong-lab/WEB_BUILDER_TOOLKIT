# Menus — Standard

## MD3 정의

> Menus display a list of choices on a temporary surface.

MD3 Menu anatomy: 컨테이너(임시 표면) + 메뉴 항목 목록. 각 항목은 (선행 아이콘) + 레이블 + (후행 텍스트: 단축키/보조 정보) 구조. 항목은 선택 가능 또는 비활성 상태일 수 있으며, 그룹 구분을 위한 divider 행이 등장할 수 있다.

## 기능 정의

1. **메뉴 항목 렌더링** — `menuItems` 토픽으로 수신한 배열 데이터를 template 반복으로 렌더링한다. 각 항목은 선행 아이콘(leading), 레이블(label), 후행 텍스트(trailing)로 구성된다. `disabled`/`divider` 플래그로 비활성/구분선 상태를 표현한다
2. **항목 클릭 이벤트** — 비활성/구분선이 아닌 항목 클릭 시 `@menuItemClicked` 발행 (페이지가 해당 액션 수행 + 메뉴 dismiss)

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.menu__items` | 항목이 추가될 부모 (규약) |
| template  | `#menu-item-template` | cloneNode 대상 (규약) |
| menuid    | `.menu__item` | 항목 식별 + 이벤트 매핑 |
| disabled  | `.menu__item` | 비활성 상태 (data-disabled) |
| divider   | `.menu__item` | 구분선 상태 (data-divider) |
| leading   | `.menu__leading` | 선행 아이콘/이모지 |
| label     | `.menu__label` | 항목 레이블 |
| trailing  | `.menu__trailing` | 후행 텍스트 (단축키/보조) |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid   | menuid |
| disabled | disabled |
| divider  | divider |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| menuItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `menuid` (computed property) | `@menuItemClicked` |

> 페이지는 핸들러에서 `data-disabled="true"` 또는 `data-divider="true"` 항목을 필터링한다. 컴포넌트는 dispatch만 하고 필터는 페이지 레벨의 판단이다.

### 커스텀 메서드

없음

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('menuItems', this)──> [Menus] 렌더링
          [{ menuid, leading, label, trailing, disabled?, divider? }, ...]

[Menus] ──@menuItemClicked──> [페이지] ──> disabled/divider 필터 후
                                          선택 액션 실행 + 메뉴 dismiss
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 깊이, Pretendard, 20px 모서리, box-shadow 금지 |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto, 8px 모서리 (MD3 기본 메뉴) |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 레이블, 넓은 여백, 샤프 모서리 (2px) |
| 04_operational | D: Dark Operational  | 컴팩트 다크, 시안 테두리, 모노스페이스 trailing(단축키), 4px 모서리 |

### 결정사항

- **선행 요소**: 텍스트 기반 (이모지/심볼). `leading`이 비어있으면 CSS로 숨김.
- **후행 요소**: 단축키 또는 보조 텍스트. `trailing`이 비어있으면 CSS로 숨김.
- **상태 플래그**: `disabled`/`divider`는 datasetAttrs로 등록되어 `[data-disabled="true"]`, `[data-divider="true"]`로 CSS 스타일링 가능. 페이지 핸들러가 필터링.
- **Dismiss 동작**: 메뉴 자체는 오버레이/팝업이 아닌 인라인 표면으로 구현한다. 팝업이 필요한 advanced 케이스는 별도 ShadowPopupMixin 조합(Advanced 변형)에서 다룬다 — Standard는 MD3 "temporary surface" 시각만 제공하고 dismiss 로직은 페이지 책임.
- **근거**: MD3 Menus는 배열을 수직 목록으로 반복 렌더하므로 ListRenderMixin이 적합. Lists와의 차이는 trailing(단축키), disabled/divider 상태 3가지 축.
