import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifact, Pipeline }  from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction} from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';


export class PipelineCdkStack extends cdk.Stack {

    private _githubArtifacts: Artifact;
    private _pipelineArtifactBucket: Bucket;
    private readonly PIPELINE_BUCKET_NAME = "ci-cd-pipeline-artifacts-bukcet";
    private readonly GITHUB_ARTIFACTS_NAME = "serverless_github_artficats";
    private readonly BASE_CODEBUILD_SPEC_PATH = "./lib/codebuild/"
    private readonly PIPELINE_DEPLOY_CODEBUILD_SPEC_FILENAME = "pipelineDeploy.yaml";
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        this._pipelineArtifactBucket = this.getPipelineArtifactBucket();
        this._githubArtifacts = this.getGithubArtifacts();

        let sourceAction = this.getSourceAction();
        let BuildPipelineAction = this.getDeployPipelineAction();


        new Pipeline(this, 'ServerlessAppPipeline', {
            pipelineName: 'serverless-app',
            artifactBucket: this._pipelineArtifactBucket,
            stages: [
              {
                stageName: 'Source',
                actions: [sourceAction],
              },
              { stageName: 'BuildPipeline', 
                actions: [BuildPipelineAction]
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

    private getDeployPipelineAction(): CodeBuildAction {
        const buildArtifacts = new Artifact();
        const buildProject: PipelineProject = this.getDeployPipelineBuildProject();
        return new CodeBuildAction({
          actionName: 'Build',
          input: this._githubArtifacts,
          project: buildProject,
          variablesNamespace: 'BuildVariables',
          outputs: [buildArtifacts]
        });
    } 

    private getDeployPipelineBuildProject(): PipelineProject {
        return new PipelineProject(this, "buildAction", {
            buildSpec: BuildSpec.fromSourceFilename(
                this.BASE_CODEBUILD_SPEC_PATH + 
                this.PIPELINE_DEPLOY_CODEBUILD_SPEC_FILENAME),
            projectName: 'aws-serverless-pipeline-deploy'
        })
    }
}