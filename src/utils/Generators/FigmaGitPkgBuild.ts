import BaseGenerator, { BaseConfig } from ".";
import PkgBuild from "../Builders/PkgBuild";

export default class FigmaGitPkgBuild extends BaseGenerator {
  protected funcs: Set<string> = new Set();

  constructor() {
    super(new PkgBuild());
  }

  public generate(): Buffer {
    if (!this.config) {
      throw new Error(
        `Errror in FigmaGitPkgBuild.generate(), config was not been passed!`
      );
    }

    const entries = Object.entries(this.config);

    for (const entry of entries) {
      this.builder.pushProp(entry[0], entry[1]!);
    }

    this.builder.pushFunc(this.getPkgverFunc());
    this.builder.pushFunc(this.getBuildFunc());
    this.builder.pushFunc(this.getPackageFunc());

    return this.builder.toBuffer();
  }

  // TODO:
  public set config(cfg: BaseConfig) {
    const { pkgver, pkgrel, arch, ...rest } = cfg;
    this._config = {
      // https://wiki.archlinux.org/title/PKGBUILD
      _pkgname: "figma-linux",
      pkgname: "${_pkgname}-git",
      pkgver,
      pkgrel,
      arch,
      pkgdesc:
        "The collaborative interface design tool. Unofficial Figma desktop client for Linux",
      url: "https://github.com/Figma-Linux/figma-linux",
      license: ["GPL2"],
      depends: ["hicolor-icon-theme"],
      makedepends: ["git", "nodejs>=18.11.18", "npm>=9.8.1", "xdg-utils"],
      conflicts: ["figma-linux", "figma-linux-bin"],
      // https://man.archlinux.org/man/PKGBUILD.5#OPTIONS_AND_DIRECTIVES
      provides: ["${_pkgname}"],
      ...rest,
    };
  }
  public get config(): BaseConfig | undefined {
    return this._config;
  }

  private getPkgverFunc() {
    return `pkgver() {
  cd "\${srcdir}/\${_pkgname}"
  git describe --long --tags --exclude='*[a-z][a-z]*' | sed -E 's/^v//;s/([^-]*-g)/r\\1/;s/-/./g'
}`;
  }

  private getBuildFunc() {
    return `build() {
  cd "\${srcdir}/\${_pkgname}"
  npm install --no-frozen-lockfile
  npm run build
  ./node_modules/.bin/electron-builder --config=config/builder.json -l dir --c.directories.output=./out
}`;
  }

  private getPackageFunc() {
    return `package() {
  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/resources/app.asar" -t "\${pkgdir}/usr/lib/\${_pkgname}"
  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/lib/\${CARCH}-linux-gnu/"* -t "\${pkgdir}/usr/lib/\${_pkgname}/lib"
  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/usr/lib/\${CARCH}-linux-gnu/"*.* -t "\${pkgdir}/usr/lib/\${_pkgname}/lib"
  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/usr/lib/\${CARCH}-linux-gnu/nss/"* -t "\${pkgdir}/usr/lib/\${_pkgname}/lib/nss"
  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/swiftshader/"* -t "\${pkgdir}/usr/lib/\${_pkgname}/swiftshader"

  for _icons in 24x24 36x36 48x48 64x64 96x96 128x128 256x256 512x512;do
    install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/icons/\${_icons}.png" \\
          "\${pkgdir}/usr/share/icons/hicolor/\${_icons}/apps/\${_pkgname}.png"
  done

  install -Dm644 "\${srcdir}/\${_pkgname}/out/linux-unpacked/icons/scalable.svg" \\
          "\${pkgdir}/usr/share/icons/hicolor/scalable/apps/\${_pkgname}.svg"
  install -Dm644 "\${srcdir}/\${_pkgname}/resources/\${_pkgname}.desktop" -t "\${pkgdir}/usr/share/applications"

  mkdir -p "\${pkgdir}/opt/\${_pkgname}"
  chmod 755 "\${srcdir}/\${_pkgname}/out/linux-unpacked/\${_pkgname}"
  cp -rf \${srcdir}/\${_pkgname}/out/linux-unpacked/* \${pkgdir}/opt/\${_pkgname}

  mkdir -p "\${pkgdir}/usr/bin"
  ln -s "/opt/\${_pkgname}/\${_pkgname}" "\${pkgdir}/usr/bin/\${_pkgname}"

  xdg-mime default \${_pkgname}.desktop x-scheme-handler/figma
}`;
  }
}
