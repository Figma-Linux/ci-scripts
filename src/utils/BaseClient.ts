import { DownloadFile } from "../types";

export interface CreatePRParams {
  title: string;
  owner: string;
  repo: string;
  sourceBranch: string;
  targetBranch: string;
}

export default abstract class {
  public constructor(protected token: string) {}

  abstract getFigmaLinuxLatestTag(): Promise<string>;
  abstract createPR(options: CreatePRParams): Promise<void>;
  abstract clone(url: string, to: string): Promise<void>;
  abstract downloadReleaseFile(
    tag: string,
    reg: RegExp
  ): Promise<DownloadFile[]>;
}
