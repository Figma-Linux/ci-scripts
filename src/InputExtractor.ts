import * as Core from "@actions/core";
import { EnumInputs, ActionInput } from "./constants";
import { Inputs } from "./types";

export default class {
  private _inputs: Inputs;

  constructor() {
    const actionStr = Core.getInput(EnumInputs.Action);
    const token = Core.getInput(EnumInputs.Token);

    Core.info(
      `InputExtractor: actionStr=${actionStr}, ${Object.values(
        ActionInput
      ).includes(actionStr as ActionInput)}, `
    );
    if (!Object.values(ActionInput).includes(actionStr as ActionInput)) {
      Core.setFailed(
        `Unknow action: ${actionStr} input. Available actions: ${Object.values(
          ActionInput
        )}`
      );
    }
    if (!token || token === "") {
      Core.setFailed(`Github token will not provided!`);
    }

    this._inputs = {
      action: actionStr as ActionInput,
      token,
    };
  }

  public get inputs(): Inputs {
    return this._inputs;
  }
}
