import { resolve } from "path";

export const FIGMA_REPO = "figma-linux";
export const FIGMA_REPO_OWNER = "Figma-linux";
export const FILES_DIR = resolve(process.cwd(), "./files");

export const FLATPAK_REPO_URL =
  "git@github.com:flathub/io.github.Figma_Linux.figma_linux.git";
export const FLATPAK_REPO_DEST = "flatpak";

export const AUR_REPO_BIN_URL =
  "ssh://aur@aur.archlinux.org/figma-linux-bin.git";
export const AUR_REPO_BIN_DEST = "aur-bin";

export const AUR_REPO_GIT_URL =
  "ssh://aur@aur.archlinux.org/figma-linux-git.git";
export const AUR_REPO_GIT_DEST = "aur-git";

export const FLATPAK_FILES_REGEXP = /^figma-linux_.*_linux_.*\.deb$/;
export const AUR_BIN_FILES_REGEXP = /^figma-linux_.*_linux_.*\.zip$/;
export const AUR_SKIP_FILES_REGEXP =
  /(\.git.*|\.SRCINFO|.*version.*|PKGBUILD|package)/;

export const TAG_REGEXP = /^v[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}$/;
export const VERSION_REGEXP = /[0-9]{1,5}\.[0-9]{1,5}\.[0-9]{1,5}/;

export enum EnumInputs {
  Action = "action",
  Token = "token",
}

export enum ActionInput {
  PUBLISH_LAUNCHPAD = "publish_launchpad",
  PUBLISH_FLATPAK = "publish_flatpak",
  PUBLISH_AUR_BIN = "publish_aur_bin",
  PUBLISH_AUR_GIT = "publish_aur_git",
}
