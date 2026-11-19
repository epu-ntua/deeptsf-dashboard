# DEEP-TSF Front-End

This is the front-end for **DEEP-TSF**, created with [Create React App](https://github.com/facebook/create-react-app)..

## How to Run the Project

### Locally

1. `Clone the project's repository`
2. `cd .\load-forecasting-dashboard\`
3. `npm install`
4. `npm start`

### Deployment of the Service

Before proceeding, follow the instructions below.

1. **Authorization Setup:**
   Depending on whether you want to run the service with or without authorization, refer to `.env.auth.example`
   or `.env.example` accordingly. Replace the content of the `.env` file with one of the two configurations, add your
   links as indicated, and proceed to the next step.
   The `REACT_APP_*` values are baked into the bundle at build time, so rebuild the image after changing them.
   `REACT_APP_FOUNDATION_MODELS` shows or hides the Foundation Models page, and `REACT_APP_EXPERIMENT_LIST=True` makes
   Codeless Forecast offer a list of the user's MLflow experiments instead of a free-text experiment name.

2. **Foundation Models (Chronos-2):** the image's nginx proxies `/chronos` to a Chronos-2 server and adds
   `CHRONOS_API_TOKEN` as the bearer token, so set it in `.env` to that server's token (otherwise forecasts return 401).
   Choose the server with `CHRONOS_SCHEME` and `CHRONOS_HOST`:
   - **Remote (default):** `https` and `chronos2-inference-server.aiodp.ai`.
   - **DeepTSF keycloak stack's Chronos-2 API:** `https` and its host (e.g. `deeptsf-chronos.<domain>`), with
     DeepTSF's `CHRONOS_API_TOKEN`.
   - **Chronos-2 container on the same docker network:** `http` and `<container name>:8000`.

   `CHRONOS_*` are read at container start, so changing them needs only a restart, not a rebuild.
   The upstream certificate is verified; set `CHRONOS_SSL_VERIFY=off` only for a self-signed test server.

   The backend, MLflow and Dagster URLs can also be changed at container start, without a rebuild:
   `DASHBOARD_BACKEND_URL`, `DASHBOARD_MLFLOW_URL` and `DASHBOARD_DAGSTER_URL` (empty = the `REACT_APP_*` build value).

3. **Docker Compose:** `docker compose up -d --build`

### Additional Notes

- If you encounter any issues or have specific requirements, please refer to the project documentation.
