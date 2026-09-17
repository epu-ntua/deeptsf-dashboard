import React from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

// Every field here is optional: leaving the defaults alone lets the inference
// server apply its own.
const AdvancedParameters = ({
                                batchSize, setBatchSize,
                                crossLearning, setCrossLearning,
                                quantileLevels, setQuantileLevels,
                                quantileLevelsError,
                                disabled,
                            }) => (
    <Grid container spacing={2} display={'flex'} justifyContent={'center'} alignItems={'center'}>
        <Grid item xs={12} md={6}>
            <Stack direction={'row'} spacing={2} sx={{alignItems: 'center'}}>
                <TuneOutlinedIcon fontSize={'large'}
                                  sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                <Typography variant={'h5'} color={'inherit'} sx={{width: '100%'}}>
                    Extra parameters
                </Typography>
            </Stack>
        </Grid>
        <Grid item xs={12} md={6}>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{color: '#FFFFFF'}}/>}
                    aria-controls={'foundation-advanced-content'}
                    id={'foundation-advanced-header'}
                    sx={{backgroundColor: '#0047BB', color: '#FFFFFF'}}>
                    <Typography>Advanced parameters (optional)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Grid container spacing={2} sx={{mt: 0}}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                id={'chronos-batch-size'}
                                type={'number'}
                                label={'Batch size'}
                                value={batchSize}
                                disabled={disabled}
                                InputProps={{inputProps: {min: 1}}}
                                onChange={event => setBatchSize(event.target.value)}
                                variant={'outlined'}
                                fullWidth/>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                id={'chronos-quantile-levels'}
                                label={'Quantile levels'}
                                value={quantileLevels}
                                disabled={disabled}
                                error={Boolean(quantileLevelsError)}
                                helperText={quantileLevelsError || 'Comma separated values between 0 and 1, e.g. 0.1,0.5,0.9'}
                                onChange={event => setQuantileLevels(event.target.value)}
                                variant={'outlined'}
                                fullWidth/>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormGroup>
                                <FormControlLabel
                                    control={<Checkbox
                                        checked={crossLearning}
                                        disabled={disabled}
                                        onChange={event => setCrossLearning(event.target.checked)}/>}
                                    label={'Enable cross-learning across series'}/>
                            </FormGroup>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>
        </Grid>
    </Grid>
);

export default AdvancedParameters;
