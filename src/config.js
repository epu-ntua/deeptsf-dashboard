// Settings shared across the app.
//
// authEnabled is fixed at build time (REACT_APP_AUTH). With auth off there is
// no login: every page and role check is allowed.
//
// The service URLs can be changed at container start without a rebuild: the
// nginx image writes /config.js (window.__CONFIG__) from the DASHBOARD_*
// variables, see nginx/40-dashboard-config.sh. An empty runtime value falls
// back to the REACT_APP_* value baked in at build time, then to the local
// default.
const runtimeConfig = (typeof window !== 'undefined' && window.__CONFIG__) || {};

const pick = (runtimeValue, buildValue, localDefault) =>
    runtimeValue || (buildValue !== undefined ? buildValue : localDefault);

export const authEnabled = process.env.REACT_APP_AUTH === 'True';

export const backendUrl = pick(runtimeConfig.backendUrl, process.env.REACT_APP_BACKEND_BASE_URL, 'http://localhost:8080');
export const mlflowUrl = pick(runtimeConfig.mlflowUrl, process.env.REACT_APP_MLFLOW, 'http://localhost:5000');
export const dagsterUrl = pick(runtimeConfig.dagsterUrl, process.env.REACT_APP_DAGSTER_ENDPOINT_URL, 'http://localhost:8006');
