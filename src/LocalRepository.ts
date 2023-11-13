export default class {
  constructor(private pathToLocalRepo: string) {}

  public async add(files: string[]) {}
  public async commit(msg: string) {}
  public async push(branch: string = "master") {}
  public async pull(branch: string = "master") {}
}
