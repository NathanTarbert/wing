import * as fs from "fs";
import * as path from "path";
import { Api } from "./api";
import { Bucket } from "./bucket";
import { Counter } from "./counter";
import { Domain } from "./domain";
import { DynamodbTable } from "./dynamodb-table";
import { EVENT_MAPPING_FQN } from "./event-mapping";
import { Function } from "./function";
import { OnDeploy } from "./on-deploy";
import { Queue } from "./queue";
import { ReactApp } from "./react-app";
import { Redis } from "./redis";
import { isSimulatorResource } from "./resource";
import { Schedule } from "./schedule";
import { Secret } from "./secret";
import { Service } from "./service";
import { STATE_FQN, State } from "./state";
import { Table } from "./table";
import { TestRunner } from "./test-runner";
import { SimTokens } from "./tokens";
import { Topic } from "./topic";
import { Website } from "./website";
import {
  API_FQN,
  BUCKET_FQN,
  COUNTER_FQN,
  DOMAIN_FQN,
  FUNCTION_FQN,
  ON_DEPLOY_FQN,
  QUEUE_FQN,
  SCHEDULE_FQN,
  SECRET_FQN,
  SERVICE_FQN,
  TOPIC_FQN,
  WEBSITE_FQN,
} from "../cloud";
import { SDK_VERSION } from "../constants";
import * as core from "../core";
import { preSynthesizeAllConstructs } from "../core/app";
import { TABLE_FQN, REDIS_FQN, DYNAMODB_TABLE_FQN, REACT_APP_FQN } from "../ex";
import { TypeSchema, WingSimulatorSchema } from "../simulator/simulator";
import { TEST_RUNNER_FQN } from "../std";

/**
 * Path of the simulator configuration file in every .wsim tarball.
 */
export const SIMULATOR_FILE_PATH = "simulator.json";

const SIMULATOR_CLASS_DATA = {
  [API_FQN]: "Api",
  [BUCKET_FQN]: "Bucket",
  [COUNTER_FQN]: "Counter",
  [DOMAIN_FQN]: "Domain",
  [DYNAMODB_TABLE_FQN]: "DynamodbTable",
  [EVENT_MAPPING_FQN]: "EventMapping",
  [FUNCTION_FQN]: "Function",
  [ON_DEPLOY_FQN]: "OnDeploy",
  [QUEUE_FQN]: "Queue",
  [REACT_APP_FQN]: "ReactApp",
  [REDIS_FQN]: "Redis",
  [SCHEDULE_FQN]: "Schedule",
  [SECRET_FQN]: "Secret",
  [SERVICE_FQN]: "Service",
  [STATE_FQN]: "State",
  [TABLE_FQN]: "Table",
  [TEST_RUNNER_FQN]: "TestRunner",
  [TOPIC_FQN]: "Topic",
  [WEBSITE_FQN]: "Website",
};

/**
 * A construct that knows how to synthesize simulator resources into a
 * Wing simulator (.wsim) file.
 */
export class App extends core.App {
  public readonly outdir: string;
  public readonly isTestEnvironment: boolean;
  public readonly _tokens: SimTokens;

  public readonly _target = "sim";

  /**
   * The test runner for this app.
   */
  protected readonly testRunner: TestRunner;

  private synthed = false;

  constructor(props: core.AppProps) {
    // doesn't allow customize the root id- as used hardcoded in the code
    super(undefined as any, "root", props);
    this.outdir = props.outdir ?? ".";
    this.isTestEnvironment = props.isTestEnvironment ?? false;
    this._tokens = new SimTokens();

    this.testRunner = new TestRunner(this, "cloud.TestRunner");

    this.synthRoots(props, this.testRunner);
  }

  /** @internal */
  public _inflightClientForFqn(fqn: string): string | undefined {
    switch (fqn) {
      case API_FQN:
        return require.resolve("./api.inflight");

      case BUCKET_FQN:
        return require.resolve("./bucket.inflight");

      case COUNTER_FQN:
        return require.resolve("./counter.inflight");

      case DOMAIN_FQN:
        return require.resolve("./domain.inflight");

      case DYNAMODB_TABLE_FQN:
        return require.resolve("./dynamodb-table.inflight");

      case EVENT_MAPPING_FQN:
        return require.resolve("./event-mapping.inflight");

      case FUNCTION_FQN:
        return require.resolve("./function.inflight");

      case ON_DEPLOY_FQN:
        return require.resolve("./on-deploy.inflight");

      case QUEUE_FQN:
        return require.resolve("./queue.inflight");

      case REACT_APP_FQN:
        return require.resolve("./react-app.inflight");

      case REDIS_FQN:
        return require.resolve("./redis.inflight");

      case SCHEDULE_FQN:
        return require.resolve("./schedule.inflight");

      case SECRET_FQN:
        return require.resolve("./secret.inflight");

      case SERVICE_FQN:
        return require.resolve("./service.inflight");

      case STATE_FQN:
        return require.resolve("./state.inflight");

      case TABLE_FQN:
        return require.resolve("./table.inflight");

      case TEST_RUNNER_FQN:
        return require.resolve("./test-runner.inflight");

      case TOPIC_FQN:
        return require.resolve("./topic.inflight");

      case WEBSITE_FQN:
        return require.resolve("./website.inflight");
    }

    return undefined;
  }

  protected typeForFqn(fqn: string): any {
    switch (fqn) {
      case API_FQN:
        return Api;

      case BUCKET_FQN:
        return Bucket;

      case COUNTER_FQN:
        return Counter;

      case DOMAIN_FQN:
        return Domain;

      case DYNAMODB_TABLE_FQN:
        return DynamodbTable;

      // EVENT_MAPPING_FQN skipped - it's not a multi-target construct

      case FUNCTION_FQN:
        return Function;

      case ON_DEPLOY_FQN:
        return OnDeploy;

      case QUEUE_FQN:
        return Queue;

      case REACT_APP_FQN:
        return ReactApp;

      case REDIS_FQN:
        return Redis;

      case SCHEDULE_FQN:
        return Schedule;

      case SECRET_FQN:
        return Secret;

      case SERVICE_FQN:
        return Service;

      case STATE_FQN:
        return State;

      case TABLE_FQN:
        return Table;

      case TEST_RUNNER_FQN:
        return TestRunner;

      case TOPIC_FQN:
        return Topic;

      case WEBSITE_FQN:
        return Website;
    }

    return undefined;
  }

  /**
   * Synthesize the app. This creates a tree.json file and a .wsim file in the
   * app's outdir, and returns a path to the .wsim directory.
   */
  public synth(): string {
    if (this.synthed) {
      return this.outdir;
    }

    fs.mkdirSync(this.outdir, { recursive: true });

    // call preSynthesize() on every construct in the tree
    preSynthesizeAllConstructs(this);

    // write simulator.json file into workdir
    this.synthSimulatorFile(this.outdir);

    // write tree.json file into workdir
    core.synthesizeTree(this, this.outdir);

    // write `outdir/connections.json`
    core.Connections.of(this).synth(this.outdir);

    this.synthed = true;

    return this.outdir;
  }

  private synthSimulatorFile(outdir: string) {
    const resources = new core.DependencyGraph(this.node)
      .topology()
      .filter(isSimulatorResource)
      .map((res) => res.toSimulator());

    const types: { [fqn: string]: TypeSchema } = {};
    for (const [fqn, className] of Object.entries(SIMULATOR_CLASS_DATA)) {
      const sourcePath = this._inflightClientForFqn(fqn);
      if (!sourcePath) {
        throw new Error(`No source path for ${fqn}`);
      }
      types[fqn] = {
        className,
        sourcePath,
      };
    }

    const contents: WingSimulatorSchema = {
      types,
      resources,
      sdkVersion: SDK_VERSION,
    };

    // write simulator.json file
    fs.writeFileSync(
      path.join(outdir, SIMULATOR_FILE_PATH),
      JSON.stringify(contents, undefined, 2),
      { encoding: "utf8" }
    );
  }
}
