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
            
            // Add image_data column to images table if it doesn't exist
            this.addImageDataColumn()
              .then(() => {
                // Update existing sessions to have default category if they don't have one
                return this.updateExistingSessions();
              })
              .then(() => resolve())
              .catch(reject);
          }
        });
      });
    });
  }

  // Update existing sessions to have default category
  async updateExistingSessions() {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE sessions 
        SET category = 'annotation_session' 
        WHERE category IS NULL OR category = ''
      `, (err) => {
        if (err) {
          console.error('Error updating existing sessions:', err.message);
          reject(err);
        } else {
          console.log('✅ Updated existing sessions with default category');
          resolve();
        }
      });
    });
  }

  // Add image_data column to images table if it doesn't exist
  async addImageDataColumn() {
    return new Promise((resolve, reject) => {
      // Check if column already exists
      this.db.all("PRAGMA table_info(images)", (err, columns) => {
        if (err) {
          console.error('Error checking images table structure:', err.message);
          reject(err);
          return;
        }

        const hasImageDataColumn = columns.some(col => col.name === 'image_data');
        
        if (!hasImageDataColumn) {
          console.log('🔧 Adding image_data column to images table...');
          this.db.run(`
            ALTER TABLE images 
            ADD COLUMN image_data TEXT
          `, (err) => {
            if (err) {
              console.error('Error adding image_data column:', err.message);
              reject(err);
            } else {
              console.log('✅ Successfully added image_data column to images table');
              resolve();
            }
          });
        } else {
          console.log('✅ image_data column already exists in images table');
          resolve();
        }
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
      
      const { id, sessionId, filename, filePath, fileSize, fileType, uploadedAt, imageDataBase64 } = imageData;

      console.log('🔍 Image data mapping:', {
        id, sessionId, filename, filePath, fileSize, fileType, uploadedAt,
        hasImageData: !!imageDataBase64
      });

      const sql = `
        INSERT OR REPLACE INTO images 
        (id, session_id, filename, file_path, file_size, file_type, uploaded_at, image_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [id, sessionId, filename, filePath, fileSize, fileType, uploadedAt, imageDataBase64], function(err) {
        if (err) {
          console.error('❌ Error saving image to database:', err.message);
          console.error('❌ SQL:', sql);
          console.error('❌ Parameters:', [id, sessionId, filename, filePath, fileSize, fileType, uploadedAt, imageDataBase64 ? 'BASE64_DATA_PROVIDED' : 'NO_BASE64_DATA']);
          reject(err);
        } else {
          console.log('✅ Image saved to database with ID:', id);
          console.log('✅ Database changes:', this.changes);
          console.log('✅ Image data included:', !!imageDataBase64);
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

  // Database health check
  async checkDatabaseHealth() {
    return new Promise((resolve, reject) => {
      const db = this.db;
      
      console.log('🏥 Running database health check...');
      
      // Check if we can perform basic operations
      db.get('SELECT COUNT(*) as count FROM sessions', (err, result) => {
        if (err) {
          console.error('❌ Database health check failed:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Database health check passed, session count:', result.count);
        resolve({ healthy: true, sessionCount: result.count });
      });
    });
  }

  // Delete session and all related data
  async deleteSession(sessionId) {
    return new Promise((resolve, reject) => {
      const db = this.db; // Capture db reference to avoid 'this' context issues
      
      console.log('🗑️ Starting delete operation for session:', sessionId);
      console.log('🗑️ Session ID type:', typeof sessionId);
      
      // Add a timeout to prevent hanging
      const timeoutId = setTimeout(() => {
        console.error('❌ Database delete operation timed out after 3 seconds');
        reject(new Error('Database operation timed out'));
      }, 3000);
      
      const cleanupAndResolve = (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      };
      
      const cleanupAndReject = (error) => {
        clearTimeout(timeoutId);
        reject(error);
      };
      
      // Try a simple approach: delete in reverse order without transactions first
      console.log('🗑️ Attempting simple delete without transaction...');
      
      // First, check if the session exists
      db.get('SELECT id FROM sessions WHERE id = ?', [sessionId], (err, row) => {
        if (err) {
          console.error('❌ Error checking if session exists:', err);
          cleanupAndReject(err);
          return;
        }
        
        if (!row) {
          console.log('⚠️ Session not found in database:', sessionId);
          cleanupAndResolve({ 
            success: false, 
            error: 'Session not found',
            sessionId: sessionId 
          });
          return;
        }
        
        console.log('✅ Session found:', sessionId);
        
        // Delete annotations (no foreign key constraints assumed)
        db.run('DELETE FROM annotations WHERE session_id = ?', [sessionId], function(annotationErr) {
          if (annotationErr) {
            console.error('❌ Failed to delete annotations:', annotationErr);
            cleanupAndReject(annotationErr);
            return;
          }
          console.log(`✅ Deleted ${this.changes} annotations`);

          // Delete images
          db.run('DELETE FROM images WHERE session_id = ?', [sessionId], function(imageErr) {
            if (imageErr) {
              console.error('❌ Failed to delete images:', imageErr);
              cleanupAndReject(imageErr);
              return;
            }
            console.log(`✅ Deleted ${this.changes} images`);

            // Delete session
            db.run('DELETE FROM sessions WHERE id = ?', [sessionId], function(sessionErr) {
              if (sessionErr) {
                console.error('❌ Failed to delete session:', sessionErr);
                cleanupAndReject(sessionErr);
                return;
              }
              
              const deletedRows = this.changes;
              console.log(`✅ Deleted ${deletedRows} session record(s)`);
              
              if (deletedRows > 0) {
                console.log('✅ Session deletion completed successfully');
                cleanupAndResolve({ 
                  success: true, 
                  deletedSessionId: sessionId,
                  deletedRows: deletedRows
                });
              } else {
                console.log('⚠️ No session was deleted (already deleted?)');
                cleanupAndResolve({ 
                  success: false, 
                  error: 'Session was not found or already deleted',
                  deletedRows: 0
                });
              }
            });
          });
        });
      });
    });
  }

  // Get annotation statistics for charts
  async getAnnotationStats() {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        const nerveTypeStats = {};
        const ageGroupStats = {};
        
        // Get nerve type distribution
        this.db.all(`
          SELECT nerve_type, COUNT(*) as count 
          FROM annotations 
          WHERE nerve_type IS NOT NULL AND nerve_type != '' 
          GROUP BY nerve_type
        `, (err, nerveRows) => {
          if (err) {
            console.error('Error getting nerve type stats:', err.message);
            reject(err);
            return;
          }
          
          nerveRows.forEach(row => {
            nerveTypeStats[row.nerve_type] = row.count;
          });
          
          // Get age group distribution
          this.db.all(`
            SELECT patient_age_group, COUNT(*) as count 
            FROM annotations 
            WHERE patient_age_group IS NOT NULL AND patient_age_group != '' 
            GROUP BY patient_age_group
          `, (err, ageRows) => {
            if (err) {
              console.error('Error getting age group stats:', err.message);
              reject(err);
              return;
            }
            
            ageRows.forEach(row => {
              ageGroupStats[row.patient_age_group] = row.count;
            });
            
            console.log('📊 Chart stats retrieved:', {
              nerveTypes: nerveTypeStats,
              ageGroups: ageGroupStats
            });
            
            resolve({
              nerveTypes: nerveTypeStats,
              ageGroups: ageGroupStats
            });
          });
        });
      });
    });
  }

  // Get unique doctors/attendees from sessions
  async getUniqueDoctors() {
    return new Promise((resolve, reject) => {
      console.log('📊 Getting unique doctors from database...');
      
      const query = `
        SELECT DISTINCT attendees 
        FROM sessions 
        WHERE attendees IS NOT NULL 
        AND attendees != '' 
        ORDER BY attendees ASC
      `;
      
      this.db.all(query, [], (err, rows) => {
        if (err) {
          console.error('❌ Error getting unique doctors:', err.message);
          reject(err);
        } else {
          const doctors = rows.map(row => row.attendees).filter(Boolean);
          console.log('✅ Found unique doctors:', doctors);
          resolve(doctors);
        }
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
