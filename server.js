// Import the Express libarary which adds web server functionality
var express = require("express");
// Create an "instance" of Express called "app". We will use "app" to configure and run the web server
var app = express();

// !!! Add the code below to allow urlencoded and JSON submissions
app.use(express.urlencoded());

app.use(express.json({ limit: "1mb" }));

// Import the express-session library which will use cookies to keep track of client sessions
var session = require("express-session");
// Tell the web server (app) to use express-session to track sessions
app.use(
  session({
    secret: "eNYNRMTeHhNIzqznJ8U8kzgFhqs6aZMbaCpKrE6hXT2rcW",

    // Set the max session time to 10 minutes. 1000 (ms) * 60 (seconds) * 10 (minutes)
    maxAge: 1000 * 60 * 10,
  })
);

// Import the MongoDB client library to a new object called "MongoClient" which we will use to access all MongoDB functions
const { MongoClient } = require("mongodb");

// Define the connection URL of the MongoDB server and additional options.
// In this case we set the "family" option to 4 which forces the connection to use IPv4 which avoids some issues
const client = new MongoClient("mongodb://localhost/", { family: 4 });

// The function that will open the connection to the MongoDB server.
// By using making this an "async" function we can use "await" statements inside of it.
// In simple terms, an "await" statements tell JavaScript to wait until the operation
// is complete before continuing
async function connect() {
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB!");
  } catch {
    console.log("Error connecting to MongoDB.");
  }
}

// Run the "connect()" function we created above
connect();

// Define a variable that is a reference to a collection we want to access in the database.
// If working with multiple collections, you could create a variable for each one
let jobCollection = client.db("WebAssessment").collection("jobList");

let usersCollection = client.db("WebAssessment").collection("users");

// // !!! Create your routes below

// Rote to Home Page : Index
app.use("/", express.static("content/"));

// Route to Admin Page
app.use("/admin", express.static("content/admin.html"));

// Route to About Us Page
app.use("/aboutus", express.static("content/abtus.html"));

// Route to Statistic Page
app.use("/statistic", express.static("content/stt.html"));


// For Login Page
// Create a route to handle requests for "/loginpage" to show the login page (login.html)
app.use("/loginpage", express.static("content/login.html"));

// Create a route for POST requests to "/loginverify" which will verify login details and redirect the user accordingly
app.post("/loginverify", function (req, res) {
  // Find a user in the 'usersCollection' with the provided username and password
  usersCollection
    .findOne({ username: req.body.username, password: req.body.password })
    .then((foundUser) => {
      if (foundUser) {
        // If a user is found, set their username in the session variable and redirect to '/private'
        req.session.username = req.body.username;
        res.redirect("/admin");
      } else {
        // If no user is found, redirect back to the login page
        return res.redirect("/loginpage");
      }
    })
    .catch((err) => {
      // Handle any errors that occur during the database query
      console.error(err); // Display the error in the debug console
      res.redirect("/loginpage"); // Redirect to login page in case of an error
    });
});

// This function "checkLoginDetails" is called by the "/private" route to check whether the user is logged in yet
function checkLoginDetails(req, res, next) {
  // Check whether the session variable "username" exists
  if (req.session.username) {
    // The "username" session variable exists, therefore the user must be successfully logged in

    // When we use a "check" function like this with Express, we can indicate that the check is successfull by calling the next() function
    next();
  } else {
    // The user is not successfully logged in. Redirect them to the login page

    res.redirect("/loginpage");
  }
}

// Create a route for /logout which destroys the current session and redirects to /login
app.get("/logout", function (req, res) {
  // Destroy the session
  req.session.destroy();

  // Redirect the user to the login page
  res.redirect("/loginpage");
});

// Requests for "/" will be redirected to /private if the user is logged in, or /loginpage if they are not
app.get("/", function (req, res) {
  if (req.session.username) {
    res.redirect("/private");
  } else {
    res.redirect("/loginpage");
  }
});

//  To GET Job Display
app.get("/totaljob", function (req, res) {
    jobCollection
    .find()
    .toArray()
    .then((results) => {
      res.json(results);    
    })
    .catch((error) => {
      res.json({ error: error });
    });
}),

// Admin Page: To add Job
app.get("/jobs", function (req, res) {
  const now = new Date();
  jobCollection
    .find({ closedate: { $gt: now } })
    .sort({ closedate: 1 })
    .toArray()
    .then((results) => {
      res.json(results);
    })
    .catch((error) => {
      res.json({ error: error });
    });
}),
  app.post("/newjob", function (req, res) {
    newjob = req.body;
    properDate = new Date(newjob.closedate);
    newjob.closedate = properDate;

    jobCollection
      .insertOne(newjob)
      .then(() => {
        res.json({ success: true });
      })
      .catch(() => {
        res.json({ success: false });
      });
  }),
  // Admin Page : To delete Job
  app.delete("/deletejob", function (req, res) {
    const jobdel = req.body;
    delete jobdel._id;
    jobCollection.deleteOne(jobdel).then(() => {
      jobCollection
        .find()
        .toArray()
        .then((results) => {
          res.json(results);
        });
    });
  }),
  // Start the web server on TCP port 3000
  app.listen(3000);
