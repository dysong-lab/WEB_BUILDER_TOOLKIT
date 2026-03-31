/**
 * GaugeChart — Dashboard Minimal
 *
 * 목적: 데이터를 gauge 차트로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

const c = { dark: '#1d1d1f', light: '#d2d2d7', faint: '#f5f5f7' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'gauge', min: 0, max: 100, startAngle: 200, endAngle: -20,
            progress: { show: true, width: 8, itemStyle: { color: c.dark } },
            axisLine: { lineStyle: { width: 8, color: [[1, c.faint]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { distance: 16, color: c.light, fontSize: 10, fontFamily: 'Instrument Sans' },
            pointer: { show: false },
            title: { show: false },
            detail: { valueAnimation: true, offsetCenter: [0, '0%'], formatter: '{value}%',
                      fontSize: 32, fontWeight: 600, fontFamily: 'Instrument Sans', color: c.dark }
        }]
    },
    mapData: function(data, option) { option.series[0].data = [{ value: data.value, name: data.name }]; return option; }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = { dashboard_gauge: [this.echarts.renderData] };

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {};
bindEvents(this, this.customEvents);
