/**
 * PieChart — Dashboard DarkTech
 */

const p = { cyan: '#4dd0e1', amber: '#ffb74d', green: '#66bb6a', red: '#ef5350',
            grid: '#1a2030', muted: '#4a5568', text: '#c8cdd5', bg: '#0a0e17' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'pie', radius: ['48%', '70%'], center: ['40%', '52%'],
            label: { show: true, formatter: '{b}', color: p.muted, fontSize: 10, fontFamily: 'IBM Plex Mono' },
            labelLine: { lineStyle: { color: p.grid } },
            itemStyle: { borderColor: p.bg, borderWidth: 2 }
        }],
        tooltip: { trigger: 'item', backgroundColor: '#141926', borderColor: p.grid,
                   textStyle: { color: p.text, fontSize: 11, fontFamily: 'IBM Plex Mono' } },
        color: [p.cyan, p.amber, p.green, p.red, p.grid]
    },
    mapData: function(data, option) { option.series[0].data = data.items; return option; }
});

this.subscriptions = { dashboard_pieChart: [this.echarts.renderData] };
Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);
