/**
 * LineChart — Dashboard DarkTech
 *
 * 목적: 데이터를 line 차트로 시각화한다
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

const p = {
    cyan: '#4dd0e1', amber: '#ffb74d', dimCyan: '#4dd0e130',
    grid: '#1a2030', muted: '#4a5568', text: '#c8cdd5'
};
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
            { name: 'CPU', type: 'line', smooth: 0.3, symbol: 'none', color: p.cyan, lineStyle: { width: 1.5 },
              areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [{ offset: 0, color: p.dimCyan }, { offset: 1, color: 'transparent' }] } } },
            { name: 'MEM', type: 'line', smooth: 0.3, symbol: 'none', color: p.amber, lineStyle: { width: 1.5 } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: '#141926', borderColor: p.grid,
                   textStyle: { color: p.text, fontSize: 11, ...mono } },
        legend: { data: ['CPU', 'MEM'], right: 0, top: 0, textStyle: { color: p.muted, fontSize: 10, ...mono },
                  icon: 'roundRect', itemWidth: 10, itemHeight: 2 }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = { dashboard_lineChart: [this.echarts.renderData] };

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
