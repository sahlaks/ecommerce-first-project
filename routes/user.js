const express = require('express');
const { signupGetController, createUser, userLogin, userIn, homeRoute, checkOtp, forgotPass, verifyMail, failOtp, sendOtp, getOtp, reSendOtp, resetPwd, reSet } = require('../controllers/user-controller');
const { validationRules, checkValidation, verifyLogin, pwdValidation, resetPwdRules } = require('../middlewares/middlewares');
const app = express.Router();




app.get('/login',userLogin)
app.post('/login',userIn)


app.get('/forgotpwd',forgotPass)
app.post('/forgotpwd',verifyMail)

app.get('/resetpwd',verifyLogin,resetPwd)
app.post('/resetpwd',verifyLogin,resetPwdRules,pwdValidation,reSet)

app.get('/home',verifyLogin,homeRoute)


app.get('/signup',signupGetController)
app.post('/signup',validationRules,checkValidation,createUser)

app.get('/sendOtp',verifyLogin,sendOtp)
app.post('/sendOtp',verifyLogin,reSendOtp)

app.get('/otpsend',getOtp)
app.post('/otpsend',checkOtp)

app.get('/otpfail',verifyLogin,failOtp)

module.exports = app;