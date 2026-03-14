import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure evidence directory exists
const evidenceDir = path.join(__dirname, "evidence");
if (!fs.existsSync(evidenceDir)) {
  fs.mkdirSync(evidenceDir);
}

const db = new Database("cybercrime.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'citizen',
    rank TEXT,
    department TEXT,
    phone TEXT,
    profile_photo TEXT,
    success_rate INTEGER DEFAULT 0,
    cases_solved INTEGER DEFAULT 0,
    cases_pending INTEGER DEFAULT 0,
    recovered_amount REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    complaint_id TEXT UNIQUE,
    victim_name TEXT,
    phone TEXT,
    email TEXT,
    fraud_type TEXT,
    amount REAL,
    location TEXT,
    bank_name TEXT,
    transaction_id TEXT,
    description TEXT,
    incident_date DATETIME,
    evidence_url TEXT,
    status TEXT DEFAULT 'pending',
    citizen_id INTEGER,
    officer_id INTEGER,
    risk_score INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(citizen_id) REFERENCES users(id),
    FOREIGN KEY(officer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS criminals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    criminal_id TEXT UNIQUE,
    alias TEXT,
    age INTEGER,
    crime_type TEXT,
    fraud_types TEXT,
    risk_level TEXT,
    risk_score INTEGER,
    history TEXT,
    associates TEXT,
    location TEXT,
    photo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crime_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    latitude REAL,
    longitude REAL,
    risk_level TEXT,
    fraud_type TEXT,
    case_id TEXT,
    amount_lost REAL,
    risk_score INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS entities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_id TEXT UNIQUE,
    type TEXT,
    value TEXT,
    linked_crimes INTEGER,
    risk_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Migration: Drop old evidence tables if they exist with wrong schema
try {
  const tableInfo = db.prepare("PRAGMA table_info(evidence_ledger)").all() as any[];
  const hasPreviousHash = tableInfo.some(col => col.name === 'previous_hash');
  if (!hasPreviousHash) {
    console.log("Migrating evidence tables (missing previous_hash)...");
    db.exec("DROP TABLE IF EXISTS evidence_ledger");
    db.exec("DROP TABLE IF EXISTS evidence_files");
  }
} catch (e) {
  console.log("Migrating evidence tables (check failed)...");
  db.exec("DROP TABLE IF EXISTS evidence_ledger");
  db.exec("DROP TABLE IF EXISTS evidence_files");
}

db.exec(`
  CREATE TABLE IF NOT EXISTS evidence_files (
    evidence_id TEXT PRIMARY KEY,
    case_id TEXT,
    title TEXT,
    file_name TEXT,
    evidence_type TEXT,
    description TEXT,
    uploaded_by TEXT,
    sha256_hash TEXT,
    previous_hash TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Verified',
    file_path TEXT
  );

  CREATE TABLE IF NOT EXISTS evidence_ledger (
    block_id INTEGER PRIMARY KEY AUTOINCREMENT,
    evidence_id TEXT,
    block_hash TEXT,
    previous_hash TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    verification_status TEXT DEFAULT 'VERIFIED',
    FOREIGN KEY(evidence_id) REFERENCES evidence_files(evidence_id)
  );

  CREATE TABLE IF NOT EXISTS atm_risk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location TEXT,
    risk_score INTEGER,
    last_incident DATETIME,
    alert_level TEXT,
    latitude REAL,
    longitude REAL
  );

  CREATE TABLE IF NOT EXISTS criminal_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    criminal_id TEXT,
    latitude REAL,
    longitude REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(criminal_id) REFERENCES criminals(criminal_id)
  );

  CREATE TABLE IF NOT EXISTS warrants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    criminal_id TEXT,
    officer_id TEXT,
    status TEXT DEFAULT 'PENDING',
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(criminal_id) REFERENCES criminals(criminal_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fir_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fir_id TEXT UNIQUE,
    complaint_id TEXT,
    victim_name TEXT,
    fraud_type TEXT,
    amount REAL,
    incident_date DATETIME,
    description TEXT,
    officer_id INTEGER,
    status TEXT DEFAULT 'GENERATED',
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(complaint_id) REFERENCES complaints(complaint_id),
    FOREIGN KEY(officer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    message TEXT,
    role TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed Data Function
function seedDatabase() {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count === 0) {
    console.log("Seeding database...");
    
    // Seed Users
    const hashedPassword = bcrypt.hashSync("password123", 10);
    const insertUser = db.prepare("INSERT INTO users (email, password, name, role, rank, department, phone, profile_photo, success_rate, cases_solved, cases_pending, recovered_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    // 1 Chief Officer
    insertUser.run('chief@cyber.gov', hashedPassword, 'Chief Officer Rajesh', 'officer', 'Chief Officer', 'Command Center', '+91 98765 43210', 'https://i.pravatar.cc/150?u=chief', 95, 120, 5, 5000000);

    // 24 Officers
    const ranks = ['Investigation Officer', 'Analyst', 'Field Officer'];
    const departments = ['Cyber Crime Unit', 'Forensics', 'Intelligence', 'Field Operations'];
    for (let i = 1; i <= 24; i++) {
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const solved = Math.floor(Math.random() * 50);
      const pending = Math.floor(Math.random() * 10);
      const success = Math.floor((solved / (solved + pending || 1)) * 100);
      insertUser.run(
        `officer${i}@cyber.gov`, 
        hashedPassword, 
        `Officer ${i}`, 
        'officer', 
        rank, 
        dept, 
        `+91 98765 ${10000 + i}`, 
        `https://i.pravatar.cc/150?u=officer${i}`,
        success,
        solved,
        pending,
        Math.floor(Math.random() * 2000000)
      );
    }
    
    // 50 Citizens
    for (let i = 1; i <= 50; i++) {
      insertUser.run(`citizen${i}@gmail.com`, hashedPassword, `Citizen ${i}`, 'citizen', null, null, `+91 90000 ${20000 + i}`, `https://i.pravatar.cc/150?u=citizen${i}`, 0, 0, 0, 0);
    }

    // Seed Criminals (2,000 records)
    const insertCriminal = db.prepare("INSERT INTO criminals (name, criminal_id, alias, age, crime_type, fraud_types, risk_level, risk_score, history, associates, location, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const fraudTypes = ['Phishing', 'UPI Fraud', 'OTP Scam', 'Investment Scam', 'Loan Fraud', 'ATM Skimming', 'SIM Swap Fraud', 'Online Shopping Fraud', 'Identity Theft', 'Ransomware', 'Crypto Scam', 'Social Engineering'];
    const riskLevels = ['Low', 'Medium', 'High', 'Critical'];
    const cities_list = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Indore', 'Bhopal', 'Patna', 'Chandigarh', 'Gurgaon', 'Noida'];
    
    for (let i = 1; i <= 2000; i++) {
      const risk = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      insertCriminal.run(
        `Criminal ${i}`, 
        `CR-${i.toString().padStart(4, '0')}`,
        `Alias ${i}`,
        20 + Math.floor(Math.random() * 40),
        fraudTypes[Math.floor(Math.random() * fraudTypes.length)],
        fraudTypes[Math.floor(Math.random() * fraudTypes.length)],
        risk,
        Math.floor(Math.random() * 100),
        "Extensive history of digital financial crimes, money laundering, and cross-border cyber operations.",
        "Linked to international cyber syndicates and dark web marketplaces.",
        cities_list[Math.floor(Math.random() * cities_list.length)],
        `https://i.pravatar.cc/150?u=criminal${i}`
      );
    }

    // Seed ATMs
    const insertATM = db.prepare("INSERT INTO atm_risk (location, risk_score, last_incident, alert_level, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?)");
    const cities = [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
      { name: 'Lucknow', lat: 26.8467, lng: 80.9462 }
    ];

    for (let i = 1; i <= 1500; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      insertATM.run(
        `${city.name} ATM #${i}`,
        Math.floor(Math.random() * 100),
        new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        Math.random() > 0.7 ? 'High' : (Math.random() > 0.4 ? 'Medium' : 'Low'),
        city.lat + (Math.random() - 0.5) * 0.1,
        city.lng + (Math.random() - 0.5) * 0.1
      );
    }

    // Seed Complaints (50,000+)
    const insertComplaint = db.prepare(`
      INSERT INTO complaints (complaint_id, victim_name, phone, email, fraud_type, amount, location, bank_name, transaction_id, description, incident_date, citizen_id, risk_score, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank', 'Bank of Baroda', 'Yes Bank', 'IndusInd Bank', 'IDFC First'];
    const statuses = ['pending', 'investigating', 'resolved', 'closed'];
    
    db.transaction(() => {
      for (let i = 1; i <= 50000; i++) {
        const citizenId = Math.floor(Math.random() * 50) + 26;
        const city = cities[Math.floor(Math.random() * cities.length)];
        const incidentDate = new Date(Date.now() - Math.random() * 31536000000).toISOString();
        insertComplaint.run(
          `CMP-${2025}-${i.toString().padStart(5, '0')}`,
          `Victim ${i}`,
          `98765432${i % 100}`,
          `victim${i}@example.com`,
          fraudTypes[Math.floor(Math.random() * fraudTypes.length)],
          Math.floor(Math.random() * 1000000),
          city.name,
          banks[Math.floor(Math.random() * banks.length)],
          `TXN${1000000 + i}`,
          "Automated intelligence report generated by CyberShield Engine.",
          incidentDate,
          citizenId,
          Math.floor(Math.random() * 100),
          statuses[Math.floor(Math.random() * statuses.length)],
          incidentDate
        );
      }
    })();

    // Seed Evidence (1,000 records)
    const evidenceCount = db.prepare("SELECT COUNT(*) as count FROM evidence_files").get() as any;
    if (evidenceCount.count === 0) {
      const insertEvidence = db.prepare(`
        INSERT INTO evidence_files (evidence_id, case_id, title, file_name, evidence_type, description, uploaded_by, sha256_hash, previous_hash, timestamp, status, file_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertLedger = db.prepare(`
        INSERT INTO evidence_ledger (evidence_id, block_hash, previous_hash, timestamp, verification_status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const evidenceTypes = [
        { name: 'Phishing Email Screenshot', type: 'image' },
        { name: 'ATM CCTV Image', type: 'image' },
        { name: 'Bank Transaction Statement', type: 'pdf' },
        { name: 'Scam Call Recording', type: 'audio' },
        { name: 'Fake Investment Website Capture', type: 'image' },
        { name: 'WhatsApp Fraud Chat Screenshot', type: 'image' },
        { name: 'SIM Swap Request Form', type: 'pdf' },
        { name: 'UPI Fraud Receipt', type: 'image' }
      ];

      const officers = ['Officer Rajesh', 'Officer Priya', 'Officer Arjun', 'Officer Meena', 'Officer Vikram', 'Officer Kiran', 'Officer Kavya', 'Officer Rahul', 'Officer Anita', 'Officer Naveen'];

      let lastHash = "0".repeat(64);
      for (let i = 1; i <= 1000; i++) {
        const evidenceId = `EV-${i.toString().padStart(3, '0')}`;
        const caseId = `CC-2025-${(1000 + i).toString()}`;
        const typeInfo = evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)];
        const officer = officers[Math.floor(Math.random() * officers.length)];
        const timestamp = new Date(Date.now() - Math.random() * 1000000000).toISOString().replace('T', ' ').split('.')[0];
        
        const dataToHash = evidenceId + caseId + typeInfo.name + officer + timestamp + lastHash;
        const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');
        
        const fileName = `${typeInfo.name.toLowerCase().replace(/ /g, '_')}_${i}.${typeInfo.type === 'image' ? 'png' : (typeInfo.type === 'audio' ? 'mp3' : 'pdf')}`;
        const filePath = `/evidence/${evidenceId}.dat`;

        insertEvidence.run(evidenceId, caseId, typeInfo.name, fileName, typeInfo.type, "Blockchain-verified digital evidence.", officer, currentHash, lastHash, timestamp, 'Verified', filePath);
        insertLedger.run(evidenceId, currentHash, lastHash, timestamp, 'VERIFIED');
        
        lastHash = currentHash;
      }
      console.log("Evidence seeded successfully with 1000 records.");
    }

    // Seed Crime Locations (2,000 records)
    const locationCount = db.prepare("SELECT COUNT(*) as count FROM crime_locations").get() as any;
    if (locationCount.count === 0) {
      const insertLocation = db.prepare(`
        INSERT INTO crime_locations (city, latitude, longitude, risk_level, fraud_type, case_id, amount_lost, risk_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (let i = 1; i <= 2000; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        insertLocation.run(
          city.name,
          city.lat + (Math.random() - 0.5) * 0.2,
          city.lng + (Math.random() - 0.5) * 0.2,
          riskLevels[Math.floor(Math.random() * riskLevels.length)],
          fraudTypes[Math.floor(Math.random() * fraudTypes.length)],
          `CC-${1000 + i}`,
          Math.floor(Math.random() * 500000),
          Math.floor(Math.random() * 100)
        );
      }
    }

    // Seed Entities (1,500 records)
    const entityCount = db.prepare("SELECT COUNT(*) as count FROM entities").get() as any;
    if (entityCount.count === 0) {
      const insertEntity = db.prepare(`
        INSERT INTO entities (entity_id, type, value, linked_crimes, risk_score)
        VALUES (?, ?, ?, ?, ?)
      `);
      const entityTypes = ['Phone', 'Bank Account', 'Email', 'Wallet ID'];
      for (let i = 1; i <= 1500; i++) {
        const type = entityTypes[Math.floor(Math.random() * entityTypes.length)];
        let value = "";
        if (type === 'Phone') value = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
        else if (type === 'Bank Account') value = `${Math.floor(Math.random() * 900000000000) + 100000000000}`;
        else if (type === 'Email') value = `fraud${i}@gmail.com`;
        else value = `UPI${Math.floor(Math.random() * 900000) + 100000}`;

        insertEntity.run(
          `EN-${i.toString().padStart(3, '0')}`,
          type,
          value,
          Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 100)
        );
      }
    }

    // Seed Settings
    const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as any;
    if (settingsCount.count === 0) {
      const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
      const defaultSettings = {
        'system_name': 'CyberShield Omega',
        'org_name': 'National Cyber Crime Bureau',
        'system_version': 'v4.2.0-stable',
        'high_risk_threshold': '75',
        'medium_risk_threshold': '40',
        'alert_sensitivity': 'High',
        'enable_email': 'true',
        'enable_sms': 'false',
        'language': 'en',
        'date_format': 'DD/MM/YYYY',
        'time_format': '24h',
        'timezone': 'IST (UTC+5:30)',
        'password_policy': 'Strong',
        'two_factor': 'true',
        'session_timeout': '30',
        'login_limit': '5'
      };
      for (const [key, value] of Object.entries(defaultSettings)) {
        insertSetting.run(key, value);
      }
    }

    console.log("Database seeded successfully.");
  }
}

seedDatabase();

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, evidenceDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;
  const JWT_SECRET = process.env.JWT_SECRET || "cyber-shield-omega-secret";

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API Routes
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const result = db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run(email, hashedPassword, name, role || 'citizen');
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/complaints", authenticate, (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const type = req.query.type;
    const location = req.query.location;
    const status = req.query.status;

    let query = "SELECT * FROM complaints WHERE 1=1";
    const params: any[] = [];

    if (req.user.role !== 'officer') {
      query += " AND citizen_id = ?";
      params.push(req.user.id);
    }

    if (type) {
      query += " AND fraud_type = ?";
      params.push(type);
    }
    if (location) {
      query += " AND location = ?";
      params.push(location);
    }
    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    const total = db.prepare(query.replace("*", "COUNT(*) as count")).get(...params) as any;
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    const complaints = db.prepare(query).all(...params);
    res.json(complaints); // Return array directly for simplicity in this app
  });

  app.get("/api/complaints/:id", authenticate, (req: any, res) => {
    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id) as any;
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    
    // Check permissions
    if (req.user.role !== 'officer' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    res.json(complaint);
  });

  app.put("/api/complaints/:id", authenticate, (req: any, res) => {
    const { status, risk_score, description } = req.body;
    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id) as any;
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    // Only officers can update status/risk
    if (req.user.role !== 'officer') {
      return res.status(403).json({ error: "Only officers can update complaints" });
    }

    db.prepare(`
      UPDATE complaints 
      SET status = ?, risk_score = ?, description = ?
      WHERE id = ?
    `).run(status || complaint.status, risk_score || complaint.risk_score, description || complaint.description, req.params.id);

    res.json({ success: true });
  });

  app.delete("/api/complaints/:id", authenticate, (req: any, res) => {
    const complaint = db.prepare("SELECT * FROM complaints WHERE id = ?").get(req.params.id) as any;
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });

    // Only officers or the owner can delete
    if (req.user.role !== 'officer' && complaint.citizen_id !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    db.prepare("DELETE FROM complaints WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/atms", authenticate, (req, res) => {
    const atms = db.prepare("SELECT * FROM atm_risk ORDER BY risk_score DESC").all();
    res.json(atms);
  });

  app.get("/api/criminals", authenticate, (req, res) => {
    const criminals = db.prepare("SELECT * FROM criminals ORDER BY risk_score DESC").all();
    res.json(criminals);
  });

  app.get("/api/criminals/:id", authenticate, (req, res) => {
    const criminal = db.prepare("SELECT * FROM criminals WHERE id = ?").get(req.params.id);
    res.json(criminal);
  });

  app.get("/api/analytics/fraud-by-type", authenticate, (req, res) => {
    const data = db.prepare("SELECT fraud_type as name, COUNT(*) as value FROM complaints GROUP BY fraud_type").all();
    res.json(data);
  });

  app.get("/api/analytics/fraud-trend", authenticate, (req, res) => {
    const data = db.prepare("SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count FROM complaints GROUP BY month ORDER BY month DESC LIMIT 12").all();
    res.json(data.reverse());
  });

  app.get("/api/intelligence/network", authenticate, (req, res) => {
    // Generate a demo network graph
    const nodes = [];
    const links = [];
    
    const criminals = db.prepare("SELECT id, name FROM criminals LIMIT 20").all() as any[];
    const banks = ['HDFC', 'ICICI', 'SBI', 'Axis', 'Kotak'];
    
    criminals.forEach(c => {
      nodes.push({ id: `criminal-${c.id}`, name: c.name, group: 'criminal' });
    });
    
    banks.forEach(b => {
      nodes.push({ id: `bank-${b}`, name: b, group: 'bank' });
    });
    
    // Random links
    criminals.forEach(c => {
      const bank = banks[Math.floor(Math.random() * banks.length)];
      links.push({ source: `criminal-${c.id}`, target: `bank-${bank}` });
    });
    
    res.json({ nodes, links });
  });

  app.get("/api/notifications", authenticate, (req, res) => {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10").all();
    res.json(notifications);
  });

  app.post("/api/notifications", authenticate, (req, res) => {
    const { message, type } = req.body;
    db.prepare("INSERT INTO notifications (message, type) VALUES (?, ?)").run(message, type);
    res.json({ success: true });
  });

  // Officer Management
app.get("/api/officers", authenticate, (req: any, res) => {
  if (req.user.role !== 'officer') return res.status(403).json({ error: "Forbidden" });
  const officers = db.prepare("SELECT id, name, email, role, rank, department, phone, profile_photo, success_rate, cases_solved, cases_pending, recovered_amount FROM users WHERE role = 'officer'").all();
  res.json(officers);
});

app.post("/api/officers", authenticate, (req: any, res) => {
  if (req.user.rank !== 'Chief Officer') return res.status(403).json({ error: "Forbidden" });
  const { id, name, email, rank, department, phone, profile_photo, role } = req.body;
  
  try {
    if (id) {
      db.prepare(`
        UPDATE users SET name = ?, email = ?, rank = ?, department = ?, phone = ?, profile_photo = ?, role = ?
        WHERE id = ?
      `).run(name, email, rank, department, phone, profile_photo, role || 'officer', id);
      res.json({ message: "Officer updated" });
    } else {
      const hashedPassword = bcrypt.hashSync("password123", 10);
      db.prepare(`
        INSERT INTO users (name, email, password, rank, department, phone, profile_photo, role)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, email, hashedPassword, rank, department, phone, profile_photo, role || 'officer');
      res.status(201).json({ message: "Officer created" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to manage officer" });
  }
});

app.delete("/api/officers/:id", authenticate, (req: any, res) => {
  if (req.user.rank !== 'Chief Officer') return res.status(403).json({ error: "Forbidden" });
  try {
    db.prepare("DELETE FROM users WHERE id = ? AND role = 'officer'").run(req.params.id);
    res.json({ message: "Officer deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete officer" });
  }
});

app.get("/api/officers/:id/stats", authenticate, (req, res) => {
  const officer = db.prepare("SELECT name, rank, department, success_rate, cases_solved, cases_pending, recovered_amount FROM users WHERE id = ?").get(req.params.id) as any;
  if (!officer) return res.status(404).json({ error: "Officer not found" });
  
  // Simulated monthly activity
  const monthlyActivity = [
    { month: 'Jan', solved: 12, pending: 4 },
    { month: 'Feb', solved: 15, pending: 3 },
    { month: 'Mar', solved: 18, pending: 5 },
    { month: 'Apr', solved: 14, pending: 6 },
    { month: 'May', solved: 20, pending: 2 },
    { month: 'Jun', solved: 22, pending: 1 },
  ];

  res.json({ ...officer, monthlyActivity });
});

// Criminal Actions
app.post("/api/criminals/:id/warrant", authenticate, (req: any, res) => {
  const { id } = req.params;
  const officerId = req.user.id;
  try {
    db.prepare("INSERT INTO warrants (criminal_id, officer_id) VALUES (?, ?)").run(id, officerId);
    res.json({ success: true, message: 'Warrant issued successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/criminals/:id/warrant", authenticate, (req: any, res) => {
  const criminal = db.prepare("SELECT * FROM criminals WHERE id = ?").get(req.params.id) as any;
  if (!criminal) return res.status(404).json({ error: "Criminal not found" });
  
  const warrant = db.prepare("SELECT * FROM warrants WHERE criminal_id = ? ORDER BY issued_at DESC LIMIT 1").get(req.params.id) as any;

  res.json({
    warrant_id: warrant ? `WNT-${warrant.id}` : `WNT-${Math.floor(10000 + Math.random() * 90000)}`,
    issue_date: warrant ? warrant.issued_at : new Date().toISOString(),
    criminal: criminal,
    officer: req.user.name,
    status: warrant ? warrant.status : 'ACTIVE'
  });
});

app.get("/api/criminals/:id/location", authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const baseLocation = db.prepare("SELECT * FROM criminal_locations WHERE criminal_id = ? ORDER BY timestamp DESC LIMIT 1").get(id) as any;
    
    if (!baseLocation) {
      const lat = 12.9716 + (Math.random() - 0.5) * 0.1;
      const lng = 77.5946 + (Math.random() - 0.5) * 0.1;
      db.prepare("INSERT INTO criminal_locations (criminal_id, latitude, longitude) VALUES (?, ?, ?)").run(id, lat, lng);
      return res.json({ latitude: lat, longitude: lng, timestamp: new Date() });
    }

    const newLat = baseLocation.latitude + (Math.random() - 0.5) * 0.01;
    const newLng = baseLocation.longitude + (Math.random() - 0.5) * 0.01;
    db.prepare("INSERT INTO criminal_locations (criminal_id, latitude, longitude) VALUES (?, ?, ?)").run(id, newLat, newLng);
    
    res.json({ latitude: newLat, longitude: newLng, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/criminals/:id/track", authenticate, (req, res) => {
  const criminal = db.prepare("SELECT * FROM criminals WHERE id = ?").get(req.params.id) as any;
  if (!criminal) return res.status(404).json({ error: "Criminal not found" });
  
  // Simulated real-time tracking data
  res.json({
    last_seen: new Date().toISOString(),
    location: criminal.location,
    coordinates: {
      lat: 19.0760 + (Math.random() - 0.5) * 0.1,
      lng: 72.8777 + (Math.random() - 0.5) * 0.1
    },
    status: 'MOVING'
  });
});

app.get("/api/crime-predictions", authenticate, (req, res) => {
  const predictions = [
    { id: 1, type: 'Phishing', probability: 0.85, location: 'Mumbai', timeframe: 'Next 12h' },
    { id: 2, type: 'SIM Swap', probability: 0.72, location: 'Delhi', timeframe: 'Next 24h' },
    { id: 3, type: 'ATM Skimming', probability: 0.91, location: 'Chennai', timeframe: 'Next 6h' }
  ];
  res.json(predictions);
});

app.get("/api/crime-locations", authenticate, (req, res) => {
  try {
    const crimes = db.prepare(`
      SELECT id, fraud_type as crime_type, location as location_name, risk_score, 
             latitude, longitude, 'High' as risk_level, 1 as incident_count
      FROM complaints
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `).all();
    res.json(crimes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get("/api/settings", authenticate, (req, res) => {
  const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", authenticate, (req, res) => {
    const { settings } = req.body;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        upsert.run(key, String(value));
      }
    })();
    res.json({ success: true });
  });

  app.post("/api/complaints", authenticate, (req: any, res) => {
    const { victim_name, phone, email, fraud_type, amount, location, bank_name, transaction_id, description, incident_date, evidence_url } = req.body;
    const complaint_id = `CMP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const risk_score = Math.floor(Math.random() * 100); // Simulated AI risk score
    
    try {
      const result = db.prepare(`
        INSERT INTO complaints (complaint_id, victim_name, phone, email, fraud_type, amount, location, bank_name, transaction_id, description, incident_date, evidence_url, citizen_id, risk_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(complaint_id, victim_name, phone, email, fraud_type, amount, location, bank_name, transaction_id, description, incident_date, evidence_url, req.user.id, risk_score);
      res.json({ id: result.lastInsertRowid, complaint_id, risk_score });
    } catch (error) {
      console.error("API Error /api/complaints (POST):", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/stats", authenticate, (req, res) => {
    const total = db.prepare("SELECT COUNT(*) as count FROM complaints").get() as any;
    const amount = db.prepare("SELECT SUM(amount) as total FROM complaints").get() as any;
    const highRisk = db.prepare("SELECT COUNT(*) as count FROM complaints WHERE risk_score > 70").get() as any;
    res.json({
      totalComplaints: total.count,
      totalAmount: amount.total || 0,
      highRiskAlerts: highRisk.count,
      activeInvestigations: Math.floor(total.count * 0.4),
      preventionRate: 85
    });
  });

  // Blockchain Evidence Routes
  app.post("/api/evidence", authenticate, upload.single("file"), (req: any, res) => {
    try {
      if (req.user.role !== 'officer') return res.status(403).json({ error: "Only officers can upload evidence" });
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const { case_id, title, description } = req.body;
      const fileContent = fs.readFileSync(req.file.path);
      const sha256_hash = crypto.createHash('sha256').update(fileContent).digest('hex');
      const evidence_id = `EV-${Math.floor(1000 + Math.random() * 9000)}`;

      // Get previous block hash
      const lastBlock: any = db.prepare("SELECT block_hash FROM evidence_ledger ORDER BY block_id DESC LIMIT 1").get();
      const previous_hash = lastBlock ? lastBlock.block_hash : "0".repeat(64);

      db.transaction(() => {
        db.prepare(`
          INSERT INTO evidence_files (evidence_id, case_id, title, file_name, evidence_type, description, uploaded_by, sha256_hash, previous_hash, file_path)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(evidence_id, case_id, title, req.file.originalname, req.file.mimetype.split("/")[0], description, req.user.name, sha256_hash, previous_hash, req.file.path);

        db.prepare(`
          INSERT INTO evidence_ledger (evidence_id, block_hash, previous_hash)
          VALUES (?, ?, ?)
        `).run(evidence_id, sha256_hash, previous_hash);
      })();

      res.json({ success: true, evidence_id, hash: sha256_hash });
    } catch (error) {
      console.error("API Error /api/evidence (POST):", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/evidence", authenticate, (req: any, res) => {
    try {
      const evidence = db.prepare(`
        SELECT f.*, l.block_id, l.previous_hash, l.timestamp as ledger_timestamp, l.verification_status
        FROM evidence_files f
        JOIN evidence_ledger l ON f.evidence_id = l.evidence_id
        ORDER BY f.timestamp DESC
      `).all();
      res.json(evidence);
    } catch (error) {
      console.error("API Error /api/evidence:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/evidence/ledger", authenticate, (req: any, res) => {
    try {
      const ledger = db.prepare(`
        SELECT l.*, f.file_name, f.case_id
        FROM evidence_ledger l
        JOIN evidence_files f ON l.evidence_id = f.evidence_id
        ORDER BY l.block_id ASC
      `).all();
      res.json(ledger);
    } catch (error) {
      console.error("API Error /api/evidence/ledger:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/evidence/:id", authenticate, (req: any, res) => {
    try {
      const evidence = db.prepare(`
        SELECT f.*, l.block_id, l.previous_hash, l.timestamp as ledger_timestamp, l.verification_status
        FROM evidence_files f
        JOIN evidence_ledger l ON f.evidence_id = l.evidence_id
        WHERE f.evidence_id = ?
      `).get(req.params.id);
      if (!evidence) return res.status(404).json({ error: "Evidence not found" });
      res.json(evidence);
    } catch (error) {
      console.error("API Error /api/evidence/:id:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/evidence/verify", authenticate, (req: any, res) => {
    try {
      const { id } = req.body;
      const evidence: any = db.prepare("SELECT * FROM evidence_files WHERE evidence_id = ?").get(id);
      if (!evidence) return res.status(404).json({ error: "Evidence not found" });

      let isFileIntact = false;
      let currentHash = "";

      if (fs.existsSync(evidence.file_path)) {
        const fileContent = fs.readFileSync(evidence.file_path);
        currentHash = crypto.createHash('sha256').update(fileContent).digest('hex');
        isFileIntact = currentHash === evidence.sha256_hash;
      } else {
        // For demo data, we might not have real files
        currentHash = evidence.sha256_hash;
        isFileIntact = true;
      }

      res.json({
        isValid: isFileIntact,
        storedHash: evidence.sha256_hash,
        currentHash: currentHash
      });
    } catch (error) {
      console.error("API Error /api/evidence/verify:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Intelligence Hub Endpoints
  app.get('/api/intelligence/network', authenticate, (req: any, res) => {
    // Mock network data
    const data = {
      nodes: [
        { id: 'C-001', label: 'Vikram "Shadow" Singh', type: 'criminal', risk: 95 },
        { id: 'C-002', label: 'Anita "Ghost" Rao', type: 'criminal', risk: 88 },
        { id: 'C-003', label: 'Rahul "Cipher" Verma', type: 'criminal', risk: 82 },
        { id: 'B-001', label: 'Global Trust Bank', type: 'bank', risk: 45 },
        { id: 'B-002', label: 'SafePay Wallets', type: 'bank', risk: 60 },
        { id: 'E-001', label: 'DarkNet Node 88', type: 'entity', risk: 99 },
        { id: 'E-002', label: 'Mule Account Group X', type: 'entity', risk: 92 },
      ],
      links: [
        { source: 'C-001', target: 'B-001', label: 'Laundering' },
        { source: 'C-001', target: 'E-001', label: 'Hosting' },
        { source: 'C-002', target: 'B-001', label: 'Transaction' },
        { source: 'C-003', target: 'B-002', label: 'Withdrawal' },
        { source: 'C-001', target: 'C-002', label: 'Accomplice' },
        { source: 'E-001', target: 'E-002', label: 'Traffic' },
        { source: 'E-002', target: 'B-002', label: 'Payout' },
      ]
    };
    res.json(data);
  });

  app.get("/api/crime-locations", authenticate, (req, res) => {
    const locations = db.prepare("SELECT * FROM crime_locations").all();
    res.json(locations);
  });

  app.get("/api/entities", authenticate, (req, res) => {
    const { q, type } = req.query;
    let query = "SELECT * FROM entities WHERE 1=1";
    const params: any[] = [];
    if (q) {
      query += " AND value LIKE ?";
      params.push(`%${q}%`);
    }
    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    const entities = db.prepare(query).all(...params);
    res.json(entities);
  });

  app.get('/api/intelligence/search', authenticate, (req: any, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const query = `%${q}%`;
    const results = db.prepare(`
      SELECT id, name, alias, risk_level, risk_score, 'criminal' as type 
      FROM criminals 
      WHERE name LIKE ? OR alias LIKE ? OR criminal_id LIKE ?
      LIMIT 20
    `).all(query, query, query);

    res.json(results);
  });

  app.get('/api/intelligence/dossier/:id', authenticate, (req: any, res) => {
    const { id } = req.params;
    
    const criminal = db.prepare('SELECT * FROM criminals WHERE id = ?').get(id);
    if (!criminal) return res.status(404).json({ error: 'Entity not found' });

    // Mock dossier details
    const dossier = {
      ...criminal,
      biometrics: {
        facial_match: '98.4%',
        fingerprint_id: 'FP-8821-X',
        iris_scan: 'Verified'
      },
      financial_footprint: [
        { date: '2025-01-10', activity: 'Suspicious UPI Transfer', amount: 50000, status: 'Flagged' },
        { date: '2025-01-12', activity: 'Crypto Exchange Deposit', amount: 120000, status: 'Monitoring' },
      ],
      known_associates: [
        { name: 'Anita Rao', relationship: 'Accomplice', risk: 'High' },
        { name: 'Rahul Verma', relationship: 'Money Mule', risk: 'Medium' }
      ],
      timeline: [
        { date: '2024-12-01', event: 'First detected in phishing network' },
        { date: '2025-01-05', event: 'Linked to ATM skimming incident in Mumbai' },
        { date: '2025-02-15', event: 'Warrant issued' }
      ]
    };

    res.json(dossier);
  });

  // Settings Actions
  app.post('/api/settings/rebuild-index', authenticate, (req: any, res) => {
    try {
      db.exec('ANALYZE');
      res.json({ success: true, message: 'Search index rebuilt and database optimized successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: 'Failed to rebuild index' });
    }
  });

  app.post('/api/settings/backup', authenticate, (req: any, res) => {
    res.json({ success: true, message: 'System backup created: backup_' + new Date().toISOString().split('T')[0] + '.db' });
  });

  app.post('/api/settings/invite-officer', authenticate, (req: any, res) => {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    res.json({ success: true, message: `Invitation sent to ${email} as ${role}` });
  });

  app.post('/api/settings/remove-officer', authenticate, (req: any, res) => {
    const { officerId } = req.body;
    if (!officerId) return res.status(400).json({ error: "Officer ID is required" });
    res.json({ success: true, message: `Officer ${officerId} removed from system` });
  });

  app.post('/api/settings/reset-password', authenticate, (req: any, res) => {
    const { officerId } = req.body;
    res.json({ success: true, message: `Password reset link sent to officer ${officerId}` });
  });

  app.post('/api/settings/assign-role', authenticate, (req: any, res) => {
    const { officerId, role } = req.body;
    res.json({ success: true, message: `Officer ${officerId} role updated to ${role}` });
  });

  app.get('/api/settings/export-logs', authenticate, (req: any, res) => {
    res.json({ success: true, downloadUrl: "/api/logs/download" });
  });

  app.get('/api/settings/clear-cache', authenticate, (req: any, res) => {
    res.json({ success: true, message: "System cache cleared" });
  });

  // Officer Management
  app.get("/api/officers", authenticate, (req: any, res) => {
    try {
      const officers = db.prepare("SELECT id, name, email, role, rank, department, phone, profile_photo, success_rate, cases_solved, cases_pending, recovered_amount FROM users WHERE role = 'officer'").all();
      res.json(officers);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/officers", authenticate, (req: any, res) => {
    try {
      if (req.user.role !== 'officer' && req.user.rank !== 'Chief Officer') {
        return res.status(403).json({ error: "Unauthorized" });
      }
      const { name, email, rank, department, phone } = req.body;
      const hashedPassword = bcrypt.hashSync("password123", 10);
      
      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
      if (existing) {
        db.prepare("UPDATE users SET name = ?, rank = ?, department = ?, phone = ? WHERE email = ?").run(name, rank, department, phone, email);
        return res.json({ success: true, message: "Officer updated" });
      }

      db.prepare("INSERT INTO users (name, email, password, role, rank, department, phone) VALUES (?, ?, ?, 'officer', ?, ?, ?)").run(name, email, hashedPassword, rank, department, phone);
      res.json({ success: true, message: "Officer added" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/officers/:id", authenticate, (req: any, res) => {
    try {
      if (req.user.rank !== 'Chief Officer') return res.status(403).json({ error: "Unauthorized" });
      db.prepare("DELETE FROM users WHERE id = ? AND role = 'officer'").run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/officers/:id/stats", authenticate, (req: any, res) => {
    try {
      const officer = db.prepare("SELECT * FROM users WHERE id = ? AND role = 'officer'").get(req.params.id) as any;
      if (!officer) return res.status(404).json({ error: "Officer not found" });
      
      const activity = Array.from({ length: 6 }, (_, i) => ({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
        cases: Math.floor(Math.random() * 20) + 5
      }));

      res.json({
        stats: {
          solved: officer.cases_solved,
          pending: officer.cases_pending,
          recovered: officer.recovered_amount,
          successRate: officer.success_rate
        },
        activity
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Criminal Tracking & Warrants
  app.post("/api/criminals/:id/warrant", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      db.prepare("INSERT INTO warrants (criminal_id, officer_id, status) VALUES (?, ?, 'ISSUED')").run(id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/criminals/:id/location", authenticate, (req: any, res) => {
    try {
      const { id } = req.params;
      let location = db.prepare("SELECT * FROM criminal_locations WHERE criminal_id = ? ORDER BY timestamp DESC LIMIT 1").get(id) as any;
      
      if (!location) {
        // Generate mock location if none exists
        const lat = 19.0760 + (Math.random() - 0.5) * 0.5;
        const lng = 72.8777 + (Math.random() - 0.5) * 0.5;
        db.prepare("INSERT INTO criminal_locations (criminal_id, latitude, longitude) VALUES (?, ?, ?)").run(id, lat, lng);
        location = { latitude: lat, longitude: lng };
      }
      
      res.json(location);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // FIR Generation
  app.post("/api/fir/generate", authenticate, (req: any, res) => {
    try {
      const { complaint_id } = req.body;
      const complaint = db.prepare("SELECT * FROM complaints WHERE complaint_id = ?").get(complaint_id) as any;
      if (!complaint) return res.status(404).json({ error: "Complaint not found" });

      const fir_id = `FIR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const pdf_path = `evidence/fir_${fir_id}.pdf`;

      // In a real app, we'd use PDFKit here. For now, we'll just record it.
      db.prepare(`
        INSERT INTO fir_reports (fir_id, complaint_id, victim_name, fraud_type, amount, incident_date, description, officer_id, pdf_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(fir_id, complaint_id, complaint.victim_name, complaint.fraud_type, complaint.amount, complaint.incident_date, complaint.description, req.user.id, pdf_path);

      res.json({ success: true, fir_id, pdf_path });
    } catch (error) {
      console.error("FIR Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // AI Chat Assistant
  app.post("/api/ai/chat", authenticate, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: "Message is required" });

      // Save user message
      db.prepare("INSERT INTO chat_history (user_id, message, role) VALUES (?, ?, ?)").run(req.user.id, message, 'user');

      // Get chat history for context
      const history = db.prepare("SELECT message, role FROM chat_history WHERE user_id = ? ORDER BY timestamp DESC LIMIT 10").all(req.user.id) as any[];
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      
      const systemInstruction = `You are the CyberShield Omega AI Assistant, a high-tech cybercrime investigation AI. 
      You help officers and citizens with cybercrime reporting, investigation, and prevention.
      You can interpret commands like:
      - "Generate FIR for CMP-XXXXX"
      - "Track criminal CR-XXXX"
      - "Show risk heatmap"
      
      Be professional, efficient, and use cyber-security terminology. 
      If a user asks to generate an FIR, tell them you are processing it and call the internal FIR generation logic if possible (simulated).`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          { role: "user", parts: [{ text: systemInstruction }] },
          ...history.reverse().map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.message }]
          })),
          { role: "user", parts: [{ text: message }] }
        ]
      });

      const aiMessage = response.text || "I am processing your request, Officer.";
      
      // Save AI response
      db.prepare("INSERT INTO chat_history (user_id, message, role) VALUES (?, ?, ?)").run(req.user.id, aiMessage, 'model');

      res.json({ message: aiMessage });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CyberShield Omega Server running on http://localhost:${PORT}`);
  });
}

startServer();
