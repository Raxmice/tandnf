const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
var _ = require("lodash");
var md5 = require("md5");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const multer = require("multer");

const app = express();

const fileStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/img/profile");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage: fileStorageEngine });

app.set("view engine", "ejs");
//for body parser
app.use(bodyparser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  session({
    secret: "key for cookie",
    resave: false,
    saveUninitialized: false
  })
);

const isAuth = (req, res, next) => {
  if (req.session.isAuth) {
    next();
  } else {
    res.redirect("/login");
  }
};

mongoose.connect(
  "mongodb+srv://Raxmice_98:Raxmice1998@noderax.tkfup.mongodb.net/personalfiletask",
  { useNewUrlParser: true }
);
const userinfo = new mongoose.Schema({
  fullname: String,
  contact: Number,
  imgname: String,
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: String,
  com1: { type: String, default: "Complete?" },
  com2: { type: String, default: "Complete?" },
  com3: { type: String, default: "Complete?" }
});
const uinfo = mongoose.model("uinfo", userinfo);

const personalinfo = new mongoose.Schema({
  description: String,
  condition: String,
  deadline: String
});
app.get("/", function (req, res) {
  res.render("index");
});
app.get("/signin", function (req, res) {
  const perr = "";
  res.render("signin", { perr: perr });
});
app.post("/signin", upload.single("avatar"), function (req, res) {
  const file = req.file;
  const f = "img/profile/" + file.originalname;
  uinfo.findOne({ email: req.body.email }, function (err, data) {
    if (data) {
      const perr = "email already exsist.";
      res.render("signin", { perr: perr });
    } else {
      const pass1 = md5(req.body.password);
      const pass2 = md5(req.body.passwordc);
      if (pass1 === pass2) {
        const p1 = new uinfo({
          fullname: _.startCase(req.body.fname),
          contact: req.body.contact,
          email: req.body.email,
          password: pass1,
          imgname: f
        });
        p1.save();
        const s = "Now you can login.";
        res.render("login", { s: s });
      } else {
        const perr = "Passwords should be same.";
        res.render("signin", { perr: perr });
      }
    }
  });
});

app.get("/login", function (req, res) {
  const s = "";
  res.render("login", { s: s });
});
app.post("/login", function (req, res) {
  const email = req.body.email;
  const password = md5(req.body.password);
  uinfo.findOne({ email: email }, function (err, data) {
    const dt = _.toString(data);
    if (dt != "") {
      const em = data.password;
      if (password === em) {
        const value = data.id;
        res.cookie("authrax", value);
        req.session.isAuth = true;
        res.redirect("/dashbord");
      } else {
        const s = "Password is incorrect.";
        res.render("login", { s: s });
      }
    } else {
      const s = "Email is incorrect.";
      res.render("login", { s: s });
    }
  });
});
app.get("/aboutus", function (req, res) {
  res.render("aboutus");
});
app.get("/contactus", function (req, res) {
  res.render("contactus");
});

//after login area
app.get("/dashbord", isAuth, function (req, res) {
  const cname = req.cookies;
  const id = cname.authrax;
  uinfo.find(function (err, data) {
    // console.log(data);
    data.forEach((data) => {
      if (id === data.id) {
        const fname = data.fullname;
        const contact = data.contact;
        const email = data.email;
        const imgname = data.imgname;
        res.render("dashbord", {
          fname: fname,
          contact: contact,
          email: email,
          imgname: imgname
        });
      } else {
        //else statment
      }
    });
  });
});

//profile
app.get("/profile", isAuth, function (req, res) {
  const cname = req.cookies;
  const id = cname.authrax;
  uinfo.find(function (err, data) {
    // console.log(data);
    data.forEach((data) => {
      if (id === data.id) {
        const wr = "";
        const fname = data.fullname;
        const contact = data.contact;
        const email = data.email;
        const imgname = data.imgname;
        res.render("profile", {
          fname: fname,
          contact: contact,
          email: email,
          imgname: imgname,
          wr: wr
        });
      } else {
        //else statment
      }
    });
  });
});
app.post("/profile", (req, res) => {
  const cname = req.cookies;
  const id = cname.authrax;
  const ps = md5(req.body.cpassword);
  const nps = md5(req.body.npassword);
  const cnps = md5(req.body.cnpassword);
  uinfo.findOne({ id: id }, function (err, data) {
    if (ps === data.password) {
      if (nps === cnps) {
        uinfo.updateOne({ id: id }, { password: nps }, function (err) {
          if (err) {
            const fs = "/img/faild.svg";
            const wr = "Update errer, try again.";
            res.render("success", { wr: wr, fs: fs });
          } else {
            const fs = "/img/success.svg";
            const wr = "Password successfuly changed.";
            res.render("success", { wr: wr, fs: fs });
          }
        });
      } else {
        const fs = "/img/faild.svg";
        const wr = "New passwords are should be same.";
        res.render("success", { wr: wr, fs: fs });
      }
    } else {
      const fs = "/img/faild.svg";
      const wr = "Current password is incorrect.";
      res.render("success", { wr: wr, fs: fs });
    }
  });
});
//profile update
app.post("/pupdate", function (req, res) {
  const cname = req.cookies;
  const id = cname.authrax;
  const fname = req.body.fname;
  const contact = req.body.contact;
  const email = req.body.email;
  uinfo.updateMany(
    { id: id },
    { fullname: fname, contact: contact, email: email },
    function (err) {
      if (err) {
        const fs = "/img/faild.svg";
        const wr = "Update errer, try again.";
        res.render("success", { wr: wr, fs: fs });
      } else {
        const fs = "/img/success.svg";
        const wr = "Your profile successfully updated.";
        res.render("success", { wr: wr, fs: fs });
      }
    }
  );
});
//couse page
app.get("/cp", isAuth, (req, res) => {
  const cname = req.cookies;
  const id = cname.authrax;
  uinfo.find(function (err, data) {
    data.forEach((data) => {
      if (data.id === id) {
        const com1 = data.com1;
        const com2 = data.com2;
        const com3 = data.com3;
        res.render("cp", { com1: com1, com2: com2, com3: com3 });
      } else {
        // console.log(err);
      }
    });
  });
});
app.post("/cp", (req, res) => {
  const cname = req.cookies;
  const id = cname.authrax;
  const com1 = _.toString(req.body.com1);
  const com2 = _.toString(req.body.com2);
  const com3 = _.toString(req.body.com3);
  if (com1 != "") {
    uinfo.updateOne({ _id: id }, { com1: "Completed" }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/cp");
      }
    });
  }
  if (com2 != "") {
    uinfo.updateOne({ _id: id }, { com2: "Completed" }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/cp");
      }
    });
  }
  if (com3 != "") {
    uinfo.updateOne({ _id: id }, { com3: "Completed" }, function (err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/cp");
      }
    });
  }
});

//task manager
app.get("/tm", isAuth, (req, res) => {
  const id = req.cookies.authrax;
  uinfo.find(function (err, data) {
    data.forEach((data) => {
      if (data.id === id) {
        const mail = _.snakeCase(data.email);
        const pinfo = mongoose.model(mail, personalinfo);
        pinfo.find(function (err, pdata) {
          res.render("tm", { data: pdata });
        });
      } else {
        // console.log(err);
      }
    });
  });
});
app.post("/tm", (req, res) => {
  const id = req.cookies.authrax;
  uinfo.find(function (err, data) {
    data.forEach((data) => {
      if (data.id === id) {
        const mail = _.snakeCase(data.email);
        const pinfo = mongoose.model(mail, personalinfo);
        const p1 = new pinfo({
          description: req.body.description,
          condition: req.body.complete,
          deadline: req.body.deadline
        });
        p1.save();
        res.redirect("/tm");
      } else {
        // console.log(err);
      }
    });
  });
});
//update
app.post("/update", (req, res) => {
  const id = req.cookies.authrax;
  const des = req.body.description;
  const pid = req.body.id;
  const com = req.body.complete;
  const upd = _.toString(req.body.update);
  uinfo.find(function (err, data) {
    data.forEach((data) => {
      if (data.id === id) {
        const mail = _.snakeCase(data.email);
        const pinfo = mongoose.model(mail, personalinfo);
        //update
        if (upd != "") {
          pinfo.updateMany(
            { _id: pid },
            { description: des, condition: com },
            function (err) {
              if (err) {
                res.send("Unknown error, try again with right data.");
                console.log(err);
              } else {
                res.redirect("/tm");
              }
            }
          );
        } else {
          pinfo.deleteOne({ _id: pid }, function (err) {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/tm");
            }
          });
        }
      } else {
        // console.log(err);
      }
    });
  });
});
//logout
app.post("/logout", (req, res) => {
  res.clearCookie("connect.sid");
  res.clearCookie("authrax");
  res.redirect("/");
});
//404
app.get("/404", function (req, res) {
  res.render("404");
});
app.get("*", function (req, res) {
  res.status(404).redirect("/404");
});

//calling a server
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("server is started on port 3000");
});
