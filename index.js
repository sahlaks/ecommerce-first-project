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


/*.......route........*/
const userRouter = require('./routes/user')
const adminRouter = require('./routes/admin')

app.set("view engine",'hbs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(noche())
app.use(session({secret: 'my-secret-key',cookie:{maxAge:10000000}}))
app.use(express.static(path.join(__dirname,'public')))


app.engine('hbs',hbs({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials'}))

Connection();
app.use('/',userRouter)
app.use('/admin',adminRouter)

app.listen(3000,console.log("server created"))