---
name: create-3d-container-component
description: GLTF 컨테이너 3D 컴포넌트를 생성합니다. 하나의 GLTF 모델 안에 다중 Mesh가 있고, 클릭된 Mesh를 동적으로 식별합니다.
---

# GLTF 컨테이너 3D 컴포넌트 생성

하나의 GLTF 모델 안에 여러 장비(Mesh)가 포함된 컨테이너 컴포넌트를 생성한다. Mesh 이름이 사전에 확정되지 않으며, Raycasting으로 클릭된 Mesh를 동적으로 식별한다.

> **공통 규칙**: [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md)
> **단일 Mesh(개별 장비)는**: `create-3d-component` SKILL을 사용

---

## 전제 조건

이 스킬은 `produce-component` 스킬에서 다음이 완료된 후 호출된다:

- **컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세 (Mixin, 커스텀 메서드, 이벤트) 작성 완료
- **사용자 승인** — CLAUDE.md 내용이 승인됨

이 스킬은 CLAUDE.md 명세를 코드로 변환하는 역할만 한다. 기능 정의나 Mixin 선택을 다시 하지 않는다.

> Mixin이 존재하지 않는 경우에도, 구현 명세에 커스텀 속성/메서드가 정의되어 있으면 그대로 구현한다. 신규 Mixin이 필요한 경우는 `produce-component` → `create-mixin-spec` → `implement-mixin`에서 이미 처리되어 있다.

---

## ⚠️ 작업 전 필수 확인

**코드 작성 전 반드시 다음 파일들을 Read 도구로 읽으세요.**
**이전에 읽었더라도 매번 다시 읽어야 합니다 — 캐싱하거나 생략하지 마세요.**

1. **대상 컴포넌트 CLAUDE.md** — 기능 정의 + 구현 명세
2. [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) — 공통 규칙
3. [CODING_STYLE.md](/.claude/guides/CODING_STYLE.md) — 코딩 스타일
4. **Mixin 문서 확인** — 구현 명세에 명시된 Mixin의 .md 파일
5. **기존 예제 확인** — 같은 패턴의 기존 컴포넌트를 참조:
   - [gltf_container](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/gltf_container/) — 대표 GLTF 컨테이너 컴포넌트

---

## GLTF 컨테이너의 특징

```
특징:
  - 1 GLTF 모델 = N 장비 = N Mesh
  - meshName이 사전에 확정되지 않음 (동적 식별)
  - Raycasting intersects에서 resolveMeshName으로 Mesh 이름 추출
  - 이벤트 이름이 범용 ('@meshClicked')
  - showDetail(meshName, data)에 인자를 받음 (외부에서 데이터 전달)
  - page before_load.js에서 fetchData로 클릭된 Mesh의 상세 데이터를 조회

개별 단위와의 핵심 차이:
  - resolveMeshName 함수 필수 (intersects 배열에서 parent 체인 탐색)
  - showDetail이 meshName과 data를 외부에서 받음
  - before_load.js에서 fetchData를 import하여 비동기 데이터 조회
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
> 클릭 이벤트가 있는 변형에서는 resolveMeshName이 필요하다.

---

## resolveMeshName — 핵심 유틸리티

GLTF 컨테이너 패턴의 핵심. Raycasting intersects 배열에서 클릭된 장비의 Mesh 이름을 추출한다.

```javascript
/**
 * resolveMeshName — intersects에서 장비 Mesh 이름을 동적으로 추출
 *
 * Raycasting 결과의 intersects[0].object는 최하위 Mesh일 수 있다.
 * parent 체인을 탐색하여 의미 있는 장비 이름을 가진 Mesh를 찾는다.
 *
 * @param {Object} event - 3D 클릭 이벤트 (event.intersects)
 * @returns {string|null} 장비 Mesh 이름 또는 null
 */
this.resolveMeshName = function (event) {
    if (!event.intersects || event.intersects.length === 0) return null;

    let object = event.intersects[0].object;

    // parent 체인을 탐색하여 장비 이름을 가진 Mesh 찾기
    while (object) {
        if (object.name && object.name !== '' && object.isMesh) {
            return object.name;
        }
        object = object.parent;
    }

    return null;
};
```

> resolveMeshName의 탐색 로직은 GLTF 모델의 구조에 따라 달라질 수 있다.
> 실제 모델의 노드 계층을 확인한 후 탐색 조건을 조정한다.

---

## 01_status — register.js

```javascript
/**
 * 01_status: MeshStateMixin만 적용
 * - 데이터 수신 시 여러 Mesh의 색상을 상태에 따라 변경
 * - 01에서는 클릭 이벤트 없음, resolveMeshName 불필요
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
 * - 상태 색상 표시 + 클릭된 Mesh로 카메라 포커스
 *
 * 컨테이너에서는:
 * - resolveMeshName으로 클릭된 Mesh를 동적 식별
 * - '@meshClicked' 범용 이벤트 사용
 * - bind3DEvents로 3D 클릭 이벤트 바인딩
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
// 3. 이벤트 매핑 + resolveMeshName 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
```

## 02_status_camera — beforeDestroy.js

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

// 1. Mixin 정리 (적용 역순) + resolveMeshName 정리
this.resolveMeshName = null;
this.cameraFocus.destroy();
this.meshState?.destroy();
```

---

## 03_status_popup — register.js

```javascript
/**
 * 03_status_popup: MeshStateMixin + 3DShadowPopupMixin
 * - 상태 색상 표시 + 클릭된 Mesh의 상세 정보를 팝업으로 표시
 *
 * 컨테이너에서는:
 * - resolveMeshName으로 클릭된 Mesh를 동적 식별
 * - showDetail(meshName, data)에 인자를 받음
 * - page before_load.js에서 fetchData로 상세 데이터를 조회한 후 showDetail 호출
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
// 3. 이벤트 매핑 + resolveMeshName/showDetail 정의
// ======================

const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};

/**
 * showDetail(meshName, data) — 외부에서 데이터를 받아 팝업에 표시
 * (개별 단위와 달리 인자를 받음)
 *
 * @param {string} meshName - 클릭된 Mesh 이름
 * @param {Object} data - fetchData로 조회한 상세 데이터
 */
this.showDetail = (meshName, data) => {
    this.shadowPopup.show();

    const nameEl = this.shadowPopup.query('.popup-name');
    const statusEl = this.shadowPopup.query('.popup-status');

    if (nameEl) nameEl.textContent = meshName;
    if (statusEl) {
        const currentStatus = (data && data.status) || this.meshState.getMeshState(meshName) || 'normal';
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

// 1. Mixin 정리 (적용 역순) + resolveMeshName/showDetail 정리
this.resolveMeshName = null;
this.showDetail = null;
this.shadowPopup.destroy();
this.meshState?.destroy();
```

---

## 04_highlight — register.js

```javascript
/**
 * 04_highlight: MeshStateMixin + MeshHighlightMixin
 * - 상태 색상 표시 + 클릭된 Mesh 선택 강조
 *
 * 컨테이너에서는:
 * - resolveMeshName으로 클릭된 Mesh를 동적 식별
 * - '@meshClicked' 범용 이벤트 사용
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
// 3. 이벤트 매핑 + resolveMeshName 정의
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
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

// 1. Mixin 정리 (적용 역순) + resolveMeshName 정리
this.resolveMeshName = null;
this.meshHighlight.destroy();
this.meshState?.destroy();
```

---

## 05_camera_highlight — register.js

```javascript
/**
 * 05_camera_highlight: MeshStateMixin + CameraFocusMixin + MeshHighlightMixin
 * - 상태 색상 + 클릭된 Mesh로 카메라 포커스 + 선택 강조
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
// 3. 이벤트 매핑 + resolveMeshName 정의
// ======================
const { bind3DEvents } = Wkit;

this.customEvents = {
    click: '@meshClicked'
};
bind3DEvents(this, this.customEvents);

/**
 * resolveMeshName — intersects에서 Mesh 이름 추출
 */
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;

    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
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

// 1. Mixin 정리 (적용 역순) + resolveMeshName 정리
this.resolveMeshName = null;
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
            datasetName: 'containerEquipmentStatus',
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

### before_load.js — 02_status_camera

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (meshName) {
            targetInstance.cameraFocus.focusOn({ meshName });
        }
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

### before_load.js — 03_status_popup

```javascript
const { onEventBusHandlers } = Wkit;
const { fetchData } = GlobalDataPublisher;

this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (!meshName) return;

        // fetchData로 클릭된 Mesh의 상세 데이터를 조회한 후 showDetail 호출
        fetchData(this, 'meshDetail', { meshName }).then(({ data }) => {
            targetInstance.showDetail(meshName, data);
        });
    },
};

onEventBusHandlers(this.pageEventBusHandlers);
```

> **개별 단위와의 핵심 차이**: before_load.js에서 `fetchData`를 import하여 클릭된 Mesh의 상세 데이터를 비동기로 조회한다. 개별 단위는 `targetInstance.showDetail()`만 호출하면 되지만, 컨테이너는 `resolveMeshName → fetchData → showDetail` 체인이 필요하다.

### before_load.js — 04_highlight / 05_camera_highlight

```javascript
const { onEventBusHandlers } = Wkit;

this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (!meshName) return;

        // 이전 강조 해제 + 새 강조 적용
        targetInstance.meshHighlight.clearAll();
        targetInstance.meshHighlight.highlight(meshName);

        // 05에서만: 카메라 포커스
        // targetInstance.cameraFocus.focusOn({ meshName });
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
└── {컨테이너명}/
    ├── CLAUDE.md
    ├── Standard/                          ← 필수 (MeshState only)
    │   ├── scripts/
    │   │   ├── register.js
    │   │   └── beforeDestroy.js
    │   ├── page/
    │   │   ├── before_load.js
    │   │   ├── loaded.js
    │   │   └── before_unload.js
    │   └── preview/
    │       └── 01_default.html            ← 모델 변종 1개당 1 파일
    └── Advanced/                          ← 선택 (Mixin 조합별)
        ├── camera/
        │   ├── scripts/
        │   │   ├── register.js
        │   │   └── beforeDestroy.js
        │   └── page/
        │       ├── before_load.js
        │       ├── loaded.js
        │       └── before_unload.js
        ├── popup/
        │   ├── scripts/...
        │   └── page/...
        ├── highlight/                     # 구현 명세에 따라 선택
        │   └── ...
        ├── camera_highlight/
        │   └── ...
        ├── visibility/
        │   └── ...
        └── preview/
            ├── 01_default_camera.html     ← {NN_변종명}_{구현명}.html
            ├── 01_default_popup.html
            ├── 01_default_highlight.html
            └── 01_default_visibility.html
```

```
models/
└── {컨테이너명}/
    └── 01_default/                        ← 모델 변종 1개당 1 폴더
        ├── {컨테이너명}.gltf
        ├── {컨테이너명}.bin
        └── textures/ 또는 maps/
```

---

## 변형(Variant) 규약 — 3D = 모델 변종

3D 컴포넌트의 "변형"은 2D의 디자인 페르소나(refined/material/editorial/operational)에 대응한다. 그러나 3D에는 시각 표현이 페르소나가 아닌 **3D 모델 그 자체**이므로, 변형의 축은 **같은 컨테이너 유형의 서로 다른 실제 모델**이 된다 (예: 같은 전기실 레이아웃의 시기별/지점별 모델).

| 차원 | 2D | 3D 컨테이너 |
|------|-----|-----|
| 불변 (공유) | register.js | register.js (resolveMeshName 포함) |
| 변형의 축 | 디자인 페르소나 | 3D 모델 변종 |
| 변형의 자산 | `views/01_refined.html` + `styles/01_refined.css` | `models/{컨테이너명}/01_default/{컨테이너명}.gltf` (+ .bin, 텍스처) |
| preview wrapper | `preview/01_refined.html` | `preview/01_default.html` (Standard) / `preview/01_default_camera.html` (Advanced) |

### 폴더/파일 명명 규칙

- 모델 변종은 `models/{컨테이너명}/NN_변종명/` 폴더로 격리한다 (예: `models/gltf_container/01_default/`)
- 폴더 안의 GLTF·.bin·텍스처 파일은 원래 이름을 유지한다 (GLTF 내부 상대 참조가 그대로 유효해야 한다)
- preview HTML은 `NN_변종명` 또는 `NN_변종명_{구현명}` 접두사를 사용한다
- manifest 라벨은 `"NN 변종명"` (공백 구분)으로 표기하여 2D 형식과 정합

### 컨테이너 특수 고려사항

- 새 모델 변종은 **기존 모델과 동일한 mesh 이름 규약**을 따라야 한다. resolveMeshName이 추출하는 이름이 변종마다 달라지면 register.js가 깨진다.
- 변종에 따라 mesh 집합이 달라지면 (예: 신규 장비 추가) 그것은 변형이 아니라 별도 컨테이너 컴포넌트로 분리한다.

### 금지 사항

- ❌ `models/gltf_container/gltf_container.gltf`처럼 변종 폴더 없이 자산을 두지 않는다 (변형이 1개여도 `01_default/`를 둔다)
- ❌ preview HTML 라벨을 구현명(`camera`, `popup`)으로 쓰지 않는다 — item 이름과 중복되어 의미가 없다
- ❌ 모델 변종을 위해 register.js나 resolveMeshName을 수정하지 않는다 (수정해야 한다면 변종이 아니라 별도 컴포넌트다)

---

## 금지 사항

> 공통 금지 사항은 [SHARED_INSTRUCTIONS.md](/.claude/skills/SHARED_INSTRUCTIONS.md) 참조

- ❌ meshName을 하드코딩하지 않는다 — 컨테이너는 동적 식별이 핵심
- ❌ 장비 고유 이벤트 이름('@battClicked' 등)을 사용하지 않는다 — '@meshClicked' 사용
- ❌ showDetail()을 인자 없이 호출하지 않는다 — 반드시 (meshName, data) 전달
- ❌ resolveMeshName 없이 클릭 이벤트를 처리하지 않는다 — intersects 직접 접근 금지
- ❌ page before_load.js에서 fetchData 없이 showDetail을 호출하지 않는다 — 상세 데이터는 반드시 API 조회

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
| 개별 단위 패턴 | [create-3d-component](/.claude/skills/2-component/create-3d-component/SKILL.md) |
| gltf_container (참조 구현) | [Components/3D_Components/gltf_container](/RNBT_architecture/DesignComponentSystem/Components/3D_Components/gltf_container/) |

---
