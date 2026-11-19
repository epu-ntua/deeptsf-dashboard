// Runtime service URLs. In the Docker image this file is rewritten at container
// start from the DASHBOARD_* variables (nginx/40-dashboard-config.sh). Empty
// values fall back to the REACT_APP_* values the bundle was built with.
window.__CONFIG__ = {
    backendUrl: "",
    mlflowUrl: "",
    dagsterUrl: ""
};
