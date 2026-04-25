const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class BackupScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️  Backup scheduler is already running');
      return;
    }

    console.log('🔄 Starting backup scheduler...');
    this.isRunning = true;

    // Check every 5 minutes for due backups
    this.intervalId = setInterval(() => {
      this.processDueBackups();
    }, 5 * 60 * 1000);

    // Run immediately on start
    this.processDueBackups();
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('⏸  Stopping backup scheduler...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async processDueBackups() {
    try {
      // Find all active schedules that are due to run
      const result = await db.query(`
        SELECT * FROM backup_schedules
        WHERE is_active = true
          AND next_run_at <= NOW()
        ORDER BY next_run_at ASC
      `);

      const dueSchedules = result.rows;

      if (dueSchedules.length > 0) {
        console.log(`📦 Found ${dueSchedules.length} due backup(s) to process`);
      }

      for (const schedule of dueSchedules) {
        await this.executeBackup(schedule);
      }
    } catch (error) {
      console.error('❌ Error processing due backups:', error);
    }
  }

  async executeBackup(schedule) {
    console.log(`🔄 Executing backup: ${schedule.name}`);

    const startedAt = new Date();
    let historyId = null;

    try {
      // Create backup history record
      const historyResult = await db.query(`
        INSERT INTO backup_history (schedule_id, status, started_at)
        VALUES ($1, 'in_progress', $2)
        RETURNING id
      `, [schedule.id, startedAt]);

      historyId = historyResult.rows[0].id;

      // Create database backup
      const backup = await this.createDatabaseBackup();

      // Upload to destination if not local
      if (schedule.destination === 's3') {
        const config = schedule.destination_config;
        await this.uploadToS3(backup.filePath, config);
      } else if (schedule.destination === 'google-drive') {
        console.log('⚠️  Google Drive integration not yet implemented');
      } else if (schedule.destination === 'dropbox') {
        console.log('⚠️  Dropbox integration not yet implemented');
      }

      // Update backup history with success
      await db.query(`
        UPDATE backup_history
        SET status = 'completed',
            file_path = $1,
            file_size = $2,
            completed_at = NOW()
        WHERE id = $3
      `, [backup.filePath, backup.fileSize, historyId]);

      // Update schedule's last run and calculate next run
      const nextRunAt = this.calculateNextRun(schedule.frequency, schedule.name);
      await db.query(`
        UPDATE backup_schedules
        SET last_run_at = $1,
            next_run_at = $2
        WHERE id = $3
      `, [startedAt, nextRunAt, schedule.id]);

      console.log(`✅ Backup completed: ${schedule.name}`);

      // Clean up old backups (keep last 30)
      await this.cleanupOldBackups();
    } catch (error) {
      console.error(`❌ Backup failed: ${schedule.name}`, error);

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

      // Still update next run time even if backup failed
      const nextRunAt = this.calculateNextRun(schedule.frequency, schedule.name);
      await db.query(`
        UPDATE backup_schedules
        SET next_run_at = $1
        WHERE id = $2
      `, [nextRunAt, schedule.id]);
    }
  }

  async createDatabaseBackup() {
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
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -F p -f "${filePath}"`;

    // Set PGPASSWORD via environment variable (works cross-platform)
    await execPromise(command, {
      env: {
        ...process.env,
        PGPASSWORD: dbConfig.password
      }
    });

    const stats = fs.statSync(filePath);

    return {
      filePath,
      fileSize: stats.size,
      filename,
    };
  }

  async uploadToS3(filePath, config) {
    const s3Client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      region: config.region || 'us-east-1',
    });

    const fileContent = fs.readFileSync(filePath);
    const filename = path.basename(filePath);

    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: `fadirect-backups/${filename}`,
      Body: fileContent,
    });

    await s3Client.send(command);
  }

  calculateNextRun(frequency, scheduleName = '') {
    const now = new Date();
    const nextRun = new Date(now);

    switch (frequency) {
      case 'custom':
        // Default custom frequency: 1 hour
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'hourly':
        nextRun.setHours(nextRun.getHours() + 1);
        break;
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }

    return nextRun;
  }

  async cleanupOldBackups() {
    try {
      const now = new Date();

      // Get all backup history records with their schedule info
      const result = await db.query(`
        SELECT
          bh.id,
          bh.file_path,
          bh.completed_at,
          bs.name as schedule_name,
          bs.frequency
        FROM backup_history bh
        LEFT JOIN backup_schedules bs ON bh.schedule_id = bs.id
        WHERE bh.status = 'completed'
          AND bh.file_path IS NOT NULL
        ORDER BY bh.completed_at DESC
      `);

      const backups = result.rows;
      let deletedCount = 0;

      for (const backup of backups) {
        const backupAge = now - new Date(backup.completed_at);
        const daysOld = backupAge / (1000 * 60 * 60 * 24);
        let shouldDelete = false;

        // Determine retention policy based on schedule type
        if (backup.schedule_name && backup.schedule_name.includes('Hourly')) {
          // Hourly backups: delete after 3 days
          shouldDelete = daysOld > 3;
        } else if (backup.frequency === 'hourly') {
          // Also catch by frequency
          shouldDelete = daysOld > 3;
        } else if (backup.schedule_name && backup.schedule_name.includes('Daily')) {
          // Daily backups: delete after 30 days
          shouldDelete = daysOld > 30;
        } else if (backup.frequency === 'daily') {
          // Also catch by frequency
          shouldDelete = daysOld > 30;
        } else if (backup.schedule_name && backup.schedule_name.includes('Monthly')) {
          // Monthly backups: keep permanently
          shouldDelete = false;
        } else if (backup.frequency === 'monthly') {
          // Also catch by frequency
          shouldDelete = false;
        } else if (!backup.schedule_id) {
          // Manual backups: delete after 30 days
          shouldDelete = daysOld > 30;
        }

        if (shouldDelete) {
          // Delete the file if it exists
          if (backup.file_path && fs.existsSync(backup.file_path)) {
            try {
              fs.unlinkSync(backup.file_path);
              deletedCount++;

              const retentionType = backup.schedule_name?.includes('Hourly') ? 'hourly' :
                                   backup.schedule_name?.includes('Daily') ? 'daily' : 'manual';
              console.log(`🗑️  Deleted ${retentionType} backup (${Math.floor(daysOld)} days old): ${path.basename(backup.file_path)}`);
            } catch (error) {
              console.error(`⚠️  Failed to delete backup file: ${backup.file_path}`, error);
            }
          }

          // Mark the history record as cleaned up
          await db.query(`
            UPDATE backup_history
            SET file_path = NULL
            WHERE id = $1
          `, [backup.id]);
        }
      }

      if (deletedCount > 0) {
        console.log(`✅ Cleanup complete: ${deletedCount} old backup(s) deleted`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up old backups:', error);
    }
  }
}

module.exports = new BackupScheduler();
