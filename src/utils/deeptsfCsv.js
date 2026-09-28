// Helpers for reading and writing DeepTSF-format CSV files on the client.
//
// The single time series format expected by DeepTSF (and by the Chronos-2
// /forecast_file endpoint) is a Datetime index column plus a single 'Value'
// column, chronologically ordered with no duplicate datetimes:
//
//     Datetime,Value
//     2015-04-09 00:00:00,5248.0
//     2015-04-09 01:00:00,5109.0
//
// See https://github.com/epu-ntua/DeepTSF/wiki/Input-format

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/

// The backend reads the file with pandas' sep=None sniffer, so accept the same
// separators it would detect instead of assuming a comma.
const detectSeparator = headerLine => {
    const candidates = [',', ';', '\t', '|']
    let best = ','
    let bestCount = 0

    candidates.forEach(candidate => {
        const count = headerLine.split(candidate).length - 1
        if (count > bestCount) {
            best = candidate
            bestCount = count
        }
    })

    return best
}

const splitLines = text => text
    .replace(/^﻿/, '') // strip a UTF-8 BOM, Excel adds one on export
    .split(/\r\n|\n|\r/)
    .filter(line => line.trim() !== '')

/**
 * Parse a DeepTSF single time series CSV.
 *
 * @param {string} text raw file contents
 * @returns {{datetimes: string[], values: number[]}}
 * @throws {Error} with a message suitable for showing directly to the user
 */
export const parseSingleSeriesCsv = text => {
    const lines = splitLines(text)

    if (lines.length === 0) {
        throw new Error('The file is empty.')
    }

    const separator = detectSeparator(lines[0])
    const header = lines[0].split(separator).map(cell => cell.trim().replace(/^"|"$/g, ''))

    if (header.length !== 2 || header[0] !== 'Datetime' || header[1] !== 'Value') {
        throw new Error(
            `Expected the header to be exactly "Datetime,Value" but found "${header.join(',')}". ` +
            'A DeepTSF single time series file must have a Datetime index column and a single Value column.'
        )
    }

    const datetimes = []
    const values = []
    const seen = new Set()

    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(separator).map(cell => cell.trim().replace(/^"|"$/g, ''))

        if (cells.length !== 2) {
            throw new Error(`Line ${i + 1} has ${cells.length} columns instead of 2.`)
        }

        const [datetime, rawValue] = cells

        if (!DATETIME_REGEX.test(datetime)) {
            throw new Error(
                `Invalid datetime "${datetime}" on line ${i + 1}. ` +
                'Expected the format YYYY-MM-DD HH:MM:SS or YYYY-MM-DD.'
            )
        }

        // The backend requires every row to use the same datetime format.
        if (i > 1 && (datetime.length !== datetimes[0].length)) {
            throw new Error(
                `Datetime "${datetime}" on line ${i + 1} does not use the same format as the first row ` +
                `("${datetimes[0]}"). All rows must share one datetime format.`
            )
        }

        if (seen.has(datetime)) {
            throw new Error(`Duplicate datetime "${datetime}" on line ${i + 1}.`)
        }

        if (datetimes.length > 0 && datetime <= datetimes[datetimes.length - 1]) {
            throw new Error(
                `Datetime "${datetime}" on line ${i + 1} is not after the previous one ` +
                `("${datetimes[datetimes.length - 1]}"). Datetimes must be in chronological order.`
            )
        }

        const value = Number(rawValue)
        if (rawValue === '' || Number.isNaN(value)) {
            throw new Error(`Value "${rawValue}" on line ${i + 1} is not a number.`)
        }

        seen.add(datetime)
        datetimes.push(datetime)
        values.push(value)
    }

    if (datetimes.length <= 1) {
        throw new Error('The file must contain at least 2 rows of data.')
    }

    return {datetimes, values}
}

// Escape a cell only when it would otherwise break the CSV structure.
const escapeCell = cell => {
    const value = cell === null || cell === undefined ? '' : String(cell)
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * Build CSV text from a header row and an array of row arrays.
 *
 * @param {string[]} headers
 * @param {Array<Array<*>>} rows
 * @returns {string}
 */
export const toCsv = (headers, rows) => [headers, ...rows]
    .map(row => row.map(escapeCell).join(','))
    .join('\n')

/**
 * Trigger a browser download of the given CSV text.
 *
 * @param {string} filename
 * @param {string} csvText
 */
export const downloadCsv = (filename, csvText) => {
    const blob = new Blob([csvText], {type: 'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

/**
 * Read a File object as text.
 *
 * @param {File} file
 * @returns {Promise<string>}
 */
export const readFileAsText = file => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsText(file)
})
