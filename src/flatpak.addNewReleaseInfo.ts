import * as https from "https";
import * as path from "path";
import * as crypto from "crypto";
import * as dayjs from "dayjs";
import * as jsYaml from "js-yaml";
import * as fs from "fs";
import { Builder, parseStringPromise } from "xml2js";

// Expamle usage with ts-node:
// ts-node ./src/flatpak.addNewReleaseInfo.ts 0.11.0 ./testData/flatpak/io.github.Figma_Linux.figma_linux.appdata.xml ./testData/flatpak/io.github.Figma_Linux.figma_linux.yml
(async () => {
  const newVersion = process.argv.find((c) =>
    /[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}/.test(c)
  );
  const xmlFilePath = process.argv.find((c) =>
    /io.github.Figma_Linux.figma_linux.appdata.xml/.test(c)
  );
  const ymlFilePath = process.argv.find((c) =>
    /io.github.Figma_Linux.figma_linux.yml/.test(c)
  );

  if (!newVersion) {
    throw new Error("New app version not passed!");
  }
  if (!xmlFilePath) {
    throw new Error("Path to xml file not passed!");
  }
  if (!ymlFilePath) {
    throw new Error("Path to yml file not passed!");
  }

  const str = await fs.promises.readFile(
    path.resolve(process.cwd(), xmlFilePath),
    {
      encoding: "utf-8",
    }
  );
  const strYml = await fs.promises.readFile(
    path.resolve(process.cwd(), ymlFilePath),
    {
      encoding: "utf-8",
    }
  );
  const releaseNotes = await fs.promises.readFile(
    path.resolve(process.cwd(), "testData/release_notes"),
    {
      encoding: "utf-8",
    }
  );
  const xmlJson = await parseStringPromise(str);
  const ymlJson = jsYaml.load(strYml) as any;
  const releaseNotesJson = await parseStringPromise(`<ul>${releaseNotes}</ul>`);

  xmlJson.component.releases[0].release.unshift({
    $: { version: newVersion, date: dayjs().format("YYYY-MM-DD") },
    description: [releaseNotesJson],
  });

  const builder = new Builder();
  const xml = builder.buildObject(xmlJson);

  await fs.promises.writeFile(path.resolve(process.cwd(), xmlFilePath), xml, {
    encoding: "utf-8",
  });

  const link = getDownloadLink(newVersion);
  const buffer = await downloadFile(link);

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");

  ymlJson.modules[0].sources[0].url = link;
  ymlJson.modules[0].sources[0].sha256 = hash;

  await fs.promises.writeFile(
    path.resolve(process.cwd(), ymlFilePath),
    jsYaml.dump(ymlJson),
    {
      encoding: "utf-8",
    }
  );
})();

function getDownloadLink(version: string) {
  return `https://github.com/Figma-Linux/figma-linux/releases/download/v${version}/figma-linux_${version}_linux_amd64.deb`;
}

async function downloadFile(link: string): Promise<Buffer> {
  return new Promise((resolve, rej) => {
    https.get(link, (res) => {
      const data: Buffer[] = [];
      res
        .on("data", (chunk: Buffer) => {
          data.push(chunk);
        })
        .on("end", () => {
          resolve(Buffer.concat(data));
        });
    });
  });
}
