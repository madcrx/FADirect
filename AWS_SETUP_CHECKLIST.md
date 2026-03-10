# AWS Amplify Verification & Completion Checklist

Use this checklist to **verify existing** AWS configurations and **complete any missing** setup items.

## 🎯 Before You Start

- [ ] AWS Console credentials ready
- [ ] Browser open to: https://console.aws.amazon.com/
- [ ] Note which region services are in (likely: **us-east-1**)

---

## 1️⃣ AWS Cognito (Authentication)

### Verify Existing User Pool
- [ ] Navigate to: **Cognito** → **User pools**
- [ ] Check if user pool exists (look for names like `fadirect`, `fadirect-user-pool`, or similar)
- [ ] If exists: Click on it to review configuration
- [ ] If doesn't exist: Create new user pool (see full guide)

### Verify User Pool Configuration
Once you find the user pool:

**Sign-in Settings:**
- [ ] Check: **Sign-in options** → Phone number enabled?
- [ ] Check: **Sign-in options** → Email enabled? (optional)

**MFA & Security:**
- [ ] Review: **MFA** settings (No MFA is OK for testing)
- [ ] Review: **Password policy** (should be set)

**Self-Registration:**
- [ ] Check: **Sign-up experience** → Self-registration enabled?
- [ ] Check: **Attribute verification** → Phone number verification enabled?

**App Client:**
- [ ] Go to: **App integration** tab → **App clients**
- [ ] Verify app client exists (or create new one: `fadirect-app-client`)
- [ ] Click on app client → **Authentication flows** → Verify:
  - [ ] ✅ ALLOW_CUSTOM_AUTH
  - [ ] ✅ ALLOW_USER_SRP_AUTH
  - [ ] ✅ ALLOW_REFRESH_TOKEN_AUTH
- [ ] If missing flows: Click **Edit** → Enable them → **Save**

### Collect Cognito Values
Copy these values (you'll need them later):

```
User Pool ID: ___________________________
   Location: User pool → Overview
   Format: us-east-1_xxxxxxxxx

App Client ID: ___________________________
   Location: App integration → App clients
   Format: 26-character string

Region: ___________________________
   Example: us-east-1
```

### Configure SMS (CRITICAL!)
- [ ] Navigate to: **Amazon SNS** service
- [ ] Go to: **Text messaging (SMS)** → **Sandbox destinations**
- [ ] Check: Are test phone numbers already added?
  - [ ] If yes: Note which numbers are verified
  - [ ] If no: Click **Add phone number**
- [ ] For each test phone you'll use:
  - [ ] Add phone (with country code): **`+_____________`**
  - [ ] Verify SMS code received
  - [ ] Status shows "Verified"

### Verify Cognito-SNS Connection
- [ ] Back to Cognito → Your user pool → **Messaging** tab
- [ ] Check: **SMS configuration** section
- [ ] Verify: IAM role is configured for SNS
- [ ] If missing: Click **Edit** → Create SNS role → **Save**

---

## 2️⃣ AWS AppSync (GraphQL API)

### Verify Existing API
- [ ] Navigate to: **AWS AppSync**
- [ ] Check: Does an API exist? (look for `fadirect-api` or similar)
- [ ] If exists: Click on it to review
- [ ] If doesn't exist: Create new API (see full guide)

### Verify API Configuration
Once you find the API:

**Authorization:**
- [ ] Go to: **Settings** → **Authorization**
- [ ] Check: Default authorization type = **Amazon Cognito User Pool**?
- [ ] Check: Is your Cognito User Pool selected?
- [ ] If wrong: Click **Edit** → Select correct user pool → **Save**

**Schema:**
- [ ] Go to: **Schema** tab
- [ ] Review: Does schema include types for User, Conversation, Message, Case?
- [ ] If empty or incomplete:
  - [ ] Copy schema from AWS_AMPLIFY_SETUP_GUIDE.md (Section 3, Step 2)
  - [ ] Paste in schema editor
  - [ ] Click **Save Schema**
  - [ ] Wait for DynamoDB tables to auto-create

**Data Sources:**
- [ ] Go to: **Data sources** tab
- [ ] Check: Are DynamoDB tables created? (Users, Conversations, Messages, Cases)
- [ ] If missing: Schema didn't deploy → Re-save schema

### Collect AppSync Values

```
GraphQL Endpoint: ___________________________
   Location: Settings
   Format: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql

Region: ___________________________
   Same as Cognito region
```

---

## 3️⃣ AWS S3 (Storage)

### Verify Existing Bucket
- [ ] Navigate to: **Amazon S3**
- [ ] Check: Does a bucket exist? (look for `fadirect`, `fadirect-storage`, or similar)
- [ ] Note the exact bucket name: **___________________________**
- [ ] If no bucket: Create new one (see full guide)

### Verify Bucket Configuration
Once you find/create the bucket:

**Basic Settings:**
- [ ] Click on bucket name
- [ ] Check: **Region** (should match Cognito region)
- [ ] Check: **Properties** → **Encryption** → Should be enabled (SSE-S3)
- [ ] If encryption off: **Edit** → Enable **Server-side encryption (SSE-S3)** → **Save**

**CORS Configuration (CRITICAL!):**
- [ ] Go to: **Permissions** tab → **CORS** section
- [ ] Check: Is CORS configured?
- [ ] If empty or missing, paste this configuration:
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
- [ ] Click **Save changes**

**Public Access:**
- [ ] Check: **Permissions** → **Block Public Access**
- [ ] Verify: All four settings are **On** (blocked)
- [ ] This is correct! Files will use signed URLs instead

### Collect S3 Values

```
Bucket Name: ___________________________
   Example: fadirect-storage-mycompany

Region: ___________________________
   Same as Cognito region
```

---

## 4️⃣ Update App Configuration

### Collect All Configuration Values

Before updating code, gather these from AWS Console:

**From Cognito User Pool:**
```
User Pool ID: ___________________________
  Location: Cognito → User pools → [Your pool] → User pool overview
  Format: us-east-1_xxxxxxxxx

App Client ID: ___________________________
  Location: Same pool → App integration tab → App clients → [Your client]
  Format: 26-character alphanumeric

Region: ___________________________
  Example: us-east-1
```

**From AppSync API:**
```
GraphQL Endpoint: ___________________________
  Location: AppSync → [Your API] → Settings
  Format: https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql

Region: ___________________________
  Same as Cognito
```

**From S3:**
```
Bucket Name: ___________________________
  Location: S3 → Buckets → Note exact name

Region: ___________________________
  Same as Cognito
```

### Update amplify.ts File

1. **On your Windows PC**, navigate to:
   ```
   FADirect\src\config\amplify.ts
   ```

2. **Replace placeholder values** with your actual values collected above:
   ```typescript
   export const amplifyConfig = {
     Auth: {
       Cognito: {
         region: 'us-east-1',                    // ← Your region
         userPoolId: 'us-east-1_abc123DEF',      // ← Your User Pool ID
         userPoolClientId: '1a2b3c4d5...l3m',    // ← Your App Client ID
         signUpVerificationMethod: 'code',
         loginWith: {
           phone: true,
         },
       },
     },
     API: {
       GraphQL: {
         endpoint: 'https://xxxxx...graphql',    // ← Your GraphQL endpoint
         region: 'us-east-1',                     // ← Your region
         defaultAuthMode: 'userPool',
       },
     },
     Storage: {
       S3: {
         bucket: 'fadirect-storage',              // ← Your S3 bucket name
         region: 'us-east-1',                     // ← Your region
       },
     },
   };
   ```

3. **Save the file**

### Final Configuration Check

Your `amplify.ts` should look like:

```typescript
export const amplifyConfig = {
  Auth: {
    Cognito: {
      region: 'us-east-1',
      userPoolId: 'us-east-1_abc123DEF',
      userPoolClientId: '1a2b3c4d5e6f7g8h9i0j1k2l3m',
      signUpVerificationMethod: 'code',
      loginWith: {
        phone: true,
      },
    },
  },
  API: {
    GraphQL: {
      endpoint: 'https://xxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
  Storage: {
    S3: {
      bucket: 'fadirect-storage',
      region: 'us-east-1',
    },
  },
};
```

---

## 5️⃣ Verify IAM Permissions (Optional but Recommended)

### Check Cognito IAM Role for SNS
- [ ] Navigate to: **IAM** → **Roles**
- [ ] Search for role containing "cognito" or "sns"
- [ ] Click on role → **Permissions**
- [ ] Verify: Has `AmazonSNSFullAccess` or custom SNS policy
- [ ] If missing: **Add permissions** → Attach `AmazonSNSFullAccess` policy

### Check AppSync Permissions
- [ ] AppSync → Your API → **Settings** → **Authorization**
- [ ] Verify: Service role exists
- [ ] Click role → Opens IAM
- [ ] Verify: Has DynamoDB access permissions

---

## 6️⃣ Test Your Setup

### Pull Latest Code (Windows)
```bash
cd FADirect
git pull origin claude/fix-build-errors-XqVrB
```

### Install & Start
```bash
npm install
npx expo start
```

### Test Authentication
- [ ] Open app on device/simulator
- [ ] Enter test phone number (must be in SNS sandbox!)
- [ ] Receive SMS code
- [ ] Enter code
- [ ] Successfully authenticated

### Verify in AWS Console
- [ ] Cognito → Users: New user appears
- [ ] AppSync → Queries: Can query data
- [ ] S3 → Bucket: Files upload successfully

---

## ✅ Final Steps

- [ ] Update `.env` file with AWS values (don't commit!)
- [ ] Add `.env` to `.gitignore`
- [ ] Commit changes to git
- [ ] Build preview version: `npm run build:preview`
- [ ] Test on iPhone

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| SMS not received | Check SNS sandbox, verify phone added |
| Authentication fails | Verify User Pool ID and Client ID |
| API errors | Check GraphQL endpoint URL |
| Storage fails | Check S3 bucket name and CORS |

---

## 📋 Configuration Summary

Once complete, you'll have:

```
AWS Region:         ___________________
User Pool ID:       ___________________
App Client ID:      ___________________
GraphQL Endpoint:   ___________________
S3 Bucket:          ___________________
```

**Save these values securely!** You'll need them for:
- Local development (`.env` file)
- Production builds (EAS secrets)
- Team members setting up locally

---

## 📞 AWS Console URLs

Quick links for reference:

- **Cognito**: https://console.aws.amazon.com/cognito/
- **AppSync**: https://console.aws.amazon.com/appsync/
- **S3**: https://console.aws.amazon.com/s3/
- **SNS (SMS)**: https://console.aws.amazon.com/sns/

---

**Questions?** Refer to the detailed **AWS_AMPLIFY_SETUP_GUIDE.md** file!
