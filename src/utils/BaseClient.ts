import { DownloadFile } from "../types";

export default abstract class {
  public constructor(protected token: string) {}

  abstract getFigmaLinuxLatestTag(): Promise<string>;
  abstract createPR(): Promise<void>;
  abstract clone(url: string, to: string): Promise<void>;
  abstract downloadReleaseFile(
    tag: string,
    reg: RegExp
  ): Promise<DownloadFile[]>;
}
