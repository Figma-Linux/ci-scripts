import BaseAction from ".";
import AurAction from "./Aur";
import FlatpakAction from "./Flatpak";
import LaunchpadAction from "./Launchpad";
import { ActionInput } from "../constants";

export default class {
  constructor() {}

  public getAction(type: ActionInput): BaseAction {
    switch (type) {
      case ActionInput.PUBLISH_AUR: {
        return new AurAction();
      }
      case ActionInput.PUBLISH_FLATPAK: {
        return new FlatpakAction();
      }
      case ActionInput.PUBLISH_LAUNCHPAD: {
        return new LaunchpadAction();
      }
      default: {
        throw new Error(`Provided invalid action type: ${type}`);
      }
    }
  }
}
