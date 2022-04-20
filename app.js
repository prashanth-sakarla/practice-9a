const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "userData.db");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(9000, () => {
      console.log("Server is Running at http://localhost/9000");
    });
  } catch (e) {
    console.log(`Database Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// create user

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const getUserName = `
  SELECT * 
  FROM user
  WHERE username = '${username}';`;
  dbResponse = await db.get(getUserName);
  if (dbResponse === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const addUserQuery = `
        INSERT INTO 
        user (username,name,password,gender,location)
        VALUES '${username}',
        '${name}',
        '${hashedPassword}',
        '${gender}',
        ${location};`;
      await db.run(addUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//api login
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserName = `
  SELECT * 
  FROM user
  WHERE username ='${username}';`;
  dbResponse = await db.get(getUserName);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(password, dbResponse.password);
    if (isPasswordMatch === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// password change
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newHashedPassword = bcrypt.hash(newPassword, 10);
  const getUserName = `
  SELECT * 
  FROM user
  WHERE username ='${username}';`;
  dbResponse = await db.get(getUserName);
  if (dbResponse === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      dbResponse.password
    );
    if (isPasswordMatch === true) {
      const changePassword = `
        UPDATE TABLE user 
        SET  password = ${newHashedPassword}
        WHERE username = ${username};`;
      await db.run(changePassword);
      response.send("Password updated");
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});

module.exports = app;
