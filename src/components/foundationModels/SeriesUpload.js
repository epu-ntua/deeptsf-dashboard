import React from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ClearOutlinedIcon from '@mui/icons-material/ClearOutlined';
import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DOCS_URL = 'https://github.com/epu-ntua/DeepTSF/wiki/Input-format';

const uploadButtonSx = {
    fontWeight: 'bold',
    textTransform: 'none',
    fontSize: '1.1rem',
    px: 3,
    py: 1.5,
    backgroundColor: '#0047BB',
    '&:hover': {backgroundColor: '#003a99'},
    borderRadius: 2,
    minWidth: 220,
    textAlign: 'left',
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
};

// One labelled upload slot: icon + title on the left, picker + filename on the right.
const FileSlot = ({inputId, icon, title, buttonLabel, file, onSelect, onClear, disabled, helperText, children}) => (
    <>
        <Grid item xs={12} md={6}>
            <Stack direction={'row'} spacing={2} sx={{alignItems: 'center'}}>
                {icon}
                <Typography variant={'h5'} color={'inherit'} sx={{width: '100%'}}>
                    {title}
                    <Tooltip
                        title={<span>
                            For more info about the permitted file format check out our{' '}
                            <a href={DOCS_URL}
                               target={'_blank'}
                               rel={'noopener noreferrer'}
                               style={{color: '#fff', textDecoration: 'underline'}}>
                                documentation
                            </a>
                        </span>}
                        arrow
                        placement={'right'}>
                        <IconButton size={'small'} sx={{ml: 1}}>
                            <InfoOutlinedIcon fontSize={'small'} color={'primary'}/>
                        </IconButton>
                    </Tooltip>
                </Typography>
            </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
            <input
                accept={'.csv'}
                style={{display: 'none'}}
                id={inputId}
                type={'file'}
                disabled={disabled}
                // Reset the value so re-picking the same file still fires onChange.
                onChange={event => {
                    const selected = event.target.files[0];
                    event.target.value = '';
                    if (selected) onSelect(selected);
                }}/>
            <Stack direction={'row'} spacing={1} sx={{alignItems: 'center'}}>
                <label htmlFor={inputId} style={{width: '100%', display: 'flex', alignItems: 'center'}}>
                    <Button
                        variant={'contained'}
                        color={'primary'}
                        size={'large'}
                        component={'span'}
                        disabled={disabled}
                        startIcon={<UploadFileOutlinedIcon fontSize={'large'} sx={{color: '#fff'}}/>}
                        sx={uploadButtonSx}>
                        {buttonLabel}
                    </Button>
                </label>
                {file && <Tooltip title={'Remove this file'} arrow>
                    <IconButton onClick={onClear} disabled={disabled} aria-label={`Remove ${title}`}>
                        <ClearOutlinedIcon color={'primary'}/>
                    </IconButton>
                </Tooltip>}
            </Stack>
            {file && <Typography variant={'body2'} sx={{mt: 1, ml: 1}} color={'text.secondary'}>
                Selected: <strong>{file.name}</strong>
            </Typography>}
            {helperText && <Typography variant={'body2'} sx={{mt: 1, ml: 1}} color={'text.secondary'}>
                {helperText}
            </Typography>}
            {children}
        </Grid>
    </>
);

// Multiple-series flags belong to the covariate file they describe, so they sit
// next to their picker instead of in the advanced parameters accordion.
const CovariateOptions = ({idPrefix, multiple, setMultiple, format, setFormat, disabled}) => (
    <Box sx={{mt: 2}}>
        <FormGroup>
            <FormControlLabel
                control={<Checkbox
                    checked={multiple}
                    disabled={disabled}
                    onChange={event => setMultiple(event.target.checked)}/>}
                label={'This file holds multiple series'}/>
        </FormGroup>
        {multiple && <FormControl fullWidth sx={{mt: 1}}>
            <InputLabel id={`${idPrefix}-format-label`}>File format</InputLabel>
            <Select
                labelId={`${idPrefix}-format-label`}
                id={`${idPrefix}-format`}
                value={format}
                label={'File format'}
                disabled={disabled}
                onChange={event => setFormat(event.target.value)}>
                <MenuItem value={'long'}>long</MenuItem>
                <MenuItem value={'short'}>short</MenuItem>
            </Select>
        </FormControl>}
    </Box>
);

const SeriesUpload = ({
                          seriesFile, setSeriesFile,
                          seriesError, seriesPreview,
                          pastCovariatesFile, setPastCovariatesFile,
                          pastCovariatesMultiple, setPastCovariatesMultiple,
                          pastCovariatesFormat, setPastCovariatesFormat,
                          futureCovariatesFile, setFutureCovariatesFile,
                          futureCovariatesMultiple, setFutureCovariatesMultiple,
                          futureCovariatesFormat, setFutureCovariatesFormat,
                          disabled,
                      }) => {

    const iconSx = {width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1};

    return (
        <Grid container spacing={2} display={'flex'} justifyContent={'center'} alignItems={'flex-start'}>
            <FileSlot
                inputId={'foundation-series-file'}
                icon={<InsertChartOutlinedIcon fontSize={'large'} sx={iconSx}/>}
                title={'Target series'}
                buttonLabel={'Upload your .csv file'}
                file={seriesFile}
                onSelect={setSeriesFile}
                onClear={() => setSeriesFile(null)}
                disabled={disabled}
                helperText={'Required. A DeepTSF single time series: a Datetime column followed by a Value column, in chronological order with no duplicate datetimes.'}>
                {seriesError && <Alert severity={'error'} sx={{mt: 2}}>{seriesError}</Alert>}
                {seriesPreview && <Alert severity={'success'} sx={{mt: 2}}>
                    {seriesPreview.datetimes.length} rows read,
                    from {seriesPreview.datetimes[0]} to {seriesPreview.datetimes[seriesPreview.datetimes.length - 1]}.
                </Alert>}
            </FileSlot>

            <Grid item xs={12}><Box sx={{my: 1}}/></Grid>

            <FileSlot
                inputId={'foundation-past-covariates-file'}
                icon={<HistoryOutlinedIcon fontSize={'large'} sx={iconSx}/>}
                title={'Past covariates'}
                buttonLabel={'Upload past covariates (optional)'}
                file={pastCovariatesFile}
                onSelect={setPastCovariatesFile}
                onClear={() => setPastCovariatesFile(null)}
                disabled={disabled}
                helperText={'Optional. Variables known only up to the end of the target series, so it should span the same period as the target.'}>
                {pastCovariatesFile && <CovariateOptions
                    idPrefix={'past-covariates'}
                    multiple={pastCovariatesMultiple}
                    setMultiple={setPastCovariatesMultiple}
                    format={pastCovariatesFormat}
                    setFormat={setPastCovariatesFormat}
                    disabled={disabled}/>}
            </FileSlot>

            <Grid item xs={12}><Box sx={{my: 1}}/></Grid>

            <FileSlot
                inputId={'foundation-future-covariates-file'}
                icon={<UpdateOutlinedIcon fontSize={'large'} sx={iconSx}/>}
                title={'Future covariates'}
                buttonLabel={'Upload future covariates (optional)'}
                file={futureCovariatesFile}
                onSelect={setFutureCovariatesFile}
                onClear={() => setFutureCovariatesFile(null)}
                disabled={disabled}
                helperText={'Optional. Variables known in advance. It must cover the forecast horizon only: exactly as many rows per series as the timesteps ahead, starting right after the target series ends.'}>
                {futureCovariatesFile && <CovariateOptions
                    idPrefix={'future-covariates'}
                    multiple={futureCovariatesMultiple}
                    setMultiple={setFutureCovariatesMultiple}
                    format={futureCovariatesFormat}
                    setFormat={setFutureCovariatesFormat}
                    disabled={disabled}/>}
            </FileSlot>
        </Grid>
    );
}

export default SeriesUpload;
