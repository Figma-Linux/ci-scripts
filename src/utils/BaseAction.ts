import BaseClient from "../utils/BaseClient";

export default abstract class {
  public constructor(protected baseClient: BaseClient) {}

  abstract run(): void;
}
