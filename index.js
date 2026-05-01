
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcrypt";
import pg from "pg";
import crypto from "crypto";
import nodemailer from "nodemailer";
import dotenv from 'dotenv'
import { sendResetEmail } from "./emailservice.js";
import db from "./db.js";
import pkg from "pg";
const { Pool } = pkg;

 dotenv.config();
const app = express();
// const db = new Pool({
//   user: process.env.PG_USER,
//   host: process.env.PG_HOST,
//   database: process.env.PG_DATABASE,
//   password: process.env.PG_PASSWORD,
//   port: process.env.PG_PORT,
// });

// db.connect();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(session({
//   secret: "budget-secret",
//   resave: false,
//   saveUninitialized: false
// }));
// import session from "express-session";
// import pgSession from "connect-pg-simple";
// import pkg from "pg";

// const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
 
  ssl: { rejectUnauthorized: false }
  
});
 console.log("DB URL:", process.env.DATABASE_URL);

// const PostgresSession = pgSession(session);
const PostgresSession = connectPgSimple(session);
app.use(session({
  store: new PostgresSession({
    pool: pool,
    tableName: "session"
  }),
  secret: process.env.SESSION_SECRET || "budget-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));
const port = process.env.PORT || 3000;
//  const port = 3000;

// app.use(session({
//   secret: process.env.SESSION_SECRET || "fallback-secret",
//   resave: false,
//   saveUninitialized: false
// }));

// HOME PAGE
app.get("/", (req, res) => {
  res.render("home");
});
app.get("/about", (req,res) =>{
  res.render("about")
});

// LOGIN PAGE
app.get("/login", (req, res) => {
  res.render("login"); 
});
// Reset Page
app.get("/forgot-password",(req,res) =>{
  res.render("pass");
});

// REGISTER PAGE
app.get("/register", (req, res) => {
  res.render("register");
});

// REGISTER
app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hash = await bcrypt.hash(password, 10);

  await db.query(
    "INSERT INTO users (email, password) VALUES ($1, $2)",
    [email, hash]
  );

  res.redirect("/login");
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await db.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  if (result.rows.length === 0) return res.send("<p>User not found kindly klick on register</p>");

  const user = result.rows[0];

  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.send("<h2>Wrong password ❌</h2>");
  req.session.user = user; 
  res.redirect("/dashboard");
});

app.post("/forgot-password", async (req, res) => {
  const email = req.body.email.trim();

  try {
    // 1️⃣ Check if user exists
    const userResult = await db.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.send(<p>"User not found"</p>);
    }

    // 2️⃣ Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
  

    // 3️⃣ Save token in DB
    await db.query(
      "UPDATE users SET reset_token=$1 WHERE email=$2",
      [token, email]
    );

    // 4️⃣ Send reset email
    await sendResetEmail(email, token);

    
    res.send("<p>Password reset link sent to your email. Check inbox and Click to reset your password please</p>");

   } catch (err) {
    console.log("ERROR IN FORGOT-PASSWORD:", err);
     res.send("Something went wrong. Please try again later.");
   }
});
app.get("/reset-password", async (req, res) => {
    
    const token = req.query.token;
     

    if (!token) {
        return res.send("Invalid link");
    }

    const user = await db.query(
        "SELECT * FROM users WHERE reset_token = $1",
        [token]
    );

    if (user.rows.length === 0) {
        return res.send("<p>Invalid or expired token</p>");
    }

    res.render("reset", { token, success: null }); 
});

app.post("/reset-password", async (req, res) => {
   const { token,password } = req.body;

  const user = await db.query(
    "SELECT * FROM users WHERE reset_token=$1",
    [token]
  );

  // if (user.rows.length === 0) {
  //   return res.send("Invalid token");
  // }
  if (user.rows.length === 0) {
    return res.render("reset.ejs", {
      error: "Invalid or expired token",
      success: null,
      token: null
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.query(
    "UPDATE users SET password=$1, reset_token=NULL WHERE reset_token=$2",
    [hashedPassword, token]
  );
    res.render("reset.ejs", 
      { success: "<h2>Password updated successfully</h2>",   
        token: null,
         error: null
    
       });

});

// DASHBOARD
app.get("/dashboard", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const data = await db.query(
    "SELECT * FROM transactions WHERE user_id=$1 ORDER BY id DESC",
    [req.session.user.id]
  );

  res.render("dashboard", { transactions: data.rows });
});



// ADD

app.post("/add", async (req, res) => {
  try {
    if (!req.session.user) return res.redirect("/login");

    const { description, income, expense } = req.body;
    console.log(req.body);

    // convert properly
    const inc = income ? Number(income) : 0;
    const exp = expense ? Number(expense) : 0;

    // validation FIRST
    if (inc > 0 && exp > 0) {
      return res.send("Enter either income OR expense, not both.");
    }

    await db.query(
      "INSERT INTO transactions (user_id, description, income, expense) VALUES ($1,$2,$3,$4)",
      [req.session.user.id, description, inc, exp]
    );

    res.redirect("/dashboard");

  } catch (err) {
    console.error("ADD ERROR:", err);
    res.status(500).send("Internal Server Error");
  }
});
// app.post("/add", async (req, res) => {
//   if (!req.session.user) return res.redirect("/login");

//   const { description, income, expense } = req.body;

//   await db.query(
//     "INSERT INTO transactions (user_id, description, income, expense) VALUES ($1,$2,$3,$4)",
//     [req.session.user.id, description, income || 0, expense || 0]
//   );

// if (income && expense) {
//   return res.send("Enter either income OR expense, not both.");
// }
//   res.redirect("/dashboard");
// });

app.get("/", async (req, res) => {
  const result = await db.query("SELECT * FROM transactions");

  let totalIncome = 0;
  let totalExpense = 0;

  result.rows.forEach(item => {
    totalIncome += Number(item.income);
    totalExpense += Number(item.expense);
  });

  const balance = totalIncome - totalExpense;

  res.render("index", {
    transactions: result.rows,
    totalIncome,
    totalExpense,
    balance
  });
});
// app.post("/add", async (req, res) => {
//   const { description, income, expense } = req.body;

//   await db.query(
//     "INSERT INTO transactions (description, income, expense) VALUES ($1, $2, $3)",
//     [description, income || 0, expense || 0]
//   );

//   res.redirect("/");
// });


// DELETE
app.post("/delete/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  await db.query(
    "DELETE FROM transactions WHERE id=$1 AND user_id=$2",
    [req.params.id, req.session.user.id]
  );

  res.redirect("/dashboard");
});
db.query(
"SELECT NOW()", (err, res) => {
  if (err) console.log(err);
  else console.log("DB Connected");
});
app.get("/monthly-summary", async (req, res) => {
  const result = await db.query(`
    SELECT 
      TO_CHAR(created_at, 'Month') AS month,
      SUM(income) AS total_income,
      SUM(expense) AS total_expense
    FROM transactions
    GROUP BY month
    ORDER BY month
  `);

  res.render("monthly.ejs", { summary: result.rows });
});
// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});


  app.listen(port, () =>{
  console.log(`Listening on port${port}`)
})

