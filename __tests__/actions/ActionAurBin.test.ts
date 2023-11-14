import * as fs from "fs";
import * as path from "path";
import * as Exec from "@actions/exec";
import Git from "../../src/Git";
import ActionAurBin from "../../src/actions/ActionAurBin";
import FigmaBinPkgBuild from "../../src/utils/Generators/FigmaBinPkgBuild";
import FigmaBinSrcInfo from "../../src/utils/Generators/FigmaBinSrcInfo";
import { FILES_DIR, AUR_REPO_BIN_DEST } from "../../src/constants";
import { BaseConfig } from "../../src/utils/Generators";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
// const fsWriteFileSpy = jest.spyOn(fs.promises, "writeFile");
const fsReaddirSpy = jest.spyOn(fs.promises, "readdir");

const files = [
  {
    name: "figma-linux_0.11.0_linux_amd64.deb",
    url: "https://github.com/Figma-Linux/figma-linux/releases/download/v0.10.0/figma-linux_0.10.0_linux_amd64.deb",
  },
  {
    name: "figma-linux_0.11.0_linux_arm64.deb",
    url: "https://github.com/Figma-Linux/figma-linux/releases/download/v0.10.0/figma-linux_0.10.0_linux_arm64.deb",
  },
];

describe("Test ActionAurBin", () => {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === "") {
    throw new Error(`env var GITHUB_TOKEN will not provided!`);
  }

  beforeEach(() => {});

  it("run", async () => {
    const pkgGenerator = new FigmaBinPkgBuild();
    const srcInfoGenerator = new FigmaBinSrcInfo();
    const aurBin = new ActionAurBin(
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

    (aurBin as any).getCurrentInfo = jest.fn().mockReturnValue({
      pkgver: "0.9.6",
      pkgrel: "0",
    });
    (aurBin as any).baseClient.getFigmaLinuxLatestTag = jest
      .fn()
      .mockResolvedValue("v0.11.0");
    (aurBin as any).baseClient.downloadReleaseFile = jest
      .fn()
      .mockResolvedValue(files);

    await aurBin.run();

    let sha256Amd64: string = "";
    let sha256Arm64: string = "";
    let sha1: string = "";
    let sha2: string = "";
    let sha3: string = "";
    await Promise.all([
      Exec.exec(
        "sha256sum",
        [`${FILES_DIR}/figma-linux_0.11.0_linux_amd64.deb`],
        {
          listeners: {
            stdout: (data: Buffer) =>
              (sha256Amd64 = data.toString().split(" ")[0]),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [`${FILES_DIR}/figma-linux_0.11.0_linux_arm64.deb`],
        {
          listeners: {
            stdout: (data: Buffer) =>
              (sha256Arm64 = data.toString().split(" ")[0]),
          },
        }
      ),
      Exec.exec(
        "sha256sum",
        [path.resolve(process.cwd(), `../${AUR_REPO_BIN_DEST}`, "96x96.png")],
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
        [path.resolve(process.cwd(), `../${AUR_REPO_BIN_DEST}`, "384x384.png")],
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
        [
          path.resolve(
            process.cwd(),
            `../${AUR_REPO_BIN_DEST}`,
            "figma-linux.desktop"
          ),
        ],
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
    // await fs.promises.rm(
    //   path.resolve(process.cwd(), `../${AUR_REPO_BIN_DEST}`),
    //   {
    //     force: true,
    //     recursive: true,
    //   }
    // );

    const config: BaseConfig = {
      pkgver: "0.11.0",
      pkgrel: "0",
      arch: ["x86_64", "aarch64"],
      source: ["96x96.png", "384x384.png", "figma-linux.desktop"],
      source_x86_64: [
        "https://github.com/Figma-Linux/figma-linux/releases/download/v0.10.0/figma-linux_0.10.0_linux_amd64.deb",
      ],
      source_aarch64: [
        "https://github.com/Figma-Linux/figma-linux/releases/download/v0.10.0/figma-linux_0.10.0_linux_arm64.deb",
      ],
      sha256sums: [sha1, sha2, sha3],
      sha256sums_x86_64: [sha256Amd64],
      sha256sums_aarch64: [sha256Arm64],
    };

    expect(pkgGenerator.config).toMatchObject({
      pkgname: "figma-linux-bin",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-git"],
      options: ["!strip"],
      ...config,
    });
    expect(srcInfoGenerator.config).toMatchObject({
      pkgbase: "figma-linux-bin",
      pkgname: "figma-linux-bin",
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-git"],
      options: ["!strip"],
      ...config,
    });

    // expect(fsWriteFileSpy).toHaveBeenCalledTimes(2);
  });

  describe("getArchFromName", () => {
    it("getArchFromName - figma-linux_0.11.0_linux_aarch64.pacman", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_aarch64.pacman`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_aarch64.rpm", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_aarch64.rpm`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_amd64.deb", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_amd64.deb`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_amd64.zip", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_amd64.zip`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.AppImage", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.AppImage`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.deb", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.deb`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_arm64.zip", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_arm64.zip`
      );

      expect(result).toEqual("aarch64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x64.pacman", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x64.pacman`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x86_64.AppImage", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x86_64.AppImage`
      );

      expect(result).toEqual("x86_64");
    });
    it("getArchFromName - figma-linux_0.11.0_linux_x86_64.rpm", async () => {
      const result = (ActionAurBin.prototype as any).getArchFromName(
        `${process.cwd()}/figma-linux_0.11.0_linux_x86_64.rpm`
      );

      expect(result).toEqual("x86_64");
    });
  });

  it("getCurrentInfo", async () => {
    const result = await (ActionAurBin.prototype as any).getCurrentInfo(
      `${process.cwd()}/testData/aur`
    );

    expect(result.pkgver).toEqual("0.9.6");
    expect(result.pkgrel).toEqual("0");
  });
});
