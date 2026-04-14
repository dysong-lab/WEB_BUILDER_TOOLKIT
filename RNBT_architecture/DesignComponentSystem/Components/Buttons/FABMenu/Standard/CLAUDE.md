# FABMenu — Standard

## 기능 정의

1. **FAB 토글** — FAB 트리거 클릭 시 메뉴 영역의 열림 상태를 전환한다. `.fab-menu` 컨테이너에 `.is-open` 클래스를 토글한다.
2. **메뉴 항목 렌더링** — `fabMenuItems` 토픽으로 수신한 배열(`[{ id, icon, label }, ...]`)을 항목 템플릿으로 반복 렌더한다.
3. **항목 클릭 이벤트** — 각 메뉴 항목 클릭 시 `@fabMenuItemClicked`를 발행한다 (항목의 `data-id` 포함).

---

## 구현 명세

### Mixin

ListRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| menu      | `.fab-menu`                | 열림 상태(.is-open) 토글 대상 — `toggleMenu`가 참조 |
| trigger   | `.fab-menu__trigger`       | FAB 트리거 — 토글 클릭 이벤트 매핑 |
| container | `.fab-menu__list`          | 항목이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#fab-menu-item-template`  | cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.fab-menu__item`          | 렌더된 항목 — 클릭 이벤트 매핑 |
| id        | `.fab-menu__item`          | 항목 식별 (data-id) |
| icon      | `.fab-menu__item-icon`     | 아이콘 |
| label     | `.fab-menu__item-label`    | 라벨 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| id  | id    |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| fabMenuItems | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 / 핸들러 |
|--------|------------------|---------------|
| click | `trigger` (ListRenderMixin cssSelectors) | `toggleMenu` (커스텀 메서드) |
| click | `item` (ListRenderMixin cssSelectors)    | `@fabMenuItemClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `toggleMenu` | `.fab-menu` 요소에 `.is-open` 클래스를 토글한다 |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('fabMenuItems', this)──> [FABMenu] 항목 렌더 ([{ id, icon, label }, ...])

[사용자] ──click .fab-menu__trigger──> [FABMenu] toggleMenu (메뉴 열림)

[FABMenu] ──@fabMenuItemClicked── e.target.closest('.fab-menu__item').dataset.id
          ──> [페이지] ──> 액션 실행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크, primary 그라데이션 FAB, 항목 카드형 리스트 |
| 02_material    | B: Material Elevated | 라이트, surface container, elevation level 3 |
| 03_editorial   | C: Minimal Editorial | 라이트, outline only, 간결한 타이포 |
| 04_operational | D: Dark Operational  | 다크, 컴팩트, 시안 outline |
