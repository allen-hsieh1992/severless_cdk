import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { RestApi, CognitoUserPoolsAuthorizer, LambdaIntegration, 
  AuthorizationType, Deployment} from 'aws-cdk-lib/aws-apigateway';
import { LogGroup } from 'aws-cdk-lib/aws-logs';

export class SeverlessCdkStack extends cdk.Stack {
  readonly _lambda_base_path = "../lambda/";
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const userPoolArn = cdk.Fn.importValue("userPoolArn");

    const userPool  = UserPool.fromUserPoolArn(this, "serverless-user-pool", userPoolArn);

    const testAuthorizer = new CognitoUserPoolsAuthorizer(this, 'testAuthorizer', {
      cognitoUserPools: [userPool]
    });

    const testLambda = this.getFunction('test');
    const testIntegration = new LambdaIntegration(testLambda);

//    const prdLogGroup = new LogGroup(this, "PrdLogs");
    const testApi = new RestApi(this, 'test', {
      defaultIntegration: testIntegration,
      /*deployOptions: {
        accessLogDestination: new LogGroupLogDestination(prdLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      },*/
    });
    const testResource = testApi.root.addResource('test');
    testResource.addMethod('GET', testIntegration, {
      authorizer: testAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    const testDeployment = new Deployment(this, 'testDeployment', {api: testApi});


    const helloLambda = this.getFunction('hello');
    const integration = new LambdaIntegration(helloLambda);

//    const prdLogGroup = new LogGroup(this, "PrdLogs");
    const helloApi = new RestApi(this, 'hello', {
      defaultIntegration: integration,
      /*deployOptions: {
        accessLogDestination: new LogGroupLogDestination(prdLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
      },*/
    });

    const helloAuthorizer = new CognitoUserPoolsAuthorizer(this, 'helloAuthorizer', {
      cognitoUserPools: [userPool]
    });

    const helloResource = helloApi.root.addResource('hello');
    helloResource.addMethod('GET', integration, {
      authorizer: helloAuthorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    const deployment = new Deployment(this, 'helloDeployment', {api: helloApi});



   /* const devLogGroup = new LogGroup(this, "DevLogs");
    new Stage(this, 'dev', {
      deployment,
      accessLogDestination: new LogGroupLogDestination(devLogGroup),
      accessLogFormat: AccessLogFormat.jsonWithStandardFields({
        caller: false,
        httpMethod: true,
        ip: true,
        protocol: true,
        requestTime: true,
        resourcePath: true,
        responseLength: true,
        status: true,
        user: true,
      }),
    });*/
  }

  getFunction(name: string): Function {
    var path = require('path');
    return new Function(this, name + 'Function', {
      runtime: Runtime.NODEJS_18_X,
      handler: name + '.lambdaHandler',
      code: Code.fromAsset(path.join(__dirname, this._lambda_base_path + name)),
    });
  }
}