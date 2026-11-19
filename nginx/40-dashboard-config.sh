#!/bin/sh
# Writes /config.js (window.__CONFIG__) from DASHBOARD_* variables at container
# start, so the service URLs can change without rebuilding the image. Runs from
# the nginx image's /docker-entrypoint.d, after its envsubst step for CHRONOS_*.
# An empty value makes the app fall back to the REACT_APP_* value baked in at
# build time (see src/config.js).
set -eu

# Print $1 as a double-quoted JavaScript string.
js_string() {
    printf '"%s"' "$(printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g')"
}

cat > /usr/share/nginx/html/config.js <<EOF
window.__CONFIG__ = {
    backendUrl: $(js_string "${DASHBOARD_BACKEND_URL:-}"),
    mlflowUrl: $(js_string "${DASHBOARD_MLFLOW_URL:-}"),
    dagsterUrl: $(js_string "${DASHBOARD_DAGSTER_URL:-}")
};
EOF
