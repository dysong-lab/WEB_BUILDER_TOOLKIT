# Mixin 명세서: HeatmapJsMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **기능** | 컨테이너에 히트맵 서피스를 lazy init하고, 위치(x, y)와 값(value)을 가진 데이터 포인트 배열을 히트맵으로 렌더링한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | EChartsMixin (데이터를 보여준다), TabulatorMixin (데이터를 보여준다) |
| **기능의 차이** | EChartsMixin은 차트로, TabulatorMixin은 테이블로 시각화한다. HeatmapJsMixin은 heatmap.js 라이브러리에 위임하여 열 분포 히트맵으로 시각화한다. 세 Mixin 모두 외부 라이브러리 인스턴스의 라이프사이클을 관리하는 동일한 패턴(lazy init, 데이터 적용, destroy)을 따른다. |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 히트맵이 렌더링될 요소. `h337.create({ container: containerEl })`의 대상 |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`를 직접 참조하여 히트맵 인스턴스를 생성한다. 없으면 ensureInstance에서 throw.

### datasetAttrs

해당 없음.

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `preset` | X | 히트맵 시각 설정. h337.create에 전달된다. updateConfig로 런타임 변경 가능 |

```javascript
preset: {
    radius: 25,
    maxOpacity: 0.8,
    blur: 0.85,
    gradient: { 0.4: 'blue', 0.6: 'green', 0.8: 'yellow', 1.0: 'red' }
}
```

---

## 3. renderData 기대 데이터

### 데이터 형태

```
히트맵 데이터 객체. max(최대값)와 points(포인트 배열)를 포함한다.
points가 없으면 data 자체를 포인트 배열로 사용한다.
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:
{
    max: 100,
    points: [
        { x: 100, y: 200, value: 80 },
        { x: 250, y: 150, value: 45 }
    ]
}
```

### KEY 매칭 규칙

```
Mixin이 data에서 max와 points를 추출한다.
  - data.max → setData의 max (없으면 기본값 1)
  - data.points → setData의 data (없으면 data 자체를 사용)

포인트 객체의 { x, y, value } 구조는 heatmap.js 라이브러리가 해석한다.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.heatmapJs`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `renderData({ response })` | 히트맵 데이터를 받아 서피스에 적용 |
| `updateConfig(newPreset)` | 프리셋 변경 (radius, opacity, gradient 등). 기존 프리셋과 merge |
| `clear()` | 히트맵 데이터 초기화 (빈 데이터 적용) |
| `destroy()` | 서피스 정리 + 모든 속성/메서드 null 처리 |

---

## 5. destroy 범위

```
- heatmapInstance.setData({ max: 1, data: [] })
- heatmapInstance = null
- currentPreset = null
- ns.renderData = null
- ns.updateConfig = null
- ns.clear = null
- ns.cssSelectors = null
- instance.heatmapJs = null
```

---

## 6. 사용 예시

### HTML

```html
<div class="heatmap-panel">
    <div class="heatmap-panel__surface" style="width: 100%; height: 400px;"></div>
</div>
```

### register.js

```javascript
applyHeatmapJsMixin(this, {
    cssSelectors: {
        container: '.heatmap-panel__surface'
    },
    preset: {
        radius: 25,
        maxOpacity: 0.8
    }
});

this.subscriptions = {
    heatmapData: [this.heatmapJs.renderData]
};
```

---
