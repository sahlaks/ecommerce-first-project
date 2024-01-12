const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const User = require("../models/usermodel")


/*...........................................setup nodemailer..................................................*/
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: 'sahlaanasks@gmail.com',		
           pass: 'tbqo rpny amgh pxhs'				
       }
   });



/*.............................................user sign in.................................................................*/
const userLogin = (req,res) => {
    res.render('user/login')
}

const userIn = async (req,res) => {

    //console.log(req.body)
    const user = await User.findOne({ email: req.body.email });
        if (user) {
          bcrypt.compare(req.body.password, user.password, (err,result)=>{
            if(result){ 
                
                req.session.email = req.body.email;
                req.session.username = user.username;
                res.redirect("home")
            }else{
              res.render('user/login',{Error: 'Incorrect password.. Please try again'})
            }
          })
        
        } else {
          res.render('user/login',{Error: 'We cannot find an account!'});
        }
}






/*...............................................home page.....................................................................*/
const homeRoute = (req,res) => {
    res.render('user/home')
}


/*................................................user signup.............................................................................*/
const signupGetController = (req, res) => {
    res.render('user/signup');
}

//.....post method.........................

const createUser = async (req,res) => {
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
}





/*.................................................send and resend otp...........................................................................*/
const sendOtp = (req,res) => {
   
    let OTP = Math.floor(Math.random() * 900000) + 100000;
        req.session.otp = OTP;
        console.log(req.session.otp)

        var emails = "sahlaanasks@gmail.com"
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

const checkOtp = async (req,res) => {
    
    if(req.session.otp == req.body.otp){
        if(req.session.forgotpwd == true){
            //res.send('success')
            res.redirect('resetpwd')
        }
            else{

                const user = await User.create(req.session.data)
                res.redirect('home');
            }
        }   
        else{
            res.render('user/otpfail')
        }


}


/*................................................reset password...................................................*/
const resetPwd = (req,res) =>{
    res.render('user/resetpwd')
}

const reSet = async (req,res) => {
    const hashPassword = await bcrypt.hash(req.body.password,10)
    req.body.password = hashPassword;
    
    res.redirect('home')
}

/*.....................................................OTP failure.....................................................................*/
const failOtp = (req,res) => {
    res.render('user/otpfail')
}


/*....................................................forgot password..................................................................*/
const forgotPass = (req,res) => {
    res.render('user/forgotpwd')
}

const verifyMail =async (req,res) => {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
        req.session.email = req.body.email;
        req.session.forgotpwd = true;
        res.redirect('sendOtp')
    }
        else{
            res.render('user/forgotpwd',{Error:'Has your email address changed? Email not found'})
        }
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
                reSet
            }