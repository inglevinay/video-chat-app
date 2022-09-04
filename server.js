//jshint:es6
const express = require("express");
const app = express();
const bodyParser = require("body-parser")
const passport = require("passport")
const cookieSession = require('cookie-session');
require('./passport');
require("dotenv").config()

app.use(cookieSession({
  name: 'google-auth-session',
  keys: ['key1', 'key2']
}))

app.use(passport.initialize());
app.use(passport.session());

const isLoggedIn = (req, res, next) => {
  if (req.user) {
      next();
  } else {
      res.sendStatus(401);
  }
}

app.get("/failed", (req, res) => {
  res.send("Failed")
})
app.get("/success",isLoggedIn, (req, res) => {
  res.send(`Welcome ${req.user.email}`)
})

app.get('/google',
  passport.authenticate('google', {
          scope:
              ['email', 'profile']
      }
  ));

app.get('/google/callback',
  passport.authenticate('google', {
      failureRedirect: '/failed',
  }),
  function (req, res) {
      res.redirect('/success')

  }
);

app.get("/logout", (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/');
})

app.use(bodyParser.urlencoded({extended:true}))
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");


app.set("view engine", "ejs");

const connecturl = 'mongodb+srv://' + process.env.UNAME+ ':' + process.env.PASSWORD + '@cluster0.5yrvv.mongodb.net/hackathonDB'
mongoose.connect(connecturl);

const userSchema = {
  email: String,
  password: String
};

const User = new mongoose.model("User", userSchema)



const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", function(req, res){
	// res.sendFile(__dirname + "/index.html");
    res.render("authenciation");
});

app.get("/register", function(req, res){
	// res.sendFile(__dirname + "/index.html");
    res.render("register");
});

app.post("/register", (req, res)=>{
  const uname = req.body.email
  const pwd = req.body.password

  console.log(uname + " " + pwd)

  User.insertMany([{email: uname, password: pwd}], (err)=>{
    if(err){
      console.log("insert was unsuccessful")
      res.redirect("/register")
    }
    else{
      console.log("insert was successful")
      res.redirect("/join")
    }
  })

})

app.get("/join", function(req, res){
	// res.sendFile(__dirname + "/join.html");
    res.render("join");
});

app.post("/join",(req, res)=>{
  const uname = req.body.username
  const pwd = req.body.password
  console.log(uname + " " + pwd)

  User.findOne({email: uname}, (err, doc)=>{
    if(err){
      console.log(err)
    }
    else{
      if(doc == null){
        console.log("not found")
        res.render("authenciation");
      }
      else{
        console.log("found")
        console.log(doc)
        res.redirect("/join");
      }
    }
  })
})

app.get("/videoMeet", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});



server.listen(process.env.PORT || 3030);
