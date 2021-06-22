import { ReportOptions, HtmlOptions } from 'istanbul-reports';

export declare interface HtmlMonorepoProject {
  name: string;
  path: string;
}

export declare interface HtmlMonorepoOptions extends HtmlOptions {
  reportTitle: string;
  projects: HtmlMonorepoProject[];
  defaultProjectName: string;
}

declare module 'istanbul-reports' {
  interface ReportOptions {
    'istanbul-reporter-html-monorepo': HtmlMonorepoOptions
  }
}
