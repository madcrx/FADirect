# Supabase Setup Guide

This app uses Supabase for authentication, database, and storage. Follow these steps to set up your Supabase project.

## 1. Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Note your project URL and anon key from Settings > API

## 2. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Or update `src/config/supabase.ts` directly with your credentials.

## 3. Set Up Database Schema

Run the following SQL in your Supabase SQL Editor (Dashboard > SQL Editor):

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('arranger', 'mourner')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  organization_id UUID,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Arrangements table
CREATE TABLE arrangements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arranger_id UUID NOT NULL REFERENCES users(id),
  mourner_id UUID NOT NULL REFERENCES users(id),
  deceased_name TEXT NOT NULL,
  funeral_type TEXT NOT NULL,
  status TEXT NOT NULL,
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  current_step_index INTEGER DEFAULT 0,
  scheduled_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  encrypted_content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  attachments JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  caption TEXT,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Templates table
CREATE TABLE "formTemplates" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Submissions table
CREATE TABLE "formSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arrangement_id UUID NOT NULL REFERENCES arrangements(id),
  template_id UUID NOT NULL REFERENCES "formTemplates"(id),
  submitted_by UUID NOT NULL REFERENCES users(id),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Encryption Keys table
CREATE TABLE "encryptionKeys" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "identityKey" TEXT NOT NULL,
  "registrationId" INTEGER NOT NULL,
  "preKeys" JSONB NOT NULL,
  "signedPreKey" JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_arrangements_arranger ON arrangements(arranger_id);
CREATE INDEX idx_arrangements_mourner ON arrangements(mourner_id);
CREATE INDEX idx_messages_arrangement ON messages(arrangement_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_documents_arrangement ON documents(arrangement_id);
CREATE INDEX idx_photos_arrangement ON photos(arrangement_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE "encryptionKeys" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- RLS Policies for arrangements table
CREATE POLICY "Users can view own arrangements" ON arrangements
  FOR SELECT USING (
    auth.uid()::text = arranger_id::text OR
    auth.uid()::text = mourner_id::text
  );

CREATE POLICY "Users can create arrangements" ON arrangements
  FOR INSERT WITH CHECK (
    auth.uid()::text = arranger_id::text OR
    auth.uid()::text = mourner_id::text
  );

CREATE POLICY "Users can update own arrangements" ON arrangements
  FOR UPDATE USING (
    auth.uid()::text = arranger_id::text OR
    auth.uid()::text = mourner_id::text
  );

-- RLS Policies for messages table
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (
    auth.uid()::text = sender_id::text OR
    auth.uid()::text = recipient_id::text
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (
    auth.uid()::text = sender_id::text OR
    auth.uid()::text = recipient_id::text
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS Policies for encryption keys table
CREATE POLICY "Users can view own keys" ON "encryptionKeys"
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own keys" ON "encryptionKeys"
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view others' public keys" ON "encryptionKeys"
  FOR SELECT USING (true);
```

## 4. Set Up Storage Buckets

Create the following storage buckets in your Supabase dashboard (Storage section):

1. `profile-photos` - For user profile pictures
2. `documents` - For funeral arrangement documents
3. `photos` - For funeral photos
4. `thumbnails` - For photo thumbnails
5. `encrypted-files` - For encrypted file storage

Configure bucket policies to allow authenticated users to upload/download.

## 5. Enable Phone Authentication

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable "Phone" provider
3. Configure your phone auth provider (Twilio, MessageBird, etc.)
4. Add your provider credentials

## 6. Test Your Setup

Run the app in development mode:

```bash
npm start
```

If configured correctly, you should be able to:
- Sign in with phone number
- Create a user profile
- Access the app features

## Troubleshooting

### "Invalid API key" error
- Double-check your `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Make sure you're using the anon/public key, not the service role key

### Phone auth not working
- Verify your phone provider is configured correctly
- Check that you have credits in your SMS provider account
- Test with a verified phone number first

### Database errors
- Ensure all tables are created
- Check that Row Level Security policies are correctly configured
- Verify user IDs match between auth.users and your users table
