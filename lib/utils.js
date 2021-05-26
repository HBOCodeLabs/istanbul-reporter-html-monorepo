'use strict';
/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const coverage = require('istanbul-lib-coverage');
const { BaseNode, BaseTree } = require('./tree');
const Path = require('./path');

class ReportNode extends BaseNode {
    constructor(path, fileCoverage) {
        super();

        this.path = path;
        this.parent = null;
        this.fileCoverage = fileCoverage;
        this.children = [];
    }

    static createRoot(children) {
        const root = new ReportNode(new Path([]));

        children.forEach(child => {
            root.addChild(child);
        });

        return root;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    asRelative(p) {
        if (p.substring(0, 1) === '/') {
            return p.substring(1);
        }
        return p;
    }

    getQualifiedName() {
        return this.asRelative(this.path.toString());
    }

    getRelativeName() {
        const parent = this.getParent();
        const myPath = this.path;
        let relPath;
        let i;
        const parentPath = parent ? parent.path : new Path([]);
        if (parentPath.ancestorOf(myPath)) {
            relPath = new Path(myPath.elements());
            for (i = 0; i < parentPath.length; i += 1) {
                relPath.shift();
            }
            return this.asRelative(relPath.toString());
        }
        return this.asRelative(this.path.toString());
    }

    getParent() {
        return this.parent;
    }

    getChildren() {
        return this.children;
    }

    isSummary() {
        return !this.fileCoverage;
    }

    getFileCoverage() {
        return this.fileCoverage;
    }

    getCoverageSummary(filesOnly) {
        const cacheProp = `c_${filesOnly ? 'files' : 'full'}`;
        let summary;

        if (Object.prototype.hasOwnProperty.call(this, cacheProp)) {
            return this[cacheProp];
        }

        if (!this.isSummary()) {
            summary = this.getFileCoverage().toSummary();
        } else {
            let count = 0;
            summary = coverage.createCoverageSummary();
            this.getChildren().forEach(child => {
                if (filesOnly && child.isSummary()) {
                    return;
                }
                count += 1;
                summary.merge(child.getCoverageSummary(filesOnly));
            });
            if (count === 0 && filesOnly) {
                summary = null;
            }
        }
        this[cacheProp] = summary;
        return summary;
    }
}

class ReportTree extends BaseTree {
    constructor(root, childPrefix) {
        super(root);

        const maybePrefix = node => {
            if (childPrefix && !node.isRoot()) {
                node.path.unshift(childPrefix);
            }
        };
        this.visit({
            onDetail: maybePrefix,
            onSummary(node) {
                maybePrefix(node);
                node.children.sort((a, b) => {
                    const astr = a.path.toString();
                    const bstr = b.path.toString();
                    return astr < bstr
                        ? -1
                        : astr > bstr
                        ? 1
                        : /* istanbul ignore next */ 0;
                });
            }
        });
    }
}

function findOrCreateParent(parentPath, nodeMap, created = () => {}) {
    let parent = nodeMap[parentPath.toString()];

    if (!parent) {
        parent = new ReportNode(parentPath);
        nodeMap[parentPath.toString()] = parent;
        created(parentPath, parent);
    }

    return parent;
}

module.exports = {
    ReportNode,
    ReportTree,
    findOrCreateParent
};
