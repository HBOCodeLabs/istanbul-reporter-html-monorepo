# istanbul-reporter-html-monorepo

An alternate HTML reporter for istanbul/nyc, intended for multi-project monorepos.

## Installation

```console
npm i -D istanbul-reporter-html-monorepo
```

## Usage

In order to produce a satisfactory output, you should not use this reporter from a command line (for example, by specifying the `-r` option for the nyc command). Instead, it's intended that you construct and execute the reporter from code, where you can
pass in the options required.

Let's say you have a custom monorepo for `Acme Corp`, containing several subfolders with different projects. You've already run your builds and unit tests and generated JSON file coverage for each project. Here's an example of how you would generate HTML monorepo from these coverage files, using a custom script.

```js
const fs = require('fs);
const { CoverageMap, CoverageMapData, createCoverageMap } = require('istanbul-lib-coverage');
const { Context, ReportBase, createContext } = require('istanbul-lib-report');
const createReport = require('istanbul-reports').create;

async function generateMonorepoReport() {
    const reportTitle = 'Acme Corp';
    const projects = [
        {
            name: '@acme/rocket-sled',
            path: 'vehicles/rocket-sled'
        },
        {
            name: '@acme/jet-engine-core',
            path: 'libraries/jet-engine-core'
        },
        // ... etc.
    ];

    // Build a coverage map containing coverage from all projects
    const coverageMap = createCoverageMap({});
    for (let project of projects) {
        const coverageData = JSON.parse(fs.readFileSync(`${project.path}/coverage/coverage-final.json`));
        coverageMap.merge(coverageData);
    }

    // Specify the output folder for the HTML report (in this case, we'll write to the 'coverage' folder
    // in the root of the monorepo).
    const context = createContext({
      dir: 'coverage',
      coverageMap: coverageMap
    });

    // Create and execute the report, passing in the expected options
    const htmlReport = createReport('istanbul-reporter-html-monorepo', {
        reportTitle: reportTitle,
        projects: projects,
        defaultProjectName: false
    });
    htmlReport.execute(context);
}
```

For additional code examples, see the examples folder. (WIP)

## Options

(In addition to the list below, the `html-monorepo` reporter accepts all the options that the standard HTML reporter does.)

### reportTitle

The `reportTitle` option allows you to specify a custom title for the report, displayed in the upper-left hand corner. If missing or undefined, the default `All files` title is used.

### projects

The `projects` option should contain an array of project definitions. Each project definition consists of a `name` and `path` key. Covered source files within the path specified will be considered part of that project, and will be displayed in the summary underneath the corresponding name.

Consider this project definition:

```js
{ name: 'docs-site', path: 'src/sites/docs' }
```

In the summary listing and breadcrumb links, files under this folder path will be displayed under `docs-site` (the project name), instead of `src/sites/docs` (the project path).

In some cases you may prefer to use the project paths instead of the names, or, you like the name but want some path context as well. You can customize the `name` property to achieve the desired result.

```js
// Organize by project, but display only the path
{ name: 'src/sites/docs', path: 'src/sites/docs' }

// Display as name and path
{ name: 'docs-site (src/sites/docs)', path: 'src/sites/docs' }

// Display as path and name
{ name: 'src/sites/docs [docs-site]', path: 'src/sites/docs' }
```

### defaultProjectName

In general, your project list should cover all files that have coverage in your monorepo. If additional files are discovered that don't fall into any of your defined projects, they will be organized under the summary line `Other Files`. You can customize this
default name by providing an alternate string value for `defaultProjectName`.

If you'd rather show these additional source files as "loose" source files in the root of the coverage report, you can disable the default project by specifying `defaultProjectName: false`.

If you want to exclude these files from the report completely, you can use nyc's built-in `--exclude` option in the appropriate project to ensure the files won't get covered. Alternately, you can doctor the combined `coverageMap` in your script and remove
any files you wish to exclude before passing the `coverageMap` to the reporter.
