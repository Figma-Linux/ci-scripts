import BaseGenerator, { BaseConfig } from ".";
import SrcInfo from "../Builders/SrcInfo";

export default class FigmaGitSrcInfo extends BaseGenerator {
  constructor() {
    super(new SrcInfo());
  }

  public generate(): Buffer {
    if (!this.config) {
      throw new Error(
        `Errror in FigmaGitSrcInfo.generate(), config was not been passed!`
      );
    }

    const { pkgbase, pkgname, ...rest } = this.config;
    const entries = Object.entries(rest);

    this.builder.pushProp("pkgbase", pkgbase!);

    for (const entry of entries) {
      this.builder.pushProp(entry[0], entry[1]!, "true");
    }

    this.builder.pushProp("pkgname", pkgbase!);

    return this.builder.toBuffer();
  }

  public set config(cfg: BaseConfig) {
    const { pkgver, pkgrel, arch, ...rest } = cfg;
    this._config = {
      // https://wiki.archlinux.org/3title/PKGBUILD
      pkgbase: "figma-linux-git",
      pkgname: "figma-linux-git",
      pkgver,
      pkgrel,
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      arch,
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["git", "nodejs>=18.11.18", "npm>=9.8.1", "xdg-utils"],
      provides: ["figma-linux"],
      ...rest,
    };
  }
  public get config(): BaseConfig | undefined {
    return this._config;
  }
}
