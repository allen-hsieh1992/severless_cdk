import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Artifact, Pipeline }  from "aws-cdk-lib/aws-codepipeline";
import { GitHubSourceAction, GitHubTrigger, CodeBuildAction} from 'aws-cdk-lib/aws-codepipeline-actions';
import { PipelineProject, LinuxBuildImage, BuildSpec } from "aws-cdk-lib/aws-codebuild";
import { Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';


export class PipelineCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

    


        const pipelineArtifactBucket = new Bucket(this, 'CiCdPipelineArtifacts', {
            bucketName: `allen08-ci-cd-pipeline-artifacts-bukcet`,
            encryption: BucketEncryption.S3_MANAGED
        });

        /* oauthToken: cdk.SecretValue.secretsManager('github_token'),

        */

        const oauth =  cdk.SecretValue.secretsManager('github_token');

        const sourceArtifacts = new Artifact('serverless_cdk_artifact_test');
        const githubAction: GitHubSourceAction = new GitHubSourceAction({
            actionName: 'GitHub_Source',
            owner: 'allen-hsieh1992',
            repo: 'severless_cdk',
            oauthToken: oauth,
            output: sourceArtifacts,
            branch: 'master',
            trigger: GitHubTrigger.WEBHOOK
          });

          

        const buildProject = new PipelineProject(this, "buildAction", {
            buildSpec: BuildSpec.fromObject({
                version: '0.2',
                phases: {
                  build: {
                    commands:[
                      'ls',
                    ],
                  },
                },
              }),
            environment: {
                buildImage: LinuxBuildImage.STANDARD_3_0            
            },
            projectName: 'aws-serverless-app-build'
        })

        const buildArtifacts = new Artifact();
        const buildAction: CodeBuildAction = new CodeBuildAction({
          actionName: 'Build',
          input: sourceArtifacts,
          project: buildProject,
          variablesNamespace: 'BuildVariables',
          outputs: [buildArtifacts]
        });

        new Pipeline(this, 'CiCdPipeline', {
            pipelineName: 'aws-serverless-app',
            artifactBucket: pipelineArtifactBucket,
            stages: [
              {
                stageName: 'Source',
                actions: [githubAction],
              },
              { stageName: 'buildAction', 
                actions: [buildAction]
              },
            ]
        })
    }


}