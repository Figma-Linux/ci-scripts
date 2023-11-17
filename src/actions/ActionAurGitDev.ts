import * as fs from "fs";
import * as Core from "@actions/core";
import * as Exec from "@actions/exec";
import { resolve } from "path";
import BaseClient from "../utils/BaseClient";
import BaseAction from "../utils/BaseAction";
import BaseGenerator from "../utils/Generators";
import {
  MAIN_REPO_DEST,
  AUR_REPO_GIT_DEV_DEST,
  AUR_REPO_GIT_DEV_URL,
  VERSION_REGEXP,
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
    const aurRepoRootPath = AUR_REPO_GIT_DEV_DEST;
    const aurRepoRoot = resolve(process.cwd(), aurRepoRootPath);
    const tag = await this.baseClient.getFigmaLinuxLatestTag();
    const newVersion = tag.replace("v", "");
    const newPkgver = await this.getNewPkgver();
    let newPkgrel = "0";

    Core.info(`Latest tag: ${tag}`);

    await fs.promises.rm(aurRepoRoot, {
      force: true,
      recursive: true,
    });
    await this.baseClient.clone(AUR_REPO_GIT_DEV_URL, aurRepoRootPath);

    const { pkgver, pkgrel } = await this.getCurrentInfo(aurRepoRoot);

    if (pkgver.match(VERSION_REGEXP)![0] === newVersion) {
      Core.warning(
        `Current version (${pkgver}) = new version (${newVersion}).`
      );
      newPkgrel = +pkgrel + 1 + "";
    }

    const pkgConfig: BaseConfig = {
      _pkgname: "figma-linux-dev",
      pkgname: "${_pkgname}-git",
      pkgver: newPkgver,
      _pkgver: newVersion,
      pkgrel: newPkgrel,
      arch: ["any"],
      source: ['figma-linux"::"git+${url}.git#branch=dev'],
      sha256sums: ["SKIP"],
    };
    const srcInfoConfig: BaseConfig = {
      ...pkgConfig,
      pkgbase: "figma-linux-dev-git",
      pkgname: "figma-linux-dev-git",
      source: [
        `figma-linux::git+https://github.com/Figma-Linux/figma-linux.git#branch=dev`,
      ],
    };

    delete srcInfoConfig["_pkgver"];
    delete srcInfoConfig["_pkgname"];

    this.pkgGenerator.config = pkgConfig;
    this.srcInfoGenerator.config = srcInfoConfig;

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

    await this.push(newPkgver, aurRepoRoot);
  }

  private async push(newPkgver: string, root: string) {
    await Exec.exec("git", ["add", "."], { cwd: root });
    await Exec.exec("git", ["commit", "-m", `"Publish build ${newPkgver}"`], {
      cwd: root,
    });
    await Exec.exec("git", ["push", "origin", "master"], {
      cwd: root,
    });
  }

  private async getNewPkgver() {
    let newPkgver = "";

    await Exec.exec("git describe --long --tags --exclude='*[a-z][a-z]*'", [], {
      cwd: MAIN_REPO_DEST,
      listeners: {
        stdout: (data) =>
          (newPkgver = data
            .toString()
            .substring(1)
            .replace(/-([0-9]{1,9})-/, ".r$1.")
            .replace(/\n/, "")),
      },
    });

    return newPkgver;
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
        .find((l) => /pkgver="?.+"?/.test(l))!
        .match(VERSION_REGEXP)![0],
      pkgrel: lines
        .find((l) => /pkgrel="?.+"?/.test(l))!
        .match(/[0-9]{1,5}/)![0],
    };
  }
}
