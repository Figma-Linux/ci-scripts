import * as fs from "fs";
import dayjs from "dayjs";
import { resolve } from "path";
import * as crypto from "crypto";
import * as jsYaml from "js-yaml";
import { Builder, parseStringPromise } from "xml2js";
import * as Exec from "@actions/exec";
import BaseAction from "../utils/BaseAction";
import {
  FILES_DIR,
  FLATPAK_REPO_DEST,
  FLATPAK_FILES_REGEXP,
  FLATPAK_REPO_URL,
} from "../../src/constants";

export default class extends BaseAction {
  public async run() {
    const dest = FLATPAK_REPO_DEST;
    const { ymlFilePath, xmlFilePath, releaseNotesFilePath } =
      this.getPaths(dest);
    const tag = await this.baseClient.getFigmaLinuxLatestTag();
    const newVersion = tag.replace("v", "");

    await fs.promises.rm(resolve(process.cwd(), dest), {
      force: true,
      recursive: true,
    });
    await this.baseClient.clone(FLATPAK_REPO_URL, dest);

    const [xmlFileContent, ymlFileContent, releaseNotesContent, files] =
      await Promise.all([
        fs.promises.readFile(xmlFilePath, {
          encoding: "utf-8",
        }),
        fs.promises.readFile(ymlFilePath, {
          encoding: "utf-8",
        }),
        fs.promises.readFile(releaseNotesFilePath, {
          encoding: "utf-8",
        }),
        this.baseClient.downloadReleaseFile(tag, FLATPAK_FILES_REGEXP),
      ]);

    const amd64File = files.find((f) => /amd64/.test(f.name));
    if (!amd64File) {
      throw new Error(
        `File for amd64 arch not found in files array: ${JSON.stringify(files)}`
      );
    }
    const arm64File = files.find((f) => /arm64|aarch64/.test(f.name));
    if (!arm64File) {
      throw new Error(
        `File for arm64 arch not found in files array: ${JSON.stringify(files)}`
      );
    }

    const [amd64FileBuffer, arm64FileBuffer] = await Promise.all([
      fs.promises.readFile(resolve(FILES_DIR, amd64File.name)),
      fs.promises.readFile(resolve(FILES_DIR, arm64File.name)),
    ]);

    const xmlJson = await parseStringPromise(xmlFileContent);
    const ymlJson = jsYaml.load(ymlFileContent) as any;
    const releaseNotesJson = await parseStringPromise(
      `<ul>${releaseNotesContent}</ul>`
    );

    xmlJson.component.releases[0].release.unshift({
      $: { version: newVersion, date: dayjs().format("YYYY-MM-DD") },
      description: [releaseNotesJson],
    });

    const builder = new Builder();
    const xml = builder.buildObject(xmlJson);

    const amd64FileHash = crypto
      .createHash("sha256")
      .update(amd64FileBuffer)
      .digest("hex");
    const arm64FileHash = crypto
      .createHash("sha256")
      .update(arm64FileBuffer)
      .digest("hex");

    ymlJson.modules[0].sources[0].url = amd64File.url;
    ymlJson.modules[0].sources[0].sha256 = amd64FileHash;
    ymlJson.modules[0].sources[1].url = arm64File.url;
    ymlJson.modules[0].sources[1].sha256 = arm64FileHash;

    await Promise.all([
      fs.promises.writeFile(xmlFilePath, xml, {
        encoding: "utf-8",
        flag: "w",
      }),
      fs.promises.writeFile(ymlFilePath, jsYaml.dump(ymlJson), {
        encoding: "utf-8",
        flag: "w",
      }),
    ]);

    await this.push(newVersion, resolve(process.cwd(), dest));
  }

  private async push(newVersion: string, root: string) {
    const branch = `update-to-${newVersion}`;

    await Exec.exec("git", ["checkout", "-b", branch], {
      cwd: root,
    });
    await Exec.exec("git", ["add", "."], { cwd: root });
    await Exec.exec(
      "git",
      ["commit", "-m", `"Publish release v${newVersion}"`],
      { cwd: root }
    );
    await Exec.exec(
      "git",
      ["tag", "-a", `v${newVersion}`, "-m", `"Publish release v${newVersion}"`],
      { cwd: root }
    );
    await Exec.exec("git", ["push", "--tags", "origin", branch], {
      cwd: root,
    });

    await this.baseClient.createPR({
      title: `Update Figma Linux to ${newVersion}`,
      owner: "flathub",
      repo: "io.github.Figma_Linux.figma_linux",
      sourceBranch: branch,
      targetBranch: "master",
    });
  }

  private getPaths(dest: string) {
    const repoPath = resolve(process.cwd(), dest);
    return {
      repoPath,
      ymlFilePath: resolve(repoPath, "io.github.Figma_Linux.figma_linux.yml"),
      xmlFilePath: resolve(
        repoPath,
        "io.github.Figma_Linux.figma_linux.appdata.xml"
      ),
      releaseNotesFilePath: resolve(process.cwd(), "release_notes"),
    };
  }
}
