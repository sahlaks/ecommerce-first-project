const express = require('express');
const { signupGetController, createUser, userLogin, userIn, homeRoute, checkOtp, forgotPass, verifyMail, failOtp, sendOtp, getOtp, reSendOtp, resetPwd, reSet, contactControler, contactController, aboutController, signout } = require('../controllers/user-controller');
const { validationRules, checkValidation, verifyLogin, pwdValidation, resetPwdRules } = require('../middlewares/middlewares');
const { products, productDetails, p, addCart } = require('../controllers/product-controller');
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

app.get('/otpfail',verifyLogin,failOtp);

/*............................................Contact , About...............................................*/
app.get("/contact",verifyLogin,contactController)
app.get('/about',verifyLogin,aboutController)

/*.............................................Product display and details...............................................*/
app.get('/products',verifyLogin,products)
app.get('/productdetails/:id',verifyLogin,productDetails)

app.get('/addcart/:pid',addCart)
app.get('/cart',(req,res)=>{
    res.render('products/cart')
})
/*................................................signout....................................................*/
app.get('/signout',verifyLogin,signout)

module.exports = app;