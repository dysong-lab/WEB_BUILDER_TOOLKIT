---
name: create-symbol-state-component
description: 인라인 SVG HTML을 Mixin 기반 상태 동적 컴포넌트로 변환합니다. datasetAttrs로 data-status를 제어하고 CSS가 색상을 전환합니다.
---

# 심볼 상태 컴포넌트 생성 (Mixin 기반)

인라인 SVG HTML을 **상태 기반 동적 컴포넌트**로 변환합니다.
`data-status` 속성과 CSS 셀렉터로 색상을 제어합니다.

> 설계 문서: [COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> 공통 규칙: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 - 캐싱하거나 생략하지 마세요.**

1. [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) - 시스템 설계
2. [/.claude/skills/SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) - 공통 규칙
3. [/.claude/guides/CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) - 코딩 스타일
4. **기존 심볼 패턴 확인** - Cube3DSymbol의 register.js, component.html, component.css를 먼저 읽을 것

---

## 핵심 원리

```
SVG <defs>에 N세트 gradient 정의 (paint0-green, paint0-yellow, paint0-red)
  ↓
SVG path에 layer 클래스 부여 (layer-grad0, layer-fill-primary)
  ↓
CSS [data-status="xxx"] 셀렉터로 fill URL 제어
  ↓
FieldRenderMixin의 datasetAttrs로 data-status 변경 → CSS가 색상 전환
```

**장점:** innerHTML 교체 없이 속성만 변경 (DOM 효율적)

---

## Mixin 적용

심볼 컴포넌트는 **FieldRenderMixin의 datasetAttrs**를 활용한다.
`data-status` 속성이 변경되면 CSS가 자동으로 색상을 전환한다.

### register.js

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyFieldRenderMixin(this, {
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    symbolStatus: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: { '.symbol-container': '@symbolClicked' }
};
bindEvents(this, this.customEvents);
```

### beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each, go } = fx;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리
this.fieldRender.destroy();
```

---

## Layer 클래스 분류 체계

SVG의 각 `<path>` 요소에 아래 클래스를 부여합니다.

### Gradient 레이어

| 클래스 | 용도 | 수량 |
|--------|------|------|
| `layer-grad0` ~ `layer-grad9` | gradient fill | SVG에 따라 0~10개 |

- 하나의 gradient ID에 하나의 layer 클래스가 매핑됩니다
- `layer-grad0`은 `paint0-green`, `paint0-yellow`, `paint0-red`에 대응

### Solid 레이어

| 클래스 | 용도 | 색상 특성 |
|--------|------|----------|
| `layer-fill-primary` | 주요 solid fill | 가장 진한 색 |
| `layer-fill-secondary` | 보조 solid fill | 중간 색 |
| `layer-fill-tertiary` | 3차 solid fill | 가장 연한 색 |

### Stroke 레이어

| 클래스 | 용도 |
|--------|------|
| `layer-stroke` | 내부 선/획 (opacity 변형 가능) |
| `layer-stroke-border` | 외곽 테두리 선 |

---

## Gradient 수량 계산

**공식:** `gradient 수` × `상태 수` = 총 `<defs>` 항목

```
예: Cube3DSymbol
- gradient 수: 10개 (paint0 ~ paint9)
- 상태 수: 3개 (green, yellow, red)
- 총 defs: 10 × 3 = 30개 linearGradient 정의
```

---

## component.html 구조

```html
<div class="symbol-container" data-status="green">
    <svg class="symbol-svg" viewBox="0 0 73 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <!-- GREEN gradients -->
            <linearGradient id="paint0-green" ...>
                <stop stop-color="#3A6B47"/>...
            </linearGradient>

            <!-- YELLOW gradients -->
            <linearGradient id="paint0-yellow" ...>
                <stop stop-color="#8B6F20"/>...
            </linearGradient>

            <!-- RED gradients -->
            <linearGradient id="paint0-red" ...>
                <stop stop-color="#8B3A3A"/>...
            </linearGradient>
        </defs>

        <g>
            <path class="layer-grad0" d="..."/>
            <path class="layer-fill-primary" d="..."/>
            <path class="layer-stroke-border" d="..." stroke-width="0.07"/>
        </g>
    </svg>
</div>
```

### Gradient ID 네이밍 규칙

```
원본 Figma SVG:  id="paint0_linear_..."
                         ↓
Green:           id="paint0-green"
Yellow:          id="paint0-yellow"
Red:             id="paint0-red"
```

### Layer 클래스 부여 기준

```
원본 SVG path:   fill="url(#paint0_linear_...)"  → class="layer-grad0"
원본 SVG path:   fill="#4ADE80" (solid, 진한)     → class="layer-fill-primary"
원본 SVG path:   stroke="#16A34A"                 → class="layer-stroke"
```

---

## component.css 구조

**각 상태별 CSS 블록이 필수. data-status 값에 의해 색상이 전환된다.**

```css
#symbol-container {
    width: 73px;    /* Figma 치수 */
    height: 54px;
    position: relative;
    overflow: hidden;
}

.symbol-container { width: 100%; height: 100%; }
.symbol-svg { display: block; width: 100%; height: 100%; }

/* ======== GREEN 상태 (정상) ======== */
.symbol-container[data-status="green"] {
    .layer-grad0 { fill: url(#paint0-green); }
    .layer-fill-primary { fill: #4ADE80; }
    .layer-fill-secondary { fill: #86EFAC; }
    .layer-fill-tertiary { fill: #D1FAE5; }
    .layer-stroke { stroke: #16A34A; }
    .layer-stroke-border { stroke: #16A34A; }
}

/* ======== YELLOW 상태 (경고) ======== */
.symbol-container[data-status="yellow"] {
    .layer-grad0 { fill: url(#paint0-yellow); }
    .layer-fill-primary { fill: #FACC15; }
    .layer-stroke { stroke: #CA8A04; }
}

/* ======== RED 상태 (위험) ======== */
.symbol-container[data-status="red"] {
    .layer-grad0 { fill: url(#paint0-red); }
    .layer-fill-primary { fill: #EF4444; }
    .layer-stroke { stroke: #DC2626; }
}
```

---

## FieldRenderMixin과 심볼의 관계

```
FieldRenderMixin의 datasetAttrs:
  status: 'status'

API 응답: { status: 'green' }

Mixin이 하는 일:
  el = querySelector('[data-status]')
  el.dataset.status = 'green'

CSS가 하는 일:
  [data-status="green"] { .layer-grad0 { fill: url(#paint0-green); } ... }

→ Mixin은 dataset만 변경, CSS가 시각적 전환을 담당
→ 별도 setStatus/getStatus API 불필요 — FieldRenderMixin이 처리
```

---

## 변환 워크플로우

```
1. figma-to-inline-svg 출력물 읽기
   ├─ 인라인 SVG HTML
   └─ 색상 정보 (주석 또는 README)

2. SVG 분석
   ├─ gradient 수 세기
   ├─ solid fill path 분류 (primary, secondary, tertiary)
   └─ stroke path 분류 (stroke, stroke-border)

3. Layer 클래스 부여
   ├─ gradient path → layer-grad0 ~ layer-gradN
   ├─ solid fill → layer-fill-primary/secondary/tertiary
   └─ stroke → layer-stroke / layer-stroke-border

4. Gradient defs 복제 (상태 수만큼)
   ├─ ID를 paintN-green, paintN-yellow, paintN-red로 변경
   └─ stop-color를 상태별 색상으로 교체

5. CSS 작성
   └─ [data-status="xxx"] { .layer-gradN { fill: url(...); } ... }

6. register.js 작성
   └─ FieldRenderMixin + datasetAttrs: { status: 'status' }

7. beforeDestroy.js 작성
   └─ 이벤트 제거 → 구독 해제 → Mixin destroy
```

---

## 출력 구조

```
[ComponentName]/
├── views/
│   └── 01_[name].html         # SVG + N세트 gradient + layer 클래스
├── styles/
│   └── 01_[name].css          # [data-status] 셀렉터
├── scripts/
│   ├── register.js            # FieldRenderMixin 조립 코드
│   └── beforeDestroy.js
└── preview/
    └── 01_[name].html
```

---

## 금지 사항

> 공통 금지 사항: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md#금지-사항-전체-공통) 참조

- ❌ innerHTML 교체로 색상 변경 (data-status 속성만 사용)
- ❌ gradient defs를 상태별로 누락
- ❌ layer 클래스 없이 직접 fill 값 변경
- ❌ Mixin 메서드 재정의
- ❌ 별도 setStatus/getStatus 함수 작성 (FieldRenderMixin이 처리)

---

## 관련 자료

| 참조 | 위치 | 특징 |
|------|------|------|
| FieldRenderMixin | [/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md) | datasetAttrs 사용법 |
| 시스템 설계 문서 | [/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md](/RNBT_architecture/DesignComponentSystem/docs/architecture/COMPONENT_SYSTEM_DESIGN.md) | 전체 아키텍처 |
