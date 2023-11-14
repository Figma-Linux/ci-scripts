import BaseBuilder, { PropItem } from ".";

const KEY_VALUE_SEPARATOR = " = ";

export default class SrcInfoBuilder extends BaseBuilder {
  constructor() {
    super(KEY_VALUE_SEPARATOR);
  }

  public pushProp(
    key: string,
    value: string | string[],
    parent?: string
  ): void {
    if (Array.isArray(value)) {
      for (const v of value) {
        this.props.push({
          key: parent ? `	${key}` : key,
          value: v,
        });
      }
    } else {
      this.props.push({
        key: parent ? `	${key}` : key,
        value,
      });
    }
  }
  public pushFunc(content: string): void {
    throw new Error(`The .SRCINFO doesn't support functions`);
  }
}
