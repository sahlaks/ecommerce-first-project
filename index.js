require('dotenv').config();
const express = require('express')
const app = express();
const Connection = require('./config');
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const hbs = require("express-handlebars").engine
const session = require('express-session')
const noche = require('nocache')
const multer = require('multer')
const path = require('path')
const Razorpay = require('razorpay')
const port = process.env.PORT || 3000

/*.......razorpay.........*/
const raz = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})



/*.......route........*/
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')

app.set("view engine",'hbs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(noche())
app.use(session({secret: 'my-secret-key',cookie:{maxAge:10000000}}))
app.use(express.static(path.join(__dirname,'public')))

app.use((req, res, next) => {
  res.locals.username = req.session.username || null;
  res.locals.cartCount = req.session.cartCount || 0;
  res.locals.listCount = req.session.listCount || 0;
  next();
});

app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials',
                    helpers:{
                        getStatusColor: function (status) {
                            switch (status) {
                              case 'Placed':
                                return 'green';
                              case 'Shipped':
                                return 'blue';
                              case 'Delivered':
                                return 'purple';
                              case 'Cancelled':
                                return 'red';
                              case 'Pending':
                                return 'orange';
                              default:
                                return 'gray';
                            }
                            },
                            eq: function (a, b, options) {
                              if (a == b) { return options.fn(this); }
                            },
                            getPaymentColor: function (status) {
                              switch (status) {
                                case 'Failure':
                                  return 'red';
                                case 'Success':
                                  return 'green';
                                case 'Pending':
                                  return 'orange';

                            }
                          },
                        }
                            }))

Connection();
app.use('/',userRouter)
app.use('/admin',adminRouter)

app.all('*',(req,res)=>{
  res.render('error/404')
})

app.use((err, req, res, next) => {
  if(err.statusCode  == 500){
    res.render('error/500')
  }
  if(err.statusCode  == 404){
    res.render('error/404')
  }

});

app.listen(port,console.log("server created"))