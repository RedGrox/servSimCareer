const express = require("express");
const app = express();
const router = express.Router();
const fs = require("fs");
const https = require("https");
var _ = require("lodash");
let rawdata;
let http = require("http");
var hash = require("object-hash");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var schedule = require("node-schedule");
const APIOWA = "0a3befe2c8971b2a420fe94c981fcd6f";

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

var scheduledFunction = schedule.scheduleJob("0 * * * *", () => {
  console.log("request meteo");
  let campionati = getCampionati();
  let boolModified = false;
  for (let i = 0; i < campionati.length; i++) {
    for (let j = 0; j < campionati[i].calendario.length; j++) {
      let diff = date_diff_indays(campionati[i].calendario[j].data);
      if (diff == 0 || diff == 1) {
        let circuito = getCircuito(campionati[i].calendario[j].idCircuito);
        let raceTimeStamp = toTimestamp(
          campionati[i].calendario[j].data +
            " " +
            campionati[i].calendario[j].ora
        );
        let str = "";
        https
          .get(
            "https://api.openweathermap.org/" +
              "data/2.5/onecall?lat=" +
              circuito.latitudine +
              "&lon=" +
              circuito.longitudine +
              "&exclude=current,minutely,alerts&appid=" +
              APIOWA +
              "&lang=it&units=metric",
            (res) => {
              res.on("data", (d) => {
                str += d;
              });
              res.on("end", () => {
                let response = JSON.parse(str);
                for (let k = 0; k < response.hourly.length; k++) {
                  if (
                    response.hourly[k].dt + response.timezone_offset ==
                    raceTimeStamp
                  ) {
                    let previsione = response.hourly[k];
                    let windDirection =
                      windSector[Math.round(previsione.wind_deg / 22.5)];

                    let meteo = {
                      temperatura: previsione.temp,
                      percepita: previsione.feels_like,
                      umidita: previsione.humidity,
                      velVento: previsione.wind_speed,
                      dirVento: windDirection,
                      prebPrec: previsione.pop,
                      nuvolePerc: previsione.clouds,
                      descMeteo: previsione.weather[0].description,
                      icon: previsione.weather[0].icon,
                      visib: previsione.visibility,
                    };
                    let requestWeatherFingerPrint = hash(meteo);
                    let dbWeatherFingerPrint = hash(
                      campionati[i].calendario[j].meteo
                    );
                    if (requestWeatherFingerPrint != dbWeatherFingerPrint) {
                      console.log("changed 0-1");
                      campionati[i].calendario[j].meteo = meteo;
                      fs.writeFileSync(
                        "DB/campionati.json",
                        JSON.stringify(campionati, null, 2),
                        "utf8"
                      );
                    }
                    k = response.hourly.length;
                  }
                }
              });
            }
          )
          .end();
      }
      if (diff >= 2 && diff <= 7) {
        let circuito = getCircuito(campionati[i].calendario[j].idCircuito);
        //richiesta
        let str = "";
        https
          .get(
            "https://api.openweathermap.org/" +
              "data/2.5/onecall?lat=" +
              circuito.latitudine +
              "&lon=" +
              circuito.longitudine +
              "&exclude=current,minutely,alerts&appid=" +
              APIOWA +
              "&lang=it&units=metric",
            (res) => {
              res.on("data", (d) => {
                str += d;
              });
              res.on("end", () => {
                let response = JSON.parse(str);
                for (let k = 0; k < response.daily.length; k++) {
                  let responseDate = new Date(response.daily[k].dt * 1000);
                  let stringDate =
                    responseDate.getFullYear() +
                    "-" +
                    (responseDate.getMonth() + 1) +
                    "-" +
                    responseDate.getDate();
                  if (stringDate == campionati[i].calendario[j].data) {
                    let previsione = response.daily[k];
                    let windDirection =
                      windSector[Math.round(previsione.wind_deg / 22.5)];
                    let meteo = {
                      temperatura: previsione.temp.day,
                      percepita: previsione.feels_like.day,
                      umidita: previsione.humidity,
                      velVento: previsione.wind_speed,
                      dirVento: windDirection,
                      prebPrec: previsione.pop,
                      nuvolePerc: previsione.clouds,
                      descMeteo: previsione.weather[0].description,
                      icon: previsione.weather[0].icon,
                    };
                    let requestWeatherFingerPrint = hash(meteo);
                    let dbWeatherFingerPrint = hash(
                      campionati[i].calendario[j].meteo
                    );
                    if (requestWeatherFingerPrint != dbWeatherFingerPrint) {
                      console.log("changed 2-7");
                      campionati[i].calendario[j].meteo = meteo;
                      fs.writeFileSync(
                        "DB/campionati.json",
                        JSON.stringify(campionati, null, 2),
                        "utf8"
                      );
                    }
                    k = response.hourly.length;
                  }
                }
              });
            }
          )
          .end();
      }
    }
  }
});

const windSector = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
  "N",
];

var toTimestamp = (strDate) => {
  var datum = Date.parse(strDate);
  return datum / 1000;
};

date_diff_indays = function (date) {
  let dt1 = new Date();
  let dt2 = new Date(date);
  return Math.floor(
    (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
      Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
      (1000 * 60 * 60 * 24)
  );
};

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
