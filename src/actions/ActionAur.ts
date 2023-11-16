import * as fs from "fs";
import * as Core from "@actions/core";
import * as Exec from "@actions/exec";
import { resolve, basename } from "path";
import * as crypto from "crypto";
import BaseClient from "../utils/BaseClient";
import BaseAction from "../utils/BaseAction";
import BaseGenerator from "../utils/Generators";
import {
  AUR_REPO_DEST,
  AUR_REPO_URL,
  AUR_BIN_FILES_REGEXP,
  AUR_SKIP_FILES_REGEXP,
  VERSION_REGEXP,
  FILES_DIR,
} from "../constants";
import { BaseConfig } from "src/utils/Generators";

export default class extends BaseAction {
  constructor(
    protected baseClient: BaseClient,
    private pkgGenerator: BaseGenerator,
    private srcInfoGenerator: BaseGenerator
  ) {
    super(baseClient);
  }

  public async run() {
    const aurRepoRootPath = AUR_REPO_DEST;
    const aurRepoRoot = resolve(process.cwd(), aurRepoRootPath);
    const tag = await this.baseClient.getFigmaLinuxLatestTag();
    const newVersion = tag.replace("v", "");

    Core.info(`Latest tag: ${tag}`);
    Core.info(`CWD: ${process.cwd()}`);
    Core.info(`Env vars: ${JSON.stringify(process.env)}`);

    const { pkgver, pkgrel } = await this.getCurrentInfo(aurRepoRoot);
    let newPkgrel = 0;

    if (pkgver === newVersion) {
      Core.warning(
        `Current version (${pkgver}) = new version (${newVersion}).`
      );
      newPkgrel = +pkgrel + 1;
    }

    const downloadFilesPromise = this.baseClient.downloadReleaseFile(
      tag,
      AUR_BIN_FILES_REGEXP
    );

    await fs.promises.rm(aurRepoRoot, {
      force: true,
      recursive: true,
    });
    await this.baseClient.clone(AUR_REPO_URL, aurRepoRootPath);

    const repoFiles = (await fs.promises.readdir(aurRepoRoot)).map(
      (f) => `${aurRepoRoot}/${f}`
    );

    const downloadFiles = await downloadFilesPromise;
    const { sources, sha256sums } = await this.getSums(repoFiles);
    const { sources: sourcesApp, sha256sums: sha256sumsApp } =
      await this.getSums(downloadFiles.map((f) => `${FILES_DIR}/${f.name}`));

    const config: BaseConfig = {
      pkgname: "figma-linux",
      pkgver: newVersion,
      pkgrel: newPkgrel + "",
      arch: ["x86_64", "aarch64"],
      source: sources,
      sha256sums,
      conflicts: ["figma-linux-git", "figma-linux-bin", "figma-linux-git-dev"],
    };

    sourcesApp.forEach((file, index) => {
      const arch = this.getArchFromName(file);
      const sourceKey = `source_${arch}`;
      const sha256sumsKey = `sha256sums_${arch}`;
      const sum = sha256sumsApp[index];
      const downloadFile = downloadFiles.find((f) => f.name === file)!;

      config[sourceKey] = [downloadFile.url];
      config[sha256sumsKey] = [sum];
    });

    this.pkgGenerator.config = config;
    this.srcInfoGenerator.config = {
      ...config,
      pkgbase: config.pkgname,
    };

    const pkgBuffer = this.pkgGenerator.generate();
    const srcInfoBuffer = this.srcInfoGenerator.generate();

    await Promise.all([
      fs.promises.writeFile(`${aurRepoRoot}/PKGBUILD`, pkgBuffer, {
        encoding: "utf-8",
        flag: "w",
      }),
      fs.promises.writeFile(`${aurRepoRoot}/.SRCINFO`, srcInfoBuffer, {
        encoding: "utf-8",
        flag: "w",
      }),
    ]);

    await Exec.exec(`cat ${aurRepoRoot}/PKGBUILD`);
    await Exec.exec(`cat ${aurRepoRoot}/.SRCINFO`);

    // TODO: push to repo
  }

  private getArchFromName(filename: string): string | undefined {
    if (/amd64|x86_64|x64/.test(filename)) {
      return "x86_64";
    } else if (/(arm64|aarch64)/.test(filename)) {
      return "aarch64";
    }
  }

  private async getCurrentInfo(
    aurRepoRoot: string
  ): Promise<{ pkgver: string; pkgrel: string }> {
    const content = await fs.promises.readFile(`${aurRepoRoot}/PKGBUILD`, {
      encoding: "utf-8",
    });
    const lines = content.split("\n");

    return {
      pkgver: lines
        .find((l) => /pkgver=".+"/.test(l))!
        .match(VERSION_REGEXP)![0],
      pkgrel: lines.find((l) => /pkgrel=".+"/.test(l))!.match(/[0-9]{1,5}/)![0],
    };
  }

  private async getSums(files: string[]): Promise<{
    sources: string[];
    sha256sums: string[];
  }> {
    const sources: string[] = [];
    const sha256sums: string[] = [];

    for (const file of files) {
      if (AUR_SKIP_FILES_REGEXP.test(file)) {
        continue;
      }

      const buffer = await fs.promises.readFile(file);
      const hash = crypto.createHash("sha256").update(buffer).digest("hex");

      sources.push(basename(file));
      sha256sums.push(hash);
    }

    return {
      sources,
      sha256sums,
    };
  }
}
