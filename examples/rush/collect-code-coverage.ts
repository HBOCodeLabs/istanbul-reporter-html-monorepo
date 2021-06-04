// Copyright (c) WarnerMedia Direct, LLC. All rights reserved. Licensed under the MIT license.
// See the LICENSE file for license information.

// Generic imports
import * as fs from 'fs';

// Istanbul-related imports
import { CoverageMap, CoverageMapData, createCoverageMap } from 'istanbul-lib-coverage';
import { Context, ReportBase, createContext } from 'istanbul-lib-report';
import { create as createReport } from 'istanbul-reports';

// Rush-related imports
import { RushConfiguration } from '@microsoft/rush-lib';

async function collectCodeCoverage() {
    // Get information about rush projects
    const config: RushConfiguration = RushConfiguration.loadFromDefaultLocation();
    const projectFolders: string[] = config.projects.map(project => project.projectFolder);
    const destinationFolder: string = `${config.rushJsonFolder}/common/temp/coverage`;

    // Merge the "coverage-final.json" from each project into one big coverage map
    const coverageMap: CoverageMap = createCoverageMap({});
    for (const projectFolder of projectFolders) {
        try {
            const resultPath = `${projectFolder}/temp/coverage/coverage-final.json`;
            const coverageResult: CoverageMapData = JSON.parse(fs.readFileSync(resultPath, 'utf8')) as CoverageMapData;
            coverageMap.merge(coverageResult);
        } catch (e) {
            if (e.code !== 'ENOENT') {
                throw e;
            }
        }
    }

    // Prepare destination folder and report context
    fs.mkdirSync(destinationFolder, { recursive: true });
    const context: Context = createContext({
      dir: destinationFolder,
      coverageMap: coverageMap
    });

    // Write the html-monorepo report
    const htmlReport: ReportBase = createReport('istanbul-reporter-html-monorepo' as any, {
        reportTitle: 'Acme Corp',
        projects: config.projects.map(project => ({
            name: project.packageName,
            path: project.projectRelativeFolder
        }))
    }) as unknown as ReportBase;
    htmlReport.execute(context);
}

collectCodeCoverage().then(console.log).catch(error => {
    console.error(error);
    process.exitCode = 1;
});
