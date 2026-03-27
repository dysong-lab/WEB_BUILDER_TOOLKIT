# cssSelectors / datasetAttrs — 규약 틀로서의 이해

## 1. 두 객체의 역할

- **cssSelectors** — DOM 요소의 위치를 결정한다 (querySelector의 인자)
- **datasetAttrs** — 어떤 data 속성명으로 값을 설정할지 지정한다

---

## 2. key 공유 메커니즘: cssSelectors와 datasetAttrs의 관계

datasetAttrs는 data 속성명을 지정하지만, 그것만으로는 아무것도 할 수 없다.
data 속성은 태그에 입력되어야 하고, 그러려면 대상 요소를 찾아야 한다.

그래서 cssSelectors와 **key를 공유**한다.
같은 key로 cssSelectors에서 위치를 가져와야 비로소 setAttribute가 가능해진다.

```
cssSelectors  →  위치 (어떤 DOM 요소에)
datasetAttrs  →  방식 (그 위치에 어떤 data 속성명으로)
```

### 동작 예시: StatefulListRenderMixin.renderData 내부

```javascript
Object.entries(cssSelectors).forEach(([key, selector]) => {
    const el = clone.querySelector(selector);   // cssSelectors의 value → 위치 결정
    if (!el || itemData[key] == null) return;    // data에서 같은 key로 값 추출

    if (datasetAttrs[key]) {
        // datasetAttrs에 key가 있으면 → data 속성으로 표출
        el.setAttribute('data-' + datasetAttrs[key], itemData[key]);
    } else {
        // 없으면 → textContent로 표출
        el.textContent = itemData[key];
    }
});
```

세 객체가 하나의 key를 축으로 연결된다:

```
key = 'active' 일 때:

  cssSelectors['active']  → '.sidebar__item'  → 위치
  datasetAttrs['active']  → 'active'          → data-active 속성으로 설정
  itemData['active']      → 'true'            → 설정할 값
```

### 같은 위치, 다른 용도

하나의 DOM 요소에 여러 data 속성이 붙을 수 있다.
cssSelectors에서 같은 선택자를 여러 key가 공유하면 된다:

```javascript
cssSelectors: {
    active:  '.sidebar__item',   // 같은 요소
    menuid:  '.sidebar__item',   // 같은 요소
}
datasetAttrs: {
    active: 'active'             // active만 data 속성
}
// menuid는 datasetAttrs에 없으므로 → textContent
// active는 datasetAttrs에 있으므로 → data-active
```

---

## 3. itemKey는 인터페이스 설정이다

StatefulListRenderMixin에서 `itemKey`는 datasetAttrs의 다른 key들과 **성격이 다르다.**

```
datasetAttrs의 일반 key (active 등):
  → 렌더링 방식 결정: "이 데이터를 이 위치에 data 속성으로 넣어라"
  → 데이터 매핑

itemKey:
  → 믹스인의 동작 방식 결정: "항목을 이 필드로 식별해라"
  → 인터페이스 설정 (updateItemState, getItemState에서만 사용)
```

itemKey는 렌더링 분기(`datasetAttrs[key]` 판별)에 관여하지 않는다.
`updateItemState(id, state)`와 `getItemState(id)`에서
항목을 찾을 때 사용하는 식별 기준일 뿐이다.

따라서 options 최상위로 분리하는 것이 올바르다:

```javascript
// 분리 후
applyStatefulListRenderMixin(this, {
    cssSelectors: { ... },
    itemKey: 'menuid',        // 인터페이스 설정 — 최상위
    datasetAttrs: {
        active: 'active'      // 순수하게 데이터 매핑만
    }
});
```

분리하면 datasetAttrs의 모든 key가 예외 없이 렌더링 분기에 직접 관여한다.

