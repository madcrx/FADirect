# Quick Browser Workflow - AWS Console Configuration

Simple step-by-step guide for checking and completing AWS configurations using your browser.

## 🌐 Open These Tabs

Open AWS Console and create these tabs:

1. **Tab 1 - Cognito**: https://console.aws.amazon.com/cognito/v2/idp/user-pools
2. **Tab 2 - SNS**: https://console.aws.amazon.com/sns/v3/home#/mobile/text-messaging
3. **Tab 3 - AppSync**: https://console.aws.amazon.com/appsync/home
4. **Tab 4 - S3**: https://console.aws.amazon.com/s3/buckets
5. **Tab 5 - This Guide** (keep open for reference)

---

## ✅ Workflow: Check Each Service

### 1. Cognito (Tab 1)

**Find your user pool:**
- Look for: `fadirect-user-pool` or `fadirect` or similar
- No pools? → Need to create one (see full setup guide)

**Click on the pool → Collect info:**

| Item | Where to Find | Value |
|------|---------------|-------|
| User Pool ID | "User pool overview" section | `ap-southeast-2_el3OwHrvc` |
| Region | Top of page (e.g., us-east-1) | `ap-southeast-2` |

**Click "App integration" tab → Scroll to "App clients":**

| Item | Where to Find | Value |
|------|---------------|-------|
| App Client ID | Click on client name | `7k4prhvslbjtpo9k8aeej7jo08` |

**Check authentication flows:**
- Click **Edit** on app client
- Scroll to "Authentication flows"
- Ensure checked: ✅ ALLOW_CUSTOM_AUTH, ✅ ALLOW_USER_SRP_AUTH, ✅ ALLOW_REFRESH_TOKEN_AUTH
- If not checked → Check them → **Save changes**

**Check messaging:**
- Click "Messaging" tab
- Find "SMS" section
- Is IAM role configured?
  - ✅ Yes → All good
  - ❌ No → Click **Edit** → Select/create role → **Save**

---

### 2. SNS (Tab 2)

**You should see "Text messaging (SMS)" page:**

**Click "Sandbox destinations" (left sidebar):**
- Do you see verified phone numbers?
  - ✅ Yes → Note which numbers are there
  - ❌ No or incomplete → Add your test phones:

**Add test phone:**
1. Click **Add phone number**
2. Enter: `+[country code][number]` (e.g., `+14155552671`)
3. Click **Add phone number**
4. Check your phone for SMS
5. Enter verification code
6. Status should show "Verified"
7. Repeat for all test phones you'll use

**IMPORTANT**: Only verified phones can receive SMS in sandbox mode!

---

### 3. AppSync (Tab 3)

**Find your API:**
- Look for: `fadirect-api` or similar
- No APIs? → Need to create one (see full setup guide)

**Click on the API → Collect info:**

| Item | Where to Find | Value |
|------|---------------|-------|
| API ID | Top of page | `___________` |
| GraphQL endpoint | Settings tab | `___________` |
| Region | Top of page | `___________` |

**Click "Settings" → Check authorization:**
- Default authorization type: Should be **Amazon Cognito User Pool**
- Cognito User Pool: Should be your `fadirect-user-pool`
- Wrong? → **Edit** → Fix → **Save**

**Click "Schema" tab:**
- Do you see types defined (User, Conversation, Message, Case)?
  - ✅ Yes → All good, schema is configured
  - ❌ No or empty → Copy schema from AWS_AMPLIFY_SETUP_GUIDE.md → Paste here → **Save Schema**

**Click "Data sources" tab:**
- Should see DynamoDB tables: UsersTable, ConversationsTable, MessagesTable, CasesTable
- Missing? → Schema didn't deploy correctly → Re-save schema

---

### 4. S3 (Tab 4)

**Find your bucket:**
- Look for: `fadirect-storage` or `fadirect` or similar
- No bucket? → Create one:
  1. Click **Create bucket**
  2. Name: `fadirect-storage-[yourcompany]` (must be unique!)
  3. Region: Same as Cognito
  4. Block all public access: ✅ ON
  5. Encryption: ✅ Enable (SSE-S3)
  6. **Create bucket**

**Click on bucket name → Collect info:**

| Item | Where to Find | Value |
|------|---------------|-------|
| Bucket name | Top of page | `___________` |
| Region | Properties tab | `___________` |

**Click "Permissions" tab:**

**Check CORS:**
- Scroll to "Cross-origin resource sharing (CORS)"
- Is it configured?
  - ✅ Yes → Verify it matches the config below
  - ❌ No → Click **Edit** → Paste config below → **Save**

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

**Check public access:**
- "Block public access (bucket settings)" section
- All 4 should be **On** (this is correct!)

**Check encryption:**
- Click "Properties" tab
- Scroll to "Default encryption"
- Should be enabled (SSE-S3)
- Not enabled? → **Edit** → Select **Server-side encryption with Amazon S3 managed keys (SSE-S3)** → **Save**

---

## 📝 Summary: Values to Collect

Once you've checked all services, you should have:

```
══════════════════════════════════════════════
AWS CONFIGURATION VALUES
══════════════════════════════════════════════

AWS Region:              _______________________

COGNITO:
  User Pool ID:          _______________________
  App Client ID:         _______________________

APPSYNC:
  GraphQL Endpoint:      _______________________

S3:
  Bucket Name:           _______________________

SNS:
  Verified Phones:       _______________________
                         _______________________
                         _______________________
══════════════════════════════════════════════
```

---

## 💻 Next: Update Your App Code

1. **Save the values above** (you'll need them!)

2. **On your Windows PC**, open:
   ```
   FADirect\src\config\amplify.ts
   ```

3. **Replace these placeholders:**
   - `YOUR_USER_POOL_ID` → Your User Pool ID
   - `YOUR_USER_POOL_CLIENT_ID` → Your App Client ID
   - `YOUR_GRAPHQL_ENDPOINT` → Your GraphQL Endpoint
   - `region: 'us-east-1'` → Your region (if different)
   - Add Storage config if missing

4. **Example final config:**
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
         bucket: 'fadirect-storage-mycompany',
         region: 'us-east-1',
       },
     },
   };
   ```

5. **Save the file**

---

## 🧪 Test It

On Windows PC:

```bash
cd FADirect
git pull origin claude/fix-build-errors-XqVrB
npm install
npx expo start
```

**Try authentication:**
1. Open app on device/simulator
2. Enter a verified phone number (from SNS sandbox)
3. Should receive SMS code
4. Enter code → Should authenticate successfully

**If SMS not received:**
- ❌ Phone not in SNS sandbox → Go back to Tab 2, add it
- ❌ Wrong region → Check all services in same region
- ❌ IAM role missing → Go back to Tab 1, configure Cognito messaging

---

## 🔄 Common Issues

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| No SMS received | Phone not in SNS sandbox | Tab 2: Add phone number |
| "User pool not found" | Wrong User Pool ID | Tab 1: Double-check ID |
| "Unauthorized" | Wrong App Client ID | Tab 1: Check App integration |
| API errors | Wrong endpoint or region | Tab 3: Verify Settings |
| Upload fails | CORS not configured | Tab 4: Add CORS config |

---

## ✅ Done!

Once you've:
- ✅ Verified all 4 services (Cognito, SNS, AppSync, S3)
- ✅ Collected all configuration values
- ✅ Updated `amplify.ts` with real values
- ✅ Tested authentication successfully

**You're ready to commit and deploy!**

```bash
git add src/config/amplify.ts
git commit -m "Configure AWS Amplify with production values"
git push origin claude/fix-build-errors-XqVrB
npm run build:preview
```

---

**Keep this page bookmarked for quick AWS Console reference!**
