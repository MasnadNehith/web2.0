const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {save_user_information, get_list_of_participants} = require('./models/server_db');
const path = require('path');
const publicPath = path.join(__dirname, './public');
const paypal = require('paypal-rest-sdk');
const session = require('express-session');

app.use(session(
  {secret: 'my web app',
  cookie :{maxAge: 60000}
  }
));


/* handling all the parsing */
app.use(bodyParser.json());
app.use(express.static(publicPath));

/* paypal configuration */
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'Af6YKOeABj2jcaH287BT_f7F3WJz5H_xufNz7hKWm3lkKTnChor28KsUk9_frDsU-nj9URwJBzZZ5dV4',
  'client_secret': 'EGd3CzQL3F8GyKwpCL0oTZ8Mr-AQR2qlY0x3T5q5P6G9cnmAZFekquoJFrehL5dzkMnF6rlQKdsu7piD'
});

app.post('/post_info', async (req,res)=>{
  var email = req.body.email;
  var amount = req.body.amount;

  if(amount <= 1){
    return_info = {};
    return_info.error = true;
    return_info.message = "The amount should be greater than 1";
    return res.send(return_info);
  }
  var fee_amount = amount * 0.9;
  var result = await save_user_information({"amount" : fee_amount, "email" : email});
  req.session.paypal_amount = amount;
  var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Lottery",
                "sku": "Funding",
                "price": amount,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": amount
        },
        'payee' : {
          'email' : 'lottery_manager@lotteryapp.com'
        },
        "description": "Lottery purchase"
    }]
};


paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
        throw error;
    } else {
        console.log("Create Payment Response");
        console.log(payment);
        for(var i = 0; i< payment.links.length; i++){
          if(payment.links[i].rel =='approval_url'){
            return res.send(payment.links[i].href);
          }
        }
    }
  });
});

app.get('/success', (req,res)=>{
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  var execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "USD",
            "total": req.session.paypal_amount
        }
    }]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
      if (error) {
          console.log(error.response);
          throw error;
      } else {
          console.log(payment);

      }
  });
  res.redirect('http://localhost:3000');
});

app.get('/get_total_amount', async (req,res)=>{
  var result = await get_total_amount();
  res.send(result);
});

app.get('/pick_winner', async (req,res)=>{
  var result = await get_total_amount();
  var total_amount = result[0].total_amount;
  req.session.paypal_amount = total_amount;

  /* Placeholder for picking the winner ,
  1) We need to write a query to get a list of all the participants
  2) we need to pick a winner */
  var list_of_participants = await get_list_of_participants();
  list_of_participants = JSON.parse(JSON.stringify(list_of_participants));
  var email_array = [];
  list_of_participants.forEach(function(element){
    email_array.push(element.email);
  });
  var winner = email_array[Math.floor(Math.random()* email_array.length)];
  console.log(winner);
  return;
  /* Create paypal payment */
  var create_payment_json = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": "http://localhost:3000/success",
        "cancel_url": "http://localhost:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": "Lottery",
                "sku": "Funding",
                "price": req.session.paypal_amount,
                "currency": "USD",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "USD",
            "total": req.session.paypal_amount
        },
        'payee' : {
          'email' : winner_email
        },
        "description": "Paying the winner of the lottery application"
    }]
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
          throw error;
      } else {
          console.log("Create Payment Response");
          console.log(payment);
          for(var i = 0; i< payment.links.length; i++){
            if(payment.links[i].rel =='approval_url'){
              return res.send(payment.links[i].href);
            }
          }
      }
    });

});











app.listen(3000,()=>{
  console.log('server is running on port 3000');
});
