/**
 * 3DShadowPopupMixin
 *
 * 3D 컴포넌트에서 Shadow DOM 팝업을 표시한다.
 *
 * 3D 컴포넌트의 appendElement는 THREE.Group이므로 DOM에 직접 팝업을 붙일 수 없다.
 * 대신 page.appendElement(HTMLDivElement)에 Shadow DOM 호스트를 생성하고,
 * HTML/CSS를 문자열(getHTML/getStyles)로 받아 주입한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 책임 분리:
 *
 *   - 컴포넌트 register.js : Mixin 적용 + 3D 클릭 이벤트 발행만. publishCode
 *                             내부 클래스/구조를 알지 못하며 query/bindPopupEvents를
 *                             직접 호출하지 않는다.
 *   - publishCode HTML/CSS : 팝업 시각 구조 + 클래스명. 사용자가 에디터에서 작성.
 *   - 페이지 코드 (loaded.js): publishCode 클래스명을 알고, 정적 이벤트는
 *                             bindPopupEvents로 한 번 등록, 동적 데이터는 매 클릭마다
 *                             show() + query()로 매핑.
 *   - Mixin 본체           : lazy init 동기 보장, 위임 + 큐잉, query, 정리.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   // [컴포넌트 register.js]
 *   const { htmlCode, cssCode } = this.properties.publishCode || {};
 *   apply3DShadowPopupMixin(this, {
 *       getHTML:   () => htmlCode || '',
 *       getStyles: () => cssCode || ''
 *   });
 *
 *   // [페이지 loaded.js]
 *   instance.shadowPopup.bindPopupEvents({
 *       click: { '.popup-close': () => instance.shadowPopup.hide() }
 *   });
 *   Weventbus.on('@battClicked', async () => {
 *       const data = await fetchBattStatus();
 *       instance.shadowPopup.show();
 *       instance.shadowPopup.query('.popup-name').textContent = data.name;
 *   });
 *
 * ─────────────────────────────────────────────────────────────
 * lazy init은 완전히 동기다. show() 다음 줄에서 즉시 query/textContent 접근이
 * 보장된다. 한 번 init되면 hide(display:none) 상태에서도 Shadow DOM이 살아있어
 * query/bindPopupEvents 모두 동작한다.
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.shadowPopup):
 *
 *   this.shadowPopup.show              — 팝업 표시 (lazy init)
 *   this.shadowPopup.hide              — 팝업 숨김
 *   this.shadowPopup.query             — Shadow DOM 내 요소 선택
 *   this.shadowPopup.queryAll          — Shadow DOM 내 모든 요소 선택
 *   this.shadowPopup.bindPopupEvents   — Shadow DOM 내 이벤트 바인딩 (show 전 호출 가능)
 *   this.shadowPopup.removePopupEvents — Shadow DOM 내 이벤트 해제
 *   this.shadowPopup.destroy           — 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function apply3DShadowPopupMixin(instance, options) {
    const { getHTML, getStyles } = options;

    const ns = {};
    instance.shadowPopup = ns;

    let host = null;
    let shadowRoot = null;

    // ── 이벤트 관리 ──

    const _popupListeners = [];
    let _pendingEvents = null;

    function bindInternal(events) {
        Object.entries(events).forEach(([eventType, selectorMap]) => {
            Object.entries(selectorMap).forEach(([selector, handler]) => {
                const listener = function(e) {
                    const target = e.target.closest(selector);
                    if (!target) return;

                    if (typeof handler === 'string' && handler.charAt(0) === '@') {
                        Weventbus.emit(handler, { event: e, targetInstance: instance });
                    } else {
                        handler(e);
                    }
                };
                shadowRoot.addEventListener(eventType, listener);
                _popupListeners.push({ eventType, listener });
            });
        });
    }

    // ── Shadow DOM 생성 ──

    /**
     * Shadow DOM 생성 (lazy init)
     * 최초 show() 호출 시 실행된다.
     *
     * 2D와의 핵심 차이:
     * - page.appendElement에 호스트를 부착 (3D appendElement는 THREE.Group)
     * - getHTML()/getStyles()로 콘텐츠를 문자열로 받아 주입
     */
    function ensureInstance() {
        if (shadowRoot) return;

        host = document.createElement('div');
        instance.page.appendElement.appendChild(host);

        shadowRoot = host.attachShadow({ mode: 'open' });

        const htmlContent = getHTML.call(instance);
        const cssContent = getStyles.call(instance);

        shadowRoot.innerHTML = `<style>${cssContent}</style>${htmlContent}`;

        host.style.display = 'none';

        // bindPopupEvents가 show() 전에 호출되었으면 여기서 바인딩
        if (_pendingEvents) {
            bindInternal(_pendingEvents);
            _pendingEvents = null;
        }
    }

    // ── Public 메서드 ──

    /**
     * 팝업 표시
     * 최초 호출 시 Shadow DOM을 생성한다.
     */
    ns.show = function() {
        ensureInstance();
        host.style.display = '';
    };

    /**
     * 팝업 숨김
     * Shadow DOM은 유지된다 (destroy하지 않음).
     */
    ns.hide = function() {
        if (!host) return;
        host.style.display = 'none';
    };

    /**
     * Shadow DOM 내 단일 요소 선택
     *
     * @param {string} selector - CSS 선택자
     * @returns {Element|null}
     */
    ns.query = function(selector) {
        if (!shadowRoot) return null;
        return shadowRoot.querySelector(selector);
    };

    /**
     * Shadow DOM 내 모든 요소 선택
     *
     * @param {string} selector - CSS 선택자
     * @returns {NodeList}
     */
    ns.queryAll = function(selector) {
        if (!shadowRoot) return [];
        return shadowRoot.querySelectorAll(selector);
    };

    /**
     * Shadow DOM 내 이벤트 바인딩
     *
     * show() 전에 호출해도 된다. Shadow DOM 생성 시 자동 바인딩된다.
     *
     * @param {Object} events - { eventType: { selector: '@eventName' | handler } }
     */
    ns.bindPopupEvents = function(events) {
        if (shadowRoot) {
            bindInternal(events);
        } else {
            _pendingEvents = events;
        }
    };

    /**
     * Shadow DOM 내 이벤트 해제
     */
    ns.removePopupEvents = function() {
        _popupListeners.forEach(({ eventType, listener }) => {
            if (shadowRoot) shadowRoot.removeEventListener(eventType, listener);
        });
        _popupListeners.length = 0;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        ns.removePopupEvents();
        if (host) {
            host.remove();
            host = null;
        }
        shadowRoot = null;
        _pendingEvents = null;
        ns.show = null;
        ns.hide = null;
        ns.query = null;
        ns.queryAll = null;
        ns.bindPopupEvents = null;
        ns.removePopupEvents = null;
        instance.shadowPopup = null;
    };
}
