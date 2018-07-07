const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {save_user_information} = require('./models/server_db');
const path = require('path');
const publicPath = path.join(__dirname, './public');

/* handling all the parsing */
app.use(bodyParser.json());
app.use(express.static(publicPath));

app.post('/post_info', async (req,res)=>{
  var email = req.body.email;
  var amount = req.body.amount;

  if(amount <= 1){
    return_info = {};
    return_info.error = true;
    return_info.message = "The amount should be greater than 1";
    return res.send(return_info);
  }
  var result = await save_user_information({"amount" : amount, "email" : email});
  res.send(result);
});

app.get('/get_total_amount', async (req,res)=>{
  var result = await get_total_amount();
  res.send(result);
});

app.listen(3000,()=>{
  console.log('server is running on port 3000');
});
