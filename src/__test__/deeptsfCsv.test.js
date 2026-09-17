import {parseSingleSeriesCsv, toCsv} from "../utils/deeptsfCsv";

const validCsv = [
    'Datetime,Value',
    '2015-04-09 00:00:00,5248.0',
    '2015-04-09 01:00:00,5109.0',
    '2015-04-09 02:00:00,5345.5',
].join('\n');

it('parses a valid DeepTSF single time series', () => {
    const {datetimes, values} = parseSingleSeriesCsv(validCsv);

    expect(datetimes).toEqual(['2015-04-09 00:00:00', '2015-04-09 01:00:00', '2015-04-09 02:00:00']);
    expect(values).toEqual([5248.0, 5109.0, 5345.5]);
});

it('accepts date-only datetimes, a BOM and CRLF line endings', () => {
    const {datetimes, values} = parseSingleSeriesCsv('﻿Datetime,Value\r\n2015-04-09,1.5\r\n2015-04-10,2.5\r\n');

    expect(datetimes).toEqual(['2015-04-09', '2015-04-10']);
    expect(values).toEqual([1.5, 2.5]);
});

it('detects a semicolon separator', () => {
    const {values} = parseSingleSeriesCsv('Datetime;Value\n2015-04-09 00:00:00;1\n2015-04-09 01:00:00;2');

    expect(values).toEqual([1, 2]);
});

it('rejects a wrong header', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Load\n2015-04-09 00:00:00,1\n2015-04-09 01:00:00,2'))
        .toThrow(/Datetime,Value/);
});

it('rejects duplicate datetimes', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Value\n2015-04-09 00:00:00,1\n2015-04-09 00:00:00,2'))
        .toThrow(/Duplicate datetime/);
});

it('rejects datetimes that are not in chronological order', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Value\n2015-04-09 01:00:00,1\n2015-04-09 00:00:00,2'))
        .toThrow(/chronological order/);
});

it('rejects mixed datetime formats', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Value\n2015-04-09,1\n2015-04-10 00:00:00,2'))
        .toThrow(/same format/);
});

it('rejects non numeric values', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Value\n2015-04-09 00:00:00,1\n2015-04-09 01:00:00,abc'))
        .toThrow(/is not a number/);
});

it('rejects a file with a single data row', () => {
    expect(() => parseSingleSeriesCsv('Datetime,Value\n2015-04-09 00:00:00,1'))
        .toThrow(/at least 2 rows/);
});

it('round trips a forecast back into DeepTSF format', () => {
    const forecast = {'2015-07-01 00:00:00': 30976.54, '2015-07-01 01:00:00': 28908.02};
    const csv = toCsv(['Datetime', 'Value'], Object.keys(forecast).map(key => [key, forecast[key]]));

    expect(csv).toBe('Datetime,Value\n2015-07-01 00:00:00,30976.54\n2015-07-01 01:00:00,28908.02');
    expect(parseSingleSeriesCsv(csv).values).toEqual([30976.54, 28908.02]);
});
