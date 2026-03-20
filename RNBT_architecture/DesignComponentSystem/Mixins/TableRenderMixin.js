/**
 * TableRenderMixin
 *
 * 테이블 인스턴스를 생성하고, 데이터를 적용하여 표시한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   applyTableRenderMixin(this, {
 *       cssSelectors: {
 *           container: '.table-container'
 *       },
 *       columns: [
 *           { title: 'Name', field: 'name' },
 *           { title: 'Value', field: 'value' }
 *       ]
 *   });
 *
 *   // renderData는 행 데이터 배열을 받는다:
 *   // [{ name: 'CPU', value: '72%' }, ...]
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.tableRender):
 *
 *   this.tableRender.cssSelectors   — 선택자
 *   this.tableRender.renderData     — { response } → 테이블 데이터 적용
 *   this.tableRender.setData        — 데이터 직접 적용
 *   this.tableRender.clearData      — 데이터 비우기
 *   this.tableRender.getInstance    — Tabulator 인스턴스 반환
 *   this.tableRender.destroy        — 인스턴스 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyTableRenderMixin(instance, options) {
    const { cssSelectors = {}, columns = [] } = options;

    const container = cssSelectors.container;

    const ns = {};
    instance.tableRender = ns;

    ns.cssSelectors = { ...cssSelectors };

    let tableInstance = null;

    /**
     * 컨테이너에 테이블 인스턴스 생성 (lazy init)
     */
    function ensureInstance() {
        if (tableInstance) return tableInstance;

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[TableRenderMixin] container not found: ' + container);

        tableInstance = new Tabulator(containerEl, {
            columns: columns,
            data: [],
            layout: 'fitColumns'
        });
        return tableInstance;
    }

    /**
     * 데이터 렌더링 — 행 데이터 배열 적용
     *
     * @param {{ response: { data: Array } }} payload
     */
    ns.renderData = function({ response }) {
        const { data } = response;
        if (!data) throw new Error('[TableRenderMixin] data is null');
        if (!Array.isArray(data)) throw new Error('[TableRenderMixin] data is not an array');

        ensureInstance().setData(data);
    };

    /**
     * 데이터 직접 적용
     *
     * @param {Array} data - 행 데이터 배열
     */
    ns.setData = function(data) {
        ensureInstance().setData(data);
    };

    /**
     * 데이터 비우기
     */
    ns.clearData = function() {
        if (tableInstance) tableInstance.clearData();
    };

    /**
     * Tabulator 인스턴스 반환 (고급 사용)
     */
    ns.getInstance = function() {
        return tableInstance;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        if (tableInstance) {
            tableInstance.destroy();
            tableInstance = null;
        }
        ns.renderData = null;
        ns.setData = null;
        ns.clearData = null;
        ns.getInstance = null;
        ns.cssSelectors = null;
        instance.tableRender = null;
    };
}
