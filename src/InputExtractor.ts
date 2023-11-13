import * as core from "@actions/core";
import { EnumInputs, ActionInput } from "./constants";
import { Inputs } from "./types";

export default class {
  private _inputs: Inputs;

  constructor() {
    const actionStr = core.getInput(EnumInputs.Action);
    const token = core.getInput(EnumInputs.Token);

    if (!ActionInput[actionStr as keyof typeof ActionInput]) {
      core.setFailed(
        `Unknow action: ${actionStr} input. Available actions: ${Object.values(
          EnumInputs
        )}`
      );
    }
    if (!token || token === "") {
      core.setFailed(`Github token will not provided!`);
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
