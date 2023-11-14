import * as fs from "fs";
import * as path from "path";
import * as jsYaml from "js-yaml";
import * as Exec from "@actions/exec";
import ActionFlatpak from "../../src/actions/ActionFlatpak";
import Git from "../../src/Git";
import { FILES_DIR, FLATPAK_REPO_DEST } from "../../src/constants";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
const fsWriteFileSpy = jest.spyOn(fs.promises, "writeFile");
const ymlDumpSpy = jest.spyOn(jsYaml, "dump");

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

describe("Test ActionFlatpak", () => {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === "") {
    throw new Error(`env var GITHUB_TOKEN will not provided!`);
  }

  beforeEach(() => {});

  it("run", async () => {
    const flatpak = new ActionFlatpak(new Git(GITHUB_TOKEN));
    fsWriteFileSpy.mockImplementation(
      (path: any, data: any) => new Promise((res, rej) => res())
    );

    (flatpak as any).getPaths = jest.fn().mockReturnValue({
      repoPath: `${process.cwd()}/testData/flatpak`,
      ymlFilePath: `${process.cwd()}/testData/flatpak/io.github.Figma_Linux.figma_linux.yml`,
      xmlFilePath: `${process.cwd()}/testData/flatpak/io.github.Figma_Linux.figma_linux.appdata.xml`,
      releaseNotesFilePath: `${process.cwd()}/testData/release_notes.xml`,
    });
    (flatpak as any).baseClient.downloadReleaseFile = jest
      .fn()
      .mockResolvedValue(files);

    await flatpak.run();

    let sha256Amd64 = "";
    let sha256Arm64 = "";
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
    ]);
    await fs.promises.rm(
      path.resolve(process.cwd(), `../${FLATPAK_REPO_DEST}`),
      {
        force: true,
        recursive: true,
      }
    );

    expect(ymlDumpSpy).toHaveBeenCalledTimes(1);
    expect(ymlDumpSpy.mock.calls[0][0].modules[0].sources[0].url).toEqual(
      files[0].url
    );
    expect(ymlDumpSpy.mock.calls[0][0].modules[0].sources[0].sha256).toEqual(
      sha256Amd64
    );
    expect(ymlDumpSpy.mock.calls[0][0].modules[0].sources[1].url).toEqual(
      files[1].url
    );
    expect(ymlDumpSpy.mock.calls[0][0].modules[0].sources[1].sha256).toEqual(
      sha256Arm64
    );
    expect(fsWriteFileSpy).toHaveBeenCalledTimes(2);
  });
});
