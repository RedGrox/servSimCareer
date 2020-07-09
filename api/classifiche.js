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
    let classifiche=getClassifiche();
    let bodyReq=req.body;
    let trueCounter=false;
    let response=[];
    if(bodyReq.arg.length==0) //send back all users
    {
      res.status(200).json(classifiche);
    }else
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existId(bodyReq.arg[i],classifiche);
        if(index!=-1)
        {
          response.push(classifiche[index]);
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

function getClassifiche()
{
  rawdata=fs.readFileSync('DB/classifiche.json');
  let classifiche;
  if(rawdata.length==0)
  {
    classifiche=[];
  }else{
    classifiche=JSON.parse(rawdata);
  }
  return classifiche;
}
function existId(id,classifiche){
    let index=-1;
    id+="";
    if(classifiche.length!=0)
    {
      for(let i=0;i<classifiche.length;i++)
      {
        if(id.localeCompare(classifiche[i].id)===0)
        {
          index=i;
        }
      }
    }
    return index;
  }
module.exports=router;