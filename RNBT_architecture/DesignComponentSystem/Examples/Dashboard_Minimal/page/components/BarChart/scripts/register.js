/**
 * BarChart — Dashboard Minimal
 *
 * 목적: 데이터를 bar 차트로 시각화한다
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

const c = { dark: '#1d1d1f', mid: '#86868b', light: '#d2d2d7', faint: '#f5f5f7' };
const font = { fontFamily: 'Instrument Sans' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 32, right: 8, bottom: 28, left: 40 },
        xAxis: { type: 'category', axisLine: { show: false },
                 axisLabel: { color: c.mid, fontSize: 11, ...font }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: c.faint } },
                 axisLabel: { color: c.light, fontSize: 11, ...font }, axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'Input', type: 'bar', barWidth: '36%', itemStyle: { color: c.dark, borderRadius: [3, 3, 0, 0] } },
            { name: 'Output', type: 'bar', barWidth: '36%', itemStyle: { color: c.light, borderRadius: [3, 3, 0, 0] } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: c.dark, borderWidth: 0,
                   textStyle: { color: '#fff', fontSize: 12, ...font } },
        legend: { data: ['Input', 'Output'], right: 0, top: 0, textStyle: { color: c.mid, fontSize: 11, ...font },
                  icon: 'roundRect', itemWidth: 12, itemHeight: 2 }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = { dashboard_barChart: [this.echarts.renderData] };

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
