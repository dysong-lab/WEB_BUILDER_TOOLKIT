# Tooltips — Advanced / richContent

## 기능 정의

1. **표시/숨김 상태 제어 (Standard 호환)** — 페이지가 루트 요소의 `data-open` 속성을 토글하여 노출 여부 제어. Standard와 동일한 hover/focus 트리거, 자동 dismiss 타이머, 위치 계산은 모두 페이지 책임.
2. **plain 라벨 텍스트 렌더링 (Standard 호환)** — `tooltipContent` 토픽 또는 `setTooltipContent` 토픽에 `{ mode: 'text', label }` 페이로드가 들어오면 `.tooltip-rc__body` 의 textContent 에 plain 텍스트만 반영(HTML 무시 — XSS 안전 default).
3. **rich HTML 콘텐츠 렌더링 — sanitize 후 주입** — `{ mode: 'html', richHtml }` 페이로드 수신 시 자체 메서드 `_sanitizeHtml(richHtml)` 로 화이트리스트 기반 정제(허용 태그 11종 + 허용 속성 5종 + dangerous URL/handler 차단) → 정제된 노드 트리만 `.tooltip-rc__body` 에 주입. 원본 HTML 문자열은 절대 `innerHTML` 로 직접 주입하지 않음.
4. **허용 태그 화이트리스트 (11종)** — `<p>`, `<a>`, `<strong>`, `<em>`, `<code>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<small>`, `<span>`, `<kbd>`. 그 외 태그(예: `<script>`, `<iframe>`, `<style>`, `<form>`, `<img>`, `<svg>`)는 노드 자체를 drop. 허용 태그 안의 자식만 walker 가 재귀 처리.
5. **허용 속성 화이트리스트 (5종)** — `href`(a 만), `class`, `title`, `data-tip-action`(a/kbd 의 페이지 액션 식별자 옵션), `aria-label`. 그 외 모든 속성(특히 `on*`/`style`/`src`/`srcset`/`formaction`/`xmlns`)은 제거. `href` 는 별도 URL safe 검사를 통과한 경우에만 유지.
6. **dangerous URL 차단 — `_isSafeHref` 검사** — `href` 값이 ① `javascript:`, ② `data:` (text/html/script 류), ③ `vbscript:` 로 시작하면 link 자체를 텍스트 노드로 unwrap(앵커는 제거하되 표시 텍스트는 보존). `http(s):`, `mailto:`, `tel:`, 상대 경로(`/path`, `./path`, `#anchor`)는 통과.
7. **링크 클릭 이벤트 — `@tooltipLinkClicked`** — 정제된 트리 안 `<a>` 클릭 시 `bindEvents` 위임으로 `@tooltipLinkClicked` 발행. 페이지가 라우팅(SPA `pushState` / 새 탭 / preview 등)을 결정. 컴포넌트는 `event.preventDefault()` 하지 않음 — 페이지 핸들러가 결정.
8. **표시/숨김 라이프사이클 이벤트** — `setTooltipOpen` 토픽 또는 외부에서 root `data-open` 을 `'true'` 로 갱신한 직후 `_emitOpenStateIfChanged()` 가 직전 상태와 비교하여 `@tooltipShown` / `@tooltipHidden` 발행. `setTooltipOpen` 핸들러는 `data-open` 갱신 + 이벤트 발행을 단일 진입점으로 통합.
9. **명시 setter — `setTooltipContent({ mode, richHtml?|label? })`** — 인스턴스 메서드. 페이지가 명령형 API 로 직접 호출 가능(토픽 publish 우회). 내부적으로 `_handleSetTooltipContent` 로 라우팅.

> **Standard와의 분리 정당성 (5축)**:
> - **새 자체 상태 4종** — `_allowedTags: Set`, `_allowedAttrs: Map<tag, Set<attr>>`, `_lastOpenState: 'true' | 'false'`, `_openObserver: MutationObserver | null`. Standard 는 stateless.
> - **새 토픽 3종** — `tooltipContent` (rich/plain 통합 채널), `setTooltipContent` (명시 갱신 alias), `setTooltipOpen` (외부 명령형 토글). Standard 는 `tooltipInfo` 단일 토픽이며 plain `label` 만.
> - **새 이벤트 3종** — `@tooltipLinkClicked` (링크 클릭), `@tooltipShown` / `@tooltipHidden` (라이프사이클). Standard 는 발행 이벤트 0종.
> - **자체 메서드 8종** — `_sanitizeHtml(html)`, `_sanitizeNode(node, parent)`, `_isSafeHref(href)`, `_handleSetTooltipContent({response})`, `_handleSetTooltipOpen({response})`, `_emitOpenStateIfChanged()`, `setTooltipContent(payload)`, `_observeOpenState()`. Standard 는 자체 메서드 0개.
> - **HTML 구조 변경** — Standard 는 `<span class="tooltip__label">` 단일 텍스트 슬롯. richContent 는 `<div class="tooltip-rc__body">` 안에 `<p>/<ul>/<a>/<kbd>` 등 구조화 콘텐츠. `tooltip` 루트는 동일 역할이지만 prefix `.tooltip-rc__*` 로 분리.
>
> 위 5축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **참조 패턴**:
> - `Tooltips/Standard` — `tooltip` 루트 + `data-open` 속성 토글 + 페이지 위치/타이머 책임 패턴 동일 차용.
> - `Menus/Advanced/contextMenu`, `Toolbars/Advanced/overflowMenu` — 자체 메서드 + 토픽 별칭(`setXxx`) 분리 + 라이프사이클 이벤트 명시 발행 패턴.
> - `TextFields/Advanced/multilineAutoGrow` — 자체 메서드 + 토픽 + bound handler refs(beforeDestroy 정확 제거) 패턴.

> **MD3 / 도메인 근거**: MD3 spec 의 **Rich Tooltips** — *"Rich tooltips include longer descriptive text, can be paired with title, links, and action buttons. They appear on hover or focus and persist until dismissed."* (Compose Material 3 `RichTooltip`). 본 변형은 MD3 rich tooltip 의 **콘텐츠 측면**(긴 설명 + 인라인 link + `<kbd>` 단축키 + 리스트)을 다룬다. action button 영역은 본 변형에서 미포함(별도 Advanced 후보 — `actionRich` 큐 등록 검토). 실사용: ① **단축키 안내** (`Ctrl+K` `<kbd>` 표기), ② **경고 + 설명 링크** (`<strong>Warning:</strong> ... <a href="/docs">Learn more</a>`), ③ **plan 비교 리스트** (`<ul>Free 10MB / Pro 1GB</ul>`), ④ **inline 코드/명령** (`<code>npm install</code>`).

> **XSS 방어 원칙**: 외부 데이터(API 응답, 사용자 입력 가공 HTML)는 절대 신뢰하지 않는다. `innerHTML` 로 raw `richHtml` 을 직접 주입하면 `<script>` / `<iframe>` / `on*` handler / `javascript:` URL 으로 코드 실행 가능. 본 변형은 ① 화이트리스트 walker, ② attribute 화이트리스트, ③ URL safe 검사, ④ DOMParser 의 `text/html` 모드(스크립트 미실행)로 4중 방어.

---

## 구현 명세

### Mixin

없음 — 자체 메서드 8종 + 자체 상태 4종으로 완결.

> **신규 Mixin 생성 금지** — `_sanitizeHtml` / walker / URL safe 검사는 본 변형(richContent)에 강하게 결합되며 다른 컴포넌트에서 답습되는 패턴이 아직 없다. 향후 `Cards/Advanced/htmlBody` 등 동일 sanitize 가 필요한 변형이 등장하면 `HtmlSanitizeMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
>
> **Standard 가 사용한 FieldRenderMixin 제거 사유**: Standard 의 `tooltipInfo` 단일 객체 → `label` textContent 1:1 매핑은 FieldRenderMixin 로 충분했지만, richContent 는 `mode` 분기(text/html) + sanitize + 노드 트리 주입이 필요해 단순 textContent 매핑으로 표현 불가. 자체 메서드(`_handleSetTooltipContent`)가 분기 + 정제 + DOM 교체를 단일 진입점에서 책임진다.

### cssSelectors (자체 — Mixin 미사용이므로 KEY 등록은 인스턴스 자체에 메모만)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root      | `.tooltip-rc`        | 루트 — `data-open` 토글 대상 + `_observeOpenState` 관찰 대상 + 위치 지정 대상(페이지) |
| body      | `.tooltip-rc__body`  | sanitize 된 콘텐츠 주입 대상 |
| link      | `.tooltip-rc__body a` | 링크 클릭 위임 대상 (`@tooltipLinkClicked`) |

> Mixin 미사용이므로 `cssSelectors` 옵션 객체는 없으며, 위 KEY 는 register.js 안에서 `bindEvents` 셀렉터와 `_observeOpenState` query 셀렉터로 직접 사용된다(하드코딩 금지 — 공통 상수로 추출). `bindEvents` selector 는 `[this._cssSelectors.link]` computed property 형태로 참조.

### datasetAttrs

없음 (페이지가 직접 `data-open` 제어, 컴포넌트는 관찰만)

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors` | `object` | `{root,body,link}` | 자체 KEY → CSS 셀렉터 매핑(하드코딩 금지). |
| `_allowedTags` | `Set<string>` | 11개 | 화이트리스트 태그(`p,a,strong,em,code,br,ul,ol,li,small,span,kbd`). |
| `_allowedAttrs` | `Map<string, Set<string>>` | tag 별 | 태그별 허용 속성. 공통(`class,title,aria-label,data-tip-action`) + `a` 의 `href`. |
| `_lastOpenState` | `'true' \| 'false'` | `'false'` | 직전 `data-open` 값 — `_emitOpenStateIfChanged` 가 변경 감지에 사용. |
| `_openObserver` | `MutationObserver \| null` | `null` | root 의 `data-open` 변화를 관찰하여 페이지가 dataset 을 직접 갱신해도 라이프사이클 이벤트 발행. |

### 구독 (subscriptions)

| topic | handler | payload |
|-------|---------|---------|
| `tooltipContent` | `this._handleSetTooltipContent` | `{ mode: 'text', label }` 또는 `{ mode: 'html', richHtml }` |
| `setTooltipContent` | `this._handleSetTooltipContent` | 동일 — 명시 갱신 alias |
| `setTooltipOpen` | `this._handleSetTooltipOpen` | `{ open: boolean }` |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `this._cssSelectors.link` (`.tooltip-rc__body a`) | `@tooltipLinkClicked` | `{ event, targetInstance }` (페이지가 `event.target.closest('a').href` / `dataset.tipAction` 추출) |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tooltipShown` | `_lastOpenState='false' → 'true'` 전환 직후 1회 | `{ targetInstance }` |
| `@tooltipHidden` | `_lastOpenState='true' → 'false'` 전환 직후 1회 | `{ targetInstance }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_isSafeHref(href)` | `(string) => boolean` | trim 후 lowercased prefix 가 `javascript:`/`data:`/`vbscript:` 면 false. http(s)/mailto/tel/상대경로/`#`은 true. 빈 문자열도 true(no-op). |
| `_sanitizeNode(node, parent)` | `(Node, Element) => void` | 재귀 walker. ① TEXT_NODE → cloneNode 후 parent.appendChild. ② ELEMENT_NODE 이고 tag 가 `_allowedTags` 에 있으면 새 element 생성 → 허용 속성만 복사(href 는 `_isSafeHref` 통과 시) → 자식 재귀 → parent.appendChild. ③ 허용 외 tag 는 element 만 drop, 자식은 그대로 parent 에 직접 재귀(unwrap — 표시 텍스트 보존). |
| `_sanitizeHtml(richHtml)` | `(string) => DocumentFragment` | `new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html')` → `body` 요소를 walker 의 가상 root 로 사용 → 빈 `DocumentFragment` 에 정제된 자식들을 누적 → 반환. DOMParser 의 'text/html' 모드는 inline `<script>` 를 실행하지 않음. |
| `_handleSetTooltipContent({ response })` | `({response}) => void` | `tooltipContent`/`setTooltipContent` 토픽 핸들러. ① body 비우기. ② `mode==='html'` 이고 `richHtml` 이 string 이면 `_sanitizeHtml` 결과 fragment 를 body 에 append. ③ 그 외(또는 `mode==='text'`)는 `label` (또는 `richHtml` 의 string fallback) 을 textContent 로만 반영(HTML 처리 없음). |
| `_handleSetTooltipOpen({ response })` | `({response}) => void` | `setTooltipOpen` 토픽 핸들러. `response.open === true/false` 면 root `dataset.open = 'true'/'false'` 갱신 → `_emitOpenStateIfChanged()`. |
| `_emitOpenStateIfChanged()` | `() => void` | root 의 현재 `dataset.open` 을 읽어 `_lastOpenState` 와 비교. 변경되었으면 `@tooltipShown` / `@tooltipHidden` 1회 발행 + `_lastOpenState` 갱신. |
| `_observeOpenState()` | `() => void` | root 에 `MutationObserver` 부착 — `attributes:true, attributeFilter:['data-open']`. 페이지가 dataset 을 직접 갱신해도 (`setTooltipOpen` 토픽 우회) 라이프사이클 이벤트 발행 보장. |
| `setTooltipContent(payload)` | `(object) => void` | 명시 setter — 토픽 publish 없이 직접 호출 가능. 내부적으로 `_handleSetTooltipContent({response: payload})` 위임. |

### 페이지 연결 사례

```
[페이지 — 단축키 안내 / 경고+링크 / plan 리스트 / 인라인 명령 안내]
    │
    ├─ // 콘텐츠 채우기 (rich)
    │  fetchAndPublish('tooltipContent', this) 또는 직접 publish
    │     payload 예: {
    │         mode: 'html',
    │         richHtml: '<p><strong>Warning:</strong> This will <em>permanently</em> delete the project. <a href="/docs/delete">Learn more</a>.</p>'
    │     }
    │
    ├─ // 또는 plain (Standard 호환 의도)
    │  publish payload: { mode: 'text', label: 'Save draft' }
    │
    ├─ // 외부 트리거로 표시/숨김 (publish)
    │  publish('setTooltipOpen', { open: true })  // 또는 false
    │
    ├─ // 또는 직접 dataset 제어 (Standard 와 동일 채널 — observer 가 라이프사이클 이벤트 발행)
    │  rootEl.dataset.open = 'true'
    │
    └─ Wkit.onEventBusHandlers({
         '@tooltipShown':       () => analytics.track('tooltip_shown'),
         '@tooltipHidden':      () => state.clearAnchor(),
         '@tooltipLinkClicked': ({ event }) => {
             const a = event.target.closest('a');
             if (!a) return;
             event.preventDefault();              // 페이지가 SPA 라우팅 결정
             router.navigate(a.getAttribute('href'));
         }
       });
```

### 디자인 변형

| 파일 | 페르소나 | rich 콘텐츠 표현 (kbd / link / list / strong) | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 8px 모서리 / 시안 link / kbd 는 검은 fill + 시안 border / list 는 leading bullet 시안. | **단축키 안내** — `<p>Press <kbd>Ctrl</kbd>+<kbd>K</kbd> to search.</p>` |
| `02_material`    | B: Material Elevated | 인버스 다크 surface / Roboto / 4px 모서리 + elevation shadow / link 는 inverse primary / kbd 는 outlined / strong 은 weight 700. | **경고 + 링크** — `<p><strong>Warning:</strong> This will <em>permanently</em> delete the project. <a href="/docs/delete">Learn more</a>.</p>` |
| `03_editorial`   | C: Minimal Editorial | 웜 아이보리 / Georgia 세리프 / 0px 모서리 / 헤어라인 link underline / kbd 는 작은 capital / list 는 dash bullet. | **plan 비교 리스트** — `<p>Storage limits</p><ul><li>Free: 10MB</li><li>Pro: <strong>1GB</strong></li><li>Team: <strong>10GB</strong></li></ul>` |
| `04_operational` | D: Dark Operational  | 다크 시안 / JetBrains Mono / 2px 각진 / inline `<code>` 은 형광 시안 background / kbd 는 monospace 작은 outline / link 는 시안 underline. | **인라인 명령 안내** — `<p>Run <code>npm install</code> then <code>npm start</code>. See <a href="/runbook">runbook</a>.</p>` |

각 페르소나는 `01_refined.html` 처럼 페르소나에 맞는 demo `richHtml` 을 1세트 + plain `label` 토글 1세트 + `setTooltipOpen` 트리거 1세트를 preview 데모 컨트롤로 노출한다(라벨/힌트로 시연 시나리오 명시).

### 결정사항

- **DOMParser 'text/html' 모드 — script 미실행** — `parseFromString(html, 'text/html')` 은 파싱은 하되 inline `<script>` 를 실행하지 않는다(MDN 명시). 따라서 1차 파싱은 안전. 그러나 파싱 결과 트리에 `<script>` 노드가 *존재* 할 수 있으므로 walker 가 명시적으로 drop. `<iframe>`/`<style>` 등도 동일 처리.
- **`<img>` 미허용 (default)** — `src`/`srcset` 으로 외부 픽셀 트래커가 가능하고, `onerror` 회피 후에도 `data:`/cross-origin 추적이 가능. 본 변형은 Tooltip 텍스트 콘텐츠를 우선시하므로 `<img>` 는 화이트리스트에서 제외. 향후 `imageRich` 별 변형이 필요하면 큐에 등록.
- **`<a>` `target` / `rel` 속성 미허용** — `target="_blank"` + `rel` 미설정은 `window.opener` 노출 + tabnabbing 위험. 페이지 핸들러가 `@tooltipLinkClicked` 에서 `event.preventDefault()` 후 `window.open(url, '_blank', 'noopener')` 를 결정. 컴포넌트는 `href` 만 보존.
- **`<a>` `href=""` 또는 unsafe URL** — 빈 href 는 그대로 통과(현재 페이지 reload 위험은 페이지 핸들러의 preventDefault 책임). unsafe URL 은 element 만 drop, 자식 텍스트 노드는 unwrap 으로 보존.
- **속성 화이트리스트 — 매우 좁게 유지** — `class`/`title`/`aria-label`/`data-tip-action`/`href`(a 만) 5종. `style`/`id`/`name`/`form*`/`xmlns*` 은 모두 제거. CSS injection (`style="background: url(javascript:...)"`) 차단.
- **walker drop 정책 — element 는 drop, 자식은 unwrap** — 허용 외 element 만 제거, 자식은 그대로 parent 에 재귀하여 표시 텍스트 보존(예: `<form><p>hi</p></form>` → `<p>hi</p>` 만). `<script>`/`<style>`/`<iframe>` 의 자식(코드 텍스트)은 자식이 텍스트 노드일 뿐이므로 결과적으로 raw 텍스트가 노출되지만, *실행되지는 않음*. 공격자에게 정보 누출은 없으며 사용자에게 무해한 텍스트로 보임.
- **MutationObserver 로 dataset 직접 제어 호환** — Standard 는 페이지가 `rootEl.dataset.open = 'true'` 로 직접 토글하는 패턴이 메인. richContent 도 이 채널을 유지하되, MutationObserver 로 변경을 감지해 `@tooltipShown`/`@tooltipHidden` 발행. `setTooltipOpen` 토픽 채널과 dataset 채널이 같은 라이프사이클 이벤트로 수렴.
- **observer 라이프사이클** — register.js 끝에서 `_observeOpenState()` 호출 → 즉시 부착. `_lastOpenState` 는 부착 시점의 dataset 값으로 초기화. beforeDestroy 에서 `disconnect()` + `null`.
- **`@tooltipLinkClicked` 는 `preventDefault` 안 함** — 페이지가 SPA 라우팅인지 새 탭인지 결정. 컴포넌트가 임의로 막으면 `<a href="mailto:...">` 같은 native 행동을 깨뜨릴 수 있음.
- **pointerType 차별 없음** — Tooltip 의 클릭은 desktop 마우스/터치 모두 동일 동작. mobile 은 트리거가 long-press 인 경우가 많지만 본 변형의 책임 외(페이지가 트리거 결정).
- **prefix `.tooltip-rc__*`** — Standard `.tooltip__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X). 루트는 `.tooltip-rc` 로 변경.
- **Tooltips 첫 Advanced 변형 — Standard `tooltipInfo` 토픽과 분리** — Standard 의 `tooltipInfo` 토픽은 plain `label` 만 운반. richContent 는 `mode` 필드 분기가 필요해 `tooltipContent` 별 토픽을 사용. 페이지가 Standard → richContent 마이그레이션 시 토픽명 + payload shape 모두 변경 필요(mode 추가). 단순 plain 케이스(`{mode:'text', label}`)는 호환성 의도.
- **신규 Mixin 생성 금지** — sanitize/walker 가 본 변형에 강하게 결합. 다른 컴포넌트가 동일 패턴을 답습하면 `HtmlSanitizeMixin` 일반화 검토(SKILL 회귀 규율, 본 사이클은 메모만).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js — Mixin 미사용이지만 자체 `_cssSelectors` 와 view/preview 일치)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (MutationObserver disconnect → customEvents 제거 → 구독 해제 → 자체 메서드/상태 null)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tooltips/Advanced/richContent/preview/...html` → `../`를 5번 = Toolbars/overflowMenu 와 동일 verbatim 복사)
