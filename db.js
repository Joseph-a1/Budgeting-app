// const { Pool } = require('pg');
import pkg from "pg";
const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
export default db;
// module.exports = db;
// const { Pool } = require("pg");

// const pool = new Pool({
//   user: "postgres",
//   host: "localhost",
//   database: "Users",
//   password: "paul123",
//   port: 5432,
// });

// module.exports = pool;