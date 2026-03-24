/**
 * Preview Runtime — SimpleDashboard 컴포넌트 독립 프리뷰용 런타임 시뮬레이션
 *
 * 실제 런타임(Wkit, Weventbus, GlobalDataPublisher)을 최소한으로 시뮬레이션한다.
 * 각 컴포넌트의 preview HTML에서 <script src="../../preview_runtime.js">로 로드한다.
 */

// ── Dataset Registry (datasetName → API endpoint) ──
const _datasetRegistry = {
    dashboard_systemInfo:    '/api/system-info',
    dashboard_stats:         '/api/stats',
    dashboard_events:        '/api/events',
    dashboard_eventBrowser:  '/api/event-browser'
};

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
const Weventbus = {
    emit: (name, payload) => {
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

    const style = document.createElement('style');
    style.textContent = cssRes;
    document.head.appendChild(style);

    return container;
}
