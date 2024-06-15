const { Client } = require("pg");
const client = new Client({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost/acme_notes_categories_db",
});

const init = async () => {
  try {
    await client.connect();

    let sql;

    // Drop the notes table if it exists
    sql = `
      DROP TABLE IF EXISTS notes;
    `;
    await client.query(sql);

    // Drop the categories table if it exists
    sql = `
      DROP TABLE IF EXISTS categories;
    `;
    await client.query(sql);

    // Create the categories table
    sql = `
      CREATE TABLE categories(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100)
      );
    `;
    await client.query(sql);

    // Create the notes table
    sql = `
      CREATE TABLE notes(
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        ranking INTEGER DEFAULT 3 NOT NULL,
        txt VARCHAR(255) NOT NULL,
        category_id INTEGER REFERENCES categories(id) NOT NULL
      );
    `;
    await client.query(sql);

    // Insert categories
    sql = `
      INSERT INTO categories (name) VALUES ('SQL');
      INSERT INTO categories (name) VALUES ('Express');
      INSERT INTO categories (name) VALUES ('Shopping');
    `;
    await client.query(sql);

    // Insert notes
    sql = `
      INSERT INTO notes (txt, ranking, category_id)
      VALUES ('learn express', 5, (SELECT id FROM categories WHERE name='Express'));
      INSERT INTO notes (txt, ranking, category_id)
      VALUES ('add logging middleware', 5, (SELECT id FROM categories WHERE name='Express'));
      INSERT INTO notes (txt, ranking, category_id)
      VALUES ('write SQL queries', 4, (SELECT id FROM categories WHERE name='SQL'));
      INSERT INTO notes (txt, ranking, category_id)
      VALUES ('learn about foreign keys', 4, (SELECT id FROM categories WHERE name='SQL'));
      INSERT INTO notes (txt, ranking, category_id)
      VALUES ('buy a quart of milk', 2, (SELECT id FROM categories WHERE name='Shopping'));
    `;
    await client.query(sql);

    console.log(
      "Tables have been created and data has been seeded successfully"
    );
  } catch (err) {
    console.error("Error creating tables and seeding data", err);
  } finally {
    await client.end();
  }
};

// Invoke the init function
init();
