/**
 * BarChart — Dashboard DarkTech
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

const p = { cyan: '#4dd0e1', grid: '#1a2030', muted: '#4a5568', text: '#c8cdd5' };
const mono = { fontFamily: 'IBM Plex Mono' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 36, right: 12, bottom: 28, left: 40 },
        xAxis: { type: 'category', axisLine: { lineStyle: { color: p.grid } },
                 axisLabel: { color: p.muted, fontSize: 10, ...mono }, axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: p.grid } },
                 axisLabel: { color: p.muted, fontSize: 10, ...mono }, axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'IN', type: 'bar', barWidth: '28%', itemStyle: { color: p.cyan, borderRadius: [1, 1, 0, 0] } },
            { name: 'OUT', type: 'bar', barWidth: '28%', itemStyle: { color: p.grid, borderRadius: [1, 1, 0, 0] } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: '#141926', borderColor: p.grid,
                   textStyle: { color: p.text, fontSize: 11, ...mono } },
        legend: { data: ['IN', 'OUT'], right: 0, top: 0, textStyle: { color: p.muted, fontSize: 10, ...mono },
                  icon: 'roundRect', itemWidth: 10, itemHeight: 2 }
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
