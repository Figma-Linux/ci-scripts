import * as Core from "@actions/core";
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
      Core.info(
        `Start figma-linux-actions, CWD: ${process.cwd()}, __dirname: ${__dirname}, start action: ${
          this.inputs.action
        }`
      );

      this.actionManager.type = this.inputs.action;
      this.actionManager.token = this.inputs.token;

      await this.actionManager.getAction().run();
    } catch (e) {
      const error = e as Error;
      Core.setFailed(
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
      Core.error(error);
    });
    process.on("unhandledRejection", (error: Error) => {
      Core.error(error);
    });
  }
}
