# 렌더링 경로 확장 논의

> 날짜: 2026-03-31
> 상태: 구현 완료 (property + unit) / template 옵션 보류

---

## 1. 배경

기존 렌더링 경로가 2가지(textContent, data-*)뿐이었다. 아이콘 교체(src), 프로그레스 바(style.width) 같은 표현이 불가능했다.

2026-03-30 논의에서 elementAttrs, styleAttrs 확장이 결정되었고, 2026-03-31에 구현했다.

---

## 2. 구현된 렌더링 경로 (4가지)

```javascript
// applyValue.js — 3개 Mixin이 공유하는 유틸리티

function applyValue(el, key, value, paths) {
    const { datasetAttrs, elementAttrs, styleAttrs } = paths;

    if (datasetAttrs[key]) {
        el.setAttribute('data-' + datasetAttrs[key], value);   // 1. data-* 속성
    } else if (elementAttrs[key]) {
        el.setAttribute(elementAttrs[key], value);             // 2. 요소 속성 (src, fill 등)
    } else if (styleAttrs[key]) {
        const { property, unit = '' } = styleAttrs[key];
        el.style[property] = value + unit;                     // 3. 스타일 속성
    } else {
        el.textContent = value;                                 // 4. 텍스트
    }
}
```

적용 대상: FieldRenderMixin, ListRenderMixin, TreeRenderMixin

---

## 3. styleAttrs의 현재 규격

```javascript
styleAttrs: {
    progress: { property: 'width', unit: '%' }
}
// → el.style.width = value + '%'
// → el.style.width = '72%'
```

`property + unit` 조합으로 값을 설정한다.

### 커버 가능한 경우

| CSS | property | unit | 결과 |
|-----|----------|------|------|
| `width: 72%` | `'width'` | `'%'` | `'72%'` |
| `height: 200px` | `'height'` | `'px'` | `'200px'` |
| `left: 50px` | `'left'` | `'px'` | `'50px'` |
| `opacity: 0.5` | `'opacity'` | (생략) | `'0.5'` |
| `backgroundColor: #f00` | `'backgroundColor'` | (생략) | `'#f00'` |

### 커버 불가능한 경우

| CSS | 문제 |
|-----|------|
| `transform: rotate(45deg)` | 값이 함수 안에 들어감 — `'45' + 'deg'` = `'45deg'` (rotate() 빠짐) |
| `transform: translateX(100px)` | 동일 — `translateX()` 빠짐 |
| `filter: blur(5px)` | 동일 — `blur()` 빠짐 |

---

## 4. 보류된 해결 방향: template 옵션

```javascript
// 현재 (property + unit):
styleAttrs: {
    progress: { property: 'width', unit: '%' }
}
// → el.style.width = 72 + '%' = '72%'

// 확장 안 (property + template):
styleAttrs: {
    rotation: { property: 'transform', template: 'rotate(${value}deg)' }
}
// → el.style.transform = 'rotate(45deg)'
```

### 보류 사유

1. 현재 대시보드 컴포넌트에서 `transform`, `filter` 같은 함수형 CSS를 데이터로 제어하는 실제 사례가 없다
2. 게이지 회전은 EChartsMixin이 처리하므로 styleAttrs로 직접 rotate할 필요 없다
3. `property + unit`으로 대시보드의 실용적 스타일 제어(프로그레스 바, 위치, 크기, 투명도, 색상)를 충분히 커버한다

### 구현 시점

함수형 CSS를 데이터로 제어해야 하는 컴포넌트가 실제로 등장할 때 template 옵션을 추가한다. applyValue.js의 styleAttrs 분기에 template 처리를 추가하면 3개 Mixin에 동시 적용된다.

```javascript
// 예상 구현:
} else if (styleAttrs[key]) {
    const { property, unit = '', template } = styleAttrs[key];
    if (template) {
        el.style[property] = template.replace('${value}', value);
    } else {
        el.style[property] = value + unit;
    }
}
```

---

*최종 업데이트: 2026-03-31*
