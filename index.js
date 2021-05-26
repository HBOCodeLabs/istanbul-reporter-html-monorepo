'use strict';
/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const {
    HtmlReporter, headerTemplate, summaryTableHeader, summaryLineTemplate, summaryTableFooter, footerTemplate, emptyClasses,fixPct
} = require('./lib/html-reporter');
const Path = require('./lib/path');
const { ReportNode, ReportTree, findOrCreateParent } = require('./lib/utils');

// Invent a pathname that should never be encountered by an actual build.
const DEFAULT_PLACEHOLDER = '________';

// We can reuse 90% of HtmlReporter, so here we extend it and then replace a few key
// methods, so we can provide our own tree logic and customize a few links.
class HtmlMonorepoReporter extends HtmlReporter {
    constructor(opts) {
        super(opts);
        console.log('constructing');
        console.log(opts);

        this.reportTitle = opts.reportTitle || 'All files';
        this.projects = opts.projects || [];
        this.defaultProjectName = opts.defaultProjectName === false
            ? undefined
            : (opts.defaultProjectName || 'Other Files');
    }

    // Override ReportBase's `execute`, so we can insert a custom method for
    // building the summary node tree.
    execute(context) {
        return this.getTree(
            context._summarizerFactory._initialList,
            context._summarizerFactory._commonParent,
            this.projects,
            this.defaultProjectName
        ).visit(this, context);
    }

    // Override `getTree`, using our custom implementation.
    getTree(initialList, commonParent, projects, defaultProjectName) {
        const nodeMap = Object.create(null);
        const topPaths = [];
        const defaultNode = defaultProjectName ? new ReportNode(new Path(DEFAULT_PLACEHOLDER)) : undefined;
        let defaultNodeAdded = false;

        initialList.forEach(o => {
            const node = new ReportNode(o.path, o.fileCoverage);
            const project = projects.find(project => o.path.toString().startsWith(project.path));
            if (project ) {
                const parent = findOrCreateParent(
                    new Path(project.path),
                    nodeMap,
                    (parentPath, parent) => {
                        topPaths.push(parent);
                    }
                );
                parent.addChild(node);
            } else if (defaultNode) {
                defaultNode.addChild(node);
                if (!defaultNodeAdded) {
                    defaultNodeAdded = true;
                    topPaths.push(defaultNode);
                }
            } else {
                topPaths.push(node);
            }
        });

        return new ReportTree(ReportNode.createRoot(topPaths));
    }

    getDisplayName(node) {
        if (node.path.toString() === DEFAULT_PLACEHOLDER) {
            return this.defaultProjectName;
        }

        const name = node.getRelativeName() || this.reportTitle;
        const project = this.projects.find(project => project.path === node.path.toString());
        return project ? project.name : name;
    }

    getBreadcrumbHtml(node) {
        let parent = node.getParent();
        const nodePath = [];

        while (parent) {
            nodePath.push(parent);
            parent = parent.getParent();
        }

        const linkPath = nodePath.map(ancestor => {
            const target = this.linkMapper.relativePath(node, ancestor);
            return '<a href="' + target + '">' + this.getDisplayName(ancestor) + '</a>';
        });

        linkPath.reverse();
        return linkPath.length > 0
            ? linkPath.join(' / ') + ' ' + this.getDisplayName(node)
            : this.reportTitle;
    }

    onSummary(node, context) {
        const linkMapper = this.linkMapper;
        const templateData = this.getTemplateData();
        const children = node.getChildren();
        const skipEmpty = this.skipEmpty;

        this.fillTemplate(node, templateData, context);
        const cw = this.getWriter(context).writeFile(linkMapper.getPath(node));
        cw.write(headerTemplate(templateData));
        cw.write(summaryTableHeader);
        children.forEach(child => {
            const metrics = child.getCoverageSummary();
            const isEmpty = metrics.isEmpty();
            if (skipEmpty && isEmpty) {
                return;
            }
            const reportClasses = isEmpty
                ? emptyClasses
                : {
                      statements: context.classForPercent(
                          'statements',
                          metrics.statements.pct
                      ),
                      lines: context.classForPercent(
                          'lines',
                          metrics.lines.pct
                      ),
                      functions: context.classForPercent(
                          'functions',
                          metrics.functions.pct
                      ),
                      branches: context.classForPercent(
                          'branches',
                          metrics.branches.pct
                      )
                  };
            const data = {
                metrics: isEmpty ? fixPct(metrics) : metrics,
                reportClasses,
                file: this.getDisplayName(child),
                output: linkMapper.relativePath(node, child)
            };
            cw.write(summaryLineTemplate(data) + '\n');
        });
        cw.write(summaryTableFooter);
        cw.write(footerTemplate(templateData));
        cw.close();
    }
}

module.exports = HtmlMonorepoReporter;
