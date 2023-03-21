
import * as cdk from 'aws-cdk-lib';
import { UserPool, StringAttribute, AccountRecovery, 
    ClientAttributes, UserPoolClient, UserPoolClientIdentityProvider, UserPoolOperation } from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class CognitoCdkStack extends cdk.Stack {
    readonly _standardCognitoAttributes = {
        givenName: true,
        familyName: true,
        email: true,
        emailVerified: true,
        address: true,
        birthdate: true,
        gender: true,
        locale: true,
        middleName: true,
        fullname: true,
        nickname: true,
        phoneNumber: true,
        phoneNumberVerified: true,
        profilePicture: true,
        preferredUsername: true,
        profilePage: true,
        timezone: true,
        lastUpdateTime: true,
        website: true,
    };

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        const userPool  = this.getUserPool();
        const userPoolClient = this.getUserPoolClient(userPool);

        new cdk.CfnOutput(this, 'userPoolId', {
            value: userPool.userPoolId,
          });

        new cdk.CfnOutput(this, 'userPoolClientId', {
            value: userPoolClient.userPoolClientId,
        });

        new cdk.CfnOutput(this, "userPoolArn", {
            value:  userPool.userPoolArn,
            exportName: "userPoolArn"
        });
    }

    getUserPool (): UserPool {
    return new UserPool(this, 'userpool', {
        userPoolName: 'serverless-user-pool',
        selfSignUpEnabled: true,
        signInAliases: {
        email: true,
        },
        autoVerify: {
        email: true,
        },
        standardAttributes: {
        givenName: {
            required: false,
            mutable: true,
        },
        familyName: {
            required: false,
            mutable: true,
        },
        },
        customAttributes: {
        country: new StringAttribute({mutable: true}),
        city: new StringAttribute({mutable: true}),
        isAdmin: new StringAttribute({mutable: true}),
        },
        passwordPolicy: {
        minLength: 6,
        requireLowercase: true,
        requireDigits: true,
        requireUppercase: false,
        requireSymbols: false,
        },
        accountRecovery: AccountRecovery.EMAIL_ONLY,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    }

    getClientWrtieAttributes(): ClientAttributes {
    return new ClientAttributes()
    .withStandardAttributes({
        ...this._standardCognitoAttributes,
        emailVerified: false,
        phoneNumberVerified: false,
    })
    .withCustomAttributes(...['country', 'city']);
    }

    getClientReadAttributes() : ClientAttributes {
    return new ClientAttributes()
    .withStandardAttributes(this._standardCognitoAttributes)
    .withCustomAttributes(...['country', 'city', 'isAdmin']);
    }

    getUserPoolClient(userPool: UserPool) : UserPoolClient {
    var clientReadAttributes = this.getClientReadAttributes();
    var clientWriteAttributes = this.getClientWrtieAttributes();

    return new UserPoolClient(this, 'userpool-client', {
        userPool,
        authFlows: {
        adminUserPassword: true,
        custom: true,
        userSrp: true,
        userPassword: true
        },
        supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO,
        ],
        readAttributes: clientReadAttributes,
        writeAttributes: clientWriteAttributes,
    });
    }
}