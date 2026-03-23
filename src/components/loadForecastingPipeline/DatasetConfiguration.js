import React, {useEffect, useState, useRef} from 'react';
import {useKeycloak} from "@react-keycloak/web";
import axios from "axios";
import axiosInstance, { createTaskWebSocket } from '../../api/axios';

import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DesktopDatePicker} from "@mui/x-date-pickers/DesktopDatePicker";
import TextField from "@mui/material/TextField";
import Container from "@mui/material/Container";
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import FormGroup from '@mui/material/FormGroup';
import Alert from "@mui/material/Alert";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import DataThresholdingIcon from "@mui/icons-material/DataThresholding";
import DateRangeIcon from "@mui/icons-material/DateRange";
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SchemaIcon from '@mui/icons-material/Schema';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function TabPanel(props) {
    const {children, value, index, ...other} = props;

    return (<div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
    >
        {value === index && (<Box sx={{p: 3}}>
            <Typography>{children}</Typography>
        </Box>)}
    </div>);
}

TabPanel.propTypes = {
    // children: PropTypes.node,
    // index: PropTypes.number.isRequired,
    // value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`, 'aria-controls': `simple-tabpanel-${index}`,
    };
}

const DatasetConfiguration = ({
                                  resetState,
                                  executionLoading,
                                  setNewFile,
                                  newFile,
                                  uploadSuccess,
                                  dayFirst,
                                  setDayFirst,
                                  experimentResolution,
                                  setExperimentResolution,
                                  multiSeriesFile,
                                  setMultiSeriesFile,
                                  removeOutliers,
                                  setRemoveOutliers,
                                  resolutions,
                                  defaultResolutionChosen,
                                  setDefaultResolutionChosen,
                                  aggregationMethod,
                                  setAggregationMethod,
                                  dateVal,
                                  minDate,
                                  maxDate,
                                  dateTest,
                                  minDateTestStart,
                                  maxDateTestStart,
                                  dateEnd,
                                  minDateEndStart,
                                  setDateVal,
                                  setDateTest,
                                  setDateEnd,
                                  setLoading,
                                  setUploadSuccess,
                                  setExecutionSuccess,
                                  setExecutionFailure,
                                  setMinDate,
                                  setMaxDate,
                                  setMaxDateTestStart,
                                  setSeriesUri,
                                  setNewFileSuccess,
                                  setNewFileFailure,
                                  setResolutions,
                                  setErrorMessage,
                                  ucChosen,
                                  setUcChosen,
                                  tsUsedID,
                                  setTsUsedId,
                                  evaluatedAllTs,
                                  setEvaluatedAllTs,
                                  imputationMethod,
                                  setImputationMethod,
                                  format,
                                  setFormat,
                                  newFileFailure
                              }) => {
    const {keycloak} = useKeycloak()
    const [value, setValue] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [taskStatusDetails, setTaskStatusDetails] = useState([]);
    const websocketRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const maxRetries = 3;
    const [retryCount, setRetryCount] = useState(0);
    const [uploadedFileName, setUploadedFileName] = useState(""); // New state for uploaded file name

    // Function to recognize if default resolution value is chosen
    const findDefaultNumber = (arr, numToCheck) => {
        if (!arr || !Array.isArray(arr)) return false;

        for (let i = 0; i < arr.length; i++) {
            const obj = arr[i];
            if (obj.default === true && obj.value === numToCheck) {
                return true;
            }
        }
        return false;
    }
    const handleAddNewFile = file => {
      setNewFile(file);
      if (file && file.name) setUploadedFileName(file.name);
    }
    const handleDayFirstCheckBox = () => {
        setDayFirst(!dayFirst)
    }
    const handleMultiSeriesCheckBox = () => {
        setMultiSeriesFile(!multiSeriesFile)
    }
    const handleOutliersCheckBox = () => {
        setRemoveOutliers(!removeOutliers)
    }

    // Clean up any pending timeouts when component unmounts
    useEffect(() => {
        return () => {
            if (websocketRef.current) {
                websocketRef.current.close();
                websocketRef.current = null;
            }

            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
        };
    }, []);

    const handleUploadFile = () => {
        const data = new FormData();
        data.append('file', newFile);
        
        // Set multiple value based on column detection in file
        // Try to auto-detect if this is a multiple timeseries file
        // by checking if the filename contains keywords or examining file content if needed
        const hasMultipleColumns = newFile && newFile.name.toLowerCase().includes('multi') || 
                                  (multiSeriesFile || format === 'short');
        
        data.append('multiple', hasMultipleColumns);
        data.append('format', format);
        
        // Log what we're sending
        console.log('Uploading file with settings:', {
            fileName: newFile.name,
            multiple: hasMultipleColumns,
            format: format
        });
        
        setUploadStatus('Starting upload...');
        setLoading(true);
        setNewFileSuccess(false);
        setNewFileFailure(false);
        setUploadProgress(0);
        setRetryCount(0);
        
        // Store current task status details for display
        setTaskStatusDetails([{
            time: new Date().toLocaleTimeString(),
            message: 'Starting file upload...',
            type: 'info'
        }]);
        
        // Use the celery endpoint that returns a task_id
        axiosInstance.post('/upload/uploadCSVfile_celery', data, {
            headers: {
                "Content-Type": "multipart/form-data",
                "Authorization": `Bearer ${keycloak.token || localStorage.getItem('virtoToken')}`
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
                setUploadStatus(`Uploading: ${percentCompleted}%`);
                
                // Add upload progress status
                if (percentCompleted % 25 === 0 || percentCompleted === 100) {
                    addTaskStatusDetail(`Upload progress: ${percentCompleted}%`, 'info');
                }
            }
        })
        .then(response => {
            console.log('Upload initiated, response:', response.data);
            setUploadStatus('File uploaded. Processing...');
            addTaskStatusDetail('File uploaded. Starting validation process...', 'info');
            
            if (response.data && response.data.task_id) {
                const taskId = response.data.task_id;
                connectWebSocket(taskId);
            } else {
                setUploadStatus('Invalid response from server');
                setNewFileFailure(true);
                setLoading(false);
                addTaskStatusDetail('Invalid response from server', 'error');
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            error.response?.status === 415 && setErrorMessage(error.response.data.detail);
            const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
            setUploadStatus('Upload failed: ' + errorMsg);
            setNewFileFailure(true);
            setLoading(false);
            addTaskStatusDetail(`Upload failed: ${errorMsg}`, 'error');
        });
    };

    // Helper function to add task status details
    const addTaskStatusDetail = (message, type = 'info') => {
        setTaskStatusDetails(prev => [
            ...prev, 
            {
                time: new Date().toLocaleTimeString(),
                message,
                type
            }
        ]);
    };

    const connectWebSocket = (taskId) => {
        // Close existing WebSocket if any
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }
        
        setUploadStatus('Connecting to server...');
        addTaskStatusDetail('Connecting to server for file validation...', 'info');
        
        // Get the token for authentication
        const token = keycloak.token || localStorage.getItem('virtoToken');
        
        // Create WebSocket with callbacks
        const ws = createTaskWebSocket(taskId, token, {
            onOpen: () => {
                setUploadStatus('Connected to server. Monitoring progress...');
                addTaskStatusDetail('WebSocket connection established', 'success');
                setRetryCount(0); // Reset retry count on successful connection
            },
            onMessage: (data) => {
                console.log('WebSocket data received:', data);
                
                if (data.status === 'Task is in progress') {
                    // Use the new 'progress' field directly if present, else calculate from steps
                    let progress = (typeof data.progress === 'number' && data.progress > 0)
                        ? data.progress
                        : (typeof data.current === 'number' && typeof data.total === 'number' && data.total > 0)
                            ? Math.round((data.current / data.total) * 100)
                            : 0;
                    setUploadProgress(progress);

                    // Compose a more informative status message
                    let statusMsg = `Processing: ${progress}%`;
                    if (typeof data.current === 'number' && typeof data.total === 'number') {
                        statusMsg += ` (Step ${data.current} of ${data.total})`;
                    }
                    if (data.message) {
                        statusMsg += ` - ${data.message}`;
                    }
                    setUploadStatus(statusMsg);

                    // Optionally, add to task status details as before
                    if (data.message) {
                        addTaskStatusDetail(`Processing (${progress}%): ${data.message}`, 'info');
                    } else if (progress % 25 === 0 || progress === 100) {
                        addTaskStatusDetail(`Processing: ${progress}% complete`, 'info');
                    }
                } else if (data.status === 'Task completed') {
                    setUploadStatus('File processed successfully');
                    setUploadProgress(100);
                    addTaskStatusDetail('File validation completed successfully', 'success');
                    handleTaskCompletion(data.result);
                    
                    // Success notification using Alert component instead of toast
                    setNewFileSuccess(true);
                    setUploadSuccess(true);
                    
                    // Close WebSocket after successful completion
                    if (websocketRef.current) {
                        websocketRef.current.close();
                        websocketRef.current = null;
                    }
                } else if (data.status === 'Task failed') {
                    const errorMsg = data.error || 'Unknown error';
                    setUploadStatus('File processing failed: ' + errorMsg);
                    setNewFileFailure(true);
                    setLoading(false);
                    addTaskStatusDetail(`File validation failed: ${errorMsg}`, 'error');
                    
                    // Close WebSocket
                    if (websocketRef.current) {
                        websocketRef.current.close();
                        websocketRef.current = null;
                    }
                }
            },
            onError: (error) => {
                console.error('WebSocket error:', error);
                addTaskStatusDetail(`WebSocket error: ${error.message || 'Connection failed'}`, 'error');
                
                // Try to reconnect a few times before giving up
                if (retryCount < maxRetries) {
                    const newRetryCount = retryCount + 1;
                    setRetryCount(newRetryCount);
                    setUploadStatus(`WebSocket connection failed. Retrying (${newRetryCount}/${maxRetries})...`);
                    addTaskStatusDetail(`Retrying connection (attempt ${newRetryCount}/${maxRetries})...`, 'warning');
                    
                    // Exponential backoff for retry
                    const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 10000);
                    
                    retryTimeoutRef.current = setTimeout(() => {
                        connectWebSocket(taskId);
                    }, retryDelay);
                } else {
                    setUploadStatus('WebSocket connection failed after multiple attempts. Please try again later.');
                    setNewFileFailure(true);
                    setLoading(false);
                    addTaskStatusDetail('WebSocket connection failed after multiple attempts', 'error');
                }
            },
            onClose: (event) => {
                console.log('WebSocket connection closed', event);
                
                // If closed unexpectedly (not clean) and we're not done, try to reconnect
                if (event.code !== 1000 && !event.wasClean && uploadStatus !== 'File processed successfully' && 
                    !uploadStatus.includes('failed') && retryCount < maxRetries) {
                    
                    const newRetryCount = retryCount + 1;
                    setRetryCount(newRetryCount);
                    setUploadStatus(`WebSocket connection closed unexpectedly. Reconnecting (${newRetryCount}/${maxRetries})...`);
                    addTaskStatusDetail(`Connection closed unexpectedly. Reconnecting (attempt ${newRetryCount}/${maxRetries})...`, 'warning');
                    
                    // Exponential backoff for retry
                    const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 10000);
                    
                    retryTimeoutRef.current = setTimeout(() => {
                        connectWebSocket(taskId);
                    }, retryDelay);
                } else if (uploadStatus !== 'File processed successfully' && !uploadStatus.includes('failed')) {
                    setUploadStatus('Connection to server closed. The upload may still be processing in the background.');
                    addTaskStatusDetail('Connection closed. Process may continue in the background.', 'info');
                }
            }
        });
        
        // Store WebSocket reference
        websocketRef.current = ws;
        
        // Check if WebSocket failed immediately
        if (!ws) {
            if (retryCount < maxRetries) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                setUploadStatus(`Could not establish WebSocket connection. Retrying (${newRetryCount}/${maxRetries})...`);
                addTaskStatusDetail(`Failed to establish connection. Retrying (attempt ${newRetryCount}/${maxRetries})...`, 'warning');
                
                // Exponential backoff for retry
                const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 10000);
                
                retryTimeoutRef.current = setTimeout(() => {
                    connectWebSocket(taskId);
                }, retryDelay);
            } else {
                setUploadStatus('Could not establish WebSocket connection after multiple attempts. Please try again later.');
                setNewFileFailure(true);
                setLoading(false);
                addTaskStatusDetail('Failed to establish connection after multiple attempts', 'error');
            }
        }
    };

    // Helper function to handle task completion
    const handleTaskCompletion = (result) => {
        if (!result) {
            setUploadStatus('Received empty result from server');
            setNewFileFailure(true);
            setLoading(false);
            return;
        }
        
        try {
            // Make sure dates are properly parsed
            const startDate = new Date(result.dataset_start);
            const endDate = new Date(result.dataset_end);
            
            setMinDate(startDate);
            setMaxDate(endDate);
            setMaxDateTestStart(endDate);
            setResolutions(result.allowed_resolutions || []);
            setSeriesUri(result.fname);
            setNewFileSuccess(true);
            setUploadSuccess(true);
            setNewFile(null);
            setLoading(false);
            setTsUsedId(result.ts_used_id);
            setEvaluatedAllTs(result.evaluate_all_ts);
            
            // Set default resolution if available
            if (result.allowed_resolutions && result.allowed_resolutions.length > 0) {
                setExperimentResolution(result.allowed_resolutions[0].value);
            }
            
            // Initialize date fields with reasonable defaults
            // Defensive: ensure allowed_validation_start is a valid date
            let validationStart = result.allowed_validation_start;
            if (validationStart && typeof validationStart === 'string' && !isNaN(Date.parse(validationStart))) {
                validationStart = new Date(validationStart);
            } else if (validationStart instanceof Date) {
                // already a Date
            } else {
                validationStart = startDate;
            }
            setDateVal(validationStart);
            // Set test date to 10 days after validation start or halfway between start and end if less than 20 days total
            const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
            const testDateOffset = daysDiff < 20 ? Math.floor(daysDiff / 2) : 10;
            setDateTest(
              new Date(
                validationStart.getTime() + testDateOffset * 24 * 60 * 60 * 1000
              )
            );
            setDateEnd(endDate);
        } catch (error) {
            console.error('Error processing task result:', error);
            setUploadStatus('Error processing server response: ' + error.message);
            setNewFileFailure(true);
            setLoading(false);
        }
    };

    const handleClearNewFile = () => {
        // Cancel any pending WebSocket connections
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        // Clear any pending timeouts
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }

        // Reset state
        resetState();
    };

    const handleChange = (event, newValue) => {
        setUcChosen('')
        setValue(newValue);
        setUcConfirmation(false)
        resetState()
    };

    const handleRadioButton = event => {
        setAggregationMethod(event.target.value)
    }

    useEffect(() => {
        setDefaultResolutionChosen(findDefaultNumber(resolutions, experimentResolution))
    }, [experimentResolution])

    // Code for "CHOOSE FROM UPLOADED FILES" option
    const [ucConfirmation, setUcConfirmation] = useState(false)

    const handleChangeUseCase = (event) => {
        setUcChosen(event.target.value);
    };

    useEffect(() => {
        if (ucChosen !== '') {
            setLoading(true)
            resetState()
        }
        // ucChosen !== '' && resetState()
        let url = ''

        if (ucChosen === 'uc2') {
            url = '/db_integration/retrieve_dataset/uc2'
        }

        if (ucChosen === 'uc6') {
            url = '/db_integration/retrieve_dataset/uc6?series_name=W6 positive_active'
        }

        ucChosen !== '' && axios.get(url)
            .then(response => {
                setSeriesUri(response.data.fname)
                setLoading(false)
                console.log(response.data)
                setUcConfirmation(true)

                setResolutions(response.data.allowed_resolutions)
                setMultiSeriesFile(response.data.multiple)

                setExperimentResolution(response.data.allowed_resolutions[0].value)

                // Set MIN/MAX values for date fields
                setMinDate(new Date(response.data.allowed_validation_start))
                setMaxDate(new Date(response.data.dataset_end))
                setMaxDateTestStart(new Date(response.data.dataset_end))

                // Re-initialize date fields
                setDateVal(new Date(response.data.allowed_validation_start))
                setDateTest(new Date(new Date(response.data.allowed_validation_start).getTime() + (10 * 24 * 60 * 60 * 1000)))
                setDateEnd(new Date(response.data.dataset_end))
            })
    }, [ucChosen])

    const handleChangeFormat = event => {
        setFormat(event.target.value);
    };

    return (
      <>
        <Container
          maxWidth={"xl"}
          sx={{ my: 5 }}
          data-testid={"codelessForecastDatasetConfiguration"}
        >
          <Typography variant={"h4"} fontWeight={"bold"} sx={{ mb: 3 }}>
            Dataset Configuration
          </Typography>

          <Box sx={{ width: "100%" }}>
            <TabPanel value={value} index={0}>
              <Grid
                container
                spacing={2}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Grid
                  item
                  xs={12}
                  md={4}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <input
                    accept=".csv"
                    style={{ display: "none" }}
                    id="raised-button-file"
                    type="file"
                    disabled={executionLoading}
                    onChange={(event) =>
                      handleAddNewFile(event.target.files[0])
                    }
                  />
                  <label
                    htmlFor="raised-button-file"
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      component="span"
                      startIcon={
                        <UploadFileOutlinedIcon
                          fontSize="large"
                          sx={{ color: "#fff" }}
                        />
                      }
                      sx={{
                        fontWeight: "bold",
                        textTransform: "none",
                        fontSize: "1.1rem",
                        px: 3,
                        py: 1.5,
                        backgroundColor: "#0047BB",
                        "&:hover": { backgroundColor: "#003a99" },
                        borderRadius: 2,
                        minWidth: 220,
                        textAlign: "left",
                        display: "flex",
                        justifyContent: "flex-start",
                        width: "100%",
                      }}
                      disabled={executionLoading || uploadStatus}
                    >
                      Upload your .csv file
                    </Button>
                    <Tooltip
                      title={
                        <span>
                          For more info about the permitted file format check
                          out our{" "}
                          <a
                            href="https://github.com/epu-ntua/DeepTSF/wiki/Input-format"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "#fff",
                              textDecoration: "underline",
                            }}
                          >
                            documentation
                          </a>
                        </span>
                      }
                      arrow
                      placement="right"
                    >
                      <IconButton size="small" sx={{ ml: 1 }}>
                        <InfoOutlinedIcon fontSize="small" color="primary" />
                      </IconButton>
                    </Tooltip>
                  </label>
                </Grid>
                <Grid item xs={12} md={8}>
                  {(newFile || uploadedFileName) && (
                    <Grid
                      container
                      display={"flex"}
                      flexDirection={"row"}
                      justifyContent={"center"}
                    >
                      <Typography
                        variant={"h5"}
                        color={"inherit"}
                        align={"right"}
                        component={"span"}
                        sx={{ width: "100%" }}
                      >
                        Chosen file:
                        <Typography
                          fontWeight={"bold"}
                          component={"span"}
                          color={"secondary"}
                        >
                          {" "}
                          {newFile?.name || uploadedFileName}
                        </Typography>
                      </Typography>
                    </Grid>
                  )}
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", justifyContent: "end", mb: 2 }}
                  >
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={executionLoading}
                            checked={dayFirst}
                            onChange={handleDayFirstCheckBox}
                            sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                          />
                        }
                        label={
                          <Typography
                            sx={{ ml: "auto" }}
                            component={"span"}
                            variant={"h6"}
                          >
                            Day First
                          </Typography>
                        }
                      />
                    </FormGroup>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Checkbox
                            disabled={executionLoading}
                            checked={multiSeriesFile}
                            onChange={handleMultiSeriesCheckBox}
                            sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                          />
                        }
                        label={
                          <Typography
                            sx={{ ml: "auto" }}
                            component={"span"}
                            variant={"h6"}
                          >
                            Multi Series file
                          </Typography>
                        }
                      />
                    </FormGroup>
                    <FormControl sx={{ mb: 5 }}>
                      <Typography variant={"h6"}>Timeseries Format</Typography>
                      <RadioGroup
                        row
                        value={format}
                        onChange={handleChangeFormat}
                      >
                        <FormControlLabel
                          value="long"
                          control={<Radio />}
                          label={<Typography variant="body1">Long</Typography>}
                          labelPlacement="end"
                        />
                        <FormControlLabel
                          value="short"
                          control={<Radio />}
                          label={<Typography variant="body1">Short</Typography>}
                          labelPlacement="end"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center", justifyContent: "end", mb: 2 }}
                  >
                    {newFile && !uploadSuccess && !uploadStatus && (
                      <Button
                        variant={"contained"}
                        component={"span"}
                        size={"large"}
                        color={"primary"}
                        sx={{ ml: "auto" }}
                        disabled={
                          executionLoading ||
                          (uploadStatus && !uploadSuccess && !newFileFailure)
                        }
                        endIcon={<CloudUploadIcon />}
                        onClick={handleUploadFile}
                      >
                        Upload file
                      </Button>
                    )}

                    {/* Show upload progress and status above the progress bar, without overlay or extra status log */}
                    {uploadStatus && !uploadSuccess && !newFileFailure && (
                      <Box sx={{ width: "100%", mb: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {uploadProgress < 100 && (
                            <CircularProgress size={24} sx={{ mr: 2 }} />
                          )}
                          {uploadProgress === 100 && (
                            <CloudUploadIcon color="success" sx={{ mr: 2 }} />
                          )}
                          <Box sx={{ width: "100%" }}>
                            {/* Show the latest backend message as-is above the progress bar */}
                            {(() => {
                              // Find the latest message (no filtering or trimming)
                              const reversed = [...taskStatusDetails].reverse();
                              // Find the latest error message if any
                              const errorMsgObj = reversed.find(
                                (d) => d.type === 'error' && d.message && d.message !== 'Connection closed. Process may continue in the background.'
                              );
                              // Find the latest info/warning message
                              const validMsgObj = reversed.find(
                                (d) => typeof d.message === "string" && d.type !== 'error'
                              );
                              // If error, show error in red, else show normal
                              if (errorMsgObj) {
                                return (
                                  <Typography
                                    variant="subtitle1"
                                    sx={{ color: 'error.main', fontWeight: 'bold' }}
                                  >
                                    {errorMsgObj.message}
                                  </Typography>
                                );
                              }
                              const msg = validMsgObj ? validMsgObj.message : uploadStatus;
                              // Try to get progress from backend, else calculate from steps if available
                              let percent = uploadProgress;
                              // Find the latest backend status object with current/total
                              const latestStepObj = reversed.find(
                                (d) => typeof d.current === "number" && typeof d.total === "number"
                              );
                              if (
                                (percent === 0 ||
                                  percent === undefined ||
                                  percent === null) &&
                                latestStepObj &&
                                latestStepObj.total > 0
                              ) {
                                percent = Math.round(
                                  (latestStepObj.current /
                                    latestStepObj.total) *
                                    100
                                );
                              }

                              return (
                                <>
                                  <Typography
                                    variant="subtitle1"
                                    color="primary"
                                    fontWeight="medium"
                                  >
                                    {msg}
                                  </Typography>
                                  <LinearProgress
                                    variant={
                                      percent > 0
                                        ? "determinate"
                                        : "indeterminate"
                                    }
                                    value={percent}
                                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                                  />
                                  <Typography
                                    variant="h6"
                                    color="primary"
                                    sx={{
                                      ml: 2,
                                      minWidth: 45,
                                      textAlign: "right",
                                    }}
                                  >
                                    {percent}%
                                  </Typography>
                                </>
                              );
                            })()}
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {(uploadSuccess || newFileFailure || (taskStatusDetails.some(d => d.type === 'error'))) && (
                      <Button
                        variant={"contained"}
                        component={"span"}
                        size={"medium"}
                        color={"error"}
                        endIcon={<BackspaceOutlinedIcon />}
                        sx={{ ml: "auto" }}
                        onClick={() => window.location.reload()}
                      >
                        Clear
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </TabPanel>

            {/* CHOOSE FROM UPLOADED FILES option*/}
            <TabPanel value={value} index={1}>
              <Grid
                container
                spacing={2}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Grid item xs={12} md={8}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center" }}
                  >
                    <DocumentScannerIcon
                      fontSize="large"
                      sx={{
                        width: "60px",
                        height: "60px",
                        color: "#0047BB",
                        ml: 2,
                        my: 1,
                      }}
                    />
                    <Typography
                      variant={"h5"}
                      color={"inherit"}
                      sx={{ width: "100%" }}
                    >
                      Choose a Use Case from the dropdown
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Choose a Use Case
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      label="Choose a Use Case"
                      onChange={handleChangeUseCase}
                    >
                      <MenuItem value={"uc2"}>Use Case 2</MenuItem>
                      <MenuItem value={"uc6"}>Use Case 6</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>

          {ucChosen === "uc6" && (
            <Grid
              container
              spacing={2}
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Grid item xs={12} md={8}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center" }}
                >
                  <AppRegistrationIcon
                    fontSize="large"
                    sx={{
                      width: "60px",
                      height: "60px",
                      color: "#0047BB",
                      ml: 2,
                      my: 1,
                    }}
                  />
                  <Typography
                    variant={"h5"}
                    color={"inherit"}
                    sx={{ width: "100%" }}
                  >
                    Select Timeseries to train your model
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                {ucConfirmation && (
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">
                      Select Timeseries ID
                    </InputLabel>
                    <Select
                      disabled={executionLoading}
                      fullWidth
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={tsUsedID}
                      label="Select Timeseries ID"
                      onChange={(e) => setTsUsedId(e.target.value)}
                    >
                      <MenuItem value={"W6 positive_reactive"}>
                        W6 positive_reactive
                      </MenuItem>
                      <MenuItem value={"W6 positive_active"}>
                        W6 positive_active
                      </MenuItem>
                      <MenuItem value={"W4 positive_reactive"}>
                        W4 positive_reactive
                      </MenuItem>
                      <MenuItem value={"W4 positive_active"}>
                        W4 positive_active
                      </MenuItem>
                    </Select>
                  </FormControl>
                )}
                {!uploadSuccess && value === 0 && (
                  <Alert severity="warning">
                    Upload a file first to see the available resolutions!
                  </Alert>
                )}
                {!ucConfirmation && value === 1 && (
                  <Alert severity="warning">
                    Wait until the file has been validated.
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}

          <Grid
            container
            spacing={2}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <DataThresholdingIcon
                  fontSize="large"
                  sx={{
                    width: "60px",
                    height: "60px",
                    color: "#0047BB",
                    ml: 2,
                    my: 1,
                  }}
                />
                <Typography
                  variant={"h5"}
                  color={"inherit"}
                  sx={{ width: "100%" }}
                >
                  Timeseries Resolution
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              {(uploadSuccess || ucConfirmation) && (
                <FormControl fullWidth>
                  <InputLabel id="demo-simple-select-label">
                    Dataset Resolution
                  </InputLabel>
                  <Select
                    disabled={executionLoading}
                    fullWidth
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={experimentResolution}
                    label="Dataset Resolution"
                    onChange={(e) => setExperimentResolution(e.target.value)}
                  >
                    {resolutions?.map((resolution) => (
                      <MenuItem
                        key={resolution.value}
                        value={resolution.value.toString()}
                      >
                        {resolution.value +
                          `${
                            findDefaultNumber(resolutions, resolution.value)
                              ? " (Current)"
                              : ""
                          }`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {!uploadSuccess && value === 0 && (
                <Alert severity="warning">
                  Upload a file first to see the available resolutions!
                </Alert>
              )}
              {!ucConfirmation && value === 1 && (
                <Alert severity="warning">
                  Upload select a Use Case first to see the available
                  resolutions!
                </Alert>
              )}
            </Grid>
          </Grid>

          {!defaultResolutionChosen && experimentResolution && (
            <Grid
              container
              spacing={2}
              display={"flex"}
              justifyContent={"center"}
              alignItems={"center"}
            >
              <Grid item xs={12} md={4}>
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{ alignItems: "center" }}
                >
                  <SchemaIcon
                    fontSize="large"
                    sx={{
                      width: "60px",
                      height: "60px",
                      color: "#0047BB",
                      ml: 2,
                      my: 1,
                    }}
                  />
                  <Typography
                    variant={"h5"}
                    color={"inherit"}
                    sx={{ width: "100%" }}
                  >
                    Select Aggregation Method
                  </Typography>
                </Stack>
              </Grid>
              <Grid
                item
                xs={12}
                md={8}
                sx={{
                  display: "flex",
                  justifyContent: "end",
                  alignItems: "end",
                }}
              >
                <FormControl sx={{ ml: "auto" }}>
                  <RadioGroup
                    row
                    aria-labelledby="demo-row-radio-buttons-group-label"
                    name="row-radio-buttons-group"
                    value={aggregationMethod}
                    onChange={handleRadioButton}
                  >
                    <FormControlLabel
                      sx={{ ml: "auto" }}
                      value="averaging"
                      control={<Radio />}
                      label={
                        <Typography
                          sx={{ ml: "auto" }}
                          component={"span"}
                          variant={"h6"}
                        >
                          Averaging
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="summation"
                      control={<Radio />}
                      label={
                        <Typography
                          sx={{ ml: "auto" }}
                          component={"span"}
                          variant={"h6"}
                        >
                          Summation
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="downsampling"
                      control={<Radio />}
                      label={
                        <Typography
                          sx={{ ml: "auto" }}
                          component={"span"}
                          variant={"h6"}
                        >
                          Downsampling
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
            </Grid>
          )}

          <Grid
            container
            spacing={2}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Grid item xs={12} md={10}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <SettingsSuggestIcon
                  fontSize="large"
                  sx={{
                    width: "60px",
                    height: "60px",
                    color: "#0047BB",
                    ml: 2,
                    my: 1,
                  }}
                />
                <Typography
                  variant={"h5"}
                  color={"inherit"}
                  sx={{ width: "100%" }}
                >
                  Outliers detection
                  <Tooltip
                    title={
                      <span>
                        For more info about our outlier detection method, check
                        out our{" "}
                        <a
                          href="https://github.com/epu-ntua/DeepTSF/wiki/DeepTSF-workflow-orchestration-interface-(advanced-users)#data-pre-processing"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#fff", textDecoration: "underline" }}
                        >
                          documentation
                        </a>
                      </span>
                    }
                    arrow
                    placement="right"
                  >
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoOutlinedIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormGroup>
                <FormControlLabel
                  labelPlacement="start"
                  control={
                    <Checkbox
                      disabled={executionLoading}
                      checked={removeOutliers}
                      onChange={handleOutliersCheckBox}
                      sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                    />
                  }
                  label={
                    <Typography
                      sx={{ ml: "auto" }}
                      component={"span"}
                      variant={"h6"}
                    >
                      Remove outliers
                    </Typography>
                  }
                />
              </FormGroup>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <AutoGraphIcon
                  fontSize="large"
                  sx={{
                    width: "60px",
                    height: "60px",
                    color: "#0047BB",
                    ml: 2,
                    my: 1,
                  }}
                />
                <Typography
                  variant={"h5"}
                  color={"inherit"}
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  Ιnterpolation Method
                  <Tooltip
                    title={
                      <span>
                        For more info about the supported imputation methods,
                        check out our{" "}
                        <a
                          href="https://github.com/epu-ntua/DeepTSF/wiki/Forecasting-workflow#data-pre-processing"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#fff", textDecoration: "underline" }}
                        >
                          documentation
                        </a>
                      </span>
                    }
                    arrow
                    placement="right"
                  >
                    <IconButton size="small" sx={{ ml: 1 }}>
                      <InfoOutlinedIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Tooltip>
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="demo-simple-select-label">
                  Choose the interpolation method
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={imputationMethod}
                  disabled={executionLoading}
                  label="Choose the interpolation method"
                  onChange={(e) => setImputationMethod(e.target.value)}
                >
                  <MenuItem value={"linear"}>Linear</MenuItem>
                  <MenuItem value={"time"}>Time</MenuItem>
                  <MenuItem value={"pad"}>Pad</MenuItem>
                  <MenuItem value={"nearest"}>Nearest</MenuItem>
                  <MenuItem value={"polynomial"}>Polynomial</MenuItem>
                  <MenuItem value={"spline"}>Spline</MenuItem>
                  <MenuItem value={"peppanen"}>Peppanen</MenuItem>
                  <MenuItem value={"krogh"}>Krogh</MenuItem>
                  <MenuItem value={"piecewise_polynomial"}>
                    Piecewise Polynomial
                  </MenuItem>
                  <MenuItem value={"spline"}>Spline</MenuItem>
                  <MenuItem value={"pchip"}>PCHIP</MenuItem>
                  {!multiSeriesFile && (
                    <MenuItem value={"akima"}>Akima</MenuItem>
                  )}
                  <MenuItem value={"cubicspline"}>Cubic Spline</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid
            container
            spacing={2}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <DateRangeIcon
                  fontSize="large"
                  sx={{
                    width: "60px",
                    height: "60px",
                    color: "#0047BB",
                    ml: 2,
                    my: 1,
                  }}
                />
                <Typography
                  variant={"h5"}
                  color={"inherit"}
                  sx={{ width: "100%" }}
                >
                  Dataset Split
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Grid
                container
                spacing={2}
                display={"flex"}
                justifyContent={"center"}
                alignItems={"center"}
              >
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DesktopDatePicker
                      disabled={
                        executionLoading || (!uploadSuccess && !ucConfirmation)
                      }
                      inputFormat="dd/MM/yyyy"
                      label="Validation Start Date"
                      value={dateVal}
                      minDate={minDate ? minDate : void 0}
                      maxDate={maxDate ? maxDate : void 0}
                      onChange={(newValue) => {
                        setDateVal(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField fullWidth {...params} />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DesktopDatePicker
                      disabled={
                        executionLoading || (!uploadSuccess && !ucConfirmation)
                      }
                      inputFormat="dd/MM/yyyy"
                      label="Test Start Date"
                      value={dateTest}
                      minDate={minDateTestStart ? minDateTestStart : void 0}
                      maxDate={maxDateTestStart ? maxDateTestStart : void 0}
                      onChange={(newValue) => {
                        setDateTest(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField fullWidth {...params} helperText={null} />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} md={4}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DesktopDatePicker
                      disabled={
                        executionLoading || (!uploadSuccess && !ucConfirmation)
                      }
                      inputFormat="dd/MM/yyyy"
                      label="Test End Date"
                      value={dateEnd}
                      minDate={minDateEndStart ? minDateEndStart : void 0}
                      maxDate={maxDate ? maxDate : void 0}
                      onChange={(newValue) => {
                        setDateEnd(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField fullWidth {...params} helperText={null} />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </>
    );
}

export default DatasetConfiguration;
