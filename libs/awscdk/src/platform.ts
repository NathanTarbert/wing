import { App } from "./app";
import { IPlatform } from "@winglang/sdk/lib/platform";

/**
 * AWS CDK Platform
 */
export class Platform implements IPlatform {
  /** Platform model */
  public readonly target = "awscdk";

  public newApp?(appProps: any): any {
    return new App(appProps);
  }
}
