const express = require("express");
const app = express();
const { Pool } = require("pg");
const morgan = require("morgan");
const port = process.env.PORT || 3000;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost/acme_notes_categories_db",
});

app.use(express.json());
app.use(morgan("dev"));

const validateEmployee = (employee) => {
  const { name, department_id } = employee;
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("Invalid name");
  }
  if (typeof department_id !== "number") {
    throw new Error("Invalid department ID");
  }
};

app.get("/api/employees", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM employees");
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.get("/api/departments", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM departments");
    res.send(rows);
  } catch (err) {
    next(err);
  }
});

app.post("/api/employees", async (req, res, next) => {
  try {
    validateEmployee(req.body);
    const { name, department_id } = req.body;
    const SQL =
      "INSERT INTO employees (name, department_id) VALUES ($1, $2) RETURNING *";
    const { rows } = await pool.query(SQL, [name, department_id]);
    res.send(rows[0]);
  } catch (err) {
    next(err);
  }
});

app.delete("/api/employees/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM employees WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

app.put("/api/employees/:id", async (req, res, next) => {
  try {
    validateEmployee(req.body);
    const { name, department_id } = req.body;
    const { id } = req.params;
    const SQL = `
      UPDATE employees
      SET name = $1, department_id = $2
      WHERE id = $3 RETURNING *
    `;
    const { rows } = await pool.query(SQL, [name, department_id, id]);
    res.send(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: err.message });
});

// Database Initialization
const init = async () => {
  try {
    await pool.connect();
    await pool.query(`
      DROP TABLE IF EXISTS employees;
      DROP TABLE IF EXISTS departments;
      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );
      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        department_id INTEGER REFERENCES departments(id)
      );
    `);
    console.log("Tables created");
    await pool.query(`
      INSERT INTO departments (name) VALUES ('HR'), ('Engineering'), ('Sales');
      INSERT INTO employees (name, department_id) 
      VALUES 
        ('Alice', (SELECT id FROM departments WHERE name = 'HR')),
        ('Bob', (SELECT id FROM departments WHERE name = 'Engineering')),
        ('Charlie', (SELECT id FROM departments WHERE name = 'Sales'));
    `);
    console.log("Data seeded");
    app.listen(port, () => console.log(`Listening on port ${port}`));
  } catch (err) {
    console.error(err);
  }
};

init();
