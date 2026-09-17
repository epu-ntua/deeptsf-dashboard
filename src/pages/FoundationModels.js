import React, {useEffect, useState} from 'react';
import {useKeycloak} from '@react-keycloak/web';

import {Link, useNavigate} from 'react-router-dom';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
} from 'chart.js';

import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';

import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';

import Breadcrumb from '../components/layout/Breadcrumb';
import ModelSelection from '../components/foundationModels/ModelSelection';
import SeriesUpload from '../components/foundationModels/SeriesUpload';
import AdvancedParameters from '../components/foundationModels/AdvancedParameters';
import ForecastResult from '../components/foundationModels/ForecastResult';

import {getFoundationModel} from '../foundationModels';
import {forecastFile, describeChronosError} from '../api/chronos';
import {parseSingleSeriesCsv, readFileAsText} from '../utils/deeptsfCsv';

ChartJS.register(
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
);

const AlertCustom = React.forwardRef(function SnackbarAlert(props, ref) {
    return <Alert elevation={6} ref={ref} variant="filled" {...props} />;
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
        Foundation Models
    </Typography>
];

const DEFAULT_MODEL_ID = 'chronos2';

// Comma separated floats, each strictly between 0 and 1.
const validateQuantileLevels = value => {
    if (!value || value.trim() === '') return '';

    const parts = value.split(',').map(part => part.trim());
    const invalid = parts.filter(part => {
        const parsed = Number(part);
        return part === '' || Number.isNaN(parsed) || parsed <= 0 || parsed >= 1;
    });

    return invalid.length > 0
        ? `Not a valid quantile level: ${invalid.join(', ')}. Use comma separated values between 0 and 1.`
        : '';
};

const FoundationModels = () => {

    const {keycloak, initialized} = useKeycloak()
    const authenticationEnabled = process.env.REACT_APP_AUTH === "True"
    const navigate = useNavigate();

    const [allowed, setAllowed] = useState(null)

    useEffect(() => {
        if (initialized) {
            // Check auth method
            const authMethod = localStorage.getItem('authMethod');

            if (authMethod === 'virto') {
                // Virto users have inergy_admin role which includes energy_engineer permissions
                setAllowed(true);
            } else if (keycloak.authenticated) {
                // Check for relevant roles in Keycloak
                const roles = keycloak.realmAccess?.roles || [];
                if (roles.includes('data_scientist') || roles.includes('energy_engineer') || roles.includes('inergy_admin')) {
                    setAllowed(true);
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        }

        if (!authenticationEnabled) {
            setAllowed(true);
        }
    }, [initialized, keycloak.authenticated, keycloak.realmAccess?.roles, navigate, authenticationEnabled])

    const defaults = getFoundationModel(DEFAULT_MODEL_ID).defaults;

    // Model and horizon
    const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
    const [timestepsAhead, setTimestepsAhead] = useState(defaults.timestepsAhead);

    // Input files
    const [seriesFile, setSeriesFile] = useState(null);
    const [seriesError, setSeriesError] = useState('');
    const [seriesPreview, setSeriesPreview] = useState(null);
    const [pastCovariatesFile, setPastCovariatesFile] = useState(null);
    const [pastCovariatesMultiple, setPastCovariatesMultiple] = useState(false);
    const [pastCovariatesFormat, setPastCovariatesFormat] = useState('long');
    const [futureCovariatesFile, setFutureCovariatesFile] = useState(null);
    const [futureCovariatesMultiple, setFutureCovariatesMultiple] = useState(false);
    const [futureCovariatesFormat, setFutureCovariatesFormat] = useState('long');

    // Optional parameters
    const [batchSize, setBatchSize] = useState(defaults.batchSize);
    const [crossLearning, setCrossLearning] = useState(defaults.crossLearning);
    const [quantileLevels, setQuantileLevels] = useState(defaults.quantileLevels);

    // Request lifecycle
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [forecast, setForecast] = useState(null);
    const [requestError, setRequestError] = useState('');
    const [successOpen, setSuccessOpen] = useState(false);
    const [failureOpen, setFailureOpen] = useState(false);

    const quantileLevelsError = validateQuantileLevels(quantileLevels);

    // Validate the target series as soon as it is picked, so format problems
    // surface immediately rather than after a slow round trip.
    const handleSeriesFileChange = file => {
        setSeriesFile(file);
        setSeriesError('');
        setSeriesPreview(null);
        setForecast(null);

        if (!file) return;

        readFileAsText(file)
            .then(text => setSeriesPreview(parseSingleSeriesCsv(text)))
            .catch(error => {
                setSeriesPreview(null);
                setSeriesError(error.message);
            });
    };

    const canSubmit = Boolean(seriesFile)
        && Boolean(seriesPreview)
        && !seriesError
        && !quantileLevelsError
        && Number(timestepsAhead) > 0
        && !loading;

    const handleMakePredictions = () => {
        setLoading(true);
        setUploadProgress(0);
        setRequestError('');
        setForecast(null);

        forecastFile({
            timestepsAhead: Number(timestepsAhead),
            seriesFile,
            pastCovariatesFile,
            pastCovariatesMultiple,
            pastCovariatesFormat,
            futureCovariatesFile,
            futureCovariatesMultiple,
            futureCovariatesFormat,
            batchSize: Number(batchSize),
            crossLearning,
            quantileLevels,
        }, {
            onUploadProgress: progressEvent => {
                if (!progressEvent.total) return;
                setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
            },
        })
            .then(data => {
                // The endpoint declares an untyped response, so check the shape.
                if (!data || typeof data.forecast !== 'object' || data.forecast === null) {
                    throw new Error('The response did not contain a "forecast" field.');
                }
                setForecast(data.forecast);
                setSuccessOpen(true);
            })
            .catch(error => {
                setRequestError(describeChronosError(error));
                setFailureOpen(true);
            })
            .finally(() => setLoading(false));
    };

    const selectedModel = getFoundationModel(modelId);

    return (
        <>
            <Breadcrumb breadcrumbs={breadcrumbs} welcome_msg={''}/>
            {allowed && <>
                <Container maxWidth={'xl'} sx={{my: 5}} data-testid={'foundationModelsSection'}>
                    <Typography component={'span'} variant={'h4'} fontWeight={'bold'} sx={{mb: 3}}>
                        Forecast with a foundation model
                    </Typography>
                    <Typography sx={{mt: 2, mb: 3}} color={'text.secondary'}>
                        Run a pre-trained forecasting model directly on your own data. No training run is
                        started and nothing is written to MLflow.
                    </Typography>
                    <ModelSelection
                        modelId={modelId}
                        setModelId={setModelId}
                        timestepsAhead={timestepsAhead}
                        setTimestepsAhead={setTimestepsAhead}
                        disabled={loading}/>
                </Container>

                <Divider/>

                <Container maxWidth={'xl'} sx={{my: 5}} data-testid={'foundationModelsUploadSection'}>
                    <Typography component={'span'} variant={'h4'} fontWeight={'bold'} sx={{mb: 3}}>
                        Upload your data
                    </Typography>
                    <SeriesUpload
                        seriesFile={seriesFile}
                        setSeriesFile={handleSeriesFileChange}
                        seriesError={seriesError}
                        seriesPreview={seriesPreview}
                        pastCovariatesFile={pastCovariatesFile}
                        setPastCovariatesFile={setPastCovariatesFile}
                        pastCovariatesMultiple={pastCovariatesMultiple}
                        setPastCovariatesMultiple={setPastCovariatesMultiple}
                        pastCovariatesFormat={pastCovariatesFormat}
                        setPastCovariatesFormat={setPastCovariatesFormat}
                        futureCovariatesFile={futureCovariatesFile}
                        setFutureCovariatesFile={setFutureCovariatesFile}
                        futureCovariatesMultiple={futureCovariatesMultiple}
                        setFutureCovariatesMultiple={setFutureCovariatesMultiple}
                        futureCovariatesFormat={futureCovariatesFormat}
                        setFutureCovariatesFormat={setFutureCovariatesFormat}
                        disabled={loading}/>
                </Container>

                <Divider/>

                <Container maxWidth={'xl'} sx={{my: 5}} data-testid={'foundationModelsParametersSection'}>
                    <Typography component={'span'} variant={'h4'} fontWeight={'bold'} sx={{mb: 3}}>
                        Fine-tune the request
                    </Typography>
                    <AdvancedParameters
                        batchSize={batchSize}
                        setBatchSize={setBatchSize}
                        crossLearning={crossLearning}
                        setCrossLearning={setCrossLearning}
                        quantileLevels={quantileLevels}
                        setQuantileLevels={setQuantileLevels}
                        quantileLevelsError={quantileLevelsError}
                        disabled={loading}/>
                </Container>

                <Divider/>

                <Container maxWidth={'xl'} sx={{my: 5}} data-testid={'foundationModelsResultSection'}>
                    <Stack direction={'row'} sx={{alignItems: 'center', mb: 3}}>
                        <Typography component={'span'} variant={'h4'} fontWeight={'bold'}>
                            Predictions
                        </Typography>
                        <Button
                            variant={'contained'}
                            color={'primary'}
                            size={'large'}
                            disabled={!canSubmit}
                            onClick={handleMakePredictions}
                            startIcon={<PlayArrowOutlinedIcon/>}
                            sx={{ml: 'auto', textTransform: 'none', fontWeight: 'bold'}}>
                            Make Predictions
                        </Button>
                    </Stack>

                    {!seriesFile && <Alert severity={'warning'}>
                        Upload a target series first to make predictions!
                    </Alert>}

                    {loading && <>
                        <Typography sx={{mt: 2}} color={'text.secondary'}>
                            {uploadProgress < 100
                                ? `Uploading: ${uploadProgress}%`
                                : `Running ${selectedModel ? selectedModel.name : 'the model'}, this can take a few minutes...`}
                        </Typography>
                        <LinearProgress
                            variant={uploadProgress > 0 && uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                            value={uploadProgress}
                            sx={{mt: 1, height: 8, borderRadius: 4}}/>
                    </>}

                    {requestError && !loading && <Alert severity={'error'} sx={{mt: 2}}>{requestError}</Alert>}

                    {forecast && !loading && <ForecastResult
                        forecast={forecast}
                        history={seriesPreview}
                        modelName={selectedModel ? selectedModel.id : 'foundation'}/>}
                </Container>

                <Snackbar open={successOpen} autoHideDuration={3000} onClose={() => setSuccessOpen(false)}>
                    <AlertCustom onClose={() => setSuccessOpen(false)} severity="success" sx={{width: '100%'}}>
                        Forecast generated successfully!
                    </AlertCustom>
                </Snackbar>
                <Snackbar open={failureOpen} autoHideDuration={6000} onClose={() => setFailureOpen(false)}>
                    <AlertCustom onClose={() => setFailureOpen(false)} severity="error" sx={{width: '100%'}}>
                        The forecast request failed.
                    </AlertCustom>
                </Snackbar>
            </>}
        </>
    );
}

export default FoundationModels;
