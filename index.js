const pg = require("pg");
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/"
);
const express = require("express");
const app = express();
const morgan = require("morgan");
const path = require("path");
const postman = require("postman");

app.use(express.json());
app.use(morgan("dev"));
app.get("/", async (req, res) =>
  res.sendFile(path.join(__dirname, index.html))
);

app.get("/", async (req, res, next) => {
  try {
    const SQL = `
         SELECT *
         FROM icecream
         ORDER BY created_at DESC
        `;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get("/icecream/:id", async (req, res, next) => {
  try {
    const SQL = `
           SELECT *
           FROM icecream
           WHERE id = $1
          `;
    const response = await client.query(SQL, [req.params.id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.post("/icecream", async (req, res, next) => {
  try {
    const SQL = `
INSERT INTO icecream(name)
VALUES($1)
RETURNING *
`;
    const response = await client.query(SQL, [req.body.txt]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete("/icecream/:id", async (req, res, next) => {
  try {
    const SQL = `
               DELETE
               FROM icecream
               WHERE id = $1
              `;
    const response = await client.query(SQL);
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.put("/icecream/:id", async (req, res, next) => {
  try {
    const SQL = `
     UPDATE icecream
     SET name=$1, is_favorite=true, updated_at=now()
     WHERE id=$3 RETURNING *
    `;
    const response = await client.query(SQL, [
      req.body.name,
      req.body.is_favorite,
      req.params.id,
    ]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ message: err.message || err });
});

//
const init = async () => {
  console.log("Connecting to DB...");
  await client.connect();
  console.log("Connected to DB!");
  let SQL = `
  DROP TABLE IF EXISTS icecream;
  CREATE TABLE icecream(
    id SERIAL PRIMARY KEY,
    name VARCHAR (100) NOT NULL, 
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
  );
  `;
  await client.query(SQL);
  console.log("Tables Created!");

  SQL = `
    INSERT INTO icecream(name, is_favorite) VALUES('strawberry', true);
    INSERT INTO icecream(name, is_favorite) VALUES('mint', false);
    INSERT INTO icecream(name, is_favorite) VALUES('cherry vanilla', true);
  `;
  await client.query(SQL);
  console.log("Data seeded!");

  const port = process.env.PORT | 3000;
  app.listen(port, () => console.log(`Listening on port: ${port}`));
};

init();
