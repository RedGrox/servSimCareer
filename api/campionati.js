const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
let rawdata;
let http=require('http');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//get circuiti
/*
  request example:
  {
    "arg"=[1,25,3]
  }
*/
router.get('/',(req,res,next)=>{
    let campionati=getCampionati();
    let bodyReq=req.body;
    let trueCounter=false;
    let response=[];
    if(bodyReq.arg.length==0) //send back all users
    {
      res.status(200).json(campionati);
    }else
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existId(bodyReq.arg[i],campionati);
        if(index!=-1)
        {
          response.push(campionati[index]);
          trueCounter=true;
        }else {
          response.push({});
        }
      }
      if(trueCounter)
      {
        res.status(200).json(response);
      }else {
        res.status(400).json(response);
      }
    }
});

function getCampionati()
{
  rawdata=fs.readFileSync('DB/campionati.json');
  let campionati;
  if(rawdata.length==0)
  {
    campionati=[];
  }else{
    campionati=JSON.parse(rawdata);
  }
  return campionati;
}
function existId(id,campionati){
    let index=-1;
    id+="";
    if(campionati.length!=0)
    {
      for(let i=0;i<campionati.length;i++)
      {
        if(id.localeCompare(campionati[i].id)===0)
        {
          index=i;
        }
      }
    }
    return index;
  }


module.exports=router;