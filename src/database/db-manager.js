const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.join(app.getPath('userData'), 'sessions.db');
  }

  // Initialize database connection and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database at:', this.dbPath);
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  // Create database tables
  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        // Sessions table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            attendees TEXT,
            category TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration INTEGER,
            total_annotations INTEGER DEFAULT 0,
            total_images INTEGER DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating sessions table:', err.message);
            reject(err);
            return;
          }
        });

        // Images table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_path TEXT,
            file_size INTEGER,
            file_type TEXT,
            uploaded_at TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating images table:', err.message);
            reject(err);
            return;
          }
        });

        // Annotations table
        this.db.run(`
          CREATE TABLE IF NOT EXISTS annotations (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            image_id TEXT NOT NULL,
            annotation_type TEXT DEFAULT 'polygon',
            points TEXT,
            nerve_type TEXT,
            side_of_body TEXT,
            patient_position TEXT,
            visibility TEXT,
            patient_age_group TEXT,
            needle_approach TEXT,
            clinical_notes TEXT,
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (image_id) REFERENCES images (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating annotations table:', err.message);
            reject(err);
            return;
          } else {
            console.log('Database tables created successfully');
            resolve();
          }
        });
      });
    });
  }

  // Save session to database
  async saveSession(sessionData) {
    return new Promise((resolve, reject) => {
      console.log('🔍 DatabaseManager.saveSession received data:', sessionData);
      
      // Handle both camelCase (frontend) and snake_case (database) field names
      const {
        id, title, attendees, category, 
        startTime, start_time, 
        endTime, end_time,
        duration, 
        totalAnnotations, total_annotations,
        totalImages, total_images,
        status
      } = sessionData;

      // Use camelCase first, fallback to snake_case
      const dbStartTime = startTime || start_time;
      const dbEndTime = endTime || end_time;
      const dbTotalAnnotations = totalAnnotations || total_annotations || 0;
      const dbTotalImages = totalImages || total_images || 0;

      console.log('🔍 Mapped database values:', {
        id, title, attendees, category,
        start_time: dbStartTime,
        end_time: dbEndTime,
        duration,
        total_annotations: dbTotalAnnotations,
        total_images: dbTotalImages,
        status
      });

      const sql = `
        INSERT OR REPLACE INTO sessions 
        (id, title, attendees, category, start_time, end_time, duration, 
         total_annotations, total_images, status, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;

      this.db.run(sql, [
        id, title, attendees, category, dbStartTime, dbEndTime,
        duration, dbTotalAnnotations, dbTotalImages, status
      ], function(err) {
        if (err) {
          console.error('❌ Error saving session to database:', err.message);
          console.error('❌ SQL:', sql);
          console.error('❌ Parameters:', [id, title, attendees, category, dbStartTime, dbEndTime, duration, dbTotalAnnotations, dbTotalImages, status]);
          reject(err);
        } else {
          console.log('✅ Session saved to database with ID:', id);
          console.log('✅ Database changes:', this.changes);
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Save image to database
  async saveImage(imageData) {
    return new Promise((resolve, reject) => {
      console.log('🔍 DatabaseManager.saveImage received data:', imageData);
      
      const { id, sessionId, filename, filePath, fileSize, fileType, uploadedAt } = imageData;

      console.log('🔍 Image data mapping:', {
        id, sessionId, filename, filePath, fileSize, fileType, uploadedAt
      });

      const sql = `
        INSERT OR REPLACE INTO images 
        (id, session_id, filename, file_path, file_size, file_type, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [id, sessionId, filename, filePath, fileSize, fileType, uploadedAt], function(err) {
        if (err) {
          console.error('❌ Error saving image to database:', err.message);
          console.error('❌ SQL:', sql);
          console.error('❌ Parameters:', [id, sessionId, filename, filePath, fileSize, fileType, uploadedAt]);
          reject(err);
        } else {
          console.log('✅ Image saved to database with ID:', id);
          console.log('✅ Database changes:', this.changes);
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Save annotation to database
  async saveAnnotation(annotationData) {
    return new Promise((resolve, reject) => {
      console.log('🔍 DatabaseManager.saveAnnotation received data:', annotationData);
      
      const {
        id, sessionId, imageId, annotationType, points, nerveType,
        sideOfBody, patientPosition, visibility, patientAgeGroup,
        needleApproach, clinicalNotes, timestamp
      } = annotationData;

      console.log('🔍 Annotation data mapping:', {
        id, sessionId, imageId, annotationType, 
        pointsType: typeof points,
        pointsValue: points,
        nerveType, sideOfBody, patientPosition, visibility, 
        patientAgeGroup, needleApproach, clinicalNotes, timestamp
      });

      // Ensure points is properly serialized
      const serializedPoints = typeof points === 'string' ? points : JSON.stringify(points || []);

      const sql = `
        INSERT OR REPLACE INTO annotations 
        (id, session_id, image_id, annotation_type, points, nerve_type,
         side_of_body, patient_position, visibility, patient_age_group,
         needle_approach, clinical_notes, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [
        id, sessionId, imageId, annotationType, serializedPoints, nerveType,
        sideOfBody, patientPosition, visibility, patientAgeGroup,
        needleApproach, clinicalNotes, timestamp
      ], function(err) {
        if (err) {
          console.error('❌ Error saving annotation to database:', err.message);
          console.error('❌ SQL:', sql);
          console.error('❌ Parameters:', [id, sessionId, imageId, annotationType, serializedPoints, nerveType, sideOfBody, patientPosition, visibility, patientAgeGroup, needleApproach, clinicalNotes, timestamp]);
          reject(err);
        } else {
          console.log('✅ Annotation saved to database with ID:', id);
          console.log('✅ Database changes:', this.changes);
          resolve({ id, changes: this.changes });
        }
      });
    });
  }

  // Get all sessions
  async getAllSessions() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT *, 
        (SELECT COUNT(*) FROM annotations WHERE session_id = sessions.id) as actual_annotations,
        (SELECT COUNT(*) FROM images WHERE session_id = sessions.id) as actual_images
        FROM sessions 
        ORDER BY created_at DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error getting sessions:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get session by ID
  async getSessionById(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT *, 
        (SELECT COUNT(*) FROM annotations WHERE session_id = sessions.id) as actual_annotations,
        (SELECT COUNT(*) FROM images WHERE session_id = sessions.id) as actual_images
        FROM sessions 
        WHERE id = ?
      `;

      this.db.get(sql, [sessionId], (err, row) => {
        if (err) {
          console.error('Error getting session:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get session with all annotations and images
  async getSessionDetails(sessionId) {
    return new Promise((resolve, reject) => {
      // Get session info
      this.getSessionById(sessionId)
        .then(session => {
          if (!session) {
            resolve(null);
            return;
          }

          // Get images for this session
          const imagesSQL = `SELECT * FROM images WHERE session_id = ? ORDER BY uploaded_at`;
          this.db.all(imagesSQL, [sessionId], (err, images) => {
            if (err) {
              reject(err);
              return;
            }

            // Get annotations for this session
            const annotationsSQL = `
              SELECT a.*, i.filename as image_name 
              FROM annotations a
              LEFT JOIN images i ON a.image_id = i.id
              WHERE a.session_id = ? 
              ORDER BY a.timestamp
            `;
            this.db.all(annotationsSQL, [sessionId], (err, annotations) => {
              if (err) {
                reject(err);
                return;
              }

              // Parse points from JSON strings
              annotations = annotations.map(annotation => ({
                ...annotation,
                points: annotation.points ? JSON.parse(annotation.points) : []
              }));

              resolve({
                session,
                images,
                annotations
              });
            });
          });
        })
        .catch(reject);
    });
  }

  // Delete session and all related data
  async deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');

        // Delete annotations
        this.db.run('DELETE FROM annotations WHERE session_id = ?', [sessionId], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
        });

        // Delete images
        this.db.run('DELETE FROM images WHERE session_id = ?', [sessionId], (err) => {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }
        });

        // Delete session
        this.db.run('DELETE FROM sessions WHERE id = ?', [sessionId], function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
            return;
          }

          this.db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              console.log('Session deleted:', sessionId);
              resolve({ changes: this.changes });
            }
          });
        });
      });
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

module.exports = DatabaseManager;
