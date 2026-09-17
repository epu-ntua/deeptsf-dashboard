import React from 'react';

import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import {foundationModels, getFoundationModel} from '../../foundationModels';

const ModelSelection = ({modelId, setModelId, timestepsAhead, setTimestepsAhead, disabled}) => {

    const selectedModel = getFoundationModel(modelId);

    return (
        <Grid container spacing={2} display={'flex'} justifyContent={'center'} alignItems={'center'}>
            <Grid item xs={12} md={6}>
                <Stack direction={'row'} spacing={2} sx={{alignItems: 'center'}}>
                    <PsychologyOutlinedIcon fontSize={'large'}
                                            sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                    <Typography variant={'h5'} color={'inherit'} sx={{width: '100%'}}>
                        Choose a foundation model
                    </Typography>
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <Stack direction={'row'} spacing={1} sx={{alignItems: 'center'}}>
                    <FormControl fullWidth>
                        <InputLabel id={'foundation-model-select-label'}>Model</InputLabel>
                        <Select
                            labelId={'foundation-model-select-label'}
                            id={'foundation-model-select'}
                            value={modelId}
                            label={'Model'}
                            disabled={disabled}
                            onChange={event => setModelId(event.target.value)}>
                            {foundationModels.map(model => (
                                <MenuItem value={model.id} key={model.id}>{model.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {selectedModel && <Tooltip
                        title={<span>
                            {selectedModel.description}{' '}
                            <a href={selectedModel.docsUrl}
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
                    </Tooltip>}
                </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
                <Stack direction={'row'} spacing={2} sx={{alignItems: 'center'}}>
                    <TimelineOutlinedIcon fontSize={'large'}
                                          sx={{width: '60px', height: '60px', color: '#0047BB', ml: 2, my: 1}}/>
                    <Typography variant={'h5'} color={'inherit'} sx={{width: '100%'}}>
                        Forecast horizon
                    </Typography>
                </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    id={'timesteps-ahead'}
                    type={'number'}
                    label={'Timesteps ahead'}
                    value={timestepsAhead}
                    disabled={disabled}
                    InputProps={{inputProps: {min: 1}}}
                    helperText={'How many steps, at the resolution of your series, the model should predict.'}
                    onChange={event => setTimestepsAhead(event.target.value)}
                    variant={'outlined'}
                    fullWidth/>
            </Grid>
        </Grid>
    );
}

export default ModelSelection;
