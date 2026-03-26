/**
 * EChartsMixin
 *
 * 차트 인스턴스를 생성하고, 데이터를 적용하여 표시한다.
 *
 * 차트의 모양(type, color, tooltip 등)은 컴포넌트가 option으로 정의하고,
 * renderData는 서버에서 오는 순수 데이터(categories, values)만 받아서 병합한다.
 *
 * ─────────────────────────────────────────────────────────────
 * 사용 예시:
 *
 *   // Cartesian (기본 규약)
 *   applyEChartsMixin(this, {
 *       cssSelectors: { container: '.chart-container' },
 *       option: {
 *           xAxis: { type: 'category' },
 *           yAxis: { type: 'value' },
 *           series: [
 *               { name: 'CPU', type: 'line', smooth: true },
 *               { name: 'Memory', type: 'line', smooth: true }
 *           ],
 *           tooltip: { trigger: 'axis' },
 *           legend: { data: ['CPU', 'Memory'] }
 *       }
 *   });
 *   // renderData: { categories: ['09:00', ...], values: [[42, ...], [65, ...]] }
 *
 *   // Pie (mapData로 커스텀 병합)
 *   applyEChartsMixin(this, {
 *       cssSelectors: { container: '.chart-container' },
 *       option: {
 *           series: [{ type: 'pie', radius: '60%' }]
 *       },
 *       mapData: function(data, option) {
 *           option.series[0].data = data.items;
 *           return option;
 *       }
 *   });
 *   // renderData: { items: [{ name: 'A', value: 10 }, ...] }
 *
 * ─────────────────────────────────────────────────────────────
 * Mixin이 주입하는 것 (네임스페이스: this.echarts):
 *
 *   this.echarts.cssSelectors   — 선택자
 *   this.echarts.renderData     — { response } → 데이터를 option에 병합하여 적용
 *   this.echarts.setOption      — 옵션 직접 적용 (merge 가능)
 *   this.echarts.resize         — 차트 리사이즈
 *   this.echarts.getInstance    — ECharts 인스턴스 반환
 *   this.echarts.destroy        — 인스턴스 정리
 *
 * ─────────────────────────────────────────────────────────────
 */

function applyEChartsMixin(instance, options) {
    const { cssSelectors = {}, option = {}, mapData } = options;

    const container = cssSelectors.container;

    const ns = {};
    instance.echarts = ns;

    ns.cssSelectors = { ...cssSelectors };

    let chartInstance = null;
    let _resizeHandler = null;

    /**
     * 컨테이너에 차트 인스턴스 생성 (lazy init)
     * window resize 시 자동으로 차트를 리사이즈한다.
     */
    function ensureInstance() {
        if (chartInstance) return chartInstance;

        const containerEl = instance.appendElement.querySelector(container);
        if (!containerEl) throw new Error('[EChartsMixin] container not found: ' + container);

        chartInstance = echarts.init(containerEl);

        // window resize → 차트 리사이즈 (debounce 150ms)
        let resizeTimer = null;
        _resizeHandler = function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (chartInstance) chartInstance.resize();
            }, 150);
        };
        window.addEventListener('resize', _resizeHandler);

        return chartInstance;
    }

    /**
     * 데이터 렌더링 — 순수 데이터를 option에 병합하여 적용
     *
     * 기본 규약 (mapData 미제공 시):
     *   data.categories → xAxis.data (Cartesian 계열)
     *   data.values[i]  → series[i].data (series 순서와 1:1 대응)
     *
     * 커스텀 (mapData 제공 시):
     *   컴포넌트가 정의한 mapData(data, optionCopy)가 병합을 수행한다.
     *   Pie, Gauge, Radar 등 기본 규약에 맞지 않는 차트에 사용한다.
     *
     * @param {{ response: Object }} payload
     */
    ns.renderData = function({ response: data }) {
        if (!data) throw new Error('[EChartsMixin] data is null');

        let merged = JSON.parse(JSON.stringify(option));

        if (mapData) {
            // 컴포넌트가 병합 로직을 직접 정의
            merged = mapData(data, merged);
        } else {
            // 기본 규약: categories + values
            if (data.categories && merged.xAxis) {
                merged.xAxis.data = data.categories;
            }

            if (data.values && merged.series) {
                for (let i = 0; i < merged.series.length; i++) {
                    if (data.values[i]) {
                        merged.series[i].data = data.values[i];
                    }
                }
            }
        }

        ensureInstance().setOption(merged);
    };

    /**
     * 옵션 직접 적용
     *
     * @param {Object} option - ECharts 옵션
     * @param {boolean} [notMerge=false] - true이면 기존 옵션 대체
     */
    ns.setOption = function(option, notMerge) {
        ensureInstance().setOption(option, notMerge);
    };

    /**
     * 차트 리사이즈
     */
    ns.resize = function() {
        if (chartInstance) chartInstance.resize();
    };

    /**
     * ECharts 인스턴스 반환 (고급 사용)
     */
    ns.getInstance = function() {
        return chartInstance;
    };

    /**
     * 정리
     */
    ns.destroy = function() {
        if (_resizeHandler) {
            window.removeEventListener('resize', _resizeHandler);
            _resizeHandler = null;
        }
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
        ns.renderData = null;
        ns.setOption = null;
        ns.resize = null;
        ns.getInstance = null;
        ns.cssSelectors = null;
        instance.echarts = null;
    };
}
