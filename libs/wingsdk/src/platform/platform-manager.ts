import { readFileSync } from "fs";
import { basename, dirname, join } from "path";
import * as vm from "vm";
import { IPlatform } from "./platform";
import { App, AppProps, SynthHooks } from "../core";

interface PlatformManagerOptions {
  readonly appProps: AppProps;
  /**
   * Either a builtin platform name or a path to a custom platform
   */
  readonly platformPaths?: string[];
}

const BUILTIN_PLATFORMS = ["tf-aws", "tf-azure", "tf-gcp", "sim"];

/** @internal */
export class PlatformManager {
  private readonly platformPaths: string[];
  private readonly appProps: AppProps;
  private readonly platformInstances: IPlatform[] = [];

  constructor(options: PlatformManagerOptions) {
    this.appProps = options.appProps;
    this.platformPaths = options.platformPaths ?? [];
    this.appProps;
  }

  private loadPlatformPath(platformPath: string) {
    const platformName = basename(platformPath);

    const isBuiltin = BUILTIN_PLATFORMS.includes(platformName);

    const pathToRead = isBuiltin
      ? join(__dirname, `../target-${platformName}/platform`)
      : join(platformPath);

    isBuiltin
      ? this.loadBuiltinPlatform(pathToRead)
      : this.loadCustomPlatform(pathToRead);
  }

  /**
   * Builtin platforms are loaded from the SDK
   *
   * @param builtinPlatformPath path to a builtin platform
   */
  private loadBuiltinPlatform(builtinPlatformPath: string) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loadedPlatform = require(builtinPlatformPath);
    if (!loadedPlatform || !loadedPlatform.Platform) {
      console.error(`Failed to load platform from ${builtinPlatformPath}`);
      return;
    }

    this.platformInstances.push(new loadedPlatform.Platform());
  }

  /**
   * Custom platforms need to be loaded into a custom context in order to
   * resolve their dependencies correctly.
   *
   * @param customPlatformPath path to a custom platform
   */
  private loadCustomPlatform(customPlatformPath: string) {
    const isScoped = customPlatformPath.startsWith('@');
    const modulePaths = module.paths;
    const platformBaseDir = isScoped ? dirname(dirname(customPlatformPath)) : dirname(customPlatformPath);
    const platformDir = join(platformBaseDir, 'node_modules');
  
    const fullCustomPlatformPath = customPlatformPath.endsWith('.js')
    ? customPlatformPath
    : isScoped 
      ? join(platformDir, `${customPlatformPath}/lib/index.js`) 
      : `${customPlatformPath}/index.js`;

    const customPlatformLibDir = join(platformBaseDir, 'node_modules', '@hasanaburayyan', 'awscdk', 'lib'); // TODO: parse this from path

    // const pathToRead = isBuiltin
    //   ? join(__dirname, `../target-${platformName}/platform`)
    //   : join(platformPath);

    const resolvablePaths = [...modulePaths, __dirname, platformDir, customPlatformLibDir];
    const requireResolve = (path: string) => {
      return require.resolve(path, {
        paths: resolvablePaths,
      });
    };
  
    const platformRequire = (path: string) => {
      return require(requireResolve(path));
    };

    platformRequire.resolve = requireResolve;
  
    const platformExports = {};
    const context = vm.createContext({
      require: platformRequire,
      console,
      exports: platformExports,
      process,
      __dirname: customPlatformPath,
    });
  
    try {
      const platformCode = readFileSync(fullCustomPlatformPath, 'utf-8');
      const script = new vm.Script(platformCode);
      script.runInContext(context);
      this.platformInstances.push(new (platformExports as any).Platform());
    } catch (error) {
      console.error('An error occurred while loading the custom platform:', error);
    }
  }

  private createPlatformInstances() {
    this.platformPaths.forEach((platformPath) => {
      this.loadPlatformPath(platformPath);
    });
  }

  // This method is called from preflight.js in order to return an App instance
  // that can be synthesized, so need to ignore the "declared but never read"
  // @ts-ignore-next-line
  private createApp(appProps: AppProps): App {
    this.createPlatformInstances();

    let appCall = this.platformInstances[0].newApp;

    if (!appCall) {
      throw new Error(
        `No newApp method found on platform: ${this.platformPaths[0]} (Hint: The first platform provided must have a newApp method)`
      );
    }

    let synthHooks: SynthHooks = {
      preSynthesize: [],
      postSynthesize: [],
      validate: [],
    };

    let newInstanceOverrides: any[] = [];

    this.platformInstances.forEach((instance) => {
      if (instance.preSynth) {
        synthHooks.preSynthesize!.push(instance.preSynth);
      }

      if (instance.postSynth) {
        synthHooks.postSynthesize!.push(instance.postSynth);
      }

      if (instance.validate) {
        synthHooks.validate!.push(instance.validate);
      }

      if (instance.newInstance) {
        newInstanceOverrides.push(instance.newInstance);
      }
    });

    return appCall!({ ...appProps, synthHooks, newInstanceOverrides }) as App;
  }
}
