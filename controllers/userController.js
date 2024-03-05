const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const User = require("../models/userModel");
const Product = require('../models/productModel');
const Cart = require("../models/cartModel");
const Wishlist = require('../models/wishlistModel');
const Address = require('../models/addressModel');
const Banner = require('../models/bannerModel')


/*...........................................setup nodemailer..................................................*/
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,			
       }
   });



/*.............................................user sign in.................................................................*/
const userLogin = (req,res) => {
    res.render('user/login')
}

const userIn = async (req,res,next) => {
    try{
    const user = await User.findOne({ email: req.body.email });
        if (user) {
          bcrypt.compare(req.body.password, user.password, (err,result)=>{
            if(result){ 
                if(user.isblocked){
                    res.render('user/login',{Error: 'Sorry.. You cannot access the page!'})
                }else{
                req.session.email = req.body.email;
                req.session.username = user.username;
                req.session.uid = user._id;
                res.redirect("home")
                }
            }else{
              res.render('user/login',{Error: 'Incorrect password.. Please try again'})
            }
          })
        
        } else {
          res.render('user/login',{Error: 'We cannot find an account!'});
        }
    }catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 404
        next(err);
    }
}

/*...............................................home page.....................................................................*/
const homeRoute = async (req,res,next) => {
    try{
    const userId = req.session.uid;
    const products = await Product.find().limit(6).lean()
    const newarrival = await Product.find().sort({_id:-1}).limit(3).lean()
    const user = await Cart.findOne({userId:userId})
    const user1 = await Wishlist.findOne({userId:userId})
    const banner = await Banner.findOne({}).lean()
    if(user){
        var cart = user.products.length;
        if(!cart){
            cart = 0;
        }
    }
    if(user1){
        var list =user1.products.length
    }
    req.session.cartCount = cart;
    req.session.listCount = list;
    var count=req.session.cartCount;
    var list=req.session.listCount;
    res.render('user/home',{user:true,products,newarrival,cart,list,banner})

    }catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 404
        next(err);
    }
}


/*................................................user signup.............................................................................*/
const signupGetController = (req, res) => {
    res.render('user/signup');
}

//.....post method.........................

const createUser = async (req,res,next) => {
try{
const hashPassword = await bcrypt.hash(req.body.password,10)
req.body.password = hashPassword;
const email = await User.findOne({email:req.body.email})
if(email){
    res.render('user/signup',{Error:'User already exist..'})
}
    else{
        
        req.session.username = req.body.username
        req.session.email = req.body.email;
        req.session.data = req.body
        res.redirect('sendOtp')

}
}catch(error){
    console.error(error)
    const err = new Error();
    err.statusCode = 404
    next(err);
}
}

/*.................................................send and resend otp...........................................................................*/
const sendOtp = (req,res) => {
   
    let OTP = Math.floor(Math.random() * 900000) + 100000;
        req.session.otp = OTP;
        console.log(req.session.otp)

        var emails = req.session.email
        sendMail(emails,`${OTP}`);

           function sendMail(emails ,otp){
            var details = {
                from: 'sahlaanask@gmail.com', // sender address same as above
                to: emails, 					// Receiver's email id
                subject: 'Mail from Node-js', // Subject of the mail.
                text: `Your OTP is ${otp}`				// Sending OTP 
            };
            transporter.sendMail(details, (error, data) => {
                if(error)
                    console.log(error)
                else
                    console.log(data);
                });
            }
        res.render('user/otpsend')
    }

const reSendOtp = (req,res) => {
    res.redirect('sendOtp')
}


/*...............................................email verification with otp...............................................................................*/
const getOtp = (req,res) => {
    res.render('user/otpsend')
}

const checkOtp = async (req,res,next) => {
try{
    if(req.session.otp == req.body.otp){
        if(req.session.forgotpwd == true){
            //res.send('success')
            res.redirect('resetpwd')
        }
            else{

                const user = await User.create(req.session.data)
                console.log(user)
                req.session.uid = user._id;
                res.redirect('home');
            }
        }   
        else{
            res.render('user/otpfail')
        }
}catch(error){
    console.error(error);
    const err = new Error();
    err.statusCode = 500;
    next(err);
}
}


/*................................................reset password...................................................*/
const resetPwd = (req,res) =>{
    res.render('user/resetpwd')
}

const reSet = async (req,res,next) => {
    try{
    const hashPassword = await bcrypt.hash(req.body.password,10)
    req.body.password = hashPassword;
    const val = await User.updateOne({email:req.session.email},{$set: {password:req.body.password}})
    
    res.redirect('home')
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

/*.....................................................OTP failure.....................................................................*/
const failOtp = (req,res) => {
    res.render('user/otpfail')
}


/*....................................................forgot password..................................................................*/
const forgotPass = (req,res) => {
    res.render('user/forgotpwd')
}

const verifyMail =async (req,res,next) => {
    try{
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        if(user.isblocked){
            res.render('user/forgotpwd',{Error: 'Sorry.. You cannot access the page!'})
        }else{
        req.session.email = req.body.email;
        req.session.forgotpwd = true;
        res.redirect('sendOtp')
        }
    }
        else{
            res.render('user/forgotpwd',{Error:'Has your email address changed? Email not found'})
        }
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

/*...................................................contact controller................................................................*/
const contactController = async(req,res)=>{
    res.render('user/contact',{user:true})
}

const aboutController = async(req,res) => {
    res.render('user/about',{user:true})
}

/*..................................................Profile......................................................*/
const profile = async (req,res,next) =>{
    try{
        const userId = req.session.uid;
        const user1 = await User.findOne({_id:userId}).lean()

        if (!user1) {
            const err = new Error();
            err.statusCode = 404;
            next(err);
            return;
        }
        res.render('user/profile',{user:true,user1})
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}
                                    /*....edit profile.....*/
const editProfile = async (req,res,next) => {
    const userId = req.session.uid;
    try{
        const data = await User.findByIdAndUpdate({_id:userId},
                                                    {$set: {username:req.body.username,
                                                            email:req.body.email,
                                                            mobilenumber:req.body.mobilenumber}})
        if (!data) {
            const err = new Error('User not found');
            err.statusCode = 404;
            next(err);
            return;
        }

        res.redirect('/profile')

    }catch(error){
        console.error(error)
        const err = new Error('Internal server error');
        err.statusCode = 500;
        next(err);
    }

}


/*......................................................address..........................................................*/
const address = async (req,res,next) => {
    try{
        const userId = req.session.uid;
        const Error = req.query.error
        const address = await Address.findOne({userId : userId}).lean()
        res.render('user/address',{user:true,address,Error})
    }catch(error){
        console.error(error)
        const err = new Error('Internal server error');
        err.statusCode = 500;
        next(err);
    }
}
                                    /*.......show address........*/
const addaddress = async (req,res,next) => {
    const userId = req.session.uid;
    try{
    const user1 = await User.findOne({_id : userId}).lean()
    res.render('user/addaddress',{user:true,user1})
    }catch(error){
    console.error(error)
    const err = new Error('Internal server error');
    err.statusCode = 500;
    next(err);
}
}
                                    /*.......add address........*/
const addAddress = async (req, res, next) => {
    const userId = req.session.uid;
    const body = req.body;
    try {
        const existingAddress = await Address.findOne({
                                userId,
                                addresses: { $elemMatch: { type: body.type } }
                                });
                                    
        if (existingAddress) {
            return res.redirect('/address?error=Address+already+exists');
            }
                                                                  
        const user1 = await Address.findOne({ userId });
        if (user1) {
            user1.addresses.push(body);
            await user1.save();
            } else {
                const data = {
                userId,
                addresses: [body]
                };
                await Address.create(data);
                }
        res.redirect('/address');
    } catch (error) {
        console.error(error)
        const err = new Error('Internal server error');
        err.statusCode = 500;
        next(err);
        }
    }

                                /*........edit address........*/
const editAddress = async (req,res,next) => {
    const userId = req.session.uid;
    const Id = req.query.id;
    const type = req.query.type
    req.session.type = type;
   
    try{
        const user = await Address.findOne({userId}).lean()
        if(user){
        const data = user.addresses.find(p => p._id == Id)
        if(!data){
            const err = new Error('Address not found');
            err.statusCode = 404;
            next(err);
            return;
        }
        req.session.address = data
        res.render('user/editaddress',{user:true,data,type})
        }else{
            const err = new Error('User not found');
            err.statusCode = 404;
            next(err);
            return;
        }
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}
                                    /*....update address....*/
const updateAddress = async (req,res,next) => {
    try{
        const userId = req.session.uid;
        const type = req.session.type;
        const user = await Address.findOne({userId}).lean()
        if(user){
        const data = await Address.findOneAndUpdate({userId,'addresses.type':type},
                                        {$set: {
                                        'addresses.$.fname': req.body.fname,
                                        'addresses.$.sname': req.body.sname,
                                        'addresses.$.pincode': req.body.pincode,
                                        'addresses.$.locality': req.body.locality,
                                        'addresses.$.address': req.body.address,
                                        'addresses.$.district': req.body.district,
                                        'addresses.$.state': req.body.state,
                                        'addresses.$.landmark': req.body.landmark,
                                        'addresses.$.phone': req.body.phone,
                                        'addresses.$.email': req.body.email,
                                        'addresses.$.mobilenumber': req.body.mobilenumber,
                                        'addresses.$.type': type,
                                        }})
        }
        res.redirect('/address')
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
    
}
                                    /*......delete address......*/
const deleteAddress = async (req,res,next) =>{
    const userId = req.session.uid;
    const Id = req.params.id;
    
    try {
      const user = await Address.findOne({userId});
      const exist = user.addresses.find(p => p._id == Id)
      if(exist){
          user.addresses.pull(exist)
      }
      await user.save();
      const address = await Address.findOne({userId});
      if(user.addresses.length == 0){
            const user1 = await Address.deleteOne({userId})
      }
      res.redirect('/address')
    } catch (error) {
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
  }


/*....................................................change password....................................................*/
const changepwd = async (req,res) => {
    const Message = req.query.error
    res.render('user/changepwd',{user:true, Message})
}

const changepassword = async (req,res,next) => {
    try{
    const checkPassword = await bcrypt.hash(req.body.currentpassword,10)
    const user = await User.findOne({email:req.session.email})
    const passwordMatch = await bcrypt.compare(req.body.currentpassword, user.password);
    if(passwordMatch){
        const hashPassword = await bcrypt.hash(req.body.newpassword,10)
        const val = await User.updateOne({email:req.session.email},{$set: {password:hashPassword}})
    
        res.redirect('/changepwd?error=You+have+successfully+changed+the+password!')
    }else{
        res.redirect('/changepwd?error=You+have+entered+wrong+password!')
    }
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

/*........................................................signout...........................................*/
const signout = async (req,res) => {
    req.session.destroy();
        res.redirect('/login')
}



module.exports = {userLogin,
                userIn,
                signupGetController,
                createUser,
                homeRoute,
                getOtp,
                checkOtp,
                sendOtp,
                reSendOtp,
                forgotPass,
                verifyMail,
                failOtp,
                resetPwd,
                reSet,
                contactController,
                aboutController,
                profile,
                editProfile,
                address,
                addaddress,
                addAddress,
                editAddress,
                updateAddress,
                deleteAddress,
                changepwd,
                changepassword,
                signout
            }