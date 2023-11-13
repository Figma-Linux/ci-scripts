import { EnumInputs, ActionInput } from "./constants";

export interface Inputs {
  [EnumInputs.Action]: ActionInput;
}
