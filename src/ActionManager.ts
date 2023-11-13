import BaseAction from "./utils/BaseAction";
import ActionAur from "./actions/ActionAur";
import ActionFlatpak from "./actions/ActionFlatpak";
import ActionLaunchpad from "./actions/ActionLaunchpad";
import Git from "./Git";
import { ActionInput } from "./constants";

export default class {
  public token: string = "";
  public type: ActionInput = ActionInput.PUBLISH_FLATPAK;

  constructor() {}

  public getAction(): BaseAction {
    switch (this.type) {
      case ActionInput.PUBLISH_AUR: {
        return new ActionAur(new Git(this.token));
      }
      case ActionInput.PUBLISH_FLATPAK: {
        return new ActionFlatpak(new Git(this.token));
      }
      case ActionInput.PUBLISH_LAUNCHPAD: {
        return new ActionLaunchpad(new Git(this.token));
      }
      default: {
        throw new Error(`Provided invalid action type: ${this.type}`);
      }
    }
  }
}
