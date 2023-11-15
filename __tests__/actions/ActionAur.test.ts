import * as fs from "fs";
import * as path from "path";
import * as Exec from "@actions/exec";
import Git from "../../src/Git";
import ActionAur from "../../src/actions/ActionAur";
import FigmaBinPkgBuild from "../../src/utils/Generators/FigmaBinPkgBuild";
import FigmaBinSrcInfo from "../../src/utils/Generators/FigmaBinSrcInfo";
import { FILES_DIR, AUR_REPO_DEST } from "../../src/constants";
import { BaseConfig } from "../../src/utils/Generators";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
// const fsWriteFileSpy = jest.spyOn(fs.promises, "writeFile");
const fsReaddirSpy = jest.spyOn(fs.promises, "readdir");
(AUR_REPO_DEST as any) = `../${AUR_REPO_DEST}`;

const files = [
  {
    name: "figma-linux_0.11.0_linux_amd64.zip",
    url: "https://github.com/Figma-Linux/figma-linux/releases/download/v0.11.0/figma-linux_0.11.0_linux_amd64.zip",
  },
  {
    name: "figma-linux_0.11.0_linux_arm64.zip",
    url: "https://github.com/Figma-Linux/figma-linux/releases/download/v0.11.0/figma-linux_0.11.0_linux_arm64.zip",
  },
];

describe("Test ActionAurBin", () => {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === "") {
    throw new Error(`env var GITHUB_TOKEN will not provided!`);
  }

  afterAll(() => {
    // await fs.promises.rm(
    //   path.resolve(process.cwd(), `../${AUR_REPO_DEST}`),
    //   {
    //     force: true,
    //     recursive: true,
    //   }
    // );
  });

  it("run", async () => {
    const pkgGenerator = new FigmaBinPkgBuild();
    const srcInfoGenerator = new FigmaBinSrcInfo();
    const aurBin = new ActionAur(
      new Git(GITHUB_TOKEN),
      pkgGenerator,
      srcInfoGenerator
    );
    // fsWriteFileSpy.mockImplementation(
    //   (path: any, data: any) => new Promise((res, rej) => res())
    // );
    fsReaddirSpy.mockResolvedValue([
      `96x96.png`,
      `384x384.png`,
      `figma-linux.desktop`,
    ] as any);

    (aurBin as any).getCurrentInfo = jest.fn().mockResolvedValue({
      pkgver: "0.9.6",
      pkgrel: "0",
    });
    (aurBin as any).baseClient.getFigmaLinuxLatestTag = jest
      .fn()
      .mockResolvedValue("v0.11.0");

    try {
      const amd64ZipFileExist = await fs.promises.stat(
        `${FILES_DIR}/figma-linux_0.11.0_linux_amd64.zip`
      );
      const arm64ZipFileExist = await fs.promises.stat(
        `${FILES_DIR}/figma-linux_0.11.0_linux_arm64.zip`
      );

      if (amd64ZipFileExist && arm64ZipFileExist) {
        (aurBin as any).baseClient.downloadReleaseFile = jest
          .fn()
          .mockResolvedValue(files);
      }
    } catch (e) {}

    await aurBin.run();

    let sha256Amd64: string = "";
    let sha256Arm64: string = "";
    let sha1: string = "";
    let sha2: string = "";
    let sha3: string = "";
    await Promise.all([
      Exec.exec(
        "sha256sum",
        [`${FILES_DIR}/figma-linux_0.11.0_linux_amd64.zip`],
        {
          listeners: {
            stdout: (data: Buffer) =>
              (sha256Amd64 = data.toString().split(" ")[0]),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [`${FILES_DIR}/figma-linux_0.11.0_linux_arm64.zip`],
        {
          listeners: {
            stdout: (data: Buffer) =>
              (sha256Arm64 = data.toString().split(" ")[0]),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [path.resolve(process.cwd(), AUR_REPO_DEST, "96x96.png")],
        {
          listeners: {
            stdout: (data: Buffer) => (sha1 = data.toString().split(" ")[0]),
            stderr: (data) =>
              console.log('Exec sum of "96x96.png" error: ', data.toString()),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [path.resolve(process.cwd(), AUR_REPO_DEST, "384x384.png")],
        {
          listeners: {
            stdout: (data: Buffer) => (sha2 = data.toString().split(" ")[0]),
            stderr: (data) =>
              console.log('Exec sum of "384x384.png" error: ', data.toString()),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [path.resolve(process.cwd(), AUR_REPO_DEST, "figma-linux.desktop")],
        {
          listeners: {
            stdout: (data: Buffer) => (sha3 = data.toString().split(" ")[0]),
            stderr: (data) =>
              console.log(
                'Exec sum of "figma-linux.desktop" error: ',
                data.toString()
              ),
          },
        }
      ),
    ]);

    const pkgConfig: BaseConfig = {
      pkgname: "figma-linux",
      pkgver: "0.11.0",
      pkgrel: "0",
      arch: ["x86_64", "aarch64"],
      source: ["96x96.png", "384x384.png", "figma-linux.desktop"],
      source_x86_64: [
        "https://github.com/Figma-Linux/figma-linux/releases/download/v0.11.0/figma-linux_0.11.0_linux_amd64.zip",
      ],
      source_aarch64: [
        "https://github.com/Figma-Linux/figma-linux/releases/download/v0.11.0/figma-linux_0.11.0_linux_arm64.zip",
      ],
      sha256sums: [sha1, sha2, sha3],
      sha256sums_x86_64: [sha256Amd64],
      sha256sums_aarch64: [sha256Arm64],
    };
    const srcInfoConfig: BaseConfig = {
      ...pkgConfig,
      pkgbase: "figma-linux",
    };

    expect(pkgGenerator.config).toMatchObject({
      pkgname: "figma-linux",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      conflicts: ["figma-linux-git", "figma-linux-bin", "figma-linux-git-dev"],
      options: ["!strip"],
      provides: ["${_pkgname}"],
      ...pkgConfig,
    });
    expect(srcInfoGenerator.config).toMatchObject({
      pkgbase: "figma-linux",
      pkgname: "figma-linux",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      conflicts: ["figma-linux-git", "figma-linux-bin", "figma-linux-git-dev"],
      options: ["!strip"],
      provides: ["figma-linux"],
      ...srcInfoConfig,
    });

    // expect(fsWriteFileSpy).toHaveBeenCalledTimes(2);
  });

  describe("getArchFromName", () => {
    it("getArchFromName - figma-linux_0.11.0_linux_aarch64.pacman", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_aarch64.pacman`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_aarch64.rpm", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_aarch64.rpm`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_amd64.deb", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_amd64.deb`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_amd64.zip", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_amd64.zip`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.AppImage", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.AppImage`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.deb", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.deb`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.zip", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.zip`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x64.pacman", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x64.pacman`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x86_64.AppImage", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x86_64.AppImage`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x86_64.rpm", async () => {
      const result = (ActionAur.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x86_64.rpm`
      );

      expect(result).toEqual("x86_64");
    });
  });

  it("getCurrentInfo", async () => {
    const result = await (ActionAur.prototype as any).getCurrentInfo(
      `${process.cwd()}/testData/aur`
    );

    expect(result.pkgver).toEqual("0.9.6");
    expect(result.pkgrel).toEqual("0");
  });
});
