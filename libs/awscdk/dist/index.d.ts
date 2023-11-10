import { Construct } from 'constructs';
import * as std from '@winglang/sdk/lib/std';
import { IInflightHost } from '@winglang/sdk/lib/std';
import { Tokens } from '@winglang/sdk/lib/core/tokens';
import { AppProps, App as App$1 } from '@winglang/sdk/lib/core';
import { Bucket as Bucket$1 } from 'aws-cdk-lib/aws-s3';
import * as cloud from '@winglang/sdk/lib/cloud';
import { Function as Function$1, IEventSource } from 'aws-cdk-lib/aws-lambda';
import { IAwsFunction, PolicyStatement } from '@winglang/sdk/lib/shared-aws';
import { Topic as Topic$1 } from 'aws-cdk-lib/aws-sns';
import * as ex from '@winglang/sdk/lib/ex';
import { IPlatform } from '@winglang/sdk/lib/platform';

/**
 * AWS implementation of `cloud.TestRunner`.
 *
 * @inflight `@winglang/sdk.cloud.ITestRunnerClient`
 */
declare class TestRunner extends std.TestRunner {
    constructor(scope: Construct, id: string, props?: std.TestRunnerProps);
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _preSynthesize(): void;
    private getTestFunctionArns;
    /** @internal */
    _toInflight(): string;
    private envTestFunctionArns;
}

/**
 * Represents values that can only be resolved after the app is synthesized.
 * Tokens values are captured as environment variable, and resolved through the compilation target token mechanism.
 */
declare class CdkTokens extends Tokens {
    /**
     * Returns true is the given value is a CDK token.
     */
    isToken(value: any): boolean;
    /**
     * "Lifts" a value into an inflight context.
     */
    lift(value: any): string;
    /**
     * Binds the given token to the host.
     */
    onLiftValue(host: IInflightHost, value: any): void;
}

/**
 * AWS-CDK App props
 */
interface CdkAppProps extends AppProps {
    /**
     * CDK Stack Name
     * @default - undefined
     */
    readonly stackName?: string;
}
/**
 * An app that knows how to synthesize constructs into CDK configuration.
 */
declare class App extends App$1 {
    readonly outdir: string;
    readonly isTestEnvironment: boolean;
    readonly _tokens: CdkTokens;
    readonly _target = "awscdk";
    private readonly cdkApp;
    private readonly cdkStack;
    private synthed;
    private synthedOutput;
    private synthHooks?;
    /**
     * The test runner for this app.
     */
    protected readonly testRunner: TestRunner;
    constructor(props: CdkAppProps);
    /**
     * Synthesize the app into CDK configuration in a `cdk.out` directory.
     *
     * This method returns a cleaned snapshot of the resulting CDK template
     * for unit testing.
     */
    synth(): string;
    protected typeForFqn(fqn: string): any;
}

/**
 * AWS implementation of `cloud.Bucket`.
 *
 * @inflight `@winglang/sdk.cloud.IBucketClient`
 */
declare class Bucket extends cloud.Bucket {
    private readonly bucket;
    private readonly public;
    private bucketDeployment?;
    constructor(scope: Construct, id: string, props?: cloud.BucketProps);
    addObject(key: string, body: string): void;
    protected eventHandlerLocation(): string;
    private onEventFunction;
    /** @internal */
    _supportedOps(): string[];
    onCreate(inflight: cloud.IBucketEventHandler, opts?: cloud.BucketOnCreateOptions): void;
    onDelete(inflight: cloud.IBucketEventHandler, opts?: cloud.BucketOnDeleteOptions): void;
    onUpdate(inflight: cloud.IBucketEventHandler, opts?: cloud.BucketOnUpdateOptions): void;
    onEvent(inflight: cloud.IBucketEventHandler, opts?: cloud.BucketOnEventOptions): void;
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    private isPublicEnvName;
    private envName;
}
declare function createEncryptedBucket(scope: Construct, isPublic: boolean, name?: string): Bucket$1;

/**
 * AWS implementation of `cloud.Counter`.
 *
 * @inflight `@winglang/sdk.cloud.ICounterClient`
 */
declare class Counter extends cloud.Counter {
    private readonly table;
    constructor(scope: Construct, id: string, props?: cloud.CounterProps);
    /** @internal */
    _supportedOps(): string[];
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    private envName;
}

/**
 * AWS implementation of `cloud.Function`.
 *
 * @inflight `@winglang/sdk.cloud.IFunctionClient`
 */
declare class Function extends cloud.Function implements IAwsFunction {
    private readonly function;
    /** Function ARN */
    readonly arn: string;
    constructor(scope: Construct, id: string, inflight: cloud.IFunctionHandler, props?: cloud.FunctionProps);
    /** @internal */
    _supportedOps(): string[];
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    /**
     * Add environment variable to the function.
     */
    addEnvironment(name: string, value: string): void;
    /**
     * Add a policy statement to the Lambda role.
     */
    addPolicyStatements(...statements: PolicyStatement[]): void;
    /** @internal */
    get _functionName(): string;
    /** @internal */
    get _function(): Function$1;
    /** @internal */
    _addEventSource(eventSource: IEventSource): void;
    private envName;
}

/**
 * AWS implementation of `cloud.Queue`.
 *
 * @inflight `@winglang/sdk.cloud.IQueueClient`
 */
declare class Queue extends cloud.Queue {
    private readonly queue;
    private readonly timeout;
    constructor(scope: Construct, id: string, props?: cloud.QueueProps);
    setConsumer(inflight: cloud.IQueueSetConsumerHandler, props?: cloud.QueueSetConsumerOptions): cloud.Function;
    /** @internal */
    _supportedOps(): string[];
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    private envName;
}

/**
 * AWS implementation of `cloud.Schedule`.
 *
 * @inflight `@winglang/sdk.cloud.IScheduleClient`
 */
declare class Schedule extends cloud.Schedule {
    private readonly scheduleExpression;
    private readonly rule;
    constructor(scope: Construct, id: string, props?: cloud.ScheduleProps);
    onTick(inflight: cloud.IScheduleOnTickHandler, props?: cloud.ScheduleOnTickOptions | undefined): cloud.Function;
    /** @internal */
    _toInflight(): string;
    private envName;
}

/**
 * AWS Implemntation of `cloud.Secret`
 *
 * @inflight `@winglang/sdk.cloud.ISecretClient`
 */
declare class Secret extends cloud.Secret {
    private readonly secret;
    private readonly arnForPolicies;
    constructor(scope: Construct, id: string, props?: cloud.SecretProps);
    /** @internal */
    _supportedOps(): string[];
    /**
     * Secret's arn
     */
    get arn(): string;
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    private envName;
}

/**
 * AWS Implementation of `cloud.Topic`.
 *
 * @inflight `@winglang/sdk.cloud.ITopicClient`
 */
declare class Topic extends cloud.Topic {
    private readonly topic;
    constructor(scope: Construct, id: string, props?: cloud.TopicProps);
    /**
     * Topic's arn
     */
    get arn(): string;
    onMessage(inflight: cloud.ITopicOnMessageHandler, props?: cloud.TopicOnMessageOptions): cloud.Function;
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _toInflight(): string;
    /** @internal */
    get _topic(): Topic$1;
    private envName;
}

/**
 * AWS implementation of `cloud.Website`.
 *
 * @inflight `@winglang/sdk.cloud.IWebsiteClient`
 */
declare class Website extends cloud.Website {
    private readonly bucket;
    private readonly _url;
    constructor(scope: Construct, id: string, props: cloud.WebsiteProps);
    get url(): string;
    addFile(path: string, data: string, options?: cloud.AddFileOptions): string;
    private formatPath;
    /** @internal */
    _toInflight(): string;
}

/**
 * AWS implementation of `ex.DynamodbTable`.
 *
 * @inflight `@winglang/sdk.ex.IDynamodbTableClient`
 */
declare class DynamodbTable extends ex.DynamodbTable {
    private readonly table;
    constructor(scope: Construct, id: string, props: ex.DynamodbTableProps);
    onLift(host: IInflightHost, ops: string[]): void;
    /** @internal */
    _supportedOps(): string[];
    _toInflight(): string;
    private envName;
}

/**
 * AWS implementation of `cloud.OnDeploy`.
 *
 * @inflight `@winglang/sdk.cloud.IOnDeployClient`
 */
declare class OnDeploy extends cloud.OnDeploy {
    constructor(scope: Construct, id: string, handler: cloud.IOnDeployHandler, props?: cloud.OnDeployProps);
    /** @internal */
    _toInflight(): string;
}

/**
 * AWS CDK Platform
 */
declare class Platform implements IPlatform {
    /** Platform model */
    readonly target = "awscdk";
    newApp?(appProps: any): any;
}

export { App, Bucket, CdkAppProps, CdkTokens, Counter, DynamodbTable, Function, OnDeploy, Platform, Queue, Schedule, Secret, TestRunner, Topic, Website, createEncryptedBucket };
