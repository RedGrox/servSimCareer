const express = require("express");
const app = express();
const router = express.Router();
const fs = require("fs");
let rawdata;
let http = require("http");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//get teams
/*
  request example:
  {
    "arg"=[1,25,3]
  }
*/
router.post("/getTeams/", (req, res, next) => {
  let teams = getTeams();
  let bodyReq = req.body;
  let trueCounter = false;
  let response = [];
  if (bodyReq.arg.length == 0) {
    //send back all users
    res.status(200).json(teams);
  } else {
    for (let i = 0; i < bodyReq.arg.length; i++) {
      let index = existId(bodyReq.arg[i], teams);
      if (index != -1) {
        response.push(teams[index]);
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

function getTeams() {
  rawdata = fs.readFileSync("DB/team.json");
  let teams;
  if (rawdata.length == 0) {
    teams = [];
  } else {
    teams = JSON.parse(rawdata);
  }
  return teams;
}

function existId(id, teams) {
  let index = -1;
  id += "";
  if (teams.length != 0) {
    for (let i = 0; i < teams.length; i++) {
      if (id.localeCompare(teams[i].id) === 0) {
        index = i;
      }
    }
  }
  return index;
}
module.exports = router;
