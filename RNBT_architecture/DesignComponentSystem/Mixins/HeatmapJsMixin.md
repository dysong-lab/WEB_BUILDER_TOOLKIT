# HeatmapJsMixin

## 설계 의도

히트맵 서피스를 생성하고, 데이터를 매핑하여 표시한다.

heatmap.js(h337) 기반으로 열 분포를 시각화한다. 데이터 포인트의 위치와 값을 받아 히트맵으로 렌더링한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### cssSelectors

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 히트맵이 렌더링될 요소 |

### preset

히트맵 시각 설정. Mixin 적용 시 전달한다.

```javascript
preset: {
    radius: 25,
    maxOpacity: 0.8,
    blur: 0.85,
    gradient: { 0.4: 'blue', 0.6: 'green', 0.8: 'yellow', 1.0: 'red' }
}
```

### renderData가 기대하는 데이터

히트맵 데이터 객체. max(최대값)와 points(포인트 배열)를 포함한다.

```javascript
{
    max: 100,
    points: [
        { x: 100, y: 200, value: 80 },
        { x: 250, y: 150, value: 45 }
    ]
}
```

---

## 사용 예시

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

## 주입되는 네임스페이스

`this.heatmapJs`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors |
| `renderData({ response })` | 히트맵 데이터를 받아 서피스에 적용 |
| `updateConfig(newPreset)` | 프리셋 변경 (radius, opacity, gradient 등) |
| `clear()` | 히트맵 데이터 초기화 |
| `destroy()` | 서피스 정리 + 모든 속성/메서드 정리 |
