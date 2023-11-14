export interface PropItem {
  key: string;
  value: string;
}

export default abstract class BaseBuilder {
  protected props: PropItem[] = [];

  constructor(protected sep: string) {}

  abstract pushProp(
    key: string,
    value: string | string[],
    parent?: string
  ): void;
  abstract pushFunc(content: string): void;

  public toString(): string {
    return this.props.map((v) => `${v.key}${this.sep}${v.value}`).join("\n");
  }
  public toBuffer(): Buffer {
    return Buffer.from(this.toString());
  }
}
