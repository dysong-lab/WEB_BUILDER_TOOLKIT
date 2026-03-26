/**
 * LineChart — Dashboard DarkTech
 *
 * 팔레트: cyan(#4dd0e1), amber(#ffb74d)
 * 폰트: IBM Plex Mono
 */

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

this.subscriptions = { dashboard_lineChart: [this.echarts.renderData] };
Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);
