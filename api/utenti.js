const express = require('express');
const app = express();
const router = express.Router();
const fs = require('fs');
let rawdata;
let http=require('http');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//get all users
/*
  request example:
  {
    "mailOrId"=1, //mail=0, id=1
    "arg"=[1,25,3]
  }
*/
router.get('/',(req,res,next)=>{
    let utenti=getUtenti();
    let bodyReq=req.body;
    let trueCounter=false;
    let response=[];
    if(bodyReq.length==0) //send back all users
    {
      res.status(200).json(utenti);
    }else if(bodyReq.mailOrId==1) //send back users with those mail
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existMail(bodyReq.arg[i],utenti);
        if(index!=-1)
        {
          response.push(utenti[index]);
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
    }else if(bodyReq.mailOrId==0) //send back users with those id
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existIdUt(bodyReq.arg[i],utenti);
        if(index!=-1)
        {
          response.push(utenti[index]);
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


function getUtenti()
{
  rawdata=fs.readFileSync('DB/utenti.json');
  let utenti;
  if(rawdata.length==0)
  {
    utenti=[];
  }else{
    utenti=JSON.parse(rawdata);
  }
  return utenti;
}
function existMail(utMail,utenti){
  let index=-1;
  if(utenti.length!=0)
  {
    for(let i=0;i<utenti.length;i++)
    {
      if(utMail.localeCompare(utenti[i].mail)===0)
      {
        index=i;
      }
    }
  }
  return index;
}
function existIdUt(idUt,utenti){
  let index=-1;
  if(utenti.length!=0)
  {
    for(let i=0;i<utenti.length;i++)
    {
      if(idUt.localeCompare(utenti[i].id)===0)
      {
        index=i;
      }
    }
  }
  return index;
}


module.exports=router;
