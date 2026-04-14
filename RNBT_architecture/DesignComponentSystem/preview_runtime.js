/**
 * Preview Runtime — SimpleDashboard 컴포넌트 독립 프리뷰용 런타임 시뮬레이션
 *
 * ─────────────────────────────────────────────────────────────
 * 이 파일이 필요한 이유:
 *
 * 컴포넌트의 register.js는 런타임 환경에서 실행되는 코드다.
 * register.js 안에서 사용하는 GlobalDataPublisher, Wkit, Weventbus, fx 등은
 * 실제 RENOBIT 뷰어 런타임이 제공하는 전역 객체다.
 *
 * 그런데 preview HTML은 브라우저에서 직접 여는 독립 파일이다.
 * RENOBIT 런타임 없이 열기 때문에 위 전역 객체들이 존재하지 않는다.
 * 이 상태에서 register.js의 패턴(Mixin 적용, 구독, 이벤트 매핑)을
 * 그대로 사용하려면 전역 객체들을 시뮬레이션해야 한다.
 *
 * 이 파일이 그 시뮬레이션을 제공한다:
 *
 *   GlobalDataPublisher — topic 기반 데이터 발행/구독
 *                         실제 파일(Utils/GlobalDataPublisher.js)이 존재하지만,
 *                         내부에서 Wkit.fetchData()를 호출한다.
 *                         Wkit.fetchData는 런타임이 제공하는 함수이므로
 *                         preview에서는 직접 fetch(url)로 대체해야 한다.
 *
 *   Wkit               — DOM 이벤트 바인딩, 이벤트 버스 핸들러 등록
 *                         실제 파일(Utils/Wkit.js)이 존재하지만,
 *                         내부에서 뷰어 런타임의 다른 모듈에 의존한다.
 *                         단독으로 <script src>로 로드할 수 없다.
 *
 *   Weventbus          — 컴포넌트 간 이벤트 전달
 *                         실제 파일(Utils/Weventbus.js)은 의존성이 fx뿐이라
 *                         단독 로드가 가능하지만, preview에서는
 *                         Wkit.onEventBusHandlers와 통합된 간소화 버전을 사용한다.
 *
 *   fx                 — 함수형 유틸리티 (go, each)
 *                         실제 파일(Utils/fx.js)이 존재하고 로드할 수 있지만,
 *                         preview에서는 go, each만 사용하므로 최소 시뮬레이션이 더 단순.
 *
 * 또한 preview 전용 헬퍼(loadComponentAssets)를 제공하여
 * HTML/CSS 파일을 fetch로 읽어 컨테이너에 삽입한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용법:
 *
 *   각 컴포넌트의 preview HTML에서:
 *   <script src="../../../../preview_runtime.js"></script>
 *   <script src="../../../../../../Mixins/FieldRenderMixin.js"></script>
 *
 * ─────────────────────────────────────────────────────────────
 * 주의:
 *
 *   이 시뮬레이션은 preview 동작 확인용이며, 실제 런타임과 동일하지 않다.
 *   실제 런타임의 Wkit.fetchData, 라이프사이클 관리 등은 포함되지 않는다.
 *   mock 서버(localhost:4010)가 실행 중이어야 데이터를 받을 수 있다.
 *
 * ─────────────────────────────────────────────────────────────
 */

// ── Dataset Registry (datasetName → API endpoint) ──
const _datasetRegistry = {
    dashboard_systemInfo:    '/api/system-info',
    dashboard_stats:         '/api/stats',
    dashboard_events:        '/api/events',
    dashboard_eventBrowser:  '/api/event-browser',
    dashboard_devices:       '/api/devices'
};

const PREVIEW_BRIDGE_TYPE = 'RNBT_PREVIEW_EVENT_LOG';
let _lastPreviewConsoleAt = 0;

function postPreviewEventLog(entry) {
    if (window.parent === window) return;
    try {
        window.parent.postMessage({
            type: PREVIEW_BRIDGE_TYPE,
            entry: {
                timestamp: Date.now(),
                ...entry,
            },
        }, '*');
    } catch (_) {
        // preview 독립 실행 시 부모 전달 실패는 무시
    }
}

// ── GlobalDataPublisher 시뮬레이션 ──
const _mappings = new Map();
const _subscribers = new Map();

const GlobalDataPublisher = {
    registerMapping({ topic, datasetInfo }) {
        _mappings.set(topic, datasetInfo);
    },
    unregisterMapping(topic) {
        _mappings.delete(topic);
    },
    subscribe(topic, instance, handler) {
        if (!_subscribers.has(topic)) _subscribers.set(topic, new Set());
        _subscribers.get(topic).add({ instance, handler });
    },
    unsubscribe(topic, instance) {
        const subs = _subscribers.get(topic);
        if (!subs) return;
        for (const sub of subs) {
            if (sub.instance === instance) subs.delete(sub);
        }
    },
    async fetchAndPublish(topic) {
        const info = _mappings.get(topic);
        if (!info) return;
        const endpoint = _datasetRegistry[info.datasetName];
        const baseUrl = info.param.baseUrl || 'localhost:4010';
        const url = `http://${baseUrl}${endpoint}`;
        const res = await fetch(url);
        const data = await res.json();
        const payload = { response: { data } };
        const subs = _subscribers.get(topic) || new Set();
        for (const { instance, handler } of subs) {
            handler.call(instance, payload);
        }
    }
};

// ── Weventbus 시뮬레이션 ──
const _eventHandlers = {};

function normalizeEventName(name) {
    return String(name || '').replace(/^@/, '');
}

function extractEventLabel(event) {
    const target = event?.target;
    if (!target || typeof target.closest !== 'function') return null;

    const candidate = target.closest('button, [role="button"], a, label, input, option, .el-button, .el-menu-item');
    if (!candidate) return null;

    const text = (
        candidate.getAttribute?.('aria-label')
        || candidate.getAttribute?.('title')
        || candidate.innerText
        || candidate.textContent
        || candidate.value
        || ''
    ).replace(/\s+/g, ' ').trim();

    return text || null;
}

function formatEventMessage(name, payload) {
    const eventName = normalizeEventName(name);
    const label = extractEventLabel(payload?.event);
    return label ? `${eventName} "${label}"` : eventName;
}

const Weventbus = {
    emit: (name, payload) => {
        const eventEntry = {
            source: 'eventbus',
            message: formatEventMessage(name, payload),
            detail: {
                targetInstanceId: payload?.targetInstance?.id || null,
                eventType: payload?.event?.type || null,
            },
        };
        setTimeout(() => {
            if (Date.now() - _lastPreviewConsoleAt < 120) return;
            postPreviewEventLog(eventEntry);
        }, 0);
        if (_eventHandlers[name]) _eventHandlers[name](payload);
    }
};

// ── Wkit 시뮬레이션 ──
const Wkit = {
    bindEvents: (instance, customEvents) => {
        const listener = (e) => {
            Object.entries(customEvents).forEach(([eventName, selectorMap]) => {
                if (eventName !== e.type) return;
                Object.entries(selectorMap).forEach(([selector, emitName]) => {
                    if (e.target.closest(selector)) {
                        Weventbus.emit(emitName, { event: e, targetInstance: instance });
                    }
                });
            });
        };
        instance._listener = listener;
        Object.keys(customEvents).forEach(eventName => {
            instance.appendElement.addEventListener(eventName, listener);
        });
    },
    removeCustomEvents: (instance) => {
        if (instance._listener) {
            ['click', 'change'].forEach(e =>
                instance.appendElement.removeEventListener(e, instance._listener)
            );
        }
    },
    onEventBusHandlers: (handlers) => {
        Object.assign(_eventHandlers, handlers);
    },
    offEventBusHandlers: (handlers) => {
        Object.keys(handlers).forEach(k => delete _eventHandlers[k]);
    },
    /**
     * 3D 이벤트 바인딩 시뮬레이션.
     * 실제 Wkit.bind3DEvents와 동일하게 instance.appendElement.eventListener[type]에
     * 이벤트 버스 발행 핸들러를 등록한다. 실제 raycasting은 프리뷰 쪽에서 수행하고
     * hit된 객체(또는 부모)의 eventListener[type](event) 를 호출하면 된다.
     *
     * 3D customEvents 구조는 2D와 다르다:
     *   2D: { click: { '.selector': '@topic' } }
     *   3D: { click: '@topic' }  (selector 없음 — 전체 mesh 대상)
     */
    bind3DEvents: (instance, customEvents) => {
        instance.appendElement.eventListener = instance.appendElement.eventListener || {};
        Object.keys(customEvents).forEach(browserEvent => {
            instance.appendElement.eventListener[browserEvent] = (event) => {
                const topic = customEvents[event.type];
                Weventbus.emit(topic, { event, targetInstance: instance });
            };
        });
    }
};

// ── fx 시뮬레이션 ──
const fx = {
    each: (fn, arr) => { if (arr) arr.forEach(fn); else return (arr2) => arr2.forEach(fn); },
    go: (...args) => {
        const [init, ...fns] = args;
        return fns.reduce((acc, fn) => { fn(acc); return acc; }, init);
    }
};

// ── Preview Helper ──

/**
 * 컴포넌트 HTML/CSS를 로드하고 컨테이너에 삽입한다.
 *
 * @param {string} containerId - 컨테이너 요소 ID
 * @param {string} htmlPath - HTML 파일 경로
 * @param {string} cssPath - CSS 파일 경로
 * @returns {Promise<HTMLElement>} 컨테이너 요소
 */
async function loadComponentAssets(containerId, htmlPath, cssPath) {
    const [htmlRes, cssRes] = await Promise.all([
        fetch(htmlPath).then(r => r.text()),
        fetch(cssPath).then(r => r.text())
    ]);

    const container = document.getElementById(containerId);
    container.innerHTML = htmlRes;

    // CSS 스코프 ID 치환: CSS 파일의 원래 스코프 ID를 실제 컨테이너 ID로 변환
    // 예: #chart-container .chart → #line-chart-container .chart
    const scopedCss = cssRes.replace(/#[\w-]+-container\b/g, '#' + containerId);

    const style = document.createElement('style');
    style.textContent = scopedCss;
    document.head.appendChild(style);

    return container;
}

function observePreviewLogElements() {
    const seen = new Map();
    const selectors = ['#demo-log', '#event-log'];

    const forwardLogElement = (el) => {
        if (!el) return;
        const raw = (el.innerText || el.textContent || '').trim();
        if (!raw) return;
        if (seen.get(el) === raw) return;
        seen.set(el, raw);

        const lines = raw.split('\n').map((line) => line.trim()).filter(Boolean);
        const bodyLines = lines.filter((line) => line !== '이벤트 로그' && line !== '—');
        if (bodyLines.length === 0) return;

        postPreviewEventLog({
            source: 'preview-log',
            message: bodyLines[0],
            lines: bodyLines.slice(0, 20),
        });
    };

    const attachObserver = (el) => {
        if (!el || el.__rnbtObserved) return;
        el.__rnbtObserved = true;

        const observer = new MutationObserver(() => forwardLogElement(el));
        observer.observe(el, {
            childList: true,
            subtree: true,
            characterData: true,
        });
        forwardLogElement(el);
    };

    const scan = () => {
        selectors.forEach((selector) => {
            document.querySelectorAll(selector).forEach(attachObserver);
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scan, { once: true });
    } else {
        scan();
    }

    const rootObserver = new MutationObserver(scan);
    rootObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

function interceptPreviewConsoleLogs() {
    if (console.__rnbtPreviewWrapped) return;

    const originalLog = console.log.bind(console);
    console.__rnbtPreviewWrapped = true;

    console.log = (...args) => {
        originalLog(...args);

        const first = args[0];
        if (typeof first !== 'string' || !first.startsWith('[Preview]')) return;

        const rendered = args
            .map((arg) => {
                if (typeof arg === 'string') return arg;
                try {
                    return JSON.stringify(arg);
                } catch (_) {
                    return String(arg);
                }
            })
            .join(' ')
            .trim();

        _lastPreviewConsoleAt = Date.now();
        postPreviewEventLog({
            source: 'preview-console',
            message: rendered,
        });
    };
}

// ── window 노출 ──
// 3D 프리뷰는 <script type="module">에서 THREE를 import하는데,
// module scope에서는 classic script의 top-level const/let에 접근할 수 없다.
// window에 붙여야 module script에서 접근 가능하다.
window.GlobalDataPublisher = GlobalDataPublisher;
window.Weventbus = Weventbus;
window.Wkit = Wkit;
window.fx = fx;
window.loadComponentAssets = loadComponentAssets;
window.RNBT_PREVIEW_BRIDGE_TYPE = PREVIEW_BRIDGE_TYPE;

interceptPreviewConsoleLogs();
observePreviewLogElements();
