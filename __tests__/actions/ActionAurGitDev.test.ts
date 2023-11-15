import * as fs from "fs";
import * as path from "path";
import Git from "../../src/Git";
import ActionAurGitDev from "../../src/actions/ActionAurGitDev";
import FigmaGitPkgBuild from "../../src/utils/Generators/FigmaGitPkgBuild";
import FigmaGitSrcInfo from "../../src/utils/Generators/FigmaGitSrcInfo";
import { MAIN_REPO_DEST } from "../../src/constants";
import { BaseConfig } from "../../src/utils/Generators";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
// const fsWriteFileSpy = jest.spyOn(fs.promises, "writeFile");
(MAIN_REPO_DEST as any) = path.resolve(process.cwd(), "..", "figma-linux");

describe("Test ActionAurGitDev", () => {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === "") {
    throw new Error(`env var GITHUB_TOKEN will not provided!`);
  }

  afterAll(() => {
    // await fs.promises.rm(
    //   path.resolve(process.cwd(), `../${AUR_REPO_GIT_DEST}`),
    //   {
    //     force: true,
    //     recursive: true,
    //   }
    // );
  });

  it("test run", async () => {
    const pkgGenerator = new FigmaGitPkgBuild();
    const srcInfoGenerator = new FigmaGitSrcInfo();
    const aurGit = new ActionAurGitDev(
      new Git(GITHUB_TOKEN),
      pkgGenerator,
      srcInfoGenerator
    );
    // fsWriteFileSpy.mockImplementation(
    //   (path: any, data: any) => new Promise((res, rej) => res())
    // );

    (aurGit as any).getCurrentInfo = jest.fn().mockResolvedValue({
      pkgver: "0.9.6.r0.gf5dd5bf",
      pkgrel: "2",
    });
    (aurGit as any).getNewPkgver = jest
      .fn()
      .mockResolvedValue("0.11.0.r37.gb297c52");
    (aurGit as any).baseClient.getFigmaLinuxLatestTag = jest
      .fn()
      .mockResolvedValue("v0.11.0");

    await aurGit.run();

    const config: BaseConfig = {
      pkgver: "0.11.0.r37.gb297c52",
      pkgrel: "0",
      arch: ["any"],
      source: ['${_pkgname}"::"git+${url}.git#branch=dev'],
      sha256sums: ["SKIP"],
    };

    expect(pkgGenerator.config).toMatchObject({
      _pkgname: "figma-linux",
      pkgname: "${_pkgname}-git-dev",
      _pkgver: "0.11.0",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["git", "nodejs>=18.11.18", "npm>=9.8.1", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-bin", "figma-linux-git"],
      provides: ["${_pkgname}"],
      ...config,
    });
    expect(srcInfoGenerator.config).toMatchObject({
      pkgbase: "figma-linux-git-dev",
      pkgname: "figma-linux-git-dev",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["git", "nodejs>=18.11.18", "npm>=9.8.1", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-bin", "figma-linux-git"],
      provides: ["figma-linux"],
      ...config,
      source: [
        `figma-linux::git+https://github.com/Figma-Linux/figma-linux.git#branch=dev`,
      ],
    });

    // expect(fsWriteFileSpy).toHaveBeenCalledTimes(2);
  });

  it("test getCurrentInfo", async () => {
    const result = await (ActionAurGitDev.prototype as any).getCurrentInfo(
      `${process.cwd()}/testData/aur`
    );

    expect(result.pkgver).toEqual("0.9.6");
    expect(result.pkgrel).toEqual("0");
  });
});
