# cssSelectors와 datasetAttrs

## 1. 두 객체의 역할

- **cssSelectors** — 대상 요소를 찾는다 (querySelector의 인자)
- **datasetAttrs** — 어떤 data 속성명으로 값을 설정할지 지정한다

---

## 2. key 공유 메커니즘

datasetAttrs는 data 속성명을 지정하지만, 그것만으로는 아무것도 할 수 없다.
data 속성은 태그에 입력되어야 하고, 그러려면 대상 요소를 찾아야 한다.

그래서 cssSelectors와 **key를 공유**한다.
같은 key로 cssSelectors에서 대상 요소를 찾아야 비로소 setAttribute가 가능해진다.

### 동작 예시: ListRenderMixin.renderData 내부 (datasetAttrs 사용 시)

```javascript
Object.entries(cssSelectors).forEach(([key, selector]) => {
    const el = clone.querySelector(selector);
    if (!el || itemData[key] == null) return;

    if (datasetAttrs[key]) {
        el.setAttribute('data-' + datasetAttrs[key], itemData[key]);
    } else {
        el.textContent = itemData[key];
    }
});
```

예시 — `key = 'active'`일 때:

```
cssSelectors['active']  → '.sidebar__item'  → 대상 요소
datasetAttrs['active']  → 'active'          → data-active 속성으로 설정
itemData['active']      → 'true'            → 설정할 값 (없으면 skip)
```

### 같은 대상, 다른 용도

하나의 DOM 요소에 여러 data 속성이 붙을 수 있다.
cssSelectors에서 같은 선택자를 여러 key가 공유하면 된다:

```javascript
cssSelectors: {
    active:  '.sidebar__item',
    menuid:  '.sidebar__item',
}
datasetAttrs: {
    active:  'active',
    menuid:  'menuid'
}
// active → data-active, menuid → data-menuid (같은 요소에 두 개의 data 속성)
```

두 객체와 key에 대한 처리 방식은 각 믹스인의 구현에 따른다.

*작성일: 2026-03-26*
