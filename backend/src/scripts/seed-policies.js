const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Simple function to create a basic PDF-like file with text content
function createSamplePDF(title, content, filepath) {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
50 700 Td
(${title}) Tj
0 -50 Td
/F1 12 Tf
(${content}) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000315 00000 n
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
565
%%EOF`;

  fs.writeFileSync(filepath, pdfContent);
}

async function seedPolicies() {
  console.log('🌱 Seeding policy documents...\n');

  try {
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads/policies');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads/policies directory\n');
    }

    // Get categories
    const categoriesResult = await db.query('SELECT id, name FROM policy_categories ORDER BY display_order');
    const categories = categoriesResult.rows;

    if (categories.length === 0) {
      console.error('❌ No categories found. Please run migrations first.');
      process.exit(1);
    }

    // Get admin user for created_by
    const adminResult = await db.query("SELECT id FROM users WHERE 'admin' = ANY(role) LIMIT 1");
    const adminId = adminResult.rows[0]?.id;

    // Sample policies for each category
    const samplePolicies = [
      {
        category: 'HR Policies',
        policies: [
          {
            title: 'Employee Handbook 2024',
            version: 'v3.2',
            description: 'Comprehensive guide to company policies, procedures, and employee expectations',
            requires_acknowledgment: true,
            content: 'This handbook outlines all employment policies including conduct, benefits, and workplace standards.'
          },
          {
            title: 'Code of Conduct',
            version: 'v2.1',
            description: 'Professional standards and ethical guidelines for all staff members',
            requires_acknowledgment: true,
            content: 'All employees must maintain professional conduct and adhere to ethical standards.'
          },
          {
            title: 'Leave and Absence Policy',
            version: 'v1.5',
            description: 'Guidelines for requesting and managing various types of leave',
            requires_acknowledgment: false,
            content: 'This policy covers annual leave, sick leave, compassionate leave, and other absences.'
          }
        ]
      },
      {
        category: 'Health & Safety',
        policies: [
          {
            title: 'Workplace Health & Safety Manual',
            version: 'v4.0',
            description: 'Comprehensive workplace safety procedures and emergency protocols',
            requires_acknowledgment: true,
            content: 'Critical safety procedures to ensure a safe working environment for all staff.'
          },
          {
            title: 'Infection Control Protocol',
            version: 'v2.3',
            description: 'Infection prevention and control measures',
            requires_acknowledgment: true,
            content: 'Guidelines for maintaining hygiene standards and preventing disease transmission.'
          },
          {
            title: 'PPE Requirements',
            version: 'v1.8',
            description: 'Personal protective equipment guidelines and requirements',
            requires_acknowledgment: false,
            content: 'Requirements for using personal protective equipment in various work situations.'
          }
        ]
      },
      {
        category: 'Service Standards',
        policies: [
          {
            title: 'Client Service Excellence Guide',
            version: 'v2.0',
            description: 'Standards for delivering exceptional service to families',
            requires_acknowledgment: true,
            content: 'Guidelines for providing compassionate and professional service to bereaved families.'
          },
          {
            title: 'Communication Standards',
            version: 'v1.6',
            description: 'Professional communication protocols with families and stakeholders',
            requires_acknowledgment: false,
            content: 'Standards for all forms of communication including phone, email, and in-person interactions.'
          }
        ]
      },
      {
        category: 'Operations',
        policies: [
          {
            title: 'Vehicle Usage Policy',
            version: 'v1.4',
            description: 'Guidelines for company vehicle operation and maintenance',
            requires_acknowledgment: false,
            content: 'Requirements and procedures for using company vehicles safely and responsibly.'
          },
          {
            title: 'Equipment Handling Procedures',
            version: 'v2.2',
            description: 'Proper handling and maintenance of funeral equipment',
            requires_acknowledgment: true,
            content: 'Detailed procedures for handling, maintaining, and storing funeral equipment.'
          },
          {
            title: 'Facility Access and Security',
            version: 'v1.9',
            description: 'Building access, security protocols, and after-hours procedures',
            requires_acknowledgment: false,
            content: 'Guidelines for facility access, alarm systems, and security procedures.'
          }
        ]
      },
      {
        category: 'Compliance',
        policies: [
          {
            title: 'Privacy and Confidentiality Policy',
            version: 'v3.1',
            description: 'Data protection and confidentiality requirements',
            requires_acknowledgment: true,
            content: 'Legal requirements for protecting client information and maintaining confidentiality.'
          },
          {
            title: 'Record Retention Policy',
            version: 'v1.7',
            description: 'Document retention and disposal guidelines',
            requires_acknowledgment: false,
            content: 'Guidelines for how long to retain various types of records and proper disposal methods.'
          }
        ]
      }
    ];

    let totalCreated = 0;

    for (const categoryGroup of samplePolicies) {
      const category = categories.find(c => c.name === categoryGroup.category);
      if (!category) {
        console.log(`⚠️  Category not found: ${categoryGroup.category}`);
        continue;
      }

      console.log(`📁 Creating policies for: ${categoryGroup.category}`);

      for (const policy of categoryGroup.policies) {
        // Create filename
        const filename = `${policy.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${policy.version}.pdf`;
        const filepath = path.join(uploadsDir, filename);

        // Create the PDF file
        createSamplePDF(policy.title, policy.content, filepath);

        // Get file stats
        const stats = fs.statSync(filepath);

        // Insert into database
        await db.query(
          `INSERT INTO policy_documents (
            title, category_id, version, file_path, file_name, file_size, mime_type,
            requires_acknowledgment, description, effective_date, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT DO NOTHING`,
          [
            policy.title,
            category.id,
            policy.version,
            `uploads/policies/${filename}`,
            filename,
            stats.size,
            'application/pdf',
            policy.requires_acknowledgment,
            policy.description,
            new Date(),
            adminId,
            adminId
          ]
        );

        console.log(`  ✅ ${policy.title}`);
        totalCreated++;
      }
      console.log('');
    }

    console.log(`\n✨ Successfully created ${totalCreated} sample policy documents!\n`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedPolicies();
