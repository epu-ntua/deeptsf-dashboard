import React, {useEffect, useState} from 'react';
import axiosInstance from "../api/axios";
import {Link, useNavigate} from "react-router-dom";

// import {modelConfigurations} from "../modelConfigurations";

import Typography from '@mui/material/Typography';
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

import Breadcrumb from "../components/layout/Breadcrumb";
import FullPageLoading from "../components/layout/FullPageLoading";
import DatasetConfiguration from "../components/loadForecastingPipeline/DatasetConfiguration";
import ModelTrainingSetup from "../components/loadForecastingPipeline/ModelTrainingSetup";
import ModelEvaluationSetup from "../components/loadForecastingPipeline/ModelEvaluationSetup";
import ExperimentExecution from "../components/loadForecastingPipeline/ExperimentExecution";
import {useKeycloak} from "@react-keycloak/web";

const AlertCustom = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const breadcrumbs = [
    <Link className={'breadcrumbLink'} key="1" to="/">
        Homepage
    </Link>,
    <Typography
        underline="hover"
        key="2"
        color="secondary"
        fontSize={'20px'}
        fontWeight={600}>
        Codeless Forecast
    </Typography>,
];

const CodelessForecast = () => {
    const {keycloak, initialized} = useKeycloak()
    const authenticationEnabled = process.env.REACT_APP_AUTH === "True"
    const navigate = useNavigate();

    const [allowed, setAllowed] = useState(null);

    useEffect(() => {
        // If authentication is disabled, allow access without checking roles
        if (!authenticationEnabled) {
            setAllowed(true);
            return;
        }

        // Otherwise, check authentication status
        if (initialized) {
            // Check auth method
            const authMethod = localStorage.getItem('authMethod');
            
            if (authMethod === 'virto') {
                // Virto users have inergy_admin role which includes data_scientist permissions
                setAllowed(true);
            } else if (keycloak.authenticated) {
                // Check for relevant roles in Keycloak
                const roles = keycloak.realmAccess?.roles || [];
                if (roles.includes('data_scientist') || roles.includes('inergy_admin')) {
                    setAllowed(true);
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        }
    }, [initialized, keycloak.authenticated, keycloak.realmAccess?.roles, navigate, authenticationEnabled]);

    const [newFile, setNewFile] = useState()
    const [dayFirst, setDayFirst] = useState(false)
    const [models, setModels] = useState([])
    const [model, setModel] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const [loading, setLoading] = useState(false)
    const [executionLoading, setExecutionLoading] = useState(false)
    const [executionInitiated, setExecutionInitiated] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [newFileSuccess, setNewFileSuccess] = useState(false)
    const [newFileFailure, setNewFileFailure] = useState(false)
    const [executionSuccess, setExecutionSuccess] = useState(false)
    const [executionFailure, setExecutionFailure] = useState(false)

    const [availableConfigurations, setAvailableConfigurations] = useState([])
    const [chosenConfiguration, setChosenConfiguration] = useState('')
    const [hyperParams, setHyperParams] = useState('')

    const [multiSeriesFile, setMultiSeriesFile] = useState(false)
    const [removeOutliers, setRemoveOutliers] = useState(true)
    const [imputationMethod, setImputationMethod] = useState('')
    const [resolutions, setResolutions] = useState([])
    const [maxDate, setMaxDate] = useState(null)
    const [minDate, setMinDate] = useState(null)
    const [minDateTestStart, setMinDateTestStart] = useState(null)
    const [maxDateTestStart, setMaxDateTestStart] = useState(null)
    const [minDateEndStart, setMinDateEndStart] = useState(null)
    const [format, setFormat] = useState('long')

    const [experimentName, setExperimentName] = useState('')
    const [experimentNameError, setExperimentNameError] = useState(false)
    const [experimentResolution, setExperimentResolution] = useState('')
    const [defaultResolutionChosen, setDefaultResolutionChosen] = useState(false)
    const [aggregationMethod, setAggregationMethod] = useState('averaging')

    const [dateVal, setDateVal] = useState(null)
    const [dateTest, setDateTest] = useState(null)
    const [dateEnd, setDateEnd] = useState(null)
    const [forecastHorizon, setForecastHorizon] = useState(24)
    const [ignorePrevious, setIgnorePrevious] = useState(true)
    const [seriesUri, setSeriesUri] = useState('')

    useEffect(() => {
        if ((initialized && experimentResolution) || (!authenticationEnabled && experimentResolution)) {
            axiosInstance.get(`/models/get_model_names/${experimentResolution}/${multiSeriesFile}`)
                .then(response => {
                    setModels(response.data)
                })
                .catch(error => {
                    console.error('Model names error:', error);
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [experimentResolution])

    useEffect(() => {
        setForecastHorizon(Math.floor(288 / (experimentResolution / 5)))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [experimentResolution])

    useEffect(() => {
        setChosenConfiguration(model.hparams)
        // axios.get('/experimentation_pipeline/training/hyperparameter_entrypoints')
        //     .then(response => {
        //         console.log(response.data)
        //         let myArray = Object.entries(response.data)
        //         const myArrayFiltered = myArray.filter(element => (element[0].includes(model.search_term)))
        //         setAvailableConfigurations(myArrayFiltered)
        //         setChosenConfiguration('')
        //     })
        //     .catch(error => console.log(error))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [model])

    useEffect(() => {
        dateVal && setMinDateTestStart(new Date(dateVal.getFullYear(), dateVal.getMonth(), dateVal.getDate() + 10))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateVal])

    useEffect(() => {
        dateTest && setMinDateEndStart(new Date(dateTest.getFullYear(), dateTest.getMonth(), dateTest.getDate() + 10))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateTest])

    useEffect(() => {
        dateTest && (dateTest < minDateTestStart) && setDateTest(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minDateTestStart])

    useEffect(() => {
        dateEnd && (dateEnd < minDateEndStart) && setDateEnd(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minDateEndStart])

    const closeSnackbar = () => {
        setNewFileSuccess(false)
        setNewFileFailure(false)

        setExecutionSuccess(false)
        setExecutionFailure(false)
    }


    // USE CASES STUFF
    const [ucChosen, setUcChosen] = useState('')
    const [tsUsedID, setTsUsedId] = useState('')
    const [evaluatedAllTs, setEvaluatedAllTs] = useState('')

    const resetState = () => {
        setNewFile(null);
        setDayFirst(false);
        setModels([]);
        setModel('');
        setErrorMessage('');
        // setLoading(false);
        setExecutionLoading(false);
        setExecutionInitiated(false);
        setUploadSuccess(false);
        setNewFileSuccess(false);
        setNewFileFailure(false);
        setExecutionSuccess(false);
        setExecutionFailure(false);
        setAvailableConfigurations([]);
        setChosenConfiguration('');
        setHyperParams('');
        setMultiSeriesFile(false);
        setRemoveOutliers(true);
        setResolutions([]);
        setMaxDate(null);
        setMinDate(null);
        setMinDateTestStart(null);
        setMaxDateTestStart(null);
        setMinDateEndStart(null);
        setExperimentName('');
        setExperimentNameError(false);
        setExperimentResolution('');
        setDefaultResolutionChosen(false);
        setAggregationMethod('averaging');
        setDateVal(null);
        setDateTest(null);
        setDateEnd(null);
        setForecastHorizon(24);
        setIgnorePrevious(true);
        setSeriesUri('');
        setTsUsedId('')
        setEvaluatedAllTs('')
        setFormat('long')
    };


    return (
        <>
            <Breadcrumb breadcrumbs={breadcrumbs} welcome_msg={''}/>

            {/* Show content if auth is disabled or user has proper permissions */}
            {(allowed || !authenticationEnabled) && <>
                {/* Dataset Configuration */}
                <DatasetConfiguration
                    resetState={resetState}
                    executionLoading={executionLoading}
                    setNewFile={setNewFile}
                    newFile={newFile}
                    dayFirst={dayFirst}
                    setDayFirst={setDayFirst}
                    experimentResolution={experimentResolution}
                    setExperimentResolution={setExperimentResolution}
                    multiSeriesFile={multiSeriesFile}
                    setMultiSeriesFile={setMultiSeriesFile}
                    removeOutliers={removeOutliers}
                    setRemoveOutliers={setRemoveOutliers}
                    resolutions={resolutions}
                    defaultResolutionChosen={defaultResolutionChosen}
                    setDefaultResolutionChosen={setDefaultResolutionChosen}
                    aggregationMethod={aggregationMethod}
                    setAggregationMethod={setAggregationMethod}
                    dateVal={dateVal}
                    minDate={minDate}
                    maxDate={maxDate}
                    dateTest={dateTest}
                    minDateTestStart={minDateTestStart}
                    maxDateTestStart={maxDateTestStart}
                    dateEnd={dateEnd}
                    minDateEndStart={minDateEndStart}
                    setDateVal={setDateVal}
                    setDateTest={setDateTest}
                    setDateEnd={setDateEnd}
                    setLoading={setLoading}
                    setUploadSuccess={setUploadSuccess}
                    setExecutionSuccess={setExecutionSuccess}
                    setExecutionFailure={setExecutionFailure}
                    setMinDate={setMinDate}
                    setMaxDate={setMaxDate}
                    setMaxDateTestStart={setMaxDateTestStart}
                    setSeriesUri={setSeriesUri}
                    setNewFileSuccess={setNewFileSuccess}
                    setNewFileFailure={setNewFileFailure}
                    setResolutions={setResolutions}
                    setErrorMessage={setErrorMessage}
                    uploadSuccess={uploadSuccess}
                    ucChosen={ucChosen}
                    setUcChosen={setUcChosen}
                    tsUsedID={tsUsedID}
                    setTsUsedId={setTsUsedId}
                    evaluatedAllTs={evaluatedAllTs}
                    setEvaluatedAllTs={setEvaluatedAllTs}
                    imputationMethod={imputationMethod}
                    setImputationMethod={setImputationMethod}
                    format={format}
                    setFormat={setFormat}
                />
                <hr/>

                {/* Model Training Setup */}
                <ModelTrainingSetup
                    experimentName={experimentName}
                    experimentNameError={experimentNameError}
                    setExperimentName={setExperimentName}
                    executionLoading={executionLoading}
                    ignorePrevious={ignorePrevious}
                    model={model}
                    setModel={setModel}
                    models={models}
                    experimentResolution={experimentResolution}
                    // availableConfigurations={availableConfigurations}
                    chosenConfiguration={chosenConfiguration}
                    hyperParams={hyperParams}
                    setHyperParams={setHyperParams}
                    setChosenConfiguration={setChosenConfiguration}
                    setIgnorePrevious={setIgnorePrevious}
                />
                <hr/>

                {/* Model Evaluation Setup */}
                <ModelEvaluationSetup
                    forecastHorizon={forecastHorizon}
                    executionLoading={executionLoading}
                    setForecastHorizon={setForecastHorizon}
                />
                <hr/>

                {/* Experiment Execution */}
                <ExperimentExecution
                    executionLoading={executionLoading}
                    uploadSuccess={uploadSuccess}
                    experimentResolution={experimentResolution}
                    dateVal={dateVal}
                    dateTest={dateTest}
                    dateEnd={dateEnd}
                    experimentName={experimentName}
                    model={model}
                    chosenConfiguration={chosenConfiguration}
                    hyperParams={hyperParams}
                    aggregationMethod={aggregationMethod}
                    removeOutliers={removeOutliers}
                    forecastHorizon={forecastHorizon}
                    executionInitiated={executionInitiated}
                    setExecutionLoading={setExecutionLoading}
                    setExecutionInitiated={setExecutionInitiated}
                    setExecutionSuccess={setExecutionSuccess}
                    setExecutionFailure={setExecutionFailure}
                    availableConfigurations={availableConfigurations}
                    ignorePrevious={ignorePrevious}
                    seriesUri={seriesUri}
                    multiSeriesFile={multiSeriesFile}
                    tsUsedID={tsUsedID}
                    evaluatedAllTs={evaluatedAllTs}
                    setEvaluatedAllTs={setEvaluatedAllTs}
                    ucChosen={ucChosen}
                    imputationMethod={imputationMethod}
                    format={format}
                />
            </>}

            {loading && <FullPageLoading/>}
            <Snackbar open={newFileSuccess} autoHideDuration={3000} onClose={closeSnackbar}>
                <AlertCustom onClose={closeSnackbar} severity="success" sx={{width: '100%', mb: 5}}>
                    The new file has been successfully uploaded!
                </AlertCustom>
            </Snackbar>
            <Snackbar open={newFileFailure} autoHideDuration={3000} onClose={closeSnackbar}>
                <AlertCustom onClose={closeSnackbar} severity="error" sx={{width: '100%', mb: 5}}>
                    {errorMessage || 'Something went wrong! Please try again later.'}
                </AlertCustom>
            </Snackbar>

            <Snackbar open={executionSuccess} autoHideDuration={3000} onClose={closeSnackbar}>
                <AlertCustom onClose={closeSnackbar} severity="success" sx={{width: '100%', mb: 5}}>
                    Execution initiated!
                </AlertCustom>
            </Snackbar>
            <Snackbar open={executionFailure} autoHideDuration={3000} onClose={closeSnackbar}>
                <AlertCustom onClose={closeSnackbar} severity="error" sx={{width: '100%', mb: 5}}>
                    Something went wrong with the execution! Please try again!
                </AlertCustom>
            </Snackbar>
        </>);
}

export default CodelessForecast;