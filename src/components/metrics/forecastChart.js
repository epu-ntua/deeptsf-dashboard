// Shared building blocks for the "Forecasted vs Actual" chart of the experiment
// tracking page. Both the "By evaluation metric" and the "By Run ID" tab plot the
// same payload, which may hold a univariate or a multivariate time series.

// Categorical hues, assigned to components in this fixed order. The ordering is
// the colour-vision-deficiency safety mechanism, not decoration: adjacent pairs
// were validated against a white chart surface, so components take the slots in
// order instead of a cycled or generated hue.
const COMPONENT_COLORS = [
    '#2a78d6', // blue
    '#eb6834', // orange
    '#1baf7a', // aqua
    '#eda100', // yellow
    '#e87ba4', // magenta
    '#008300', // green
    '#4a3aa7', // violet
    '#e34948', // red
];

// Past the eighth component the hues start over. Every repetition then gets its
// own marker shape, drawn periodically along the line, so two components sharing
// a hue are still told apart by shape rather than by colour alone.
const POINT_STYLES = ['circle', 'triangle', 'rect', 'rectRot'];
const MARKER_SPACING = 12;

const FORECAST_DASH = [6, 4];

/**
 * Bring one pandas 'split' payload into a single shape: an index, one name per
 * column and rows of values. Univariate payloads from an older backend arrive
 * with `data` already flattened to bare numbers, so those are re-wrapped here.
 */
const normalizeSplit = (split) => {
    if (!split || !Array.isArray(split.index) || !Array.isArray(split.data)) return null;

    const rows = split.data.map(row => (Array.isArray(row) ? row : [row]));
    const width = rows.reduce((widest, row) => Math.max(widest, row.length), 0);
    if (width === 0) return null;

    const named = Array.isArray(split.columns) && split.columns.length === width;
    const columns = named
        ? split.columns.map(String)
        : Array.from({length: width}, (_, i) => `component ${i + 1}`);

    return {index: split.index.map(String), columns, rows};
};

const sortTimestamps = (timestamps) => {
    const parsed = timestamps.map(timestamp => Date.parse(timestamp));
    if (parsed.every(value => !Number.isNaN(value))) {
        return timestamps
            .map((timestamp, i) => [timestamp, parsed[i]])
            .sort((a, b) => a[1] - b[1])
            .map(([timestamp]) => timestamp);
    }
    return [...timestamps].sort();
};

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
};

/**
 * Place one column of a frame on the shared timestamp axis, leaving a gap
 * wherever that frame has no value. The actual series starts before the forecast
 * does, so the two are matched by timestamp rather than zipped by position.
 */
const alignToLabels = (frame, column, positions, length) => {
    const values = new Array(length).fill(null);
    frame.index.forEach((timestamp, row) => {
        const position = positions.get(timestamp);
        if (position !== undefined) {
            values[position] = toNumber(frame.rows[row]?.[column]);
        }
    });
    return values;
};

const lineStyle = (color, {dashed, pointStyle, marked}) => ({
    borderColor: color,
    backgroundColor: color,
    borderWidth: 2,
    borderDash: dashed ? FORECAST_DASH : undefined,
    pointStyle,
    pointRadius: marked ? (ctx => (ctx.dataIndex % MARKER_SPACING === 0 ? 3.5 : 0)) : 0,
    pointHoverRadius: 4,
    tension: 0,
    spanGaps: false,
});

/**
 * Turn a /results/get_forecast_vs_actual payload into Chart.js line data.
 * Returns null when the payload holds nothing plottable.
 *
 * A univariate series keeps the familiar two-colour reading (actual in the first
 * hue, forecast in the second). A multivariate one gives each component its own
 * hue and tells actual from forecast by a solid versus a dashed line, so colour
 * always means "which component".
 */
export const buildForecastChart = (payload) => {
    const actual = normalizeSplit(payload?.actual);
    const forecast = normalizeSplit(payload?.forecast);
    if (!actual || !forecast) return null;

    const labels = sortTimestamps([...new Set([...actual.index, ...forecast.index])]);
    if (labels.length === 0) return null;

    const positions = new Map(labels.map((label, i) => [label, i]));
    const componentCount = Math.max(actual.columns.length, forecast.columns.length);
    const multivariate = componentCount > 1;

    const datasets = [];
    for (let component = 0; component < componentCount; component++) {
        const color = COMPONENT_COLORS[component % COMPONENT_COLORS.length];
        const cycle = Math.floor(component / COMPONENT_COLORS.length);
        const style = {pointStyle: POINT_STYLES[cycle % POINT_STYLES.length], marked: cycle > 0};

        // Each line is named after its own frame's column, since the forecast of a
        // probabilistic model carries one column per quantile rather than the
        // component names of the actual series.
        if (component < actual.columns.length) {
            datasets.push({
                label: multivariate ? `${actual.columns[component]} · actual` : 'Actual',
                data: alignToLabels(actual, component, positions, labels.length),
                ...lineStyle(multivariate ? color : COMPONENT_COLORS[0], {...style, dashed: false}),
            });
        }
        if (component < forecast.columns.length) {
            datasets.push({
                label: multivariate ? `${forecast.columns[component]} · forecast` : 'Forecast',
                data: alignToLabels(forecast, component, positions, labels.length),
                ...lineStyle(multivariate ? color : COMPONENT_COLORS[1], {...style, dashed: multivariate}),
            });
        }
    }

    const hasValues = datasets.some(dataset => dataset.data.some(value => value !== null));
    if (!hasValues) return null;

    return {labels, datasets, multivariate, componentCount};
};

export const forecastChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: {
        mode: 'index',
        intersect: false,
    },
    plugins: {
        legend: {
            position: 'bottom',
            labels: {usePointStyle: true, boxWidth: 8},
        },
        tooltip: {
            // A multivariate series puts many lines under the crosshair at once;
            // the ones with no value at that timestamp are noise.
            filter: item => item.parsed.y !== null,
        },
    },
    scales: {
        // Deliberately a single y scale: forecast and actual are the same measure,
        // and a second scale would make them look comparable when they are not.
        y: {
            type: 'linear',
            display: true,
            position: 'left',
        },
        x: {
            ticks: {maxRotation: 0, autoSkipPadding: 24},
        },
    },
};

export default buildForecastChart;
