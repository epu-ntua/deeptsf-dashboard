import React, {useState} from 'react';
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import NumbersIcon from "@mui/icons-material/Numbers";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ChevronRight from "@mui/icons-material/ChevronRight";
import SettingsIcon from '@mui/icons-material/Settings';
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import {Bar, Line} from "react-chartjs-2";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Alert from "@mui/material/Alert";
import Loading from "../layout/Loading";
import axios from "axios";

import {buildForecastChart, forecastChartOptions} from "./forecastChart";

const DEFAULT_SAMPLES = 200

const ByRunId = () => {
    const [runID, setRunID] = useState('')
    const [limit, setLimit] = useState('')

    // Set once the user has asked for a run, so the page opens on the prompt below.
    const [requested, setRequested] = useState(false)
    const [loadedRun, setLoadedRun] = useState('')

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

    const fetchForecast = (run, series, samples) => {
        setNoLineChart(false)
        setLoadingLineChart(true)

        axios.get(`/results/get_forecast_vs_actual/${run}/n_samples/${samples > 0 ? samples : DEFAULT_SAMPLES}`,
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

    const fetchMetrics = (run, samples) => {
        setRequested(true)
        setLoadedRun(run)
        setNoBarChart(false)
        setNoLineChart(false)
        setBarChartLabels([])
        setBarChartValues([])
        setSeriesOptions([])
        setSeriesChosen('')
        setForecastChart(null)

        setLoadingBarChart(true)
        setLoadingLineChart(true)

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
                fetchForecast(run, available.length > 0 ? available[0] : '', samples)
            })
            .catch(error => {
                setSeriesOptions([])
                setSeriesChosen('')
                fetchForecast(run, '', samples)
            })
    }

    const handleChangeSeries = (event) => {
        setSeriesChosen(event.target.value)
        if (loadedRun) fetchForecast(loadedRun, event.target.value, limit)
    }

    return (
        <>
            <Grid container spacing={2} display={'flex'} justifyContent={'center'} alignItems={'center'}>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={2} sx={{alignItems: 'center'}}>
                        <SettingsIcon fontSize="large"
                                     sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                        <Typography component={'span'} variant={'h5'} color={'inherit'} sx={{width: '100%'}}>Insert desired Run
                            ID</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <TextField id="run-id"
                                   label="Run ID" variant="outlined"
                                   value={runID}
                                   onChange={e => setRunID(e.target.value)}
                        />
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
                    <Button variant={'contained'} component={'span'} size={'large'} color={'primary'}
                            disabled={!runID}
                            endIcon={<ChevronRight/>} onClick={() => fetchMetrics(runID, limit)}>
                        <Typography component={'span'} variant={'subtitle1'}>LOAD METRICS</Typography>
                    </Button>
                </Stack>
            </Grid>

            <Divider sx={{mt: 2, mb: 4}}/>

            {!requested && <Alert severity="info" sx={{my: 5}} data-testid={'byRunIdPrompt'}>
                Insert the Run ID you want to inspect and how many evaluation samples to plot, then select LOAD METRICS.
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
                {noBarChart && <Alert severity="warning" sx={{my: 5}}>No data available for this run.</Alert>}
                {loadingBarChart && <Loading/>}

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

                {noLineChart && <Alert severity="warning" sx={{my: 5}}>No data available for this run.</Alert>}
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

export default ByRunId;
