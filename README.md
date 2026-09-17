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

2. **Foundation Models (Chronos-2):** set `CHRONOS_API_TOKEN` in `.env`. Without it every forecast returns 401.

3. **Docker Compose:** `docker compose up -d --build`

   The image builds the app and serves it with nginx on port `3001` (host port `3003`), on the external
   `nginxproxy_energyguard_net` network. nginx also proxies `/chronos` to the Chronos-2 inference server and adds the
   API token, so the token never reaches the browser (see `nginx/default.conf.template`). Inference can take several
   minutes, so the reverse proxy in front of the dashboard needs a read timeout of about 900s.

### Additional Notes

- If you encounter any issues or have specific requirements, please refer to the project documentation.
