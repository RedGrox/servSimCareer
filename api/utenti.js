const express = require("express");
const app = express();
const router = express.Router();
const fs = require("fs");
const crypto = require("crypto");
const secret = "password";
let rawdata;
let http = require("http");
const bodyParser = require("body-parser");
let lastId = getLastId();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.post("/login", (req, res, next) => {
  let utenti = getUtenti();
  let bodyReq = req.body;
  if (bodyReq.mail) {
    let mail = bodyReq.mail;
    let index = existMail(mail, utenti);
    if (index != -1) {
      let hashedPsw = crypto
        .createHmac("sha256", secret)
        .update(bodyReq.password)
        .digest("hex");
      if (hashedPsw.localeCompare(utenti[index].password) === 0) {
        res.status(200).json(utenti[index]);
      } else {
        res.status(400).json({});
      }
    } else {
      res.status(400).json({});
    }
  }
});
//get users
/*
  request example:
  {
    "mailOrId"=1, //mail=0, id=1
    "arg"=[1,25,3]
  }
*/
router.get("/", (req, res, next) => {
  let utenti = getUtenti();
  let bodyReq = req.body;
  let trueCounter = false;
  let response = [];
  if (bodyReq.length == 0) {
    //send back all users
    res.status(200).json(utenti);
  } else if (bodyReq.mailOrId == 1) {
    //send back users with those mail
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existMail(bodyReq.arg[i], utenti);
      if (index != -1) {
        response.push(utenti[index]);
        trueCounter = true;
      } else {
        response.push({});
      }
    }
    if (trueCounter) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  } else if (bodyReq.mailOrId == 0) {
    //send back users with those id
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existIdUt(bodyReq.arg[i], utenti);
      if (index != -1) {
        response.push(utenti[index]);
        trueCounter = true;
      } else {
        response.push({});
      }
    }
    if (trueCounter) {
      res.status(200).json(response);
    } else {
      res.status(400).json(response);
    }
  }
});
//insert a user
/*
  post example:
  [
    {
    "id":"0",
    "mail":"paolorossi@mail.com",
    "password":"password",
    "nome":"Paolo",
    "cognome":"Rossi",
    "img":"",
    "numeroGara":"5",
    "circuitoPreferito":"",
    "circuitoOdiato":"",
    "autoPreferita":""
    }
  ]
*/
router.post("/", (req, res, next) => {
  let utenti = getUtenti();
  let bodyReq = req.body;
  console.log(req.body);
  let trueCounter = false;
  let arrStatus = [];
  for (let i = 0; i < bodyReq.length; i++) {
    if (existMail(bodyReq[i].mail, utenti) == -1) {
      let hashedPsw = crypto
        .createHmac("sha256", secret)
        .update(bodyReq[i].password)
        .digest("hex");
      bodyReq[i].password = hashedPsw;
      lastId += 1;
      bodyReq[i].id = lastId;
      utenti.push(bodyReq[i]);
      fs.writeFileSync(
        "DB/utenti.json",
        JSON.stringify(utenti, null, 2),
        "utf8"
      );
      trueCounter = true;
      arrStatus.push(true);
    } else {
      arrStatus.push(false);
    }
  }
  if (trueCounter == true) {
    res.status(200).json(arrStatus);
  } else {
    res.status(400).json(arrStatus);
  }
});

/*delete example
  {
    "mailOrId"=1, //mail=0, id=1
    "arg"=[1,25,3]
  }
*/
router.delete("/", (req, res, next) => {
  let utenti = getUtenti();
  let bodyReq = req.body;
  let trueCounter = false;
  let arrStatus = [];
  if (bodyReq.mailOrId == 0) {
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existMail(bodyReq.arg[i], utenti);
      if (index != -1) {
        utenti.splice(index, 1);
        trueCounter = true;
        arrStatus[i] = true;
      } else {
        arrStatus[i] = false;
      }
    }
    if (trueCounter) {
      fs.writeFileSync(
        "DB/utenti.json",
        JSON.stringify(utenti, null, 2),
        "utf8"
      );
      res.status(200).json(arrStatus);
    } else {
      res.status(400).json(arrStatus);
    }
  } else {
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existIdUt(bodyReq.arg[i], utenti);
      if (index != -1) {
        utenti.splice(index, 1);
        trueCounter = true;
        arrStatus[i] = true;
      } else {
        arrStatus[i] = false;
      }
    }
    if (trueCounter) {
      fs.writeFileSync(
        "DB/utenti.json",
        JSON.stringify(utenti, null, 2),
        "utf8"
      );
      res.status(200).json(arrStatus);
    } else {
      res.status(400).json(arrStatus);
    }
  }
});

//modify a user
/*
  post example:
  {
  "id":"0",
  "mail":"paolorossi@mail.com",
  "password":"password",
  "nome":"Paolo",
  "cognome":"Rossi",
  "img":"",
  "numeroGara":"5",
  "circuitoPreferito":"",
  "circuitoOdiato":"",
  "autoPreferita":""
  }
*/
router.put("/", (req, res, next) => {
  let utenti = getUtenti();
  let bodyReq = req.body;
  let indexId = existIdUt(bodyReq.id, utenti);
  let indexM = existMail(bodyReq.mail, utenti);
  if (indexId != -1 && (indexId == indexM || indexM == -1)) {
    utenti[indexId] = bodyReq;
    fs.writeFileSync("DB/utenti.json", JSON.stringify(utenti, null, 2), "utf8");
    res.status(200).json({});
  } else {
    if (indexId == -1) {
      res.status(400).json({ error: 0 }); //error id
    } else {
      res.status(400).json({ error: 1 }); //error mail
    }
  }
});

function getUtenti() {
  rawdata = fs.readFileSync("DB/utenti.json");
  let utenti;
  if (rawdata.length == 0) {
    utenti = [];
  } else {
    utenti = JSON.parse(rawdata);
  }
  return utenti;
}
function existMail(utMail, utenti) {
  let index = -1;
  if (utenti.length != 0) {
    for (let i = 0; i < utenti.length; i++) {
      if (utMail.localeCompare(utenti[i].mail) === 0) {
        index = i;
      }
    }
  }
  return index;
}

function existIdUt(idUt, utenti) {
  let index = -1;
  idUt += "";
  if (utenti.length != 0) {
    for (let i = 0; i < utenti.length; i++) {
      if (idUt.localeCompare(utenti[i].id) === 0) {
        index = i;
      }
    }
  }
  return index;
}

function getLastId() {
  let utenti = getUtenti();
  if (utenti != -1) {
    return Number(utenti[utenti.length - 1].id);
  } else {
    return 0;
  }
}

module.exports = router;
