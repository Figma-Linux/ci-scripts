import { resolve } from "path";

export const FIGMA_REPO = "figma-linux";
export const FIGMA_REPO_OWNER = "Figma-linux";
export const FILES_DIR = resolve(process.cwd(), "./files");

export enum EnumInputs {
  Action = "action",
  Token = "token",
}

export enum ActionInput {
  PUBLISH_LAUNCHPAD = "publish_launchpad",
  PUBLISH_FLATPAK = "publish_flatpak",
  PUBLISH_AUR = "publish_aur",
}
