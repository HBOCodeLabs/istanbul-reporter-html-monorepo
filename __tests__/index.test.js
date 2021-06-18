// Copyright (c) WarnerMedia Direct, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
//
// Copyright 2012-2015, Yahoo Inc.
// Copyrights licensed under the New BSD License. See the accompanying ThirdPartyNotices.txt file for terms.

const fs = require('fs');

const HtmlMonorepoReporter = require('..');

describe('HtmlMonorepoReporter', () => {
    it('can be constructed with no options', () => {
        jest.spyOn(HtmlMonorepoReporter, 'loadOptionsFromConfigFile').mockReturnValue({});

        expect(new HtmlMonorepoReporter({})).toMatchObject({
            projects: [],
            reportTitle: 'All files',
            defaultProjectName: 'Other Files'
        });
    });

    it('can be constructed with options', () => {
        jest.spyOn(HtmlMonorepoReporter, 'loadOptionsFromConfigFile').mockReturnValue({});

        expect(new HtmlMonorepoReporter({
            projects: [
                { name: 'Acme', path: '/acme' }
            ],
            reportTitle: 'Acme Corp',
            defaultProjectName: false
        })).toMatchObject({
            projects: [
                { name: 'Acme', path: 'acme' }
            ],
            reportTitle: 'Acme Corp',
            defaultProjectName: undefined
        });
    });

    it('raises an error if a project is malformed', () => {
        jest.spyOn(HtmlMonorepoReporter, 'loadOptionsFromConfigFile').mockReturnValue({});

        expect(() => new HtmlMonorepoReporter({
            projects: [
                { name: 'Acme' }
            ],
        })).toThrowError("html-monorepo projects entry: missing 'path' key");
    });

    describe('loadOptionsFromConfigFile', () => {
        let $processEnv;

        beforeEach(() => {
            $processEnv = process.env;
            process.env = {};
        });

        afterEach(() => {
            process.env = $processEnv;
        });

        it('returns configuration when istanbul-reporter-options.json exists', () => {
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ reportTitle: 'Cyberdyne Systems' }));
            expect(
                HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toEqual({ reportTitle: 'Cyberdyne Systems' });
            expect(fs.readFileSync).toHaveBeenCalledWith('istanbul-reporter-options.json', 'utf8');
        });

        it('returns empty object when istanbul-reporter-options.json does not exist', () => {
            jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
            });
            expect(
                HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toEqual({});
            expect(fs.readFileSync).toHaveBeenCalledWith('istanbul-reporter-options.json', 'utf8');
        });

        it('raises error if istanbul-reporter-options.json is not valid', () => {
            jest.spyOn(fs, 'readFileSync').mockReturnValue('reportTitle: Cyberdyne Systems');
            expect(
                () => HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toThrow('Attempted to load istanbul-reporter-options.json, but it does not contain valid JSON: Unexpected token r in JSON at position 0');
            expect(fs.readFileSync).toHaveBeenCalledWith('istanbul-reporter-options.json', 'utf8');
        });

        it('returns configuration when ISTANBUL_REPORTER_CONFIG is set', () => {
            process.env.ISTANBUL_REPORTER_CONFIG = 'alternate.json';
            jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify({ reportTitle: 'Cyberdyne Systems' }));
            expect(
                HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toEqual({ reportTitle: 'Cyberdyne Systems' });
            expect(fs.readFileSync).toHaveBeenCalledWith('alternate.json', 'utf8');
        });

        it('raises error if ISTANBUL_REPORTER_CONFIG file does not exist', () => {
            process.env.ISTANBUL_REPORTER_CONFIG = 'alternate.json';
            jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
                throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
            });
            expect(
                () => HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toThrow('Attempted to load alternate.json (specified by ISTANBUL_REPORTER_CONFIG), but it does not exist or does not contain valid JSON: ENOENT');
            expect(fs.readFileSync).toHaveBeenCalledWith('alternate.json', 'utf8');
        });

        it('raises error if ISTANBUL_REPORTER_CONFIG file is not valid', () => {
            process.env.ISTANBUL_REPORTER_CONFIG = 'alternate.json';
            jest.spyOn(fs, 'readFileSync').mockReturnValue('reportTitle: Cyberdyne Systems');
            expect(
                () => HtmlMonorepoReporter.loadOptionsFromConfigFile()
            ).toThrow('Attempted to load alternate.json (specified by ISTANBUL_REPORTER_CONFIG), but it does not exist or does not contain valid JSON: Unexpected token r in JSON at position 0');
            expect(fs.readFileSync).toHaveBeenCalledWith('alternate.json', 'utf8');
        });
    });
});
