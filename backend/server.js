import express from "express";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import cors from "cors";

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

// connect to DB
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "bank",
  // port: 8889,
});

// help function to make code look nicer
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

//routes endpoints

app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  // kryptera lösenordet innan det hamnar i DB

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  console.log("hashedPassword", hashedPassword);

  try {
    const result = await query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword]
    );

    res.status(201).json({ message: "User created" });
  } catch (error) {
    console.error("Error creating user", error);
    res.status(500).json({ error: "Error creating user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // 1. Gör select och hämta raden som matchar username

  const result = await query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);

  console.log("result", result);

  const user = result[0];

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  // 2. Kolla hash i DB matchar crypterat lösenord

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(401).send("invalid usernam or password");
  }

  res.status(200).json({ message: "login successful" });
});

// app.post("/accounts", (req, res) => {
//   const { otp, amount } = req.body;
//   const session = Sessions.find((session) => session.otp === otp);
//   if (session) {
//     const accountIndex = Accounts.findIndex(
//       (account) => account.username === session.username
//     );
//     if (accountIndex !== -1) {
//       Accounts[accountIndex].balance += parseInt(amount);
//       res.status(200).json({ message: "Deposit successful." });
//     } else {
//       res.status(404).json({ message: "Account not found." });
//     }
//   } else {
//     res.status(401).json({ message: "Invalid OTP." });
//   }
//   console.log(otp, amount);
// });

app.listen(port, () => {
  console.log(`Bankens backend körs på http://localhost:${port}`);
});
