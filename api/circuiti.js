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
    let circuiti=getCircuiti();
    let bodyReq=req.body;
    let trueCounter=false;
    let response=[];
    if(bodyReq.arg.length==0) //send back all users
    {
      res.status(200).json(circuiti);
    }else
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existId(bodyReq.arg[i],circuiti);
        if(index!=-1)
        {
          response.push(circuiti[index]);
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

function getCircuiti()
{
  rawdata=fs.readFileSync('DB/circuiti.json');
  let circuiti;
  if(rawdata.length==0)
  {
    circuiti=[];
  }else{
    circuiti=JSON.parse(rawdata);
  }
  return circuiti;
}
function existId(id,circuiti){
    let index=-1;
    id+="";
    if(circuiti.length!=0)
    {
      for(let i=0;i<circuiti.length;i++)
      {
        if(id.localeCompare(circuiti[i].id)===0)
        {
          index=i;
        }
      }
    }
    return index;
  }

module.exports=router;