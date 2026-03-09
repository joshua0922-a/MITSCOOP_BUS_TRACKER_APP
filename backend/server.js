const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ===============================
   DATABASE
================================ */
const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database error:", err.message);
  else console.log("SQLite database connected");
});

/* ===============================
   CREATE TABLES
================================ */
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS buses(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_number TEXT UNIQUE,
      plate_number TEXT,
      route TEXT,
      driver TEXT,
      conductor TEXT,
      status TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_number TEXT,
      action TEXT,
      time TEXT,
      date TEXT,
      remarks TEXT
    )
  `);
});

/* ===============================
   HEALTH CHECK
================================ */
app.get("/api/health", (req,res)=>{
  res.json({status:"Server Running"});
});

/* ===============================
   BUS ROUTES
================================ */
app.get("/api/buses", (req,res)=>{
  const search = req.query.search;
  let sql = "SELECT * FROM buses";
  let params = [];
  if(search){
    sql += " WHERE bus_number LIKE ?";
    params.push(`%${search}%`);
  }
  db.all(sql, params, (err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.post("/api/buses",(req,res)=>{
  const {bus_number,plate_number,route,driver,conductor,status} = req.body;
  if(!bus_number) return res.status(400).json({error:"Bus number required"});
  db.run(
    `INSERT INTO buses (bus_number,plate_number,route,driver,conductor,status) VALUES (?,?,?,?,?,?)`,
    [bus_number,plate_number,route,driver,conductor,status || "Active"],
    function(err){
      if(err) return res.status(500).json({error:err.message});
      res.json({success:true,bus_id:this.lastID});
    }
  );
});

app.put("/api/buses/:id",(req,res)=>{
  const {plate_number,route,driver,conductor,status} = req.body;
  db.run(
    `UPDATE buses SET plate_number=?,route=?,driver=?,conductor=?,status=? WHERE id=?`,
    [plate_number,route,driver,conductor,status,req.params.id],
    function(err){
      if(err) return res.status(500).json({error:err.message});
      res.json({success:true,updated:this.changes});
    }
  );
});

app.delete("/api/buses/:id",(req,res)=>{
  db.run(`DELETE FROM buses WHERE id=?`, [req.params.id], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({success:true,deleted:this.changes});
  });
});

/* ===============================
   LOG ROUTES
================================ */
app.get("/api/logs",(req,res)=>{
  const {bus,date,limit} = req.query;
  let sql = "SELECT * FROM logs WHERE 1=1";
  let params = [];
  if(bus){ sql += " AND bus_number=?"; params.push(bus); }
  if(date){ sql += " AND date=?"; params.push(date); }
  sql += " ORDER BY id DESC";
  if(limit){ sql += " LIMIT ?"; params.push(Number(limit)); }
  db.all(sql,params,(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    res.json(rows);
  });
});

app.post("/api/log",(req,res)=>{
  const {bus_number,action,remarks} = req.body;
  if(!bus_number || !action) return res.status(400).json({error:"bus_number and action required"});
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const time = now.toLocaleTimeString();

  db.get(`SELECT * FROM buses WHERE bus_number=?`, [bus_number], (err,bus)=>{
    if(err) return res.status(500).json({error:err.message});
    if(!bus) return res.status(404).json({error:"Bus not registered"});
    
    db.run(
      `INSERT INTO logs (bus_number,action,time,date,remarks) VALUES (?,?,?,?,?)`,
      [bus_number,action,time,date,remarks],
      function(err){
        if(err) return res.status(500).json({error:err.message});
        const status = action === "OUT" ? "On Route" : "In Terminal";
        db.run(`UPDATE buses SET status=? WHERE bus_number=?`, [status,bus_number]);
        res.json({success:true,log_id:this.lastID});
      }
    );
  });
});

app.put("/api/logs/:id",(req,res)=>{
  const {remarks} = req.body;
  db.run(`UPDATE logs SET remarks=? WHERE id=?`, [remarks,req.params.id], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({success:true,updated:this.changes});
  });
});

app.delete("/api/logs/:id",(req,res)=>{
  db.run(`DELETE FROM logs WHERE id=?`, [req.params.id], function(err){
    if(err) return res.status(500).json({error:err.message});
    res.json({success:true,deleted:this.changes});
  });
});

/* ===============================
   DASHBOARD STATS
================================ */
app.get("/api/dashboard",(req,res)=>{
  db.all(`SELECT status, COUNT(*) as total FROM buses GROUP BY status`,(err,rows)=>{
    if(err) return res.status(500).json({error:err.message});
    const stats = {total:0,onRoute:0,inTerminal:0,maintenance:0};
    rows.forEach(r=>{
      stats.total += r.total;
      if(r.status==="On Route") stats.onRoute=r.total;
      if(r.status==="In Terminal") stats.inTerminal=r.total;
      if(r.status==="Maintenance") stats.maintenance=r.total;
    });
    res.json(stats);
  });
});

/* ===============================
   VERCEL EXPORT
================================ */
module.exports = app;  // <-- for Vercel serverless