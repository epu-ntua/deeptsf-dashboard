import React, {useEffect, useState} from 'react';
import axios from "axios";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import ModelTrainingIcon from "@mui/icons-material/ModelTraining";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";

import DataUsageIcon from "@mui/icons-material/DataUsage";
import NumbersIcon from "@mui/icons-material/Numbers";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import Loading from "../layout/Loading";

import {Bar, Line} from "react-chartjs-2";

import {buildForecastChart, forecastChartOptions} from "./forecastChart";

const DEFAULT_SAMPLES = 200

const ByEvaluationMetric = () => {

    const [experiments, setExperiments] = useState([])
    const [experimentChosen, setExperimentChosen] = useState('')
    const [bestRun, setBestRun] = useState('')

    const [metrics, setMetrics] = useState([])
    const [metricChosen, setMetricChosen] = useState('')

    const [limit, setLimit] = useState('')

    // Nothing is fetched for a run until the user has made a choice and asked for
    // it, so the page opens on the prompt below instead of on an empty chart.
    const [requested, setRequested] = useState(false)

    const [barChartLabels, setBarChartLabels] = useState([])
    const [barChartValues, setBarChartValues] = useState([])
    const [loadingBarChart, setLoadingBarChart] = useState(false)
    const [noBarChart, setNoBarChart] = useState(false)

    // A run that evaluated a whole multiple dataset has one set of results per
    // Timeseries ID; the dropdown picks which of them the chart shows.
    const [seriesOptions, setSeriesOptions] = useState([])
    const [seriesChosen, setSeriesChosen] = useState('')

    const [forecastChart, setForecastChart] = useState(null)
    const [loadingLineChart, setLoadingLineChart] = useState(false)
    const [noLineChart, setNoLineChart] = useState(false)

    useEffect(() => {
        axios.get('/results/get_list_of_experiments')
            .then(response => setExperiments(response.data))
            .catch(error => console.log(error))

        axios.get('/metrics/get_metric_names')
            .then(response => setMetrics(response.data))
            .catch(error => console.log(error))
    }, [])

    // The results on screen belong to the experiment and metric they were loaded
    // for, so changing either of those clears them rather than leaving something
    // stale under the new selection.
    useEffect(() => {
        setRequested(false)
        setBestRun('')
        setBarChartLabels([])
        setBarChartValues([])
        setNoBarChart(false)
        setSeriesOptions([])
        setSeriesChosen('')
        setForecastChart(null)
        setNoLineChart(false)
    }, [experimentChosen, metricChosen])

    const fetchForecast = (run, series) => {
        setNoLineChart(false)
        setLoadingLineChart(true)

        axios.get(`/results/get_forecast_vs_actual/${run}/n_samples/${limit > 0 ? limit : DEFAULT_SAMPLES}`,
            {params: series ? {series} : undefined})
            .then(response => {
                const chart = buildForecastChart(response.data)
                setForecastChart(chart)
                setNoLineChart(!chart)
                setLoadingLineChart(false)
            })
            .catch(error => {
                setForecastChart(null)
                setLoadingLineChart(false)
                setNoLineChart(true)
            })
    }

    const fetchRun = (run) => {
        // MLflow holds the metrics of a run already averaged over every time series
        // it evaluated, so this is the same call for single and multiple datasets.
        axios.get(`/results/get_metric_list/${run}`)
            .then(response => {
                const data = response.data;
                if (Array.isArray(data.labels) && Array.isArray(data.data) && data.data.length > 0) {
                    setBarChartLabels(data.labels)
                    setBarChartValues(data.data)
                } else {
                    setNoBarChart(true)
                }
                setLoadingBarChart(false)
            })
            .catch(error => {
                setLoadingBarChart(false)
                setNoBarChart(true)
            })

        // Which time series the run evaluated. A run over a single series, or a
        // backend without this endpoint, falls back to the run's own artifacts.
        axios.get(`/results/get_evaluation_series/${run}`)
            .then(response => {
                const available = Array.isArray(response.data?.series) ? response.data.series : []
                setSeriesOptions(available)
                setSeriesChosen(available.length > 0 ? available[0] : '')
                fetchForecast(run, available.length > 0 ? available[0] : '')
            })
            .catch(error => {
                setSeriesOptions([])
                setSeriesChosen('')
                fetchForecast(run, '')
            })
    }

    const loadMetrics = () => {
        if (experimentChosen === '') return

        setRequested(true)
        setBestRun('')
        setBarChartLabels([])
        setBarChartValues([])
        setNoBarChart(false)
        setLoadingBarChart(true)
        setSeriesOptions([])
        setSeriesChosen('')
        setForecastChart(null)
        setNoLineChart(false)
        setLoadingLineChart(true)

        axios.get(`/results/get_best_run_id_by_mlflow_experiment/${experimentChosen}/${metricChosen ? metricChosen : 'mape'}`)
            .then(response => {
                setBestRun(response.data)
                fetchRun(response.data)
            })
            .catch(error => {
                setLoadingBarChart(false)
                setLoadingLineChart(false)
                setNoBarChart(true)
                setNoLineChart(true)
            })
    }

    const handleChangeSeries = (event) => {
        setSeriesChosen(event.target.value)
        if (bestRun) fetchForecast(bestRun, event.target.value)
    }

    return (
        <>
            <Grid container spacing={2} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                        <ModelTrainingIcon fontSize="large"
                                           sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                        <Typography component={'span'} variant={'h5'} color={'inherit'} sx={{width: '100%'}}>Experiment name</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                        <InputLabel id="experiment-select-label">Choose an experiment</InputLabel>
                        <Select
                            labelId="experiment-select-label"
                            id="experiment-select"
                            value={experimentChosen}
                            label="Choose an experiment"
                            onChange={e => setExperimentChosen(e.target.value)}
                        >
                            {experiments && experiments.map(experiment => (
                                <MenuItem key={experiment.experiment_id}
                                          value={experiment.experiment_id}>{experiment?.experiment_name ? experiment.experiment_name : 'Default'}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                        <DataUsageIcon fontSize="large"
                                       sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                        <Typography component={'span'} variant={'h5'} color={'inherit'} sx={{width: '100%'}}>Main evaluation
                            metric</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <InputLabel id="metric-select-label">Choose a metric</InputLabel>
                        <Select
                            labelId="metric-select-label"
                            id="metric-select"
                            value={metricChosen}
                            label="Choose a metric"
                            onChange={e => setMetricChosen(e.target.value)}
                        >
                            {metrics && metrics.map(metric => (
                                <MenuItem key={metric.search_term}
                                          value={metric.search_term}>{metric.metric_name}</MenuItem>))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                        <NumbersIcon fontSize="large"
                                     sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                        <Typography component={'span'} variant={'h5'} color={'inherit'} sx={{width: '100%'}}>Number of evaluation
                            samples</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <TextField type={'number'} InputProps={{inputProps: {min: 0, max: 2000}}}
                                   id="evaluation-samples"
                                   label="Evaluation samples" variant="outlined"
                                   value={limit}
                                   onChange={e => setLimit(e.target.value)}/>
                    </FormControl>
                </Grid>

                <Stack sx={{ml: 'auto', my: 2}} direction={'row'} spacing={2}>
                    {bestRun && <Button variant={'contained'} component={'span'} size={'large'} color={'warning'}
                                        sx={{ml: 'auto'}}
                                        endIcon={<ChevronRight/>}
                                        onClick={() => window.open(`${process.env.REACT_APP_MLFLOW}/#/experiments/${experimentChosen}/runs/${bestRun}`, '_blank')}
                    >
                        <Typography variant={'subtitle1'}>DETAILS ON MLFLOW</Typography>
                    </Button>}
                    <Button variant={'contained'} component={'span'} size={'large'} color={'primary'}
                            disabled={experimentChosen === ''}
                            onClick={loadMetrics}
                            endIcon={<ChevronRight/>}><Typography variant={'subtitle1'}>LOAD
                        METRICS</Typography></Button>
                </Stack>
            </Grid>

            <Divider sx={{my: 4}}/>

            {!requested && <Alert severity="info" sx={{my: 5}} data-testid={'byEvaluationMetricPrompt'}>
                Choose an experiment, the evaluation metric to rank its runs by and how many evaluation samples to plot,
                then select LOAD METRICS.
            </Alert>}

            {requested && <>
                <Grid container direction="row" alignItems="center" justifyItems={'center'}>
                    <Typography variant={'h4'} display={'flex'} alignItems={'center'}>
                        <ChevronRightIcon
                            fontSize={'large'}/> Model Evaluation Metrics
                    </Typography>
                </Grid>
                {seriesOptions.length > 1 && !loadingBarChart && barChartValues.length > 0 &&
                    <Typography variant={'body2'} color={'text.secondary'} sx={{mt: 1, ml: 5}}>
                        Averaged over the {seriesOptions.length} evaluated time series, as logged in MLflow.
                    </Typography>}
                {noBarChart && <Alert severity="warning" sx={{my: 5}}>No data available for this experiment.</Alert>}
                {loadingBarChart && <Loading/>}

                {barChartValues.length > 0 && !loadingBarChart && <React.Fragment>
                    <Container>
                        <Bar data={{
                            labels: barChartLabels,
                            datasets: [{
                                label: 'Model Evaluation Metrics',
                                data: barChartValues,
                                backgroundColor: [
                                    'rgba(255, 99, 132, 0.2)',
                                    'rgba(54, 162, 235, 0.2)',
                                    'rgba(255, 206, 86, 0.2)',
                                    'rgba(75, 192, 192, 0.2)',
                                    'rgba(153, 102, 255, 0.2)',
                                    'rgba(255, 159, 64, 0.2)',
                                ],
                            }]
                        }} options={{
                            title: {
                                display: true,
                                fontSize: 20
                            },
                            legend: {
                                display: true,
                                position: 'right'
                            }
                        }}
                        />
                    </Container>
                </React.Fragment>}

                <Divider sx={{my: 5}}/>

                <Grid container direction="row" alignItems="center" justifyItems={'center'}>
                    <Typography variant={'h4'} display={'flex'} alignItems={'center'}>
                        <ChevronRightIcon
                            fontSize={'large'}/> Forecasted vs Actual Time Series
                    </Typography>
                </Grid>

                {seriesOptions.length > 1 && <FormControl sx={{my: 3, minWidth: '320px'}}>
                    <InputLabel id="series-select-label">Time series</InputLabel>
                    <Select
                        labelId="series-select-label"
                        id="series-select"
                        value={seriesChosen}
                        label="Time series"
                        onChange={handleChangeSeries}
                    >
                        {seriesOptions.map(series => (
                            <MenuItem key={series} value={series}>{series}</MenuItem>))}
                    </Select>
                </FormControl>}

                {noLineChart && <Alert severity="warning" sx={{my: 5}}>No data available for this experiment.</Alert>}
                {loadingLineChart && <Loading/>}

                <Divider sx={{mt: 5}}/>

                {forecastChart && !loadingLineChart &&
                    <React.Fragment>
                        <Container sx={{mb: 5}}>
                            <Line options={forecastChartOptions} data={{
                                labels: forecastChart.labels,
                                datasets: forecastChart.datasets,
                            }}/>
                            {forecastChart.multivariate &&
                                <Typography variant={'body2'} color={'text.secondary'} sx={{mt: 2}}>
                                    {forecastChart.componentCount} components; the actual series is drawn solid and its
                                    forecast dashed, in the same colour.
                                </Typography>}
                        </Container>
                    </React.Fragment>}
            </>}
        </>
    );
}

export default ByEvaluationMetric;
