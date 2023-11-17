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
      _pkgname: "figma-linux",
      pkgname: "${_pkgname}-bin",
      pkgver,
      pkgrel,
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      arch,
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["unzip", "xdg-utils"],
      // https://man.archlinux.org/man/PKGBUILD.5#OPTIONS_AND_DIRECTIVES
      options: ["!strip"],
      provides: ["${_pkgname}"],
      ...rest,
    };
  }
  public get config(): BaseConfig | undefined {
    return this._config;
  }

  private getPackageFunc() {
    return `package() {
  cd "\${srcdir}"

  install -D "\${srcdir}"/\${_pkgname}.desktop "\${pkgdir}"/usr/share/applications/\${_pkgname}.desktop
  install -D "\${srcdir}"/256x256.png "\${pkgdir}"/usr/share/pixmaps/\${_pkgname}.png

  for size in 24 36 48 64 72 96 128 192 256 384 512; do
    install -D "\${srcdir}/\${size}x\${size}.png" \\
                "\${pkgdir}/usr/share/icons/hicolor/\${size}x\${size}/apps/\${_pkgname}.png"
  done

  mkdir -p "\${pkgdir}/opt/\${_pkgname}"
  cp -rf ./* "\${pkgdir}/opt/\${_pkgname}"
  chmod 755 "\${pkgdir}/opt/\${_pkgname}/\${_pkgname}"

  mkdir -p "\${pkgdir}/usr/bin"
  ln -s "/opt/\${_pkgname}/\${_pkgname}" "\${pkgdir}/usr/bin/\${_pkgname}"

  xdg-mime default \${_pkgname}.desktop x-scheme-handler/figma
}`;
  }
}
