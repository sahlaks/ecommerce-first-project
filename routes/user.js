const express = require('express');
const { signupGetController, createUser, userLogin, userIn, homeRoute, checkOtp, forgotPass, verifyMail, failOtp, sendOtp, getOtp, reSendOtp, resetPwd, reSet, contactController, aboutController, signout, profile, address, editProfile, addAddress, addaddress, deleteAddress, changepwd, editAddress, updateAddress, changepassword } = require('../controllers/userController');
const { validationRules, checkValidation, verifyLogin, pwdValidation, resetPwdRules, changepwdRules, changepwdValidation, addressValidation, addressRules, editaddressValidation, checkoutaddressValidation } = require('../middlewares/middlewares');
const { products, productDetails} = require('../controllers/productController');
const { addCart, wishlist, cart, wishlistView, deleteWishlist, deleteCart, checkout, updateCart, takeAddress, orderSuccess, checkoutForm, viewOrder, viewOrderList, cancelOrder, razorpayChecking, returnOrder, viewWallet, viewInvoice, razorpayCheck} = require('../controllers/cartController');
const { getCoupons, checkCoupon, applyCoupon } = require('../controllers/couponController');
const app = express.Router();



/*..............................................Login...............................................*/
app.get('/login',userLogin)
app.post('/login',userIn)


/*...........................................forgot password..............................................*/
app.get('/forgotpwd',forgotPass)
app.post('/forgotpwd',verifyMail)


/*...........................................reset password....................................................*/
app.get('/resetpwd',verifyLogin,resetPwd)
app.post('/resetpwd',verifyLogin,resetPwdRules,pwdValidation,reSet)


/*...........................................home page.................................................................*/
app.get('/home',verifyLogin,homeRoute)


/*.............................................signup..............................................................*/
app.get('/signup',signupGetController)
app.post('/signup',validationRules,checkValidation,createUser)


/*.............................................otp...................................................................*/
app.get('/sendOtp',verifyLogin,sendOtp)
app.post('/sendOtp',verifyLogin,reSendOtp)
                                            /*...resend otp...*/
app.get('/otpsend',getOtp)
app.post('/otpsend',checkOtp)
                                            /*...otp fail...*/
app.get('/otpfail',verifyLogin,failOtp);


/*............................................Contact , About...............................................*/
app.get("/contact",verifyLogin,contactController)
app.get('/about',verifyLogin,aboutController)


/*.............................................Product display and details...............................................*/
app.get('/products',verifyLogin,products)
app.get('/productdetails/:id',verifyLogin,productDetails)


/*.........................................Cart, Wishlist............................................................*/
app.post('/addcart/:pid',verifyLogin,addCart)
app.get('/cart',verifyLogin,cart)
app.get('/deleteCart/:productId',verifyLogin,deleteCart)  
app.get('/cartChangeQuantity',verifyLogin,updateCart)



app.post('/wishlist/:pid',verifyLogin,wishlist)
app.get('/wishlistview',verifyLogin,wishlistView)
app.get('/deleteWishlist/:pid',verifyLogin,deleteWishlist)


/*...................................................checkout....................................................*/
app.get('/checkout',verifyLogin,checkout)
app.get('/showaddress',verifyLogin,takeAddress)
app.post('/postcheckout',verifyLogin,addressRules,checkoutaddressValidation,checkoutForm)
app.post('/razorpay/callback',razorpayChecking);
app.post('/razpay/callback',razorpayCheck)
app.get('/vieworder',verifyLogin,viewOrder)
app.get('/editorder',verifyLogin,viewOrderList)
app.get('/cancelorder',verifyLogin,cancelOrder)
app.get('/returnorder',verifyLogin,returnOrder)
app.get('/wallet',verifyLogin,viewWallet)

/*................................................profile...........................................................*/
app.get('/profile',verifyLogin,profile)
app.post('/editprofile',verifyLogin,editProfile)


/*...............................................Coupons...........................................................*/
app.get('/getcoupon',verifyLogin,getCoupons)
app.get('/applyCoupon',verifyLogin,applyCoupon)
app.get('/invoice',viewInvoice)

/*................................................address..........................................................*/
app.get('/address',verifyLogin,address)
app.get('/addaddress',verifyLogin,addaddress)
app.post('/addaddress',verifyLogin,addressRules,addressValidation,addAddress)
app.get('/editaddress',verifyLogin,editAddress)
app.post('/editaddress/:id',verifyLogin,addressRules,editaddressValidation,updateAddress)
app.get('/deleteaddress/:id',verifyLogin,deleteAddress)


/*........................................change password....................................................*/
app.get('/changepwd',verifyLogin,changepwd)
app.post('/changepassword',verifyLogin,changepwdRules,changepwdValidation,changepassword)


/*................................................signout....................................................*/
app.get('/signout',verifyLogin,signout)

module.exports = app;