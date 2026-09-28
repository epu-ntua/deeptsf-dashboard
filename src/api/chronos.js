import axios from 'axios';

// Client for the Chronos-2 inference server (https://gitlab.deployai.eu/iccs/chronos2-inference-server).
//
// The server sends no CORS headers, so requests go through the /chronos path on
// the dashboard's own ingress (and through setupProxy.js in development) rather
// than straight to its host. This keeps every call same-origin.
//
// It deliberately does not reuse src/api/axios.js: that instance is pinned to
// the DeepTSF backend base URL, forces application/json on POSTs whose URL does
// not contain "upload", and redirects to / on any 401 — none of which is right
// here.

const baseURL = process.env.REACT_APP_CHRONOS_BASE_URL || '/chronos';

const chronosInstance = axios.create({
    baseURL: baseURL,
    headers: {'Accept': 'application/json'},
    withCredentials: false, // same-origin proxy, no cookies involved
    timeout: 15 * 60 * 1000, // inference runs on CPU and can take several minutes
});

chronosInstance.interceptors.request.use(
    (config) => {
        // Normally nothing is attached here: Chronos-2 authenticates with a static
        // API token that the ingress (production) or setupProxy.js (development)
        // injects, so the browser holds no credentials. These are the fallbacks for
        // deployments that cannot inject the header at the proxy.
        const configuredToken = process.env.REACT_APP_CHRONOS_API_TOKEN;
        const keycloakToken = localStorage.getItem('keycloakToken');
        const virtoToken = localStorage.getItem('virtoToken');
        const authMethod = localStorage.getItem('authMethod');

        if (configuredToken) {
            config.headers.Authorization = `Bearer ${configuredToken}`;
        } else if (authMethod === 'keycloak' && keycloakToken) {
            config.headers.Authorization = `Bearer ${keycloakToken}`;
        } else if (authMethod === 'virto' && virtoToken) {
            config.headers.Authorization = `Bearer ${virtoToken}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Turn an axios failure into a message worth showing to the user, preferring the
 * FastAPI "detail" field when the server sent one.
 *
 * @param {*} error
 * @returns {string}
 */
export const describeChronosError = (error) => {
    const detail = error?.response?.data?.detail;

    if (Array.isArray(detail)) {
        // FastAPI validation errors: [{loc: [...], msg: "..."}]
        return detail.map(item => `${(item.loc || []).join('.')}: ${item.msg}`).join(' | ');
    }
    if (typeof detail === 'string') {
        return detail;
    }
    if (detail && typeof detail === 'object') {
        // Prediction failures come back as an object, e.g.
        // {error: 'Prediction failed', exception: 'ValueError', message: 'future_df must contain ...'}
        return [detail.error, detail.message].filter(Boolean).join(': ')
            || JSON.stringify(detail);
    }
    if (error?.code === 'ECONNABORTED') {
        return 'The request timed out before the model returned a forecast.';
    }
    return error?.message || 'The forecast request failed.';
};

/**
 * Call POST /forecast_file.
 *
 * Optional fields are only appended when the user actually set them, so the
 * server applies its own defaults for everything else.
 *
 * @param {Object} params
 * @param {number} params.timestepsAhead        required, number of steps to predict
 * @param {File}   params.seriesFile            required, DeepTSF single series CSV
 * @param {File}   [params.pastCovariatesFile]
 * @param {File}   [params.futureCovariatesFile]
 * @param {boolean}[params.pastCovariatesMultiple]
 * @param {boolean}[params.futureCovariatesMultiple]
 * @param {string} [params.pastCovariatesFormat]   'long' | 'short'
 * @param {string} [params.futureCovariatesFormat] 'long' | 'short'
 * @param {number} [params.batchSize]
 * @param {boolean}[params.crossLearning]
 * @param {string} [params.quantileLevels]         comma separated, e.g. '0.1,0.5,0.9'
 * @param {Object} [options]
 * @param {Function} [options.onUploadProgress]
 * @returns {Promise<Object>} the parsed response body
 */
export const forecastFile = (params, options = {}) => {
    const data = new FormData();

    data.append('timesteps_ahead', String(params.timestepsAhead));
    data.append('series_file', params.seriesFile);

    if (params.pastCovariatesFile) {
        data.append('past_covariates_file', params.pastCovariatesFile);
        // These two only describe the past covariates file, so they are pointless without it.
        data.append('past_covariates_multiple', String(Boolean(params.pastCovariatesMultiple)));
        data.append('past_covariates_format', params.pastCovariatesFormat || 'long');
    }

    if (params.futureCovariatesFile) {
        data.append('future_covariates_file', params.futureCovariatesFile);
        data.append('future_covariates_multiple', String(Boolean(params.futureCovariatesMultiple)));
        data.append('future_covariates_format', params.futureCovariatesFormat || 'long');
    }

    if (params.batchSize) {
        data.append('batch_size', String(params.batchSize));
    }
    if (params.crossLearning !== undefined) {
        data.append('cross_learning', String(Boolean(params.crossLearning)));
    }
    if (params.quantileLevels) {
        data.append('quantile_levels', params.quantileLevels);
    }

    return chronosInstance
        .post('/forecast_file', data, {
            headers: {'Content-Type': 'multipart/form-data'},
            onUploadProgress: options.onUploadProgress,
        })
        .then(response => response.data);
};

export default chronosInstance;
