const fs = require('fs');
const path = require('path');

/**
 * Corruption-safe SQLite backup manager for Pryaskay Abdy.
 * Uses SQLite VACUUM INTO (atomic & WAL-safe) on the real active DB file (data.db),
 * with automatic fallback, pruning, and optional offsite backup push.
 */
function createBackupManager({ db, dbPath, backupsDir }) {
  const ensureDir = () => {
    try {
      if (!fs.existsSync(backupsDir)) {
        fs.mkdirSync(backupsDir, { recursive: true });
      }
    } catch (e) {}
  };

  function getLiveDbPath() {
    if (dbPath && fs.existsSync(dbPath)) return dbPath;
    const fallback = path.join(__dirname, '..', 'data.db');
    return fallback;
  }

  function listBackups() {
    ensureDir();
    try {
      return fs.readdirSync(backupsDir)
        .filter((f) => (f.startsWith('pryaska_backup_') || f.startsWith('chat_backup_')) && f.endsWith('.db'))
        .map((f) => {
          const full = path.join(backupsDir, f);
          try {
            const stats = fs.statSync(full);
            return {
              filename: f,
              sizeBytes: stats.size,
              sizeFormatted: `${(stats.size / 1024).toFixed(1)} KB`,
              createdAt: stats.mtime.getTime()
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error('Backup list error:', err.message);
      return [];
    }
  }

  function resolveBackupPath(filename) {
    if (!filename) return null;
    const safeFile = path.basename(String(filename));
    if (!safeFile.endsWith('.db')) return null;
    const target = path.join(backupsDir, safeFile);
    return fs.existsSync(target) ? { target, safeFile } : null;
  }

  async function notifyOffsiteBackup(targetPath, backupFileName) {
    try {
      const botToken = process.env.TELEGRAM_BACKUP_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID;
      if (botToken && chatId && typeof fetch === 'function' && typeof FormData !== 'undefined') {
        const buf = fs.readFileSync(targetPath);
        const form = new FormData();
        form.append('chat_id', chatId);
        form.append('caption', `📦 یەدەگی داتابەیسی پریاسکەی عەبدی\n${backupFileName}`);
        form.append('document', new Blob([buf]), backupFileName);
        await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: form
        }).catch(() => {});
      }
      const webhookUrl = process.env.BACKUP_WEBHOOK_URL;
      if (webhookUrl && typeof fetch === 'function') {
        const stats = fs.statSync(targetPath);
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'backup_created',
            filename: backupFileName,
            sizeBytes: stats.size,
            createdAt: new Date().toISOString()
          })
        }).catch(() => {});
      }
    } catch (e) {
      // Never crash main flow on offsite notification failure
    }
  }

  function createBackupSnapshot(isAuto = false) {
    try {
      ensureDir();
      const livePath = getLiveDbPath();
      if (!fs.existsSync(livePath)) {
        console.error('Backup creation skipped: active database not found at', livePath);
        return null;
      }

      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const suffix = `${isAuto ? 'auto' : 'manual'}_${Math.floor(Math.random() * 1000)}`;
      const backupFileName = `pryaska_backup_${dateStr}_${suffix}.db`;
      const targetPath = path.join(backupsDir, backupFileName);

      // Prefer SQLite VACUUM INTO for atomic WAL-safe consistent snapshot
      let createdWithVacuum = false;
      try {
        if (db && typeof db.exec === 'function') {
          const escaped = targetPath.replace(/'/g, "''");
          db.exec(`VACUUM INTO '${escaped}'`);
          createdWithVacuum = fs.existsSync(targetPath);
        }
      } catch (vacErr) {
        createdWithVacuum = false;
      }

      if (!createdWithVacuum) {
        fs.copyFileSync(livePath, targetPath);
      }

      if (!fs.existsSync(targetPath)) {
        return null;
      }

      const size = fs.statSync(targetPath).size;

      // Prune old backups, keeping latest 15
      const files = listBackups();
      if (files.length > 15) {
        files.slice(15).forEach((f) => {
          if (f.filename !== backupFileName) {
            try {
              fs.unlinkSync(path.join(backupsDir, f.filename));
            } catch (e) {}
          }
        });
      }

      notifyOffsiteBackup(targetPath, backupFileName);

      return {
        name: backupFileName,
        filename: backupFileName,
        size,
        sizeFormatted: `${(size / 1024).toFixed(1)} KB`,
        method: createdWithVacuum ? 'vacuum_into' : 'file_copy',
        createdAt: Date.now()
      };
    } catch (err) {
      console.error('Backup creation error:', err);
      return null;
    }
  }

  return {
    createBackupSnapshot,
    listBackups,
    resolveBackupPath,
    getLiveDbPath
  };
}

module.exports = { createBackupManager };
