# AWS Amplify Backend Setup Script for PowerShell
# This script will guide you through setting up the AWS Amplify backend

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "AWS Amplify Backend Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure AWS Credentials
Write-Host "Step 1: Configure AWS Credentials" -ForegroundColor Yellow
Write-Host "You need to configure AWS credentials first." -ForegroundColor White
Write-Host ""
Write-Host "Run this command in PowerShell:" -ForegroundColor Green
Write-Host "  amplify configure" -ForegroundColor Green
Write-Host ""
Write-Host "This will:" -ForegroundColor White
Write-Host "1. Open your browser to sign in to AWS Console" -ForegroundColor White
Write-Host "2. Guide you to create an IAM user" -ForegroundColor White
Write-Host "3. Save the credentials locally" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Save the Access Key ID and Secret Access Key when shown!" -ForegroundColor Red
Write-Host ""
$response = Read-Host "Have you completed 'amplify configure'? (y/n)"
if ($response -ne 'y') {
    Write-Host "Please run 'amplify configure' first, then run this script again." -ForegroundColor Red
    exit
}

# Step 2: Initialize Amplify
Write-Host ""
Write-Host "Step 2: Initialize Amplify Project" -ForegroundColor Yellow
Write-Host "Initializing Amplify..." -ForegroundColor White
Write-Host ""

Write-Host "Answer the following prompts:" -ForegroundColor Cyan
Write-Host "  - Project name: FADirect" -ForegroundColor Gray
Write-Host "  - Environment name: dev" -ForegroundColor Gray
Write-Host "  - Default editor: Visual Studio Code (or your preference)" -ForegroundColor Gray
Write-Host "  - App type: javascript" -ForegroundColor Gray
Write-Host "  - Framework: react-native" -ForegroundColor Gray
Write-Host "  - Source directory: src" -ForegroundColor Gray
Write-Host "  - Distribution directory: /" -ForegroundColor Gray
Write-Host "  - Build command: npm run build" -ForegroundColor Gray
Write-Host "  - Start command: npm start" -ForegroundColor Gray
Write-Host "  - Use AWS profile: Yes (select the profile you created)" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to run 'amplify init'"

amplify init

# Step 3: Add Authentication
Write-Host ""
Write-Host "Step 3: Add Cognito Authentication" -ForegroundColor Yellow
Write-Host ""
Write-Host "Answer the following prompts:" -ForegroundColor Cyan
Write-Host "  - Configuration: Manual configuration" -ForegroundColor Gray
Write-Host "  - Sign-in method: Phone Number" -ForegroundColor Gray
Write-Host "  - MFA: No" -ForegroundColor Gray
Write-Host "  - Email verification: No" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to run 'amplify add auth'"

amplify add auth

# Step 4: Add GraphQL API
Write-Host ""
Write-Host "Step 4: Add AppSync GraphQL API" -ForegroundColor Yellow
Write-Host ""
Write-Host "Answer the following prompts:" -ForegroundColor Cyan
Write-Host "  - Service: GraphQL" -ForegroundColor Gray
Write-Host "  - API name: fadirectapi" -ForegroundColor Gray
Write-Host "  - Authorization: Amazon Cognito User Pool" -ForegroundColor Gray
Write-Host "  - Advanced settings: No" -ForegroundColor Gray
Write-Host "  - Schema template: Single object with fields" -ForegroundColor Gray
Write-Host ""
Read-Host "Press Enter to run 'amplify add api'"

amplify add api

# Update GraphQL schema
Write-Host ""
Write-Host "Updating GraphQL schema..." -ForegroundColor Yellow

$schemaPath = "amplify\backend\api\fadirectapi\schema.graphql"
$schema = @"
type User @model @auth(rules: [{allow: owner}]) {
  id: ID!
  phoneNumber: String! @index(name: "byPhoneNumber")
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
  messages: [Message] @hasMany(indexName: "byConversation", fields: ["id"])
}

type Message @model @auth(rules: [{allow: owner}]) {
  id: ID!
  conversationId: String! @index(name: "byConversation")
  senderId: String!
  senderName: String
  content: String!
  timestamp: AWSDateTime!
  read: Boolean
  attachments: [String]
  conversation: Conversation @belongsTo(fields: ["conversationId"])
}

type Case @model @auth(rules: [{allow: owner}]) {
  id: ID!
  deceasedName: String!
  familyMemberId: String!
  funeralDirectorId: String
  status: String!
  serviceDate: AWSDateTime
  serviceLocation: String
  notes: String
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}
"@

if (Test-Path $schemaPath) {
    Set-Content -Path $schemaPath -Value $schema
    Write-Host "✓ GraphQL schema updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Schema file not found at $schemaPath" -ForegroundColor Red
    Write-Host "You may need to update it manually after deployment." -ForegroundColor Yellow
}

# Step 5: Deploy to AWS
Write-Host ""
Write-Host "Step 5: Deploy to AWS" -ForegroundColor Yellow
Write-Host "This will create all resources in your AWS account." -ForegroundColor White
Write-Host "This process takes 5-10 minutes..." -ForegroundColor White
Write-Host ""
$deploy = Read-Host "Deploy now? (y/n)"

if ($deploy -eq 'y') {
    amplify push

    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "Deployment Complete!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""

    # Get configuration
    Write-Host "Getting configuration values..." -ForegroundColor Yellow
    Write-Host ""

    amplify status

    Write-Host ""
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Run: amplify configure project" -ForegroundColor White
    Write-Host "2. Copy the configuration values" -ForegroundColor White
    Write-Host "3. Update src/config/amplify.ts with your values" -ForegroundColor White
    Write-Host ""
    Write-Host "To get config in JSON format, run:" -ForegroundColor Yellow
    Write-Host "  amplify env get --json" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment skipped. Run 'amplify push' when ready." -ForegroundColor Yellow
}

Write-Host "Setup script complete!" -ForegroundColor Green
