import BaseBuilder from ".";

const KEY_VALUE_SEPARATOR = "=";

export default class PkgBuilder extends BaseBuilder {
  protected funcs: Set<string> = new Set();

  constructor() {
    super(KEY_VALUE_SEPARATOR);
  }

  public pushProp(key: string, value: string | string[]): void {
    const sep: { [key: string]: string } = {
      source: `"\n        "`,
      sha256sums: `"\n            "`,
    };
    const str = Array.isArray(value)
      ? `("${value.join(sep[key] ? sep[key] : '" "')}")`
      : `"${value}"`;

    this.props.push({
      key,
      value: str,
    });
  }
  public pushFunc(content: string): void {
    this.funcs.add(`\n\n${content}`);
  }

  public toString(): string {
    return [
      ...this.props.map((v) => `${v.key}${this.sep}${v.value}\n`),
      ...this.funcs,
    ].join("");
  }
}
