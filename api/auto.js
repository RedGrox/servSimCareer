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
    let auto=getAuto();
    let bodyReq=req.body;
    let trueCounter=false;
    let response=[];
    if(bodyReq.arg.length==0) //send back all users
    {
      res.status(200).json(auto);
    }else
    {
      for(let i=0;i<bodyReq.arg.length;i++)
      {
        let index=existId(bodyReq.arg[i],auto);
        if(index!=-1)
        {
          response.push(auto[index]);
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

function getAuto()
{
  rawdata=fs.readFileSync('DB/auto.json');
  let auto;
  if(rawdata.length==0)
  {
    auto=[];
  }else{
    auto=JSON.parse(rawdata);
  }
  return auto;
}
function existId(id,auto){
    let index=-1;
    id+="";
    if(auto.length!=0)
    {
      for(let i=0;i<auto.length;i++)
      {
        if(id.localeCompare(auto[i].id)===0)
        {
          index=i;
        }
      }
    }
    return index;
  }



module.exports=router;