import * as fs from "fs";
import { resolve } from "path";
import * as Core from "@actions/core";
import * as Exec from "@actions/exec";
import * as Octokit from "@actions/github";
import { GitHub } from "@actions/github/lib/utils";
import BaseClient, { CreatePRParams } from "./utils/BaseClient";
import { FIGMA_REPO, FIGMA_REPO_OWNER, FILES_DIR } from "./constants";
import { DownloadFile } from "./types";

export default class extends BaseClient {
  private client: InstanceType<typeof GitHub>;

  public constructor(protected token: string) {
    super(token);
    this.client = Octokit.getOctokit(token);
  }

  public async getFigmaLinuxLatestTag(): Promise<string> {
    const tags = await this.client.rest.repos.listTags({
      owner: FIGMA_REPO_OWNER,
      repo: FIGMA_REPO,
      per_page: 1,
    });

    return tags.data[0].name;
  }
  public async createPR(params: CreatePRParams) {
    await this.client.rest.pulls.create({
      title: params.title,
      owner: params.owner,
      repo: params.repo,
      head: params.sourceBranch,
      base: params.targetBranch,
      draft: false,
    });
  }
  public async clone(url: string, to: string) {
    await fs.promises.mkdir(resolve(process.cwd(), to), { recursive: true });
    await Exec.exec("git", ["clone", url, "."], {
      cwd: resolve(process.cwd(), to),
    });
  }

  public async downloadReleaseFile(
    tag: string,
    reg: RegExp
  ): Promise<DownloadFile[]> {
    const release = await this.client.rest.repos.getReleaseByTag({
      tag,
      owner: FIGMA_REPO_OWNER,
      repo: FIGMA_REPO,
    });

    const files: DownloadFile[] = [];
    for (const asset of release.data.assets) {
      if (reg.test(asset.name)) {
        files.push({
          name: asset.name,
          url: asset.browser_download_url,
        });
      }
    }

    if (!files.length) {
      Core.warning(
        `No files for download by RegExp: ${reg}, files: ${JSON.stringify(
          files
        )}`
      );
      return [];
    }

    const promises: Promise<unknown>[] = [];
    for (const file of files) {
      const promise = this.DownloadFileToDest(file.url, file.name).catch(
        (e) => {
          const error = e as Error;
          Core.error(
            `Cannot download file: ${file.name}, url: ${
              file.url
            }, error: ${JSON.stringify({
              name: error.name,
              message: error.message,
              stack: error.stack,
            })}`
          );
        }
      );

      promises.push(promise);
    }

    await Promise.all(promises);

    return files;
  }

  private async DownloadFileToDest(
    url: string,
    filename: string
  ): Promise<void> {
    const request = await this.client.request<ArrayBuffer>({
      method: "GET",
      url,
    });

    await fs.promises.mkdir(FILES_DIR, { recursive: true });
    await fs.promises.writeFile(
      `${FILES_DIR}/${filename}`,
      Buffer.from(request.data),
      {
        encoding: "hex",
        flag: "w",
      }
    );
  }
}
