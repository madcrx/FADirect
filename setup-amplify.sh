#!/bin/bash

# AWS Amplify Backend Setup Script
# This script will guide you through setting up the AWS Amplify backend

echo "========================================="
echo "AWS Amplify Backend Setup"
echo "========================================="
echo ""

# Step 1: Configure AWS Credentials (Interactive)
echo "Step 1: Configure AWS Credentials"
echo "This will open a browser to sign in to AWS and create an IAM user."
echo "Follow the prompts to create an IAM user with programmatic access."
echo ""
echo "Run this command NOW (in a separate terminal if needed):"
echo "  amplify configure"
echo ""
read -p "Press Enter after you've completed 'amplify configure'..."

# Step 2: Initialize Amplify
echo ""
echo "Step 2: Initialize Amplify Project"
echo "Starting Amplify initialization..."
echo ""

amplify init <<EOF
FADirect
dev
code
javascript
react-native
src
/
npm run build
npm start
Y
Y
default
EOF

# Step 3: Add Authentication
echo ""
echo "Step 3: Add Cognito Authentication"
echo ""

amplify add auth <<EOF
Manual configuration
Username
Phone Number
No
No
Email
No, I am done.
No
EOF

# Step 4: Add GraphQL API
echo ""
echo "Step 4: Add AppSync GraphQL API"
echo ""

amplify add api <<EOF
GraphQL
fadirectapi
Amazon Cognito User Pool
No
No
Single object with fields (e.g., "Todo" with ID, name, description)
No
Y
EOF

# Update the GraphQL schema
cat > amplify/backend/api/fadirectapi/schema.graphql <<'GRAPHQL_SCHEMA'
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
GRAPHQL_SCHEMA

echo ""
echo "GraphQL schema has been updated with your data models."
echo ""

# Step 5: Push to AWS
echo "Step 5: Deploy to AWS"
echo "This will create all resources in your AWS account."
echo ""
read -p "Press Enter to deploy to AWS (this may take 5-10 minutes)..."

amplify push --yes

# Step 6: Get configuration
echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Getting your configuration values..."
echo ""

amplify status

echo ""
echo "To get your configuration values, run:"
echo "  amplify env get --json dev"
echo ""
echo "Then update src/config/amplify.ts with these values."
echo ""
