import BaseBuilder from "../Builders";

export interface RequireConfig {
  pkgver: string;
  pkgrel: string;
  arch: string[];
  source: string[];
  sha256sums: string[];
}

export interface Config extends RequireConfig {
  pkgbase?: string;
  pkgname?: string;
  pkgdesc?: string;
  url?: string;
  license?: string[];
  depends?: string[];
  makedepends?: string[];
  provides?: string[];
  conflicts?: string[];
  options?: string[];
}

export interface BaseConfig extends Config {
  [key: string]: string | undefined | string[];
}

export default abstract class BaseGenerator {
  protected _config?: BaseConfig;

  constructor(protected builder: BaseBuilder) {}

  abstract generate(): Buffer;
  abstract set config(cfg: BaseConfig);
  abstract get config(): BaseConfig | undefined;
}
