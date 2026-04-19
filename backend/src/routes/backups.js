const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// AWS S3
const AWS = require('aws-sdk');

// Get all backup schedules
router.get('/schedules', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT * FROM backup_schedules
      ORDER BY created_at DESC
    `);

    res.json({
      schedules: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        frequency: row.frequency,
        destination: row.destination,
        destinationConfig: row.destination_config,
        isActive: row.is_active,
        lastRunAt: row.last_run_at,
        nextRunAt: row.next_run_at,
        createdAt: row.created_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create a backup schedule
router.post('/schedules',
  authenticateToken,
  requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('frequency').isIn(['hourly', 'daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
    body('destination').isIn(['local', 's3', 'google-drive', 'dropbox']).withMessage('Invalid destination'),
    body('destinationConfig').optional().isObject().withMessage('Destination config must be an object'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { name, frequency, destination, destinationConfig } = req.body;

    try {
      // Calculate next run time based on frequency
      let nextRunAt = new Date();
      switch (frequency) {
        case 'hourly':
          nextRunAt.setHours(nextRunAt.getHours() + 1);
          break;
        case 'daily':
          nextRunAt.setDate(nextRunAt.getDate() + 1);
          break;
        case 'weekly':
          nextRunAt.setDate(nextRunAt.getDate() + 7);
          break;
        case 'monthly':
          nextRunAt.setMonth(nextRunAt.getMonth() + 1);
          break;
      }

      const result = await db.query(`
        INSERT INTO backup_schedules (name, frequency, destination, destination_config, next_run_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [name, frequency, destination, JSON.stringify(destinationConfig || {}), nextRunAt]);

      const schedule = result.rows[0];

      res.status(201).json({
        message: 'Backup schedule created successfully',
        schedule: {
          id: schedule.id,
          name: schedule.name,
          frequency: schedule.frequency,
          destination: schedule.destination,
          destinationConfig: schedule.destination_config,
          isActive: schedule.is_active,
          nextRunAt: schedule.next_run_at,
          createdAt: schedule.created_at,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update a backup schedule
router.put('/schedules/:id',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const { name, frequency, destination, destinationConfig, isActive } = req.body;

    try {
      const result = await db.query(`
        UPDATE backup_schedules
        SET name = COALESCE($1, name),
            frequency = COALESCE($2, frequency),
            destination = COALESCE($3, destination),
            destination_config = COALESCE($4, destination_config),
            is_active = COALESCE($5, is_active)
        WHERE id = $6
        RETURNING *
      `, [name, frequency, destination, destinationConfig ? JSON.stringify(destinationConfig) : null, isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: { message: 'Backup schedule not found' } });
      }

      const schedule = result.rows[0];

      res.json({
        message: 'Backup schedule updated successfully',
        schedule: {
          id: schedule.id,
          name: schedule.name,
          frequency: schedule.frequency,
          destination: schedule.destination,
          destinationConfig: schedule.destination_config,
          isActive: schedule.is_active,
          nextRunAt: schedule.next_run_at,
          createdAt: schedule.created_at,
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a backup schedule
router.delete('/schedules/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      DELETE FROM backup_schedules WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Backup schedule not found' } });
    }

    res.json({ message: 'Backup schedule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get backup history
router.get('/history', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT bh.*, bs.name as schedule_name
      FROM backup_history bh
      LEFT JOIN backup_schedules bs ON bh.schedule_id = bs.id
      ORDER BY bh.started_at DESC
      LIMIT 100
    `);

    res.json({
      history: result.rows.map(row => ({
        id: row.id,
        scheduleId: row.schedule_id,
        scheduleName: row.schedule_name,
        status: row.status,
        filePath: row.file_path,
        fileSize: row.file_size,
        errorMessage: row.error_message,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Create database backup file
async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;
  const backupDir = path.join(__dirname, '../../backups');

  // Create backups directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const filePath = path.join(backupDir, filename);

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'fadirect',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  };

  // Use pg_dump to create backup
  const command = `PGPASSWORD="${dbConfig.password}" pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filePath}"`;

  await execPromise(command);

  const stats = fs.statSync(filePath);

  return {
    filePath,
    fileSize: stats.size,
    filename,
  };
}

// Upload to S3
async function uploadToS3(filePath, config) {
  const s3 = new AWS.S3({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: config.region || 'us-east-1',
  });

  const fileContent = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  const params = {
    Bucket: config.bucket,
    Key: `fadirect-backups/${filename}`,
    Body: fileContent,
  };

  await s3.upload(params).promise();
}

// Manual backup trigger
router.post('/manual',
  authenticateToken,
  requireAdmin,
  [
    body('destination').isIn(['local', 's3', 'google-drive', 'dropbox']).withMessage('Invalid destination'),
    body('destinationConfig').optional().isObject().withMessage('Destination config must be an object'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { destination, destinationConfig } = req.body;

    try {
      const startedAt = new Date();

      // Create backup history record
      const historyResult = await db.query(`
        INSERT INTO backup_history (status, started_at)
        VALUES ('running', $1)
        RETURNING id
      `, [startedAt]);

      const historyId = historyResult.rows[0].id;

      // Create database backup
      const backup = await createDatabaseBackup();

      // Upload to destination if not local
      if (destination === 's3') {
        await uploadToS3(backup.filePath, destinationConfig);
      } else if (destination === 'google-drive') {
        // Google Drive integration would go here
        throw new Error('Google Drive integration not yet implemented');
      } else if (destination === 'dropbox') {
        // Dropbox integration would go here
        throw new Error('Dropbox integration not yet implemented');
      }

      // Update backup history
      await db.query(`
        UPDATE backup_history
        SET status = 'completed',
            file_path = $1,
            file_size = $2,
            completed_at = NOW()
        WHERE id = $3
      `, [backup.filePath, backup.fileSize, historyId]);

      res.json({
        message: 'Backup created successfully',
        backup: {
          id: historyId,
          filePath: backup.filePath,
          fileSize: backup.fileSize,
          destination,
        }
      });
    } catch (error) {
      // Update backup history with error
      if (historyId) {
        await db.query(`
          UPDATE backup_history
          SET status = 'failed',
              error_message = $1,
              completed_at = NOW()
          WHERE id = $2
        `, [error.message, historyId]);
      }
      next(error);
    }
  }
);

// Download backup file
router.get('/download/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT * FROM backup_history WHERE id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Backup not found' } });
    }

    const backup = result.rows[0];

    if (!backup.file_path || !fs.existsSync(backup.file_path)) {
      return res.status(404).json({ error: { message: 'Backup file not found' } });
    }

    const filename = path.basename(backup.file_path);
    res.download(backup.file_path, filename);
  } catch (error) {
    next(error);
  }
});

// Restore from backup
router.post('/restore/:id',
  authenticateToken,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;

    try {
      console.log(`Starting restore process for backup ID: ${id}`);

      const result = await db.query(`
        SELECT * FROM backup_history WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) {
        console.error(`Backup not found: ${id}`);
        return res.status(404).json({ error: { message: 'Backup not found' } });
      }

      const backup = result.rows[0];
      console.log(`Backup found: ${backup.file_path}`);

      if (!backup.file_path) {
        console.error('Backup file path is null');
        return res.status(404).json({ error: { message: 'Backup file path not recorded' } });
      }

      if (!fs.existsSync(backup.file_path)) {
        console.error(`Backup file does not exist at path: ${backup.file_path}`);
        return res.status(404).json({
          error: {
            message: 'Backup file not found on disk',
            details: `Expected location: ${backup.file_path}`
          }
        });
      }

      // Check if file is readable
      try {
        fs.accessSync(backup.file_path, fs.constants.R_OK);
        console.log('Backup file is readable');
      } catch (err) {
        console.error('Backup file is not readable:', err);
        return res.status(500).json({
          error: {
            message: 'Backup file is not readable',
            details: err.message
          }
        });
      }

      const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'fadirect',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      };

      console.log('Starting database restore...');
      console.log(`Database: ${dbConfig.database}, Host: ${dbConfig.host}, Port: ${dbConfig.port}, User: ${dbConfig.user}`);

      // First check if psql is available
      try {
        await execPromise('psql --version');
        console.log('psql is available');
      } catch (err) {
        console.error('psql not found in PATH:', err);
        return res.status(500).json({
          error: {
            message: 'PostgreSQL client tools not found',
            details: 'psql command is not available. Please ensure PostgreSQL client is installed.'
          }
        });
      }

      // Use psql to restore backup with error output
      // --single-transaction ensures atomicity - either all or nothing
      const command = `PGPASSWORD="${dbConfig.password}" psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} --single-transaction -f "${backup.file_path}" 2>&1`;

      console.log('Executing restore command...');
      const { stdout, stderr } = await execPromise(command);

      if (stderr && !stderr.includes('NOTICE')) {
        console.error('Restore stderr:', stderr);
      }
      if (stdout) {
        console.log('Restore stdout:', stdout);
      }

      console.log('Database restore completed successfully');
      res.json({
        message: 'Database restored successfully from backup',
        details: {
          backupDate: backup.started_at,
          fileSize: backup.file_size,
          fileName: path.basename(backup.file_path),
        }
      });
    } catch (error) {
      console.error('Restore error:', error);
      const errorMessage = error.stderr || error.message || 'Unknown error occurred';
      res.status(500).json({
        error: {
          message: 'Failed to restore database',
          details: errorMessage
        }
      });
    }
  }
);

module.exports = router;
