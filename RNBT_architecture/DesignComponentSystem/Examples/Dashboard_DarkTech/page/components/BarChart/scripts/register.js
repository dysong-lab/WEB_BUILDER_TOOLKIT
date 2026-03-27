/**
 * BarChart — Dashboard DarkTech
 */

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

this.subscriptions = { dashboard_barChart: [this.echarts.renderData] };
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
