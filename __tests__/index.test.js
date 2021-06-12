// Copyright (c) WarnerMedia Direct, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.
//
// Copyright 2012-2015, Yahoo Inc.
// Copyrights licensed under the New BSD License. See the accompanying ThirdPartyNotices.txt file for terms.

const HtmlMonorepoReporter = require('..');

describe('HtmlMonorepoReporter', () => {
    it('can be constructed with no options', () => {
        expect(new HtmlMonorepoReporter({})).toMatchObject({
            projects: [],
            reportTitle: 'All files',
            defaultProjectName: 'Other Files'
        });
    });

    it('can be constructed with options', () => {
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
        expect(() => new HtmlMonorepoReporter({
            projects: [
                { name: 'Acme' }
            ],
        })).toThrowError("html-monorepo projects entry: missing 'name' key");
    });
});
