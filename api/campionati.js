const express = require("express");
const app = express();
const router = express.Router();
const fs = require("fs");
var _ = require("lodash");
let rawdata;
let http = require("http");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//get circuiti
/*
  request example:
  {
    "arg"=[1,25,3]
  }
*/
router.get("/dateUt/:idUt", (req, res, next) => {
  console.log("request " + Date.now().toString());
  let campionati = getCampionati();
  let idUt = parseInt(req.params.idUt, 10);
  let userRaces = [];
  for (let i = 0; i < campionati.length; i++) {
    let thereIsUt = false;
    for (let j = 0; j < campionati[i].pilotiIscritti.length; j++) {
      if (campionati[i].pilotiIscritti[j].idUt == idUt) {
        thereIsUt = true;
        j = campionati[i].pilotiIscritti.length;
      }
    }
    if (thereIsUt == true) {
      for (let j = 0; j < campionati[i].calendario.length; j++) {
        let gara = campionati[i].calendario[j];
        let circuito = getCircuito(gara.idCircuito);
        let index = _.findIndex(userRaces, function (item) {
          return item.title == gara.data;
        });
        if (index == -1) {
          userRaces.push({
            title: gara.data,
            data: [
              {
                ora: gara.ora,
                meteo: gara.meteo,
                circuito: circuito.nome,
                logo: circuito.logo,
                campionato: campionati[i].nome,
              },
            ],
          });
        } else {
          userRaces[index].data.push({
            ora: gara.ora,
            circuito: gara.circuito,
            meteo: gara.meteo,
            circuito: circuito.nome,
            logo: circuito.logo,
            campionato: campionati[i].nome,
          });
        }
      }
    }
  }
  userRaces.sort(function (a, b) {
    if (a.title > b.title) {
      return 1;
    }
    if (a.title < b.title) {
      return -1;
    }
    return 0;
  });
  res.status(200).json(userRaces);
});

router.post("/addPref/", (req, res, next) => {
  let bodyReq = req.body;
  if (addPref(bodyReq.idUt, parseInt(bodyReq.idChamp.id))) {
    res.status(200).json({});
  } else {
    res.status(400).json({});
  }
});

router.post("/removePref/", (req, res, next) => {
  let bodyReq = req.body;
  if (removePref(bodyReq.idUt, parseInt(bodyReq.idChamp.id))) {
    res.status(200).json({});
  } else {
    res.status(400).json({});
  }
});

router.post("/", (req, res, next) => {
  let campionati = getCampionati();
  let bodyReq = req.body;
  let pref = getPref(bodyReq.idUt);
  let trueCounter = false;
  let response = [];
  if (bodyReq.arg.length == 0) {
    //send back all championships
    res.status(200).json({ campionati, pref });
  } else {
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existId(bodyReq.arg[i], campionati);
      if (index != -1) {
        response.push(campionati[index]);
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

function getCampionati() {
  rawdata = fs.readFileSync("DB/campionati.json");
  let campionati;
  if (rawdata.length == 0) {
    campionati = [];
  } else {
    campionati = JSON.parse(rawdata);
  }
  return campionati;
}

function getCircuito(idCircuito) {
  rawdata = fs.readFileSync("DB/circuiti.json");
  let circuiti;
  if (rawdata.length == 0) {
    return -1;
  } else {
    circuiti = JSON.parse(rawdata);
    for (let i = 0; i < circuiti.length; i++) {
      if (circuiti[i].id == idCircuito) {
        return circuiti[i];
      }
    }
  }
}

function getPref(idUt) {
  rawdata = fs.readFileSync("DB/utenti.json");
  let utenti, pref;
  if (rawdata.length == 0) {
    pref = [];
  } else {
    utenti = JSON.parse(rawdata);
    pref = [];
    for (let i = 0; i < utenti.length; i++) {
      if (utenti[i].id == idUt) {
        return utenti[i].campionatiPreferiti;
      }
    }
  }
  return pref;
}

function addPref(idUt, idChamp) {
  let rawdata = fs.readFileSync("DB/utenti.json");
  let utenti, campionati;
  campionati = getCampionati();
  if (rawdata.length == 0 && existId(idChamp, campionati)) {
    return false;
  } else {
    utenti = JSON.parse(rawdata);
    for (let i = 0; i < utenti.length; i++) {
      if (utenti[i].id == idUt) {
        if (!utenti[i].campionatiPreferiti.includes(idChamp)) {
          utenti[i].campionatiPreferiti.push(idChamp);
          utenti[i].campionatiPreferiti.sort();
          fs.writeFileSync(
            "DB/utenti.json",
            JSON.stringify(utenti, null, 2),
            "utf8"
          );
          return true;
        }
      }
    }
    return false;
  }
}

function removePref(idUt, idChamp) {
  function filterById(value) {
    return value != idChamp;
  }
  rawdata = fs.readFileSync("DB/utenti.json");
  let utenti;
  if (rawdata.length == 0) {
    return false;
  } else {
    utenti = JSON.parse(rawdata);
    for (let i = 0; i < utenti.length; i++) {
      if (utenti[i].id == idUt) {
        if (utenti[i].campionatiPreferiti.includes(idChamp)) {
          utenti[i].campionatiPreferiti = utenti[i].campionatiPreferiti.filter(
            filterById
          );
          fs.writeFileSync(
            "DB/utenti.json",
            JSON.stringify(utenti, null, 2),
            "utf8"
          );
          return true;
        }
      }
    }
    return false;
  }
}

function existId(id, campionati) {
  let index = -1;
  id += "";
  if (campionati.length != 0) {
    for (let i = 0; i < campionati.length; i++) {
      if (id.localeCompare(campionati[i].id) === 0) {
        index = i;
      }
    }
  }
  return index;
}

module.exports = router;
