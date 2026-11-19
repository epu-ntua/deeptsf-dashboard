<p align="center">
  <a href="https://doi.org/10.1016/j.softx.2024.101758">
    <img alt="DeepTSF" src="public/images/logo-deeptsf.png" width="250" />
  </a>
</p>
<p align="center">
    ✨ The web dashboard of DeepTSF: codeless machine learning operations for time series forecasting ✨
</p>

<p align="center">
    🙌 Refer to <b><a href="https://github.com/epu-ntua/DeepTSF/wiki/DeepTSF-documentation">https://github.com/epu-ntua/DeepTSF/wiki/DeepTSF-documentation</a></b> for the documentation 📖
</p>

[![DOI](https://img.shields.io/badge/Cite%20this%20paper-Google%20Scholar-blue)](https://doi.org/10.1016/j.softx.2024.101758)

This repository contains the front-end of [DeepTSF](https://github.com/epu-ntua/DeepTSF), a React application served by
nginx. It talks to the DeepTSF backend and offers:

- **Codeless Forecasting Pipeline**: upload a time series, configure the model and launch a training run.
- **Experiment Tracking**: compare runs by evaluation metric or run ID and plot actual vs forecasted values.
- **Foundation Models**: forecast with the pre-trained Chronos-2 model, without training anything yourself.
- **System Monitoring**: CPU, memory and GPU usage of the DeepTSF servers.
- Links to the **MLflow** and **Dagster** UIs of the deployment.

## Installation

To set up the dashboard on your local system, you need to clone the main branch of this repository:

```git clone https://github.com/epu-ntua/deeptsf-dashboard.git```

After that you need to navigate to the root directory of the dashboard:

```cd /path/to/repo/of/deeptsf-dashboard```

The dashboard is configured with a .env file. Two examples are provided: `.env.example` and `.env.auth.example`
(for a deployment with Keycloak login). Copy the one you need to `.env` and fill in the addresses of your DeepTSF
backend, MLflow and Dagster servers.

The `REACT_APP_*` values are compiled into the dashboard when the image is built, so rebuild the image after changing
them. All other values are read when the container starts, so a restart is enough.

### Set up locally using Docker

The simplest local setup is the full DeepTSF deployment: follow the
[DeepTSF installation guide](https://github.com/epu-ntua/DeepTSF#installation) and the dashboard comes up with it.

To run the dashboard on its own, keep `REACT_APP_AUTH=False` in `.env` for a dashboard without login, or follow
[Keycloak login](#keycloak-login) below. Then run the following command in the root directory of the dashboard:

```docker compose up -d --build```

The dashboard is up and running. Navigate to [http://localhost:3003](http://localhost:3003) and start your experiments!

The compose file joins the existing docker network named by `COMPOSE_NETWORK` (default `keycloak_net`), so that
network must exist first. If the backend, MLflow or Dagster address changes (for example because macOS uses port 5000
for AirPlay), set `DASHBOARD_BACKEND_URL`, `DASHBOARD_MLFLOW_URL` or `DASHBOARD_DAGSTER_URL` in `.env` and restart the
container; no rebuild is needed.

## Keycloak login

With `REACT_APP_AUTH=True` users sign in through Keycloak, and the dashboard sends their access token to the DeepTSF
backend with every request. The dashboard uses **one Keycloak client**. The EnergyGuard deployment, for example, uses
the client `energyguard-deeptsf-dashboard` for `https://deeptsf.energy-guard.eu`.

#### Create the Keycloak client

In your realm, create an OpenID Connect client with these settings:

| Setting | Value |
|---|---|
| Client ID | e.g. `energyguard-deeptsf-dashboard` |
| Client authentication | **Off** (public client: the dashboard runs in the browser and cannot keep a secret) |
| Standard flow | **On** (the login redirect) |
| Implicit flow | Off |
| Root URL | the dashboard URL, e.g. `https://deeptsf.energy-guard.eu` |
| Valid redirect URIs | the dashboard URL followed by `/*`, e.g. `https://deeptsf.energy-guard.eu/*` |
| Web origins | the dashboard URL, or `*` to allow any origin |
| Default client scopes | include `roles`, `profile` and `email` |

The dashboard shows the user's name from the `profile` scope and reads the roles from the `roles` scope.

#### Assign the roles

Access to the pages depends on these **realm roles**. Create them in the realm and assign them to your users:

| Realm role | Pages |
|---|---|
| `data_scientist` | Codeless Forecasting Pipeline, Foundation Models |
| `energy_engineer` | Experiment Tracking, Foundation Models |
| `inergy_admin` | all pages, including System Monitoring and the MLflow and Dagster links |

The DeepTSF backend checks the same roles on every request. Its own Keycloak settings are described in the
[DeepTSF repository](https://github.com/epu-ntua/DeepTSF).

#### Configure the dashboard

Set these values in `.env` (see `.env.auth.example`) and rebuild the image:

```
REACT_APP_AUTH=True
REACT_APP_KEYCLOAK_URL=https://<keycloak host>
REACT_APP_KEYCLOAK_REALM=<realm>
REACT_APP_KEYCLOAK_CLIENT_ID=energyguard-deeptsf-dashboard
```

`REACT_APP_KEYCLOAK_URL` is the address of the Keycloak server itself, without `/realms/...`.

## Foundation Models (Chronos-2)

The Foundation Models page sends its forecasts to `/chronos` on the dashboard itself. The nginx in the image forwards
these requests to a Chronos-2 inference server and adds `CHRONOS_API_TOKEN` as the bearer token, so the token never
reaches the browser. Set the token to that server's API token, otherwise every forecast returns 401.

Choose the server with `CHRONOS_SCHEME` and `CHRONOS_HOST`:

| Chronos-2 server | `CHRONOS_SCHEME` | `CHRONOS_HOST` | `CHRONOS_API_TOKEN` |
|---|---|---|---|
| Remote server (default) | `https` | `chronos2-inference-server.aiodp.ai` | that server's token |
| Chronos-2 API of a DeepTSF Keycloak deployment | `https` | its host, e.g. `deeptsf-chronos.<domain>` | DeepTSF's `CHRONOS_API_TOKEN` |
| Chronos-2 container on the same docker network | `http` | `<container name>:8000` | DeepTSF's `CHRONOS_API_TOKEN`, or empty if that is empty |

The certificate of an https server is verified. Set `CHRONOS_SSL_VERIFY=off` only for a self-signed test server. Set
`REACT_APP_FOUNDATION_MODELS=False` to hide the page.

## Configuration reference

Read when the image is built (rebuild after changing):

| Variable | Description |
|---|---|
| `REACT_APP_AUTH` | `True` for Keycloak login, `False` for no login |
| `REACT_APP_KEYCLOAK_URL`, `REACT_APP_KEYCLOAK_REALM`, `REACT_APP_KEYCLOAK_CLIENT_ID` | Keycloak server, realm and client |
| `REACT_APP_BACKEND_BASE_URL` | DeepTSF backend |
| `REACT_APP_MLFLOW` | MLflow UI |
| `REACT_APP_DAGSTER_ENDPOINT_URL` | Dagster UI |
| `REACT_APP_FOUNDATION_MODELS` | show (`True`) or hide (`False`) the Foundation Models page |
| `REACT_APP_EXPERIMENT_LIST` | `True`: choose the experiment from the user's MLflow experiments; `False`: type its name |

Read when the container starts (restart after changing):

| Variable | Description |
|---|---|
| `DASHBOARD_BACKEND_URL`, `DASHBOARD_MLFLOW_URL`, `DASHBOARD_DAGSTER_URL` | override the backend, MLflow and Dagster addresses; empty = the build-time value |
| `CHRONOS_SCHEME`, `CHRONOS_HOST`, `CHRONOS_API_TOKEN`, `CHRONOS_SSL_VERIFY` | Chronos-2 server, see [Foundation Models](#foundation-models-chronos-2) |
| `COMPOSE_NETWORK` | existing docker network the compose file joins (default `keycloak_net`) |

## Development

To run the dashboard with live reloading, install the dependencies and start the development server:

```npm install```

```npm start```

The development server reads the same `.env` file and forwards `/chronos` to `CHRONOS_PROXY_TARGET` (default: the
remote Chronos-2 server). Run the tests with `npm test`.

For the extensive DeepTSF documentation please navigate to our [Wiki](https://github.com/epu-ntua/DeepTSF/wiki/DeepTSF-documentation).

#### 📺 DeepTSF — Video Demonstration

Also, a video demonstration of DeepTSF is available on YouTube.

[![Watch on YouTube](https://img.shields.io/badge/Watch%20on-YouTube-red?logo=youtube&logoColor=white&style=for-the-badge)](https://www.youtube.com/watch?v=hJbnvXummTI)

## References
[1] S. Pelekis et al., “DeepTSF: Codeless machine learning operations for time series forecasting,” SoftwareX, vol. 27, p. 101758, Sep. 2024, doi: [10.1016/J.SOFTX.2024.101758](https://doi.org/10.1016/j.softx.2024.101758). <br>
