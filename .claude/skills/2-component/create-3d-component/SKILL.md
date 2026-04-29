---
name: create-3d-component
description: 개별 단위 3D 컴포넌트를 생성합니다. 단일 GLTF 모델(1 장비 = 1 Mesh)의 컴포넌트를 CLAUDE.md 명세에 따라 구현합니다.
---

# 개별 단위 3D 컴포넌트 생성

단일 GLTF 모델을 제어하는 3D 컴포넌트를 생성한다. 하나의 장비가 하나의 Mesh에 대응하며, meshName이 확정되어 있다.

> **공통 규칙**: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)
> **다중 Mesh(GLTF 컨테이너)는**: `create-3d-container-component` SKILL을 사용

---

## 전제 조건

이 스킬은 `produce-component` 스킬에서 다음이 완료된 후 호출된다:

- **컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세 (Mixin, 커스텀 메서드, 이벤트) 작성 완료
- **사용자 승인** — CLAUDE.md 내용이 승인됨

이 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다. 기능 정의나 Mixin 선택을 다시 하지 않는다.

> Mixin이 존재하지 않는 경우에도, 구현 명세에 커스텀 속성/메서드가 정의되어 있으면 그대로 구현한다. 컴포넌트 생산 루프에서는 **새 Mixin을 만들지 않는다** — 커스텀 메서드로 완결한다. Mixin 추가는 루프와 분리된 별도 수동 작업(`create-mixin-spec` → `implement-mixin`)에서 사용자가 직접 처리한다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**

1. **대상 컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세
2. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
3. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
4. **Mixin 문서 확인** — 구현 명세에 명시된 Mixin의 .md 파일
5. **기존 예제 확인** — 같은 패턴의 기존 컴포넌트를 참조:
   - [BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) — 대표 개별 단위 컴포넌트

---

## 개별 단위 3D 컴포넌트의 특징

```
특징:
  - 1 GLTF 모델 = 1 장비 = 1 Mesh
  - meshName이 확정됨 (하드코딩)
  - 이벤트 이름이 장비 고유 (예: '@battClicked')
  - showDetail()에 인자 없음 (자기 자신의 상태를 내부에서 조회)

예시:
  BATT, Chiller, Panel, UPS, thermohygrostat, tempHumiTH2B
```

---

## 변형 구조

변형은 Standard(필수)와 Advanced(선택)로 구분된다. 실제 조합은 CLAUDE.md 구현 명세에서 결정된다.

| 세트 | 번호 | 이름 | Mixin 조합 |
|------|------|------|-----------|
| Standard | 01 | status | MeshState |
| Advanced | 02 | camera | MeshState + CameraFocus |
| Advanced | 03 | popup | MeshState + 3DShadowPopup |
| Advanced | 04 | highlight | MeshState + MeshHighlight |
| Advanced | 05 | camera_highlight | MeshState + CameraFocus + MeshHighlight |
| Advanced | 06 | visibility | MeshState + MeshVisibility |
| Advanced | 07 | animation | MeshState + AnimationMixin |
| Advanced | 08 | clipping | MeshState + ClippingPlaneMixin |

> 기존 생산된 01~03은 `01_status`, `02_status_camera`, `03_status_popup` 폴더명을 유지한다.
> 신규 생산분(04~)부터 새 명명 규칙을 적용한다.

---

## 01_status — register.js

```javascript
/**
 * 01_status: MeshStateMixin만 적용
 * - 데이터 수신 시 Mesh 색상을 상태에 따라 변경
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (01에서는 없음)
// ======================
```

## 01_status — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리
this.meshState?.destroy();
```

---

## 02_status_camera — register.js

```javascript
/**
 * 02_status_camera: MeshStateMixin + CameraFocusMixin
 * - 상태 색상 표시 + 클릭 시 카메라 포커스
 *
 * 개별 단위에서는 meshName이 확정이므로
 * resolveMeshName이 불필요하다.
 * page before_load.js에서 하드코딩된 meshName으로 focusOn을 호출한다.
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 (개별 단위 02에서는 없음)
// ======================
// 클릭 이벤트는 page before_load.js에서 처리한다.
// meshName이 확정이므로 컴포넌트 레벨에서 이벤트를 바인딩할 필요 없음.
```

## 02_status_camera — beforeDestroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## 03_status_popup — register.js

```javascript
/**
 * 03_status_popup: MeshStateMixin + 3DShadowPopupMixin
 * - 상태 색상 표시 + 클릭 시 팝업으로 상세 정보 표시
 *
 * 개별 단위에서는:
 * - meshName이 확정이므로 resolveMeshName 불필요
 * - showDetail()에 인자 없음 — 내부에서 getMeshState로 상태 조회
 * - 이벤트 이름이 장비 고유 (예: '@battClicked')
 */

// ======================
// 1. MIXIN 적용
// ======================

// ── MeshStateMixin ────────────────────────────────────────────
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ── 3DShadowPopupMixin ────────────────────────────────────────
const { htmlCode, cssCode } = this.properties.publishCode || {};

apply3DShadowPopupMixin(this, {
    getHTML:   () => htmlCode || '',
    getStyles: () => cssCode || '',
    onCreated: () => {
        this.shadowPopup.bindPopupEvents({
            click: {
                '.popup-close': () => this.shadowPopup.hide()
            }
        });
    }
});

// ======================
// 3. 이벤트 매핑 + showDetail 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);

/**
 * showDetail — 인자 없이 호출 (개별 단위 패턴)
 * 내부에서 getMeshState로 자기 자신의 상태를 조회하여 팝업에 표시
 */
this.showDetail = () => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    const statusEl = this.shadowPopup.query('.popup-status');

    if (nameEl) nameEl.textContent = this.name || '장비명';
    if (statusEl) {
        const currentStatus = this.meshState.getMeshState('장비명') || 'normal';
        statusEl.textContent = currentStatus;
        statusEl.dataset.status = currentStatus;
    }
};
```

## 03_status_popup — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순) + showDetail 정리
this.showDetail = null;
this.shadowPopup.destroy();
this.meshState?.destroy();
```

---

## 04_highlight — register.js

```javascript
/**
 * 04_highlight: MeshStateMixin + MeshHighlightMixin
 * - 상태 색상 표시 + 클릭 시 선택 강조
 *
 * MeshHighlightMixin은 emissive 채널을 사용하므로
 * MeshStateMixin(color 채널)과 동시 적용 가능하다.
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyMeshHighlightMixin(this, {
    highlightColor:     0xFFFF00,
    highlightIntensity: 0.3,
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);
```

## 04_highlight — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.meshHighlight.destroy();
this.meshState?.destroy();
```

---

## 05_camera_highlight — register.js

```javascript
/**
 * 05_camera_highlight: MeshStateMixin + CameraFocusMixin + MeshHighlightMixin
 * - 상태 색상 + 클릭 시 카메라 포커스 + 선택 강조
 */

// ======================
// 1. MIXIN 적용
// ======================
applyMeshStateMixin(this, {
    colorMap: {
        normal:   0x00C853,
        warning:  0xFFD600,
        critical: 0xFF1744,
        offline:  0x9E9E9E,
    },
});

applyCameraFocusMixin(this, {
    camera:   wemb.threeElements.camera,
    controls: wemb.threeElements.mainControls,
    duration: 1000
});

applyMeshHighlightMixin(this, {
    highlightColor:     0xFFFF00,
    highlightIntensity: 0.3,
});

// ======================
// 2. 구독 연결
// ======================
this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@장비명Clicked'   // ← 실제 이벤트 이름으로 교체
};
bind3DEvents(this, this.customEvents);
```

## 05_camera_highlight — beforeDestroy.js

```javascript
const { removeCustomEvents } = Wkit;

// 3. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

// 2. 구독 해제
go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 1. Mixin 정리 (적용 역순)
this.meshHighlight.destroy();
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## page scripts

### loaded.js (모든 변형 공통)

```javascript
const { registerMapping, fetchAndPublish } = GlobalDataPublisher;
const { each, go } = fx;

this.pageDataMappings = [
    {
        topic: 'equipmentStatus',
        datasetInfo: {
            datasetName: '장비명Status',  // ← API 엔드포인트명
            param: {}
        },
        refreshInterval: 30000
    }
];

this.pageParams = {};

go(
    this.pageDataMappings,
    each(registerMapping),
    each(({ topic }) => this.pageParams[topic] = {}),
    each(({ topic }) =>
        fetchAndPublish(topic, this)
            .catch(err => console.error(`[Page] ${topic}:`, err))
    )
);

this.startAllIntervals = () => {
    this.pageIntervals = {};

    go(
        this.pageDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                const state = { _stopped: false, _timerId: null };
                this.pageIntervals[topic] = state;

                const scheduleNext = () => {
                    if (state._stopped) return;
                    state._timerId = setTimeout(() => {
                        fetchAndPublish(topic, this, this.pageParams[topic] || {})
                            .catch(err => console.error(`[Page] ${topic}:`, err))
                            .finally(scheduleNext);
                    }, refreshInterval);
                };
                scheduleNext();
            }
        })
    );
};

this.stopAllIntervals = () => {
    go(
        Object.values(this.pageIntervals || {}),
        each(state => {
            state._stopped = true;
            clearTimeout(state._timerId);
        })
    );
};

this.startAllIntervals();
```

### before_load.js — 03_status_popup

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@장비명Clicked': ({ targetInstance }) => {
        targetInstance.showDetail();  // 인자 없이 호출 (개별 단위 패턴)
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_load.js — 04_highlight / 05_camera_highlight

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@장비명Clicked': ({ targetInstance }) => {
        // 이전 강조 해제 + 새 강조 적용
        targetInstance.meshHighlight.clearAll();
        targetInstance.meshHighlight.highlight('장비명');  // ← 실제 meshName

        // 05에서만: 카메라 포커스
        // targetInstance.cameraFocus.focusOn({ meshName: '장비명' });
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_unload.js (모든 변형 공통)

```javascript
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = Wkit;
const { each, go } = fx;

if (this.stopAllIntervals) this.stopAllIntervals();
this.pageIntervals = null;

offEventBusHandlers(this.pageEventBusHandlers);
this.pageEventBusHandlers = null;

go(
    this.pageDataMappings,
    each(({ topic }) => unregisterMapping(topic))
);
this.pageDataMappings = null;
this.pageParams = null;
```

---

## 출력 구조

```
Components/3D_Components/
└── {장비명}/
    ├── CLAUDE.md
    ├── Standard/                          ← 필수 (MeshState only)
    │   ├── CLAUDE.md
    │   ├── scripts/
    │   │   ├── register.js
    │   │   └── beforeDestroy.js
    │   └── preview/
    │       └── 01_default.html            ← 모델 변종 1개당 1 파일
    └── Advanced/                          ← 선택 (Mixin 조합별, 다중 구현 컨테이너)
        ├── camera/                        ← 각 구현은 Standard와 동일한 4요소를 자기 안에 갖는다
        │   ├── CLAUDE.md
        │   ├── scripts/
        │   │   ├── register.js
        │   │   └── beforeDestroy.js
        │   └── preview/
        │       └── 01_default.html        ← 구현명은 경로에 있으므로 파일명은 변종명만
        ├── popup/
        │   ├── CLAUDE.md
        │   ├── scripts/...
        │   └── preview/
        │       └── 01_default.html
        ├── highlight/                     # 구현 명세에 따라 선택
        │   └── ... (동일 4요소)
        └── camera_highlight/
            └── ... (동일 4요소)
```

> 페이지 라이프사이클 훅(`before_load.js`, `loaded.js`, `before_unload.js`)은 컴포넌트가 아니라 **페이지**가 가진다 (`Examples/{Dashboard}/page/page_scripts/`). 컴포넌트 폴더 안에 두지 않는다.

```
models/
└── {장비명}/
    └── 01_default/                        ← 모델 변종 1개당 1 폴더
        ├── {장비명}.gltf
        ├── {장비명}.bin
        ├── {장비명}-p.png
        └── maps/ 또는 textures/
```

---

## 변형(Variant) 규약 — 3D = 모델 변종

3D 컴포넌트의 "변형"은 2D의 디자인 페르소나(refined/material/editorial/operational)에 대응한다. 그러나 3D에는 시각 표현이 페르소나가 아닌 **3D 모델 그 자체**이므로, 변형의 축은 **같은 장비 유형의 서로 다른 실제 모델**이 된다.

| 차원 | 2D | 3D |
|------|-----|-----|
| 불변 (공유) | register.js | register.js |
| 변형의 축 | 디자인 페르소나 | 3D 모델 변종 |
| 변형의 자산 | `views/01_refined.html` + `styles/01_refined.css` | `models/{장비명}/01_default/{장비명}.gltf` (+ .bin, 텍스처) |
| preview wrapper | `preview/01_refined.html` (Standard·Advanced 모두 자기 폴더 안) | `preview/01_default.html` (Standard·Advanced 모두 자기 폴더 안) |

### 폴더/파일 명명 규칙

- 모델 변종은 `models/{장비명}/NN_변종명/` 폴더로 격리한다 (예: `models/BATT/01_default/`)
- 폴더 안의 GLTF·.bin·텍스처 파일은 원래 이름을 유지한다 (GLTF 내부 상대 참조가 그대로 유효해야 한다)
- preview HTML은 항상 `{Standard 또는 Advanced/{구현명}}/preview/NN_변종명.html` 위치에 둔다 (구현명은 경로에 있으므로 파일명은 변종명만)
- manifest 라벨은 `"NN 변종명"` (공백 구분)으로 표기하여 2D 형식과 정합

### 변형 추가 절차

1. `models/{장비명}/02_compact/`처럼 새 폴더를 만들고 모델 자산을 넣는다
2. Standard 및 각 Advanced/{구현}/preview/ 안에 새 변종에 대응하는 preview HTML(`02_compact.html`)을 추가한다
3. 새 preview HTML 내부 `loader.load(...)` 경로를 새 폴더로 지정한다
4. manifest.json의 해당 set/item.previews 배열에 `{ "label": "02 compact", "path": "..." }`를 추가한다
5. register.js는 절대 수정하지 않는다 — meshName 약속을 새 모델이 지키면 동일한 코드로 동작한다

### 금지 사항

- ❌ `models/BATT/BATT.gltf`처럼 변종 폴더 없이 자산을 두지 않는다 (변형이 1개여도 `01_default/`를 둔다)
- ❌ preview HTML 라벨을 구현명(`camera`, `popup`)으로 쓰지 않는다 — item 이름과 중복되어 의미가 없다
- ❌ 모델 변종을 위해 register.js를 수정하지 않는다 (수정해야 한다면 변종이 아니라 별도 컴포넌트다)

---

## 금지 사항

> 공통 금지 사항은 [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

- ❌ meshName을 동적으로 추출하지 않는다 — 개별 단위는 이름이 확정됨
- ❌ resolveMeshName 함수를 만들지 않는다 — GLTF 컨테이너 전용 패턴
- ❌ showDetail에 meshName/data 인자를 넣지 않는다 — 내부에서 getMeshState로 조회
- ❌ 이벤트 이름에 '@meshClicked'를 사용하지 않는다 — 범용 이름은 GLTF 컨테이너 전용
- ❌ fetchData를 page before_load.js에서 호출하지 않는다 — 개별 단위는 구독 데이터만 사용

---

## 마무리: manifest.json 등록

구현 완료 후 반드시 `Components/CLAUDE.md` Step 5에 따라 `DesignComponentSystem/manifest.json`에 신규 컴포넌트/set/item/preview를 등록한다. 누락 시 `index.html` 카탈로그에 노출되지 않는다.

> 등록 위치/규칙은 [Components/CLAUDE.md Step 5](/RNBT_architecture/DesignComponentSystem/Components/CLAUDE.md) 참조 (3D 모델 변종 추가 절차도 동일하게 manifest 등록 포함)

---

## Preview 코드 영역 식별 규약

`preview/*.html`의 `<script>` 내부 코드는 빌더(다른 페이지 개발자)가 컴포넌트 사용법을 학습하는 **가이드** 역할을 한다. 따라서 다음 4종 라벨로 영역을 분리하여 페이지 책임 코드와 컴포넌트 register.js 본문이 한눈에 구분되도록 작성한다.

| 라벨 | 의미 |
|------|------|
| `[PREVIEW 인프라]` | Three.js scene/camera/light 셋업, GLTFLoader, model.traverse, OrbitControls, originalColors 저장 등 운영과 무관한 보일러플레이트 |
| `[PAGE]` | 페이지 개발자가 운영에서 직접 작성할 코드 (외부 DOM 정적 렌더 시뮬레이션, 외부 자원 주입, `pageDataMappings` 시뮬레이션) |
| `[COMPONENT register.js 본문]` | register.js의 내용을 그대로 옮긴 부분 (`applyXxxMixin`, 커스텀 메서드 정의, `subscribe go({...})`) — 운영에서는 자동 적용, 페이지는 작성 X |
| `[PREVIEW 전용]` | 데모 컨트롤만의 일회성 코드 (강제 상태 버튼, 디버그 토글, 컴포넌트 외부 명령형 API 시연용 슬라이더 등) |

표기 규약(시각 우선순위 3단계: ████ 두꺼운 블록 / ════ 단일선 헤더 / ──── 점선 인라인)과 적용 예시는 [`_shared/preview-area-labeling.md`](/.claude/skills/0-produce/_shared/preview-area-labeling.md)에 단일 진실 출처로 정리되어 있다. 신규 변형 작성 시 반드시 본 규약을 따르며, 기준 사례는 `Components/3D_Components/meshesArea/area_01/Advanced/hudInfo/preview/01_default.html`이다.

---

## 관련 자료

| 문서 | 경로 |
|------|------|
| MeshStateMixin | [Mixins/MeshStateMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshStateMixin.md) |
| MeshHighlightMixin | [Mixins/MeshHighlightMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshHighlightMixin.md) |
| MeshVisibilityMixin | [Mixins/MeshVisibilityMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/MeshVisibilityMixin.md) |
| CameraFocusMixin | [Mixins/CameraFocusMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/CameraFocusMixin.md) |
| AnimationMixin | [Mixins/AnimationMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/AnimationMixin.md) |
| ClippingPlaneMixin | [Mixins/ClippingPlaneMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/ClippingPlaneMixin.md) |
| 3DShadowPopupMixin | [Mixins/3DShadowPopupMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/3DShadowPopupMixin.md) |
| GLTF 컨테이너 패턴 | [create-3d-container-component](/.claude/skills/2-component/create-3d-container-component/SKILL.md) |
| BATT (참조 구현) | [Components/3D_Components/BATT](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/BATT/) |

---
