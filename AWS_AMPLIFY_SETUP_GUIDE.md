# AWS Amplify Setup Guide - FA Direct

This guide provides detailed step-by-step instructions to configure AWS Amplify for the FA Direct app after migrating from Firebase/Supabase to AWS.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [AWS Cognito Setup (Authentication)](#aws-cognito-setup-authentication)
4. [AWS AppSync Setup (GraphQL API)](#aws-appsync-setup-graphql-api)
5. [AWS S3 Setup (Storage)](#aws-s3-setup-storage)
6. [Configure the App](#configure-the-app)
7. [Environment Variables](#environment-variables)
8. [Testing Your Setup](#testing-your-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:
- ✅ AWS Account with admin access
- ✅ AWS CLI installed and configured
- ✅ Node.js 18+ installed
- ✅ This repository cloned to your Windows PC

### Install AWS CLI (Windows)
```bash
# Download and install from:
https://aws.amazon.com/cli/

# After installation, configure:
aws configure
```

Enter your AWS credentials when prompted:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format: `json`

---

## AWS Account Setup

### 1. Sign in to AWS Console
1. Go to https://console.aws.amazon.com/
2. Sign in with your AWS account
3. Select your preferred region (e.g., **us-east-1** - US East N. Virginia)
   - **IMPORTANT**: Use the same region for all services

### 2. Create IAM User for App (Optional but Recommended)
1. Navigate to **IAM** → **Users** → **Create User**
2. User name: `fadirect-app-user`
3. Enable **Programmatic access**
4. Attach policies:
   - `AmazonCognitoPowerUser`
   - `AWSAppSyncAdministrator`
   - `AmazonS3FullAccess`
5. Save the **Access Key ID** and **Secret Access Key**

---

## AWS Cognito Setup (Authentication)

AWS Cognito handles user authentication with phone number + SMS verification codes.

### Step 1: Create User Pool

1. **Navigate to Cognito**
   - AWS Console → Search "Cognito" → **User pools** → **Create user pool**

2. **Configure Sign-in Experience**
   - Provider type: **Cognito user pool**
   - Cognito user pool sign-in options:
     - ✅ **Phone number**
     - ✅ **Email** (optional)
   - Click **Next**

3. **Configure Security Requirements**
   - Password policy: **Cognito defaults** (or custom as needed)
   - Multi-factor authentication: **No MFA** (or configure if needed)
   - User account recovery: **Phone number**
   - Click **Next**

4. **Configure Sign-up Experience**
   - Self-service sign-up: **Enable**
   - Attribute verification and user account confirmation:
     - ✅ Allow Cognito to automatically send messages to verify
     - Attributes to verify: **Phone number**
   - Required attributes:
     - ✅ `phone_number`
     - ✅ `name` (optional)
     - ✅ `email` (optional)
   - Click **Next**

5. **Configure Message Delivery**
   - Email delivery: **Send email with Cognito** (default)
   - SMS: **Enable SMS** for phone verification
     - IAM role: Create new role or use existing
     - **IMPORTANT**: Set up AWS SNS SMS sandbox for testing
   - Click **Next**

6. **Integrate Your App**
   - User pool name: **`fadirect-user-pool`**
   - App client name: **`fadirect-app-client`**
   - App type: **Public client**
   - Authentication flows:
     - ✅ `ALLOW_CUSTOM_AUTH`
     - ✅ `ALLOW_USER_SRP_AUTH`
     - ✅ `ALLOW_REFRESH_TOKEN_AUTH`
   - Click **Next**

7. **Review and Create**
   - Review all settings
   - Click **Create user pool**

### Step 2: Configure SMS Messaging (CRITICAL)

1. **Navigate to Amazon SNS**
   - AWS Console → Search "SNS" → **Text messaging (SMS)** → **Sandbox destinations**

2. **Add Phone Numbers for Testing**
   - Click **Add phone number**
   - Enter your test phone number (with country code, e.g., `+14155552671`)
   - AWS will send a verification code
   - Enter the code to verify
   - **Repeat for all test phone numbers**

3. **Request Production SMS Access** (For Production)
   - Go to SNS → **Text messaging (SMS)** → **Publish text message**
   - Follow prompts to request production access
   - Fill out use case questionnaire
   - Wait for approval (usually 24-48 hours)

### Step 3: Note Your Cognito Configuration

After creating the user pool, collect these values:

1. **User Pool ID**
   - Location: User pools → `fadirect-user-pool` → **User pool overview**
   - Format: `us-east-1_xxxxxxxxx`
   - Example: `us-east-1_abc123DEF`

2. **App Client ID**
   - Location: User pools → `fadirect-user-pool` → **App integration** tab → **App clients**
   - Format: 26-character alphanumeric string
   - Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m`

3. **Region**
   - The AWS region you selected (e.g., `us-east-1`)

---

## AWS AppSync Setup (GraphQL API)

AWS AppSync provides the GraphQL API for database operations.

### Step 1: Create GraphQL API

1. **Navigate to AppSync**
   - AWS Console → Search "AppSync" → **Create API**

2. **Choose API Type**
   - Select **Build from scratch**
   - API name: **`fadirect-api`**
   - Click **Create**

3. **Configure Authorization**
   - Default authorization mode: **Amazon Cognito User Pool**
   - Cognito User Pool: Select **`fadirect-user-pool`**
   - Default action: **Allow**
   - Click **Create**

### Step 2: Define GraphQL Schema

1. **Navigate to Schema**
   - AppSync → `fadirect-api` → **Schema**

2. **Add Schema**
   ```graphql
   type User @model @auth(rules: [{allow: owner}]) {
     id: ID!
     phoneNumber: String!
     firstName: String
     lastName: String
     email: String
     role: String!
     organizationId: String
     organizationName: String
     createdAt: AWSDateTime!
     lastSeen: AWSDateTime
   }

   type Conversation @model @auth(rules: [{allow: owner}]) {
     id: ID!
     title: String
     participants: [String!]!
     lastMessage: String
     lastMessageTime: AWSDateTime
     createdAt: AWSDateTime!
     updatedAt: AWSDateTime!
   }

   type Message @model @auth(rules: [{allow: owner}]) {
     id: ID!
     conversationId: ID!
     senderId: String!
     senderName: String!
     text: String!
     timestamp: AWSDateTime!
     status: String
   }

   type Case @model @auth(rules: [{allow: owner}]) {
     id: ID!
     deceasedName: String!
     caseNumber: String!
     arrangerId: String!
     arrangerOrg: String!
     status: String!
     createdAt: AWSDateTime!
     updatedAt: AWSDateTime!
   }
   ```

3. **Create Resources**
   - Click **Save Schema**
   - AppSync will automatically create:
     - DynamoDB tables
     - Resolvers for queries and mutations
     - Subscriptions

### Step 3: Note Your AppSync Configuration

1. **GraphQL Endpoint**
   - Location: AppSync → `fadirect-api` → **Settings**
   - Format: `https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql`
   - Example: `https://abcde12345fghij67890klmno.appsync-api.us-east-1.amazonaws.com/graphql`

2. **Region**
   - Same as your Cognito region (e.g., `us-east-1`)

---

## AWS S3 Setup (Storage)

AWS S3 handles file uploads (photos, documents, etc.).

### Step 1: Create S3 Bucket

1. **Navigate to S3**
   - AWS Console → Search "S3" → **Create bucket**

2. **Configure Bucket**
   - Bucket name: **`fadirect-storage`** (must be globally unique)
     - If taken, try: `fadirect-storage-[your-org-name]`
   - Region: Same as Cognito (e.g., `us-east-1`)
   - Object Ownership: **ACLs disabled**
   - Block Public Access: **Keep all blocked** (we'll use signed URLs)
   - Bucket Versioning: **Disable**
   - Encryption: **Enable** (SSE-S3)
   - Click **Create bucket**

### Step 2: Configure CORS

1. **Navigate to Bucket Permissions**
   - S3 → `fadirect-storage` → **Permissions** tab → **CORS**

2. **Add CORS Configuration**
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Save changes**

### Step 3: Create IAM Policy for Storage Access

1. **Navigate to IAM**
   - AWS Console → IAM → **Policies** → **Create policy**

2. **JSON Policy**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::fadirect-storage/*"
       },
       {
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::fadirect-storage"
       }
     ]
   }
   ```

3. **Name the Policy**
   - Name: `fadirect-storage-policy`
   - Click **Create policy**

4. **Attach to Cognito Identity Pool** (Next section)

---

## Configure the App

Now update your FA Direct app with the AWS configuration values.

### Step 1: Update Amplify Configuration File

1. **Open the config file on your Windows PC**
   ```
   FADirect/src/config/amplify.ts
   ```

2. **Replace with your actual values**
   ```typescript
   import { Amplify } from 'aws-amplify';

   // AWS Amplify Configuration
   export const amplifyConfig = {
     Auth: {
       Cognito: {
         region: 'us-east-1', // Your AWS region
         userPoolId: 'us-east-1_abc123DEF', // From Cognito User Pool
         userPoolClientId: '1a2b3c4d5e6f7g8h9i0j1k2l3m', // From Cognito App Client
         signUpVerificationMethod: 'code',
         loginWith: {
           phone: true,
         },
       },
     },
     API: {
       GraphQL: {
         endpoint: 'https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql', // From AppSync
         region: 'us-east-1', // Your AWS region
         defaultAuthMode: 'userPool',
       },
     },
     Storage: {
       S3: {
         bucket: 'fadirect-storage', // Your S3 bucket name
         region: 'us-east-1', // Your AWS region
       },
     },
   };

   export const configureAmplify = () => {
     Amplify.configure(amplifyConfig);
   };

   export default amplifyConfig;
   ```

3. **Save the file**

### Step 2: Create Environment-Specific Config (Recommended)

For better security, use environment variables:

1. **Create `.env` file** in project root:
   ```env
   # AWS Amplify Configuration
   AWS_REGION=us-east-1
   AWS_USER_POOL_ID=us-east-1_abc123DEF
   AWS_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m
   AWS_APPSYNC_ENDPOINT=https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
   AWS_S3_BUCKET=fadirect-storage
   ```

2. **Update `amplify.ts` to use environment variables**:
   ```typescript
   import { Amplify } from 'aws-amplify';

   export const amplifyConfig = {
     Auth: {
       Cognito: {
         region: process.env.AWS_REGION || 'us-east-1',
         userPoolId: process.env.AWS_USER_POOL_ID || '',
         userPoolClientId: process.env.AWS_USER_POOL_CLIENT_ID || '',
         signUpVerificationMethod: 'code',
         loginWith: {
           phone: true,
         },
       },
     },
     API: {
       GraphQL: {
         endpoint: process.env.AWS_APPSYNC_ENDPOINT || '',
         region: process.env.AWS_REGION || 'us-east-1',
         defaultAuthMode: 'userPool',
       },
     },
     Storage: {
       S3: {
         bucket: process.env.AWS_S3_BUCKET || '',
         region: process.env.AWS_REGION || 'us-east-1',
       },
     },
   };

   export const configureAmplify = () => {
     Amplify.configure(amplifyConfig);
   };

   export default amplifyConfig;
   ```

3. **Add `.env` to `.gitignore`**:
   ```
   # Environment variables
   .env
   .env.local
   .env.production
   ```

---

## Environment Variables

### For Local Development

**Create `.env.local`**:
```env
AWS_REGION=us-east-1
AWS_USER_POOL_ID=us-east-1_abc123DEF
AWS_USER_POOL_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m
AWS_APPSYNC_ENDPOINT=https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
AWS_S3_BUCKET=fadirect-storage
```

### For Expo EAS Build

1. **Set secrets in EAS**:
   ```bash
   eas secret:create --scope project --name AWS_REGION --value us-east-1
   eas secret:create --scope project --name AWS_USER_POOL_ID --value us-east-1_abc123DEF
   eas secret:create --scope project --name AWS_USER_POOL_CLIENT_ID --value 1a2b3c4d5e6f7g8h9i0j1k2l3m
   eas secret:create --scope project --name AWS_APPSYNC_ENDPOINT --value https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql
   eas secret:create --scope project --name AWS_S3_BUCKET --value fadirect-storage
   ```

2. **Update `app.config.js`**:
   ```javascript
   module.exports = ({ config }) => {
     return {
       ...config,
       name: 'FA Direct',
       slug: 'fadirect',
       extra: {
         awsRegion: process.env.AWS_REGION,
         awsUserPoolId: process.env.AWS_USER_POOL_ID,
         awsUserPoolClientId: process.env.AWS_USER_POOL_CLIENT_ID,
         awsAppsyncEndpoint: process.env.AWS_APPSYNC_ENDPOINT,
         awsS3Bucket: process.env.AWS_S3_BUCKET,
       },
     };
   };
   ```

3. **Access in `amplify.ts`**:
   ```typescript
   import Constants from 'expo-constants';

   const extra = Constants.expoConfig?.extra || {};

   export const amplifyConfig = {
     Auth: {
       Cognito: {
         region: extra.awsRegion || 'us-east-1',
         userPoolId: extra.awsUserPoolId || '',
         userPoolClientId: extra.awsUserPoolClientId || '',
         // ... rest of config
       },
     },
     // ... rest of config
   };
   ```

---

## Testing Your Setup

### Step 1: Test Locally

1. **Pull the repository on Windows**:
   ```bash
   git pull origin claude/fix-build-errors-XqVrB
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Test phone authentication**:
   - Open app on simulator/device
   - Enter a phone number (must be in SNS sandbox)
   - Verify you receive SMS code
   - Enter code and confirm authentication works

### Step 2: Test Authentication Flow

1. **Sign up with phone number**:
   ```
   Test phone: +1234567890 (must be in SNS sandbox)
   ```

2. **Check Cognito Users**:
   - AWS Console → Cognito → User pools → `fadirect-user-pool` → **Users**
   - Verify new user appears

### Step 3: Test GraphQL API

1. **Open AppSync Console**:
   - AppSync → `fadirect-api` → **Queries**

2. **Run test query**:
   ```graphql
   query ListUsers {
     listUsers {
       items {
         id
         phoneNumber
         firstName
         lastName
       }
     }
   }
   ```

3. **Verify data appears**

### Step 4: Test S3 Storage

1. **Upload a test file in the app**
2. **Check S3 bucket**:
   - S3 → `fadirect-storage`
   - Verify file appears

---

## Troubleshooting

### Issue: "User pool client does not exist"

**Solution**:
- Verify `userPoolClientId` is correct
- Check app client exists: Cognito → User pools → App integration

### Issue: "User does not exist"

**Solution**:
- Sign up first before signing in
- Check phone number format: `+[country code][number]` (e.g., `+14155552671`)

### Issue: "SMS not received"

**Solutions**:
1. **Check SNS Sandbox**:
   - Verify phone number is added to sandbox
   - Production requires SNS access approval

2. **Check SNS IAM Role**:
   - Cognito → User pools → Messaging → SMS
   - Verify IAM role has SNS permissions

3. **Check AWS Service Quotas**:
   - SNS → Text messaging → Spending limits
   - Default sandbox limit: $1/month

### Issue: "GraphQL endpoint not found"

**Solution**:
- Verify endpoint URL is correct
- Check region matches
- Verify AppSync API is deployed

### Issue: "Access denied to S3"

**Solutions**:
1. **Check CORS configuration**
2. **Verify IAM policy attached**
3. **Check bucket permissions**

### Issue: "Amplify not configured"

**Solution**:
- Ensure `configureAmplify()` is called before any auth/API calls
- Check `App.tsx` initializes Amplify on startup

### Issue: Environment variables not loading

**Solutions**:
1. **For local dev**: Use `expo-constants` and `app.config.js`
2. **For EAS builds**: Set secrets via `eas secret:create`
3. **Restart dev server** after changing `.env`

---

## Quick Reference

### AWS Console Links
- **Cognito**: https://console.aws.amazon.com/cognito/
- **AppSync**: https://console.aws.amazon.com/appsync/
- **S3**: https://console.aws.amazon.com/s3/
- **SNS**: https://console.aws.amazon.com/sns/
- **IAM**: https://console.aws.amazon.com/iam/

### Configuration Values Checklist
- [ ] AWS Region (e.g., `us-east-1`)
- [ ] Cognito User Pool ID (e.g., `us-east-1_abc123DEF`)
- [ ] Cognito App Client ID (26 characters)
- [ ] AppSync GraphQL Endpoint URL
- [ ] S3 Bucket Name
- [ ] SNS Phone Numbers (for testing)

### Files to Update
- [ ] `src/config/amplify.ts` - Main Amplify configuration
- [ ] `.env` - Environment variables (don't commit!)
- [ ] `app.config.js` - Expo configuration with secrets
- [ ] `README.md` - Update backend info

---

## Next Steps After Setup

1. **Update README.md**:
   - Replace Supabase references with AWS Amplify
   - Update backend setup section

2. **Commit Configuration**:
   ```bash
   git add src/config/amplify.ts app.config.js
   git commit -m "Configure AWS Amplify backend services"
   git push origin claude/fix-build-errors-XqVrB
   ```

3. **Build and Test**:
   ```bash
   npm run build:preview
   ```

4. **Deploy to Production**:
   - Request SNS production access
   - Update production environment variables
   - Build production version

---

## Support

**Need help?**
- AWS Support: https://console.aws.amazon.com/support/
- Amplify Docs: https://docs.amplify.aws/
- AppSync Docs: https://docs.aws.amazon.com/appsync/
- Cognito Docs: https://docs.aws.amazon.com/cognito/

**Project Info**:
- GitHub: https://github.com/madcrx/FADirect
- Branch: `claude/fix-build-errors-XqVrB`
