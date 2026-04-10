/**
 * Charts — BarChart
 *
 * 목적: 운영 지표를 막대 차트로 비교 시각화한다
 * 기능: EChartsMixin으로 카테고리 기반 2개 시리즈 bar chart를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

const color = {
    ink: '#dcecff',
    sub: 'rgba(205, 225, 255, 0.62)',
    line: 'rgba(205, 225, 255, 0.12)',
    primary: '#78b7ff',
    secondary: 'rgba(255, 255, 255, 0.4)',
    tooltip: '#08111d'
};

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.bar-chart__canvas'
    },
    option: {
        animationDuration: 500,
        grid: {
            top: 12,
            right: 8,
            bottom: 12,
            left: 8,
            containLabel: true
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: color.tooltip,
            borderWidth: 0,
            textStyle: {
                color: '#ffffff',
                fontFamily: 'SUIT'
            }
        },
        legend: {
            show: false
        },
        xAxis: {
            type: 'category',
            axisLine: {
                lineStyle: {
                    color: color.line
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: color.sub,
                fontSize: 12,
                fontFamily: 'SUIT'
            }
        },
        yAxis: {
            type: 'value',
            splitLine: {
                lineStyle: {
                    color: color.line
                }
            },
            axisLabel: {
                color: color.sub,
                fontSize: 11,
                fontFamily: 'SUIT'
            }
        },
        series: [
            {
                name: 'Inbound',
                type: 'bar',
                barMaxWidth: 24,
                itemStyle: {
                    color: color.primary,
                    borderRadius: [8, 8, 0, 0]
                }
            },
            {
                name: 'Outbound',
                type: 'bar',
                barMaxWidth: 24,
                itemStyle: {
                    color: color.secondary,
                    borderRadius: [8, 8, 0, 0]
                }
            }
        ]
    }
});

this.subscriptions = {
    chartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {};
bindEvents(this, this.customEvents);
