# HeatmapJsMixin

## 설계 의도

히트맵 서피스를 생성하고, 데이터를 매핑하여 표시한다.

heatmap.js(h337) 기반으로 열 분포를 시각화한다. 데이터 포인트의 위치와 값을 받아 히트맵으로 렌더링한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조

---

## 인터페이스

### cssSelectors

| KEY | 필수 | 의미 |
|-----|------|------|
| `container` | O | 히트맵이 렌더링될 요소 |

### 기타 옵션

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `preset` | `object` (h337 config) | X | `{}` | 히트맵 시각 설정. `h337.create`에 `container`와 spread하여 전달됨 |

**`preset`의 주요 필드** (heatmap.js 공식 옵션)

| 필드 | 타입 | 의미 |
|------|------|------|
| `radius` | number | 각 포인트 반경 (px) |
| `maxOpacity` | number (0~1) | 최대 투명도 |
| `blur` | number (0~1) | 블러 강도 |
| `gradient` | `{ [stopRatio: number]: color }` | 값 비율 구간별 색상. 예: `{ 0.4: 'blue', 1.0: 'red' }` |

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
| `getInstance()` | h337 인스턴스 반환 (고급 사용) |
| `destroy()` | 서피스 정리 + 모든 속성/메서드 정리 |

---

## 메서드 입력 포맷

### `renderData(payload)`

**`payload` 형태**

```javascript
{
    response: {
        max?:   number,                          // 기본값 1
        points: Array<{ x: number, y: number, value: number }>
    }
}

// fallback: response 자체가 배열이면 points로 간주
```

| 필드 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| `response.max` | number | X | `1` | 히트맵 정규화 기준 최대값. `data.max \|\| 1` 로 대입 |
| `response.points` | `Array<{x,y,value}>` | ✓* | — | 각 포인트 픽셀 좌표(`x`, `y`)와 세기(`value`). `data.points` 미제공 시 **fallback**: `data` 자체를 포인트 배열로 간주 (`data.points \|\| data`) |

`*` `points`가 없고 `data` 자체도 배열이 아니면 h337에 배열이 아닌 값이 넘어가 런타임 오류 가능.

**Error**: `response`가 `null`/`undefined`이면 `[HeatmapJsMixin] data is null` **throw**.

**반환**: `void` (내부적으로 h337 인스턴스의 `setData({ max, data: points })` 호출)

### `updateConfig(newPreset)`

| 파라미터 | 타입 | 필수 | 기본값 | 의미 |
|---------|------|------|--------|------|
| `newPreset` | `object` (h337 config 일부) | ✓ | — | `currentPreset`에 shallow merge되어 `heatmapInstance.configure(currentPreset)` 호출 (인스턴스 생성 이후에만 실제 반영) |

**반환**: `void`

### 파라미터 없는 메서드

| 메서드 | 의미 | 반환 |
|--------|------|------|
| `clear` | `setData({ max: 1, data: [] })`로 데이터만 비움. 인스턴스 유지 | `void` |
| `getInstance` | 현재 h337 인스턴스 또는 `null` | `h337.Heatmap \| null` |
| `destroy` | `setData({ max: 1, data: [] })` + 인스턴스/프리셋 null + 네임스페이스 null (**h337 인스턴스는 DOM 제거하지 않음** — 참조만 끊음) | `void` |
