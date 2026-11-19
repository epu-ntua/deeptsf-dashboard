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

2. **Foundation Models (Chronos-2):** set `CHRONOS_API_TOKEN` in `.env`. Without it every forecast returns 401.
   `/chronos` goes to the remote server by default (`CHRONOS_SCHEME=https`, `CHRONOS_HOST=chronos2-inference-server.aiodp.ai`).
   For the Chronos-2 container of a DeepTSF stack on the same network, set `CHRONOS_SCHEME=http`,
   `CHRONOS_HOST=<its CHRONOS_HOSTNAME>:8000` and the same `CHRONOS_API_TOKEN` as that stack.

3. **Docker Compose:** `docker compose up -d --build`

### Additional Notes

- If you encounter any issues or have specific requirements, please refer to the project documentation.
