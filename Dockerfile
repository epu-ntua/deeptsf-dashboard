FROM node:14-alpine AS development

# Add a work directory
WORKDIR /app

# Set build-time arguments as environment variables
ARG REACT_APP_NAME
ARG REACT_APP_AUTH
ARG REACT_APP_BACKEND_BASE_URL
ARG REACT_APP_MLFLOW
ARG REACT_APP_KEYCLOAK_REALM
ARG REACT_APP_KEYCLOAK_URL
ARG REACT_APP_KEYCLOAK_CLIENT_ID
ARG REACT_APP_DAGSTER_ENDPOINT_URL
ARG REACT_APP_BACKEND_WS_URL
ARG REACT_APP_CHRONOS_BASE_URL
ARG REACT_APP_CHRONOS_API_TOKEN

ENV REACT_APP_NAME=${REACT_APP_NAME}
ENV REACT_APP_AUTH=${REACT_APP_AUTH}
ENV REACT_APP_BACKEND_BASE_URL=${REACT_APP_BACKEND_BASE_URL}
ENV REACT_APP_MLFLOW=${REACT_APP_MLFLOW}
ENV REACT_APP_KEYCLOAK_REALM=${REACT_APP_KEYCLOAK_REALM}
ENV REACT_APP_KEYCLOAK_URL=${REACT_APP_KEYCLOAK_URL}
ENV REACT_APP_KEYCLOAK_CLIENT_ID=${REACT_APP_KEYCLOAK_CLIENT_ID}
ENV REACT_APP_DAGSTER_ENDPOINT_URL=${REACT_APP_DAGSTER_ENDPOINT_URL}
ENV REACT_APP_BACKEND_WS_URL=${REACT_APP_BACKEND_WS_URL}
ENV REACT_APP_CHRONOS_BASE_URL=${REACT_APP_CHRONOS_BASE_URL}
ENV REACT_APP_CHRONOS_API_TOKEN=${REACT_APP_CHRONOS_API_TOKEN}

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application files
COPY . .

# Build for production with environment variables
RUN npm run build

# Serve the build with nginx instead of `serve`. `serve` is a static file
# server and cannot proxy /chronos to the Chronos-2 inference server, which the
# Kubernetes deployment does with an ingress plus a small nginx proxy. Here one
# nginx does both, see nginx/default.conf.template.
FROM nginx:1.27-alpine AS production

COPY --from=development /app/build /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Only substitute our own variables, so nginx variables like $uri survive envsubst
ENV NGINX_ENVSUBST_FILTER=^CHRONOS_
ENV CHRONOS_HOST=chronos2-inference-server.aiodp.ai
ENV CHRONOS_API_TOKEN=

# Expose port
EXPOSE 3001
