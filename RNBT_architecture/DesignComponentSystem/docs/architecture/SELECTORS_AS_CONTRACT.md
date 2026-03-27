# cssSelectors / datasetAttrs — 규약 틀로서의 이해

## 1. 본질: 바인딩 규약이지 시각적 제약이 아니다

cssSelectors와 datasetAttrs는 **"Mixin이 특정 모양을 가져야 한다"는 의미가 아니다.**
데이터와 디자인(HTML)을 연결하기 위해 존재하는 **규약 틀**이다.

```
cssSelectors / datasetAttrs가 강제하는 것:

  ✗ 레이아웃, 크기, 색상, 위치
  ✗ Mixin의 활용 방식
  ○ "이 이름의 연결점이 존재한다"는 사실만
```

### 근거: renderData의 실제 동작

```javascript
// FieldRenderMixin — cssSelectors로 위치를 결정
Object.entries(data).forEach(([key, value]) => {
    if (!cssSelectors[key]) return;

    const el = instance.appendElement.querySelector(cssSelectors[key]);
    if (!el) return;

    if (datasetAttrs[key]) {
        el.setAttribute('data-' + datasetAttrs[key], value);
    } else {
        el.textContent = value;
    }
});
```

레이아웃, 크기, 색상에 대한 코드는 없다.
순수하게 "데이터 → DOM 연결"만 수행한다.

### 실증: 같은 규약, 다른 디자인

EventLog 컴포넌트는 동일한 cssSelectors 정의로
01_list, 02_timeline, 03_table 세 가지 완전히 다른 시각적 디자인을 구현한다.
규약이 모양을 결정하지 않는다는 직접적 증거다.

---

## 2. 위치는 cssSelectors가 담당한다

모든 요소 탐색은 cssSelectors를 통해 이루어진다.
`[data-*]` 속성 셀렉터로 위치를 찾지 않는다.

```
위치 결정의 단일 경로:

  cssSelectors → querySelector → 요소 발견
    → datasetAttrs에 등록된 키? → setAttribute로 data 속성 설정
    → 등록되지 않은 키?         → textContent 설정
```

이전에는 datasetAttrs가 `[data-attr]`로 별도의 위치 탐색을 했지만,
이는 cssSelectors와 다른 경로로 요소를 찾는 것이어서 불일치가 발생했다.
(예: `dataset` API의 camelCase ↔ kebab-case 자동 변환 문제)

---

## 3. 두 가지 "보여주기": Mixin 역할 분리

데이터를 보여주는 방식이 두 가지이므로, Mixin도 두 가지다.

| Mixin | 보여주는 방식 | datasetAttrs |
|-------|-------------|-------------|
| **ListRenderMixin** | 텍스트로 보여준다 (textContent) | 없음 |
| **StatefulListRenderMixin** | 상태로 보여준다 (data 속성) + 텍스트 | 있음 |
| **FieldRenderMixin** | 단일 객체를 텍스트/상태로 보여준다 | 있음 (선택) |

- **ListRenderMixin** — 순수 렌더링. cssSelectors → textContent만.
- **StatefulListRenderMixin** — 상태 관리. datasetAttrs 키는 data 속성, 나머지는 textContent. updateItemState/getItemState로 개별 항목 상태 변경/조회.

둘 다 필요하면 (텍스트 + 상태) 두 Mixin을 함께 적용한다.

### Mixin별 cssSelectors 활용 방식

| 패턴 | Mixin | 활용 방식 |
|------|-------|----------|
| cssSelectors 순회 + textContent | ListRender | 텍스트 렌더링 |
| cssSelectors 순회 + datasetAttrs 분기 | StatefulListRender, FieldRender | 텍스트 + 상태 |
| container key만 사용 | ECharts, Tabulator, HeatmapJs | 렌더링 대상 위치만 |
| template key만 사용 | ShadowPopup | Shadow DOM 쿼리용 |
| 아예 사용 안 함 | CameraFocus, MeshState | 별도 옵션 체계 사용 |

---

## 4. cssSelectors의 key가 연결의 축이다

cssSelectors를 순회하며 데이터를 라우팅한다:

```
cssSelectors의 key를 순회
  → datasetAttrs에 있으면 → data 속성 설정
  → datasetAttrs에 없으면 → textContent 설정
```

**cssSelectors의 key가 데이터 필드명과 일치해야 한다.**

### 패턴 A: textContent만 (ListRenderMixin)

```javascript
cssSelectors: {
    time:    '.event-time',
    level:   '.event-level',
    message: '.event-message'
}
// data: [{ time: '14:30', level: 'ERROR', message: '...' }]
// → 각 요소에 textContent 설정
```

### 패턴 B: data 속성 + textContent (StatefulListRenderMixin)

```javascript
cssSelectors: {
    menuid:  '.sidebar__item',     // data 속성이 들어갈 위치
    active:  '.sidebar__item',     // 같은 요소에 여러 data 속성 가능
    icon:    '.sidebar__item-icon',
    label:   '.sidebar__item-label'
}
datasetAttrs: {
    itemKey: 'menuid',
    active:  'active'
}
// data: [{ menuid: 'dashboard', active: 'true', icon: '📊', label: 'Dashboard' }]
// → menuid, active → setAttribute('data-menuid', ...), setAttribute('data-active', ...)
// → icon, label → textContent
```

### 패턴 C: 단일 객체 (FieldRenderMixin)

```javascript
cssSelectors: {
    title:    '.header__title',
    userName: '.header__user-name',
    status:   '.system-status'
}
datasetAttrs: {
    status: 'status'
}
// data: { title: 'Dashboard', userName: 'Admin', status: 'online' }
// → title, userName → textContent
// → status → setAttribute('data-status', 'online')
```

---

## 5. `{ active: 'active' }` — 같은 값 할당의 의의

datasetAttrs에서 key와 value에 같은 값을 할당하는 패턴:

```javascript
datasetAttrs: {
    active: 'active'
}
```

이것은 단순 반복이 아니다. **key와 value가 서로 다른 역할을 하기 때문이다.**

```
datasetAttrs: { active: 'active' }
               ───────   ───────
                  │          │
                  │          └─ HTML data 속성명: setAttribute('data-active', value)
                  │
                  └─ cssSelectors의 key: cssSelectors['active'] → 위치 결정
                     + 데이터 필드명: itemData['active'] → 값 추출
```

- **좌변(key)**: cssSelectors에서 위치를 찾고, data에서 값을 꺼내는 key
- **우변(value)**: HTML의 data-* 속성명

같은 값이면 직통 연결, 다르면 이름 변환이 일어난다.

---

## 6. 종합: cssSelectors / datasetAttrs의 정체

```
cssSelectors / datasetAttrs는:

  ┌─ 디자인에게 → 모양을 강제하지 않는다
  ├─ Mixin에게  → 활용 방식을 강제하지 않는다
  └─ 양쪽 사이에서 → 연결점의 이름만 약속한다

  위치 결정은 cssSelectors가 단일 담당한다:

  ┌─ cssSelectors → 요소의 위치 (querySelector)
  ├─ datasetAttrs → 해당 키의 처리 방식 (textContent 대신 data 속성)
  └─ 데이터 필드명 = cssSelectors의 key

  = 데이터와 DOM 사이의 라우팅 테이블
```
