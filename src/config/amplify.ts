import { Amplify } from 'aws-amplify';

// AWS Amplify Configuration
// TODO: Replace these with your actual AWS Amplify configuration
// You can get these values from the AWS Amplify Console after setting up your backend
export const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1', // e.g., 'us-east-1'
      userPoolId: 'YOUR_USER_POOL_ID', // e.g., 'us-east-1_abcdef123'
      userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID', // e.g., '1a2b3c4d5e6f7g8h9i0j1k2l3m'
      signUpVerificationMethod: 'code', // 'code' | 'link'
      loginWith: {
        phone: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'YOUR_GRAPHQL_ENDPOINT', // e.g., 'https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql'
      region: 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
};

export const configureAmplify = () => {
  Amplify.configure(amplifyConfig);
};

export default amplifyConfig;
