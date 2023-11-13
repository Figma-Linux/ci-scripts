import * as core from "@actions/core";
import { EnumInputs, ActionInput } from "./constants";
import { Inputs } from "./types";

export default class {
  constructor() {}

  public getInputs(): Inputs {
    const actionStr = core.getInput(EnumInputs.Action);

    if (!ActionInput[actionStr as keyof typeof ActionInput]) {
      core.setFailed(
        `Unknow action: ${actionStr} input. Available actions: ${Object.values(
          EnumInputs
        )}`
      );
    }

    return {
      action: actionStr as ActionInput,
    };
  }
}
