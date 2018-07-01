const express = require('express');
const app = express();

app.post('/',(req,res)=>{
  var email = req.body.email;
  var amount = req.body.amount;

  res.send({"amount" : amount , "email" : email });
});

app.listen(3000,()=>{
  console.log('server is running on port 3000');
});
