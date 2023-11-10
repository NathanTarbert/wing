"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  App: () => App,
  Bucket: () => Bucket2,
  CdkTokens: () => CdkTokens,
  Counter: () => Counter2,
  DynamodbTable: () => DynamodbTable2,
  Function: () => Function2,
  OnDeploy: () => OnDeploy2,
  Platform: () => Platform,
  Queue: () => Queue2,
  Schedule: () => Schedule2,
  Secret: () => Secret2,
  TestRunner: () => TestRunner2,
  Topic: () => Topic2,
  Website: () => Website2,
  createEncryptedBucket: () => createEncryptedBucket
});
module.exports = __toCommonJS(src_exports);

// src/app.ts
var import_fs = require("fs");
var import_path7 = require("path");
var cdk = __toESM(require("aws-cdk-lib"));
var import_assertions = require("aws-cdk-lib/assertions");
var import_safe_stable_stringify = __toESM(require("safe-stable-stringify"));

// src/bucket.ts
var import_path2 = require("path");
var import_aws_cdk_lib2 = require("aws-cdk-lib");
var import_aws_s3 = require("aws-cdk-lib/aws-s3");
var import_aws_s3_deployment = require("aws-cdk-lib/aws-s3-deployment");
var import_aws_s3_notifications = require("aws-cdk-lib/aws-s3-notifications");

// src/function.ts
var import_path = require("path");
var import_aws_cdk_lib = require("aws-cdk-lib");
var import_aws_iam = require("aws-cdk-lib/aws-iam");
var import_aws_lambda = require("aws-cdk-lib/aws-lambda");
var cloud = __toESM(require("@winglang/sdk/lib/cloud"));
var core = __toESM(require("@winglang/sdk/lib/core"));
var import_bundling = require("@winglang/sdk/lib/shared/bundling");
var Function2 = class extends cloud.Function {
  constructor(scope, id, inflight, props = {}) {
    super(scope, id, inflight, props);
    const bundle = (0, import_bundling.createBundle)(this.entrypoint);
    const logRetentionDays = props.logRetentionDays === void 0 ? 30 : props.logRetentionDays < 0 ? void 0 : props.logRetentionDays;
    this.function = new import_aws_lambda.Function(this, "Default", {
      handler: "index.handler",
      code: import_aws_lambda.Code.fromAsset((0, import_path.resolve)(bundle.directory)),
      runtime: import_aws_lambda.Runtime.NODEJS_18_X,
      environment: this.env,
      timeout: props.timeout ? import_aws_cdk_lib.Duration.seconds(props.timeout.seconds) : import_aws_cdk_lib.Duration.minutes(1),
      memorySize: props.memory ?? 1024,
      architecture: import_aws_lambda.Architecture.ARM_64,
      logRetention: logRetentionDays
    });
    this.arn = this.function.functionArn;
  }
  /** @internal */
  _supportedOps() {
    return [cloud.FunctionInflightMethods.INVOKE];
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("functions can only be bound by awscdk.Function for now");
    }
    if (ops.includes(cloud.FunctionInflightMethods.INVOKE)) {
      host.addPolicyStatements({
        actions: ["lambda:InvokeFunction"],
        resources: [`${this.function.functionArn}`]
      });
    }
    host.addEnvironment(this.envName(), this.function.functionArn);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "FunctionClient",
      [`process.env["${this.envName()}"], "${this.node.path}"`]
    );
  }
  /**
   * Add environment variable to the function.
   */
  addEnvironment(name, value) {
    super.addEnvironment(name, value);
    if (this.function) {
      this.function.addEnvironment(name, value);
    }
  }
  /**
   * Add a policy statement to the Lambda role.
   */
  addPolicyStatements(...statements) {
    for (const statement of statements) {
      this.function.addToRolePolicy(new import_aws_iam.PolicyStatement(statement));
    }
  }
  /** @internal */
  get _functionName() {
    return this.function.functionName;
  }
  /** @internal */
  get _function() {
    return this.function;
  }
  /** @internal */
  _addEventSource(eventSource) {
    this.function.addEventSource(eventSource);
  }
  envName() {
    return `FUNCTION_NAME_${this.node.addr.slice(-8)}`;
  }
};

// src/bucket.ts
var cloud2 = __toESM(require("@winglang/sdk/lib/cloud"));
var core2 = __toESM(require("@winglang/sdk/lib/core"));
var import_convert = require("@winglang/sdk/lib/shared/convert");
var import_permissions = require("@winglang/sdk/lib/shared-aws/permissions");
var import_std = require("@winglang/sdk/lib/std");
var EVENTS = {
  [cloud2.BucketEventType.DELETE]: import_aws_s3.EventType.OBJECT_REMOVED,
  [cloud2.BucketEventType.CREATE]: import_aws_s3.EventType.OBJECT_CREATED_PUT,
  [cloud2.BucketEventType.UPDATE]: import_aws_s3.EventType.OBJECT_CREATED_POST
};
var Bucket2 = class extends cloud2.Bucket {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    this.public = props.public ?? false;
    this.bucket = createEncryptedBucket(this, this.public);
  }
  addObject(key, body) {
    if (!this.bucketDeployment) {
      this.bucketDeployment = new import_aws_s3_deployment.BucketDeployment(this, `S3Object-${key}`, {
        destinationBucket: this.bucket,
        sources: [import_aws_s3_deployment.Source.data(key, body)]
      });
    } else {
      this.bucketDeployment.addSource(import_aws_s3_deployment.Source.data(key, body));
    }
  }
  eventHandlerLocation() {
    return (0, import_path2.join)(__dirname, "bucket.onevent.inflight.js");
  }
  onEventFunction(event, inflight, opts) {
    const hash = inflight.node.addr.slice(-8);
    const functionHandler = (0, import_convert.convertBetweenHandlers)(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-${event}-Handler-${hash}`,
      inflight,
      this.eventHandlerLocation(),
      `BucketEventHandlerClient`
    );
    const fn = Function2._newFunction(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-${event}-${hash}`,
      functionHandler,
      opts
    );
    if (!(fn instanceof Function2)) {
      throw new Error(
        "Bucket only supports creating awscdk.Function right now"
      );
    }
    return fn;
  }
  /** @internal */
  _supportedOps() {
    return [
      cloud2.BucketInflightMethods.DELETE,
      cloud2.BucketInflightMethods.GET,
      cloud2.BucketInflightMethods.GET_JSON,
      cloud2.BucketInflightMethods.LIST,
      cloud2.BucketInflightMethods.PUT,
      cloud2.BucketInflightMethods.PUT_JSON,
      cloud2.BucketInflightMethods.PUBLIC_URL,
      cloud2.BucketInflightMethods.EXISTS,
      cloud2.BucketInflightMethods.TRY_GET,
      cloud2.BucketInflightMethods.TRY_GET_JSON,
      cloud2.BucketInflightMethods.TRY_DELETE,
      cloud2.BucketInflightMethods.SIGNED_URL,
      cloud2.BucketInflightMethods.METADATA,
      cloud2.BucketInflightMethods.COPY
    ];
  }
  onCreate(inflight, opts) {
    const fn = this.onEventFunction("OnCreate", inflight, opts);
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onCreate()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.CREATE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
  }
  onDelete(inflight, opts) {
    const fn = this.onEventFunction("OnDelete", inflight, opts);
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onDelete()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.DELETE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
  }
  onUpdate(inflight, opts) {
    const fn = this.onEventFunction("OnUpdate", inflight, opts);
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onUpdate()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.UPDATE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
  }
  onEvent(inflight, opts) {
    const fn = this.onEventFunction("OnEvent", inflight, opts);
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onCreate()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.CREATE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onDelete()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.DELETE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
    import_std.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onUpdate()"
    });
    this.bucket.addEventNotification(
      EVENTS[cloud2.BucketEventType.UPDATE],
      new import_aws_s3_notifications.LambdaDestination(fn._function)
    );
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("buckets can only be bound by tfaws.Function for now");
    }
    host.addPolicyStatements(
      ...(0, import_permissions.calculateBucketPermissions)(this.bucket.bucketArn, ops)
    );
    host.addEnvironment(this.envName(), this.bucket.bucketName);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core2.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "BucketClient",
      [
        `process.env["${this.envName()}"]`,
        `process.env["${this.isPublicEnvName()}"]`
      ]
    );
  }
  isPublicEnvName() {
    return `${this.envName()}_IS_PUBLIC`;
  }
  envName() {
    return `BUCKET_NAME_${this.node.addr.slice(-8)}`;
  }
};
function createEncryptedBucket(scope, isPublic, name = "Default") {
  const isTestEnvironment = App.of(scope).isTestEnvironment;
  return new import_aws_s3.Bucket(scope, name, {
    encryption: import_aws_s3.BucketEncryption.S3_MANAGED,
    blockPublicAccess: isPublic ? {
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false
    } : import_aws_s3.BlockPublicAccess.BLOCK_ALL,
    publicReadAccess: isPublic ? true : false,
    removalPolicy: import_aws_cdk_lib2.RemovalPolicy.DESTROY,
    autoDeleteObjects: isTestEnvironment ? true : false
  });
}

// src/counter.ts
var import_aws_cdk_lib3 = require("aws-cdk-lib");
var import_aws_dynamodb = require("aws-cdk-lib/aws-dynamodb");
var cloud3 = __toESM(require("@winglang/sdk/lib/cloud"));
var core3 = __toESM(require("@winglang/sdk/lib/core"));
var import_commons = require("@winglang/sdk/lib/shared-aws/commons");
var import_permissions2 = require("@winglang/sdk/lib/shared-aws/permissions");
var Counter2 = class extends cloud3.Counter {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    this.table = new import_aws_dynamodb.Table(this, "Default", {
      partitionKey: { name: import_commons.COUNTER_HASH_KEY, type: import_aws_dynamodb.AttributeType.STRING },
      billingMode: import_aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: import_aws_cdk_lib3.RemovalPolicy.DESTROY
    });
  }
  /** @internal */
  _supportedOps() {
    return [
      cloud3.CounterInflightMethods.INC,
      cloud3.CounterInflightMethods.DEC,
      cloud3.CounterInflightMethods.PEEK,
      cloud3.CounterInflightMethods.SET
    ];
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("counters can only be bound by awscdk.Function for now");
    }
    host.addPolicyStatements(
      ...(0, import_permissions2.calculateCounterPermissions)(this.table.tableArn, ops)
    );
    host.addEnvironment(this.envName(), this.table.tableName);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core3.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "CounterClient",
      [`process.env["${this.envName()}"]`, `${this.initial}`]
    );
  }
  envName() {
    return `DYNAMODB_TABLE_NAME_${this.node.addr.slice(-8)}`;
  }
};

// src/dynamodb-table.ts
var import_aws_cdk_lib4 = require("aws-cdk-lib");
var import_aws_dynamodb2 = require("aws-cdk-lib/aws-dynamodb");
var core4 = __toESM(require("@winglang/sdk/lib/core"));
var ex = __toESM(require("@winglang/sdk/lib/ex"));
var import_resource_names = require("@winglang/sdk/lib/shared/resource-names");
var import_dynamodb_table = require("@winglang/sdk/lib/shared-aws/dynamodb-table");
var import_permissions3 = require("@winglang/sdk/lib/shared-aws/permissions");
var DynamodbTable2 = class extends ex.DynamodbTable {
  constructor(scope, id, props) {
    super(scope, id, props);
    const attributeDefinitions = props.attributeDefinitions;
    this.table = new import_aws_dynamodb2.Table(this, "Default", {
      tableName: import_resource_names.ResourceNames.generateName(this, {
        prefix: this.name,
        ...import_dynamodb_table.NAME_OPTS
      }),
      partitionKey: {
        name: props.hashKey,
        type: attributeDefinitions[props.hashKey]
      },
      sortKey: props.rangeKey ? {
        name: props.rangeKey,
        type: attributeDefinitions[props.rangeKey]
      } : void 0,
      billingMode: import_aws_dynamodb2.BillingMode.PAY_PER_REQUEST,
      removalPolicy: import_aws_cdk_lib4.RemovalPolicy.DESTROY
    });
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error(
        "Dynamodb tables can only be bound by tfaws.Function for now"
      );
    }
    host.addPolicyStatements(
      ...(0, import_permissions3.calculateDynamodbTablePermissions)(this.table.tableArn, ops)
    );
    host.addEnvironment(this.envName(), this.table.tableName);
    super.onLift(host, ops);
  }
  /** @internal */
  _supportedOps() {
    return [
      ex.DynamodbTableInflightMethods.PUT_ITEM,
      ex.DynamodbTableInflightMethods.UPDATE_ITEM,
      ex.DynamodbTableInflightMethods.DELETE_ITEM,
      ex.DynamodbTableInflightMethods.GET_ITEM,
      ex.DynamodbTableInflightMethods.SCAN,
      ex.DynamodbTableInflightMethods.QUERY,
      ex.DynamodbTableInflightMethods.TRANSACT_GET_ITEMS,
      ex.DynamodbTableInflightMethods.TRANSACT_WRITE_ITEMS,
      ex.DynamodbTableInflightMethods.BATCH_GET_ITEM,
      ex.DynamodbTableInflightMethods.BATCH_WRITE_ITEM
    ];
  }
  _toInflight() {
    return core4.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "DynamodbTableClient",
      [`process.env["${this.envName()}"]`]
    );
  }
  envName() {
    return `DYNAMODB_TABLE_NAME_${this.node.addr.slice(-8)}`;
  }
};

// src/on-deploy.ts
var import_triggers = require("aws-cdk-lib/triggers");
var cloud4 = __toESM(require("@winglang/sdk/lib/cloud"));
var core5 = __toESM(require("@winglang/sdk/lib/core"));
var OnDeploy2 = class extends cloud4.OnDeploy {
  constructor(scope, id, handler, props = {}) {
    super(scope, id, handler, props);
    let fn = cloud4.Function._newFunction(this, "Function", handler, props);
    const awsFn = fn;
    let trigger = new import_triggers.Trigger(this, "Trigger", {
      handler: awsFn._function
    });
    trigger.executeAfter(...props.executeAfter ?? []);
    trigger.executeBefore(...props.executeBefore ?? []);
  }
  /** @internal */
  _toInflight() {
    return core5.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "OnDeployClient",
      []
    );
  }
};

// src/queue.ts
var import_path3 = require("path");
var import_aws_cdk_lib5 = require("aws-cdk-lib");
var import_aws_lambda_event_sources = require("aws-cdk-lib/aws-lambda-event-sources");
var import_aws_sqs = require("aws-cdk-lib/aws-sqs");
var cloud5 = __toESM(require("@winglang/sdk/lib/cloud"));
var core6 = __toESM(require("@winglang/sdk/lib/core"));
var import_convert2 = require("@winglang/sdk/lib/shared/convert");
var import_permissions4 = require("@winglang/sdk/lib/shared-aws/permissions");
var import_std2 = require("@winglang/sdk/lib/std");
var Queue2 = class extends cloud5.Queue {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    this.timeout = props.timeout ?? import_std2.Duration.fromSeconds(30);
    this.queue = new import_aws_sqs.Queue(this, "Default", {
      visibilityTimeout: props.timeout ? import_aws_cdk_lib5.Duration.seconds(props.timeout?.seconds) : import_aws_cdk_lib5.Duration.seconds(30),
      retentionPeriod: props.retentionPeriod ? import_aws_cdk_lib5.Duration.seconds(props.retentionPeriod?.seconds) : import_aws_cdk_lib5.Duration.hours(1)
    });
  }
  setConsumer(inflight, props = {}) {
    const hash = inflight.node.addr.slice(-8);
    const functionHandler = (0, import_convert2.convertBetweenHandlers)(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-SetConsumerHandler-${hash}`,
      inflight,
      (0, import_path3.join)(
        __dirname.replace("target-awscdk", "shared-aws"),
        "queue.setconsumer.inflight.js"
      ),
      "QueueSetConsumerHandlerClient"
    );
    const fn = Function2._newFunction(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-SetConsumer-${hash}`,
      functionHandler,
      {
        ...props,
        timeout: this.timeout
      }
    );
    if (!(fn instanceof Function2)) {
      throw new Error("Queue only supports creating awscdk.Function right now");
    }
    const eventSource = new import_aws_lambda_event_sources.SqsEventSource(this.queue, {
      batchSize: props.batchSize ?? 1
    });
    fn._addEventSource(eventSource);
    import_std2.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "setConsumer()"
    });
    return fn;
  }
  /** @internal */
  _supportedOps() {
    return [
      cloud5.QueueInflightMethods.PUSH,
      cloud5.QueueInflightMethods.PURGE,
      cloud5.QueueInflightMethods.APPROX_SIZE,
      cloud5.QueueInflightMethods.POP
    ];
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("queues can only be bound by tfaws.Function for now");
    }
    const env = this.envName();
    host.addPolicyStatements(
      ...(0, import_permissions4.calculateQueuePermissions)(this.queue.queueArn, ops)
    );
    host.addEnvironment(env, this.queue.queueUrl);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core6.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "QueueClient",
      [`process.env["${this.envName()}"]`]
    );
  }
  envName() {
    return `SCHEDULE_EVENT_${this.node.addr.slice(-8)}`;
  }
};

// src/schedule.ts
var import_path4 = require("path");
var import_aws_cdk_lib6 = require("aws-cdk-lib");
var import_aws_events = require("aws-cdk-lib/aws-events");
var import_aws_events_targets = require("aws-cdk-lib/aws-events-targets");
var cloud6 = __toESM(require("@winglang/sdk/lib/cloud"));
var core7 = __toESM(require("@winglang/sdk/lib/core"));
var import_convert3 = require("@winglang/sdk/lib/shared/convert");
var import_std3 = require("@winglang/sdk/lib/std");
var Schedule2 = class extends cloud6.Schedule {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    const { rate, cron } = props;
    if (cron) {
      const cronArr = cron.split(" ");
      let cronOpt = {
        minute: cronArr[0],
        hour: cronArr[1],
        month: cronArr[3],
        year: "*"
      };
      if (cronArr[2] !== "?") {
        cronOpt.day = cronArr[2];
      }
      if (cronArr[4] !== "?") {
        cronOpt.weekDay = cronArr[4];
      }
      this.scheduleExpression = import_aws_events.Schedule.cron(cronOpt);
    } else {
      this.scheduleExpression = import_aws_events.Schedule.rate(
        import_aws_cdk_lib6.Duration.minutes(rate.minutes)
      );
    }
    this.rule = new import_aws_events.Rule(this, "Schedule", {
      enabled: true,
      schedule: this.scheduleExpression
    });
  }
  onTick(inflight, props) {
    const hash = inflight.node.addr.slice(-8);
    const functionHandler = (0, import_convert3.convertBetweenHandlers)(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-OnTickHandler-${hash}`,
      inflight,
      (0, import_path4.join)(
        __dirname.replace("target-awscdk", "shared-aws"),
        "schedule.ontick.inflight.js"
      ),
      "ScheduleOnTickHandlerClient"
    );
    const fn = Function2._newFunction(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-SetConsumer-${hash}`,
      functionHandler,
      props
    );
    if (!(fn instanceof Function2)) {
      throw new Error(
        "Schedule only supports creating awscdk.Function right now"
      );
    }
    this.rule.addTarget(new import_aws_events_targets.LambdaFunction(fn._function));
    (0, import_aws_events_targets.addLambdaPermission)(this.rule, fn._function);
    import_std3.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onTick()"
    });
    return fn;
  }
  /** @internal */
  _toInflight() {
    return core7.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "ScheduleClient",
      [`process.env["${this.envName()}"]`]
    );
  }
  envName() {
    return `SCHEDULE_EVENT_${this.node.addr.slice(-8)}`;
  }
};

// src/secret.ts
var import_aws_cdk_lib7 = require("aws-cdk-lib");
var import_aws_secretsmanager = require("aws-cdk-lib/aws-secretsmanager");
var cloud7 = __toESM(require("@winglang/sdk/lib/cloud"));
var core8 = __toESM(require("@winglang/sdk/lib/core"));
var import_permissions5 = require("@winglang/sdk/lib/shared-aws/permissions");
var Secret2 = class extends cloud7.Secret {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    if (props.name) {
      this.secret = import_aws_secretsmanager.Secret.fromSecretNameV2(this, "Default", props.name);
      this.arnForPolicies = `${this.secret.secretArn}-??????`;
    } else {
      this.secret = new import_aws_secretsmanager.Secret(this, "Default");
      this.arnForPolicies = this.secret.secretArn;
      new import_aws_cdk_lib7.CfnOutput(this, "SecretArn", { value: this.secret.secretName });
    }
  }
  /** @internal */
  _supportedOps() {
    return [
      cloud7.SecretInflightMethods.VALUE,
      cloud7.SecretInflightMethods.VALUE_JSON
    ];
  }
  /**
   * Secret's arn
   */
  get arn() {
    return this.secret.secretArn;
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("secrets can only be bound by awscdk.Function for now");
    }
    host.addPolicyStatements(
      ...(0, import_permissions5.calculateSecretPermissions)(this.arnForPolicies, ops)
    );
    host.addEnvironment(this.envName(), this.secret.secretArn);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core8.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "SecretClient",
      [`process.env["${this.envName()}"]`]
    );
  }
  envName() {
    return `SECRET_ARN_${this.node.addr.slice(-8)}`;
  }
};

// src/test-runner.ts
var import_aws_cdk_lib8 = require("aws-cdk-lib");
var core9 = __toESM(require("@winglang/sdk/lib/core"));
var std = __toESM(require("@winglang/sdk/lib/std"));
var OUTPUT_TEST_RUNNER_FUNCTION_ARNS = "WingTestRunnerFunctionArns";
var TestRunner2 = class extends std.TestRunner {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    const output = new import_aws_cdk_lib8.CfnOutput(this, "TestFunctionArns", {
      value: import_aws_cdk_lib8.Lazy.string({
        produce: () => {
          return JSON.stringify([...this.getTestFunctionArns().entries()]);
        }
      })
    });
    output.overrideLogicalId(OUTPUT_TEST_RUNNER_FUNCTION_ARNS);
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("TestRunner can only be bound by tfaws.Function for now");
    }
    const testFunctions = this.getTestFunctionArns();
    host.addEnvironment(
      this.envTestFunctionArns(),
      JSON.stringify([...testFunctions.entries()])
    );
    super.onLift(host, ops);
  }
  /** @internal */
  _preSynthesize() {
    for (const test of this.findTests()) {
      if (test._fn) {
        this.node.addDependency(test._fn);
      }
    }
    super._preSynthesize();
  }
  getTestFunctionArns() {
    const arns = /* @__PURE__ */ new Map();
    for (const test of this.findTests()) {
      if (test._fn) {
        if (!(test._fn instanceof Function2)) {
          throw new Error(
            `Unsupported test function type, ${test._fn.node.path} was not a tfaws.Function`
          );
        }
        arns.set(test.node.path, test._fn.arn);
      }
    }
    return arns;
  }
  /** @internal */
  _toInflight() {
    return core9.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "TestRunnerClient",
      [`process.env["${this.envTestFunctionArns()}"]`]
    );
  }
  envTestFunctionArns() {
    return `TEST_RUNNER_FUNCTIONS_${this.node.addr.slice(-8)}`;
  }
};

// src/tokens.ts
var import_aws_cdk_lib9 = require("aws-cdk-lib");
var import_cloud = require("@winglang/sdk/lib/cloud");
var import_tokens = require("@winglang/sdk/lib/core/tokens");
var CdkTokens = class extends import_tokens.Tokens {
  /**
   * Returns true is the given value is a CDK token.
   */
  isToken(value) {
    return import_aws_cdk_lib9.Token.isUnresolved(value);
  }
  /**
   * "Lifts" a value into an inflight context.
   */
  lift(value) {
    if (value == null) {
      throw new Error(`Unable to lift null token`);
    }
    const envName = JSON.stringify(this.envName(value.toString()));
    switch (typeof value) {
      case "string":
        return `process.env[${envName}]`;
      case "number":
        return `parseFloat(process.env[${envName}], 10)`;
      case "object":
        if (Array.isArray(value)) {
          return `JSON.parse(process.env[${envName}])`;
        }
    }
    throw new Error(`Unable to lift token ${value}`);
  }
  /**
   * Binds the given token to the host.
   */
  onLiftValue(host, value) {
    if (!(host instanceof import_cloud.Function)) {
      throw new Error(`Tokens can only be bound by a Function for now`);
    }
    let envValue;
    switch (typeof value) {
      case "string":
        envValue = value;
        break;
      case "number":
        envValue = value.toString();
        break;
      case "object":
        if (Array.isArray(value)) {
          envValue = import_aws_cdk_lib9.Fn.toJsonString(value);
          break;
        }
    }
    if (envValue === void 0) {
      throw new Error(`Unable to bind token ${value}`);
    }
    const envName = this.envName(value.toString());
    if (host.env[envName] === void 0) {
      host.addEnvironment(envName, envValue);
    }
  }
};

// src/topic.ts
var import_path5 = require("path");
var import_aws_sns = require("aws-cdk-lib/aws-sns");
var import_aws_sns_subscriptions = require("aws-cdk-lib/aws-sns-subscriptions");
var cloud8 = __toESM(require("@winglang/sdk/lib/cloud"));
var core10 = __toESM(require("@winglang/sdk/lib/core"));
var import_convert4 = require("@winglang/sdk/lib/shared/convert");
var import_permissions6 = require("@winglang/sdk/lib/shared-aws/permissions");
var import_std4 = require("@winglang/sdk/lib/std");
var Topic2 = class extends cloud8.Topic {
  constructor(scope, id, props = {}) {
    super(scope, id, props);
    this.topic = new import_aws_sns.Topic(this, "Topic");
  }
  /**
   * Topic's arn
   */
  get arn() {
    return this.topic.topicArn;
  }
  onMessage(inflight, props = {}) {
    const hash = inflight.node.addr.slice(-8);
    const functionHandler = (0, import_convert4.convertBetweenHandlers)(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-OnMessageHandler-${hash}`,
      inflight,
      (0, import_path5.join)(
        __dirname.replace("target-awscdk", "shared-aws"),
        "topic.onmessage.inflight.js"
      ),
      "TopicOnMessageHandlerClient"
    );
    const fn = Function2._newFunction(
      this.node.scope,
      // ok since we're not a tree root
      `${this.node.id}-OnMessage-${hash}`,
      functionHandler,
      props
    );
    if (!(fn instanceof Function2)) {
      throw new Error("Topic only supports creating awscdk.Function right now");
    }
    const subscription = new import_aws_sns_subscriptions.LambdaSubscription(fn._function);
    this.topic.addSubscription(subscription);
    import_std4.Node.of(this).addConnection({
      source: this,
      target: fn,
      name: "onMessage()"
    });
    return fn;
  }
  onLift(host, ops) {
    if (!(host instanceof Function2)) {
      throw new Error("topics can only be bound by awscdk.Function for now");
    }
    host.addPolicyStatements(
      ...(0, import_permissions6.calculateTopicPermissions)(this.topic.topicArn, ops)
    );
    host.addEnvironment(this.envName(), this.topic.topicArn);
    super.onLift(host, ops);
  }
  /** @internal */
  _toInflight() {
    return core10.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "TopicClient",
      [`process.env["${this.envName()}"]`]
    );
  }
  /** @internal */
  get _topic() {
    return this.topic;
  }
  envName() {
    return `TOPIC_ARN_${this.node.addr.slice(-8)}`;
  }
};

// src/website.ts
var import_path6 = require("path");
var import_aws_cloudfront = require("aws-cdk-lib/aws-cloudfront");
var import_aws_cloudfront_origins = require("aws-cdk-lib/aws-cloudfront-origins");
var import_aws_iam2 = require("aws-cdk-lib/aws-iam");
var import_aws_s3_deployment2 = require("aws-cdk-lib/aws-s3-deployment");
var import_lib = require("@winglang/sdk/lib");
var cloud9 = __toESM(require("@winglang/sdk/lib/cloud"));
var INDEX_FILE = "index.html";
var Website2 = class extends cloud9.Website {
  constructor(scope, id, props) {
    super(scope, id, props);
    this.bucket = createEncryptedBucket(this, false, "WebsiteBucket");
    new import_aws_s3_deployment2.BucketDeployment(this, "BucketWebsiteConfiguration", {
      destinationBucket: this.bucket,
      sources: [import_aws_s3_deployment2.Source.asset(this.path)]
    });
    const cloudFrontOAI = new import_aws_cloudfront.OriginAccessIdentity(this, "CloudFrontOAI");
    this.bucket.addToResourcePolicy(
      new import_aws_iam2.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.bucket.arnForObjects("*")],
        principals: [
          new import_aws_iam2.CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          )
        ]
      })
    );
    const distribution = new import_aws_cloudfront.Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: new import_aws_cloudfront_origins.S3Origin(this.bucket, {
          originAccessIdentity: cloudFrontOAI
        })
      },
      domainNames: this._domain ? [this._domain.domainName] : void 0,
      defaultRootObject: INDEX_FILE
    });
    this._url = `https://${distribution.domainName}`;
  }
  get url() {
    return this._url;
  }
  addFile(path, data, options) {
    new import_aws_s3_deployment2.BucketDeployment(this, `S3Object-${path}`, {
      destinationBucket: this.bucket,
      contentType: options?.contentType ?? "text/plain",
      sources: [import_aws_s3_deployment2.Source.data(this.formatPath(path), data)]
    });
    return `${this.url}/${path}`;
  }
  formatPath(path) {
    return path.split(import_path6.sep).join(import_path6.posix.sep);
  }
  /** @internal */
  _toInflight() {
    return import_lib.core.InflightClient.for(
      __dirname.replace("target-awscdk", "shared-aws"),
      __filename,
      "WebsiteClient",
      []
    );
  }
};

// src/app.ts
var import_cloud2 = require("@winglang/sdk/lib/cloud");
var import_core = require("@winglang/sdk/lib/core");
var import_ex = require("@winglang/sdk/lib/ex");
var import_std5 = require("@winglang/sdk/lib/std");
var import_util = require("@winglang/sdk/lib/util");
var App = class extends import_core.App {
  constructor(props) {
    let stackName = props.stackName ?? process.env.CDK_STACK_NAME;
    if (stackName === void 0) {
      throw new Error(
        "A CDK stack name must be specified through the CDK_STACK_NAME environment variable."
      );
    }
    const outdir = props.outdir ?? ".";
    const cdkOutdir = (0, import_path7.join)(outdir, ".");
    if (props.isTestEnvironment) {
      stackName += import_util.Util.sha256(outdir.replace(/\.tmp$/, "")).slice(-8);
    }
    (0, import_fs.mkdirSync)(cdkOutdir, { recursive: true });
    const cdkApp = new cdk.App({ outdir: cdkOutdir });
    const cdkStack = new cdk.Stack(cdkApp, stackName);
    super(cdkStack, props.rootId ?? "Default", props);
    this._target = "awscdk";
    cdkApp.new = (fqn, ctor, scope, id, ...args) => this.new(fqn, ctor, scope, id, ...args);
    cdkApp.newAbstract = (fqn, scope, id, ...args) => this.newAbstract(fqn, scope, id, ...args);
    this.synthHooks = props.synthHooks;
    this.outdir = outdir;
    this.cdkApp = cdkApp;
    this.cdkStack = cdkStack;
    this.synthed = false;
    this.isTestEnvironment = props.isTestEnvironment ?? false;
    this._tokens = new CdkTokens();
    this.testRunner = new TestRunner2(this, "cloud.TestRunner");
    this.synthRoots(props, this.testRunner);
  }
  /**
   * Synthesize the app into CDK configuration in a `cdk.out` directory.
   *
   * This method returns a cleaned snapshot of the resulting CDK template
   * for unit testing.
   */
  synth() {
    if (this.synthed) {
      return this.synthedOutput;
    }
    (0, import_core.preSynthesizeAllConstructs)(this);
    if (this.synthHooks?.preSynthesize) {
      this.synthHooks.preSynthesize.forEach((hook) => hook(this));
    }
    this.cdkApp.synth();
    (0, import_core.synthesizeTree)(this, this.outdir);
    import_core.Connections.of(this).synth(this.outdir);
    const template = import_assertions.Template.fromStack(this.cdkStack);
    this.synthed = true;
    this.synthedOutput = (0, import_safe_stable_stringify.default)(template.toJSON(), null, 2) ?? "";
    return this.synthedOutput;
  }
  typeForFqn(fqn) {
    switch (fqn) {
      case import_cloud2.FUNCTION_FQN:
        return Function2;
      case import_cloud2.BUCKET_FQN:
        return Bucket2;
      case import_cloud2.COUNTER_FQN:
        return Counter2;
      case import_cloud2.SCHEDULE_FQN:
        return Schedule2;
      case import_cloud2.QUEUE_FQN:
        return Queue2;
      case import_cloud2.TOPIC_FQN:
        return Topic2;
      case import_std5.TEST_RUNNER_FQN:
        return TestRunner2;
      case import_cloud2.SECRET_FQN:
        return Secret2;
      case import_cloud2.ON_DEPLOY_FQN:
        return OnDeploy2;
      case import_cloud2.WEBSITE_FQN:
        return Website2;
      case import_ex.DYNAMODB_TABLE_FQN:
        return DynamodbTable2;
    }
    return void 0;
  }
};

// src/platform.ts
var Platform = class {
  constructor() {
    /** Platform model */
    this.target = "awscdk";
  }
  newApp(appProps) {
    return new App(appProps);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  App,
  Bucket,
  CdkTokens,
  Counter,
  DynamodbTable,
  Function,
  OnDeploy,
  Platform,
  Queue,
  Schedule,
  Secret,
  TestRunner,
  Topic,
  Website,
  createEncryptedBucket
});
