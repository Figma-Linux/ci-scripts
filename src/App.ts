import * as core from "@actions/core";
import ActionManager from "./ActionManager";
import InputExtractor from "./InputExtractor";
import { Inputs } from "./types";

export default class {
  private inputs: Inputs;

  public constructor(
    private actionManager: ActionManager,
    private inputExtractor: InputExtractor
  ) {
    this.inputs = this.inputExtractor.inputs;

    this.handleEvents();
  }

  public async start() {
    try {
      this.actionManager.type = this.inputs.action;
      this.actionManager.token = this.inputs.token;

      await this.actionManager.getAction().run();
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

  private handleEvents() {
    process.on("uncaughtException", (error: Error) => {
      core.error(error);
    });
    process.on("unhandledRejection", (error: Error) => {
      core.error(error);
    });
  }
}
