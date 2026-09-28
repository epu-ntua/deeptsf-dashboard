import React, {useMemo, useState} from 'react';
import {Line} from 'react-chartjs-2';

import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import {toCsv, downloadCsv} from '../../utils/deeptsfCsv';

const DEFAULT_HISTORY_POINTS = 200;

const ForecastResult = ({forecast, history, modelName}) => {

    const [historyPoints, setHistoryPoints] = useState(DEFAULT_HISTORY_POINTS);

    const forecastDatetimes = useMemo(() => Object.keys(forecast), [forecast]);
    const forecastValues = useMemo(() => forecastDatetimes.map(key => forecast[key]), [forecast, forecastDatetimes]);

    const chart = useMemo(() => {
        const requested = Number(historyPoints);
        // Guard the 0 case explicitly: slice(-0) is slice(0), i.e. the whole array.
        const points = Number.isFinite(requested) && requested >= 0 ? requested : DEFAULT_HISTORY_POINTS;
        const showHistory = Boolean(history) && points > 0;
        const historyDatetimes = showHistory ? history.datetimes.slice(-points) : [];
        const historyValues = showHistory ? history.values.slice(-points) : [];
        const horizon = forecastValues.length;

        // Both series live on one category axis. Padding each with nulls keeps a
        // dataset to its own region; repeating the last historical point as the
        // forecast's first value joins the two lines instead of leaving a gap.
        const actualData = [...historyValues, ...new Array(horizon).fill(null)];
        const forecastData = historyValues.length > 0
            ? [
                ...new Array(historyValues.length - 1).fill(null),
                historyValues[historyValues.length - 1],
                ...forecastValues,
            ]
            : forecastValues;

        return {
            labels: [...historyDatetimes, ...forecastDatetimes],
            datasets: [
                {
                    label: 'Actual',
                    data: actualData,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    yAxisID: 'y',
                },
                {
                    label: 'Forecast',
                    data: forecastData,
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    yAxisID: 'y',
                },
            ],
        };
    }, [history, historyPoints, forecastDatetimes, forecastValues]);

    // The exported file is itself a valid DeepTSF single time series, so it can be
    // fed straight back into the forecasting pipeline.
    const handleDownload = () => {
        const rows = forecastDatetimes.map(datetime => [datetime, forecast[datetime]]);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadCsv(`${modelName || 'foundation'}_forecast_${stamp}.csv`, toCsv(['Datetime', 'Value'], rows));
    };

    if (forecastDatetimes.length === 0) {
        return <Alert severity={'warning'} sx={{my: 5}}>The model returned an empty forecast.</Alert>;
    }

    return (
        <>
            <Grid container direction={'row'} alignItems={'center'} justifyItems={'center'}>
                <Typography variant={'h4'} display={'flex'} alignItems={'center'}>
                    <ChevronRightIcon fontSize={'large'}/> Forecasted Time Series
                </Typography>
            </Grid>

            <Grid container spacing={2} sx={{mt: 1}} alignItems={'center'}>
                <Grid item xs={12} md={4}>
                    <TextField
                        id={'foundation-history-points'}
                        type={'number'}
                        label={'History points to display'}
                        value={historyPoints}
                        InputProps={{inputProps: {min: 0, max: 5000}}}
                        onChange={event => setHistoryPoints(event.target.value)}
                        variant={'outlined'}
                        fullWidth/>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Stack direction={'row'} sx={{justifyContent: {xs: 'flex-start', md: 'flex-end'}}}>
                        <Button
                            variant={'contained'}
                            color={'primary'}
                            size={'large'}
                            startIcon={<DownloadOutlinedIcon/>}
                            onClick={handleDownload}
                            sx={{textTransform: 'none', fontWeight: 'bold'}}>
                            Download forecast (.csv)
                        </Button>
                    </Stack>
                </Grid>
            </Grid>

            <Container sx={{my: 5}}>
                <Line
                    options={{
                        responsive: true,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        stacked: false,
                        plugins: {
                            title: {
                                display: true,
                            },
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                            },
                        },
                    }}
                    data={chart}/>
            </Container>
        </>
    );
}

export default ForecastResult;
