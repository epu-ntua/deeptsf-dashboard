// Foundation forecasting models available for inference from the dashboard.
// Adding another model is a matter of adding an entry here.

export const foundationModels = [
    {
        id: 'chronos2',
        name: 'Chronos-2',
        description: 'Amazon Chronos-2 zero-shot forecasting model, hosted by ICCS. ' +
            'Runs inference directly on your uploaded series, no training required.',
        docsUrl: 'https://github.com/epu-ntua/DeepTSF/wiki/Time-series-foundation-models',
        defaults: {
            timestepsAhead: 24,
            batchSize: 1,
            crossLearning: false,
            quantileLevels: '0.1,0.5,0.9',
        },
    },
]

export const getFoundationModel = id => foundationModels.find(model => model.id === id)
