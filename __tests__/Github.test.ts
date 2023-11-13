import Git from "../src/Git";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN as string;
const tagReg = /^v[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}$/;

describe("Github", () => {
  if (!GITHUB_TOKEN || GITHUB_TOKEN === "") {
    throw new Error(`env var GITHUB_TOKEN will not provided!`);
  }

  it("Get Figma linux latest tag", async () => {
    const client = new Git(process.env.GITHUB_TOKEN as string);
    const result = await client.getFigmaLinuxLatestTag();

    console.log("Figma Linux latest tag: ", result);

    expect(tagReg.test(result)).toEqual(true);
  });

  it.skip("Clone repo", async () => {
    const client = new Git(process.env.GITHUB_TOKEN as string);
    await client.clone(
      "https://aur.archlinux.org/figma-linux.git",
      "../test-aur"
    );
  });

  it.skip("Download release files", async () => {
    const client = new Git(process.env.GITHUB_TOKEN as string);
    await client.downloadReleaseFile(
      "v0.11.0",
      /^figma-linux_.*_linux_.*\.zip$/
    );
  });
});
