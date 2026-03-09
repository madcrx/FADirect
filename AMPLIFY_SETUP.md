# AWS Amplify Setup Guide

This app now uses AWS Amplify instead of Supabase for authentication and backend services.

## Prerequisites

1. AWS Account
2. AWS Amplify CLI installed: `npm install -g @aws-amplify/cli`
3. AWS credentials configured: `amplify configure`

## Setup Steps

### 1. Initialize Amplify in your project

```bash
amplify init
```

Follow the prompts:
- Enter a name for the project: `FADirect`
- Enter a name for the environment: `dev`
- Choose your default editor
- Choose the type of app: `javascript`
- Framework: `react-native`
- Source directory path: `src`
- Distribution directory path: `/`
- Build command: `npm run build`
- Start command: `npm start`

### 2. Add Authentication (Cognito)

```bash
amplify add auth
```

Configuration:
- Do you want to use the default authentication? `Manual configuration`
- How do you want users to sign in? `Phone Number`
- Do you want to configure advanced settings? `Yes`
- What attributes are required for signing up? `phone_number`
- Do you want to enable SMS MFA? `No` (or `Yes` if needed)

### 3. Add API (AppSync GraphQL)

```bash
amplify add api
```

Configuration:
- Select from one of the below mentioned services: `GraphQL`
- Provide API name: `fadirectapi`
- Choose authorization type: `Amazon Cognito User Pool`
- Do you want to configure advanced settings? `No`
- Do you have an annotated GraphQL schema? `No`
- Choose a schema template: `Single object with fields`

### 4. Update GraphQL Schema

Edit `amplify/backend/api/fadirectapi/schema.graphql`:

```graphql
type User @model @auth(rules: [{allow: owner}]) {
  id: ID!
  phoneNumber: String!
  firstName: String!
  lastName: String!
  email: String
  role: String!
  organizationId: String
  organizationName: String
  createdAt: AWSDateTime!
  lastSeen: AWSDateTime!
}

type Conversation @model @auth(rules: [{allow: owner}]) {
  id: ID!
  participantIds: [String!]!
  lastMessage: String
  lastMessageTime: AWSDateTime
  caseId: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Message @model @auth(rules: [{allow: owner}]) {
  id: ID!
  conversationId: String!
  senderId: String!
  content: String!
  timestamp: AWSDateTime!
  read: Boolean
  attachments: [String]
}

type Case @model @auth(rules: [{allow: owner}]) {
  id: ID!
  deceasedName: String!
  familyMemberId: String!
  funeralDirectorId: String
  status: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
```

### 5. Push to AWS

```bash
amplify push
```

This will:
- Create the Cognito User Pool
- Create the AppSync GraphQL API
- Deploy all resources to AWS

### 6. Get Configuration Values

After `amplify push` completes, you'll see output with:
- User Pool ID
- User Pool Client ID
- GraphQL Endpoint
- Region

Copy these values to `src/config/amplify.ts`:

```typescript
export const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'YOUR_REGION', // e.g., 'us-east-1'
      userPoolId: 'YOUR_USER_POOL_ID',
      userPoolClientId: 'YOUR_USER_POOL_CLIENT_ID',
      signUpVerificationMethod: 'code',
      loginWith: {
        phone: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'YOUR_GRAPHQL_ENDPOINT',
      region: 'YOUR_REGION',
      defaultAuthMode: 'userPool',
    },
  },
};
```

### 7. Enable Phone Number Authentication in Cognito

1. Go to AWS Console → Cognito → User Pools
2. Select your user pool
3. Go to "Messaging" tab
4. Configure SNS for SMS:
   - Create an SNS IAM role if you don't have one
   - Set SMS authentication message template
5. Go to "Sign-in experience" tab
6. Ensure "Phone number" is enabled as sign-in option

## Testing

1. Run your app: `npm start`
2. Try signing in with a phone number
3. You should receive an SMS with a verification code
4. Enter the code to complete authentication

## Troubleshooting

### SMS not sending
- Check AWS SNS SMS spending limit (default is $1/month for new accounts)
- Request production access for SNS SMS in AWS Console
- Verify your phone number format includes country code (e.g., +61400000000)

### Authentication errors
- Check CloudWatch logs for Cognito triggers
- Verify user pool configuration allows phone number auth
- Ensure app client has proper auth flows enabled

### GraphQL errors
- Check AppSync console for resolver logs
- Verify IAM permissions
- Check schema and resolver mappings

## Cost Estimates

AWS Amplify services used:
- **Cognito**: Free tier includes 50,000 MAUs
- **AppSync**: $4 per million queries/mutations
- **SNS SMS**: ~$0.00645 per SMS in Australia

## Next Steps

1. Customize the GraphQL schema for your needs
2. Add storage with `amplify add storage` if needed
3. Set up hosting with `amplify add hosting`
4. Configure CI/CD for automatic deployments
