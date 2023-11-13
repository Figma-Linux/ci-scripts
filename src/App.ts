import * as core from "@actions/core";
import ActionManager from "./actions/Manager";
import InputExtractor from "./inputExtractor";
import { Inputs } from "./types";

export default class {
  private inputs: Inputs;

  public constructor(
    private actionManager: ActionManager,
    private inputExtractor: InputExtractor
  ) {
    this.inputs = this.inputExtractor.getInputs();
  }

  public async start() {
    try {
      await this.actionManager.getAction(this.inputs.action).run();
    } catch (e) {
      const error = e as Error;
      core.error(
        `Error occur: ${error.message} in action: ${
          this.inputs.action
        }, trace: ${JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
        })}`
      );
    }
  }
}
