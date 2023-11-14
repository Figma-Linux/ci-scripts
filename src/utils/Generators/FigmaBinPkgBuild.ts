import BaseGenerator, { BaseConfig } from ".";
import PkgBuild from "../Builders/PkgBuild";

export default class FigmaBinPkgBuild extends BaseGenerator {
  protected funcs: Set<string> = new Set();

  constructor() {
    super(new PkgBuild());
  }

  public generate(): Buffer {
    if (!this.config) {
      throw new Error(
        `Errror in FigmaBinPkgBuild.generate(), config was not been passed!`
      );
    }

    const entries = Object.entries(this.config);

    for (const entry of entries) {
      this.builder.pushProp(entry[0], entry[1]!);
    }

    this.builder.pushFunc(this.getPackageFunc());

    return this.builder.toBuffer();
  }

  public set config(cfg: BaseConfig) {
    const { pkgver, pkgrel, arch, ...rest } = cfg;
    this._config = {
      // https://wiki.archlinux.org/title/PKGBUILD
      pkgname: "figma-linux-bin",
      pkgver,
      pkgrel,
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      arch,
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-git"],
      // https://man.archlinux.org/man/PKGBUILD.5#OPTIONS_AND_DIRECTIVES
      options: ["!strip"],
      ...rest,
    };
  }
  public get config(): BaseConfig | undefined {
    return this._config;
  }

  private getPackageFunc() {
    return `package() {
  cd "\${srcdir}"

  install -D "\${srcdir}"/figma-linux.desktop "\${pkgdir}"/usr/share/applications/figma-linux.desktop
  install -D "\${srcdir}"/256x256.png "\${pkgdir}"/usr/share/pixmaps/figma-linux.png

  for size in 24 36 48 64 72 96 128 192 256 384 512; do
    install -D "\${srcdir}/\${size}x\${size}.png" \\
                "\${pkgdir}/usr/share/icons/hicolor/\${size}x\${size}/apps/figma-linux.png"
  done

  mkdir -p "\${pkgdir}/opt/\${pkgname}"
  cp -rf ./* "\${pkgdir}/opt/\${pkgname}"

  mkdir -p "\${pkgdir}/usr/bin"
  chmod 755 "/opt/\${pkgname}/figma-linux"
  ln -s "/opt/\${pkgname}/figma-linux" "\${pkgdir}/usr/bin/figma-linux"

  xdg-mime default figma-linux.desktop x-scheme-handler/figma
}`;
  }
}
