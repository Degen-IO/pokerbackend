// a connection pool allows you to make multiple connection requests to your server (neccessary?)
// const { Pool } = require("pg");
// const dotenv = require("dotenv");
// dotenv.config();

// const connectDb = async () => {
//   try {
//     const pool = new Pool({
//       user: process.env.PGUSER,
//       host: process.env.PGHOST,
//       database: process.env.PGDATABASE,
//       password: process.env.PGPASSWORD,
//       port: process.env.PGPORT,
//     });

//     await pool.connect();
//     const res = await pool.query("SELECT * FROM clients");
//     console.log(res);
//     await pool.end();
//   } catch (error) {
//     console.log(error);
//   }
// };

// connectDb();

//single client connection

const { Client } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const connectDb = async () => {
  try {
    const client = new Client({
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD,
      port: process.env.PGPORT,
    });

    await client.connect();
    const res = await client.query("SELECT * FROM some_table");
    console.log(res);
    await client.end();
  } catch (error) {
    console.log(error);
  }
};

connectDb();
