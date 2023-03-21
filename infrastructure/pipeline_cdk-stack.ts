import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifact, Pipeline }  from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction} from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";


export class PipelineCdkStack extends cdk.Stack {

    private _githubArtifacts: Artifact;
    private _pipelineArtifactBucket: Bucket;
    private _deployRole: Role;
    private readonly PIPELINE_BUCKET_NAME = "ci-cd-pipeline-artifacts-bukcet";
    private readonly GITHUB_ARTIFACTS_NAME = "serverless_github_artficats";
    private readonly BASE_CODEBUILD_SPEC_PATH = "./infrastructure/codebuild/"
    //private readonly PIPELINE_STACK_NAME = "PipelineCdkStack";
    private readonly SERVERLESS_STACK_NAME = "SeverlessCdkStack";
    private readonly COGNITO_STACK_NAME = "CognitoCdkStack";
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this._pipelineArtifactBucket = this.getPipelineArtifactBucket();
        this._githubArtifacts = this.getGithubArtifacts();

        let sourceAction = this.getSourceAction();
        //let DeployPipelineStackAction = this.getDeployAction(this.PIPELINE_STACK_NAME);
        let DeployServerlessStackAction = this.getDeployAction(this.SERVERLESS_STACK_NAME);
        let DeployCognitoStackAction = this.getDeployAction(this.COGNITO_STACK_NAME);

        new Pipeline(this, 'ServerlessAppPipeline', {
            pipelineName: 'serverless-app',
            artifactBucket: this._pipelineArtifactBucket,
            stages: [
              {
                stageName: 'Source',
                actions: [sourceAction],
              },
              { stageName: 'DeployStack', 
                actions: [//DeployPipelineStackAction, 
                          DeployServerlessStackAction,
                          DeployCognitoStackAction]
              },
            ]
        })
    }

    private getGithubArtifacts(): Artifact {
        return new Artifact(this.GITHUB_ARTIFACTS_NAME);
    }

    private getPipelineArtifactBucket(): Bucket {
        return new Bucket(this, 
            'CiCdPipelineArtifacts', {
                bucketName: this.PIPELINE_BUCKET_NAME,
                encryption: BucketEncryption.S3_MANAGED
        });
    }

    private getSourceAction() : GitHubSourceAction {
        const oauth =  cdk.SecretValue.secretsManager('github_token');
        return new GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'allen-hsieh1992',
            repo: 'severless_cdk',
            oauthToken: oauth,
            output: this._githubArtifacts,
            branch: 'main',
            trigger: GitHubTrigger.WEBHOOK
        });
    }

    private getDeployAction(deployStack: string): CodeBuildAction {
        const buildArtifacts = new Artifact("Artifact_" + deployStack);
        const buildProject: PipelineProject = this.getDeployBuildProject(deployStack);
        return new CodeBuildAction({
          actionName: 'Deploy_' + deployStack,
          input: this._githubArtifacts,
          project: buildProject,
          variablesNamespace: deployStack + '_variables_namespace',
          outputs: [buildArtifacts],
          environmentVariables: {
            STACK : { value: deployStack },
          }
        });
    } 

    private getDeployRole(): Role {
        if (this._deployRole === undefined) {
            this._deployRole = new Role(this, 'DeployRole', {
                assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
                inlinePolicies: {
                  "CDKDeploy": new PolicyDocument({
                    statements: [
                      new PolicyStatement({
                        actions: ["sts:AssumeRole"],
                        resources: ["arn:aws:iam::*:role/cdk-*"]
                      }),
                    ]
                })}
            });
        }
        return this._deployRole;
    }

    private getDeployBuildProject(deployStack: string): PipelineProject {
        const deployRole: Role = this.getDeployRole();
        return new PipelineProject(this, "deployAction_" + deployStack, {
            buildSpec: BuildSpec.fromSourceFilename(
                this.BASE_CODEBUILD_SPEC_PATH + 
                deployStack + ".yaml"),
            projectName: deployStack,
            environment: {
                buildImage: LinuxBuildImage.STANDARD_6_0
            },
            role: deployRole
        })
    }
}