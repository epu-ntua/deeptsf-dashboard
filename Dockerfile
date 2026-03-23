FROM node:14-alpine AS development

# Add a work directory
WORKDIR /app

# Set build-time arguments as environment variables
ARG REACT_APP_BACKEND_BASE_URL
ARG REACT_APP_MLFLOW
ARG REACT_APP_KEYCLOAK_REALM
ARG REACT_APP_KEYCLOAK_URL
ARG REACT_APP_KEYCLOAK_CLIENT_ID
ARG REACT_APP_DAGSTER_ENDPOINT_URL
ARG REACT_APP_BACKEND_WS_URL

ENV REACT_APP_BACKEND_BASE_URL=${REACT_APP_BACKEND_BASE_URL}
ENV REACT_APP_MLFLOW=${REACT_APP_MLFLOW}
ENV REACT_APP_KEYCLOAK_REALM=${REACT_APP_KEYCLOAK_REALM}
ENV REACT_APP_KEYCLOAK_URL=${REACT_APP_KEYCLOAK_URL}
ENV REACT_APP_KEYCLOAK_CLIENT_ID=${REACT_APP_KEYCLOAK_CLIENT_ID}
ENV REACT_APP_DAGSTER_ENDPOINT_URL=${REACT_APP_DAGSTER_ENDPOINT_URL}
ENV REACT_APP_BACKEND_WS_URL=${REACT_APP_BACKEND_WS_URL}

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the rest of the application files
COPY . .

# Build for production with environment variables
RUN npm run build

# Install `serve` to serve the React app
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Start the app
CMD ["serve", "-s", "build"]
# CMD serve -s build
