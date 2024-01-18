const {check,validationResult} = require('express-validator');
const multer = require('multer')
const path = require('path')



const validationRules=[
    check('username').not().isEmpty().withMessage("Username is required").isLength({min:5}).withMessage('Username must be above 5 characters')
    .isAlpha().matches(/^[a-zA-Z0-9 ]+$/).withMessage("invalid value"),

    check('mobilenumber').not().isEmpty().withMessage("Mobile number is required").isLength({min:10,max:10}).withMessage('Mobile number must be 10 digits').isNumeric().withMessage("Invalid mobile number"),

    check('email').isEmail().withMessage('Invalid email'),
    check('password').not().isEmpty().withMessage("Password required").isLength({min:6}).withMessage("Password must be minumum 6 characters").
    custom(
        (value) => {
        // Check if the password contains at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          throw new Error('Password must contain at least one special character');
        }
        return true;
    }
    ),
    check('confirmpassword').not().isEmpty().withMessage("Confirm password required").
    custom((value,{req})=> {
        if(value != req.body.password){
            throw new Error('Passwords do not match')
        }
        return true;
    }
    )
    ]

const checkValidation =(req,res,next)=>{
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("user/signup",{err:error.mapped()})
    }
    else{
        next()
    }
}

const verifyLogin =(req,res,next)=>{
    if(req.session.email){
        next()
    }
    else{
        res.render("user/login")
    }
}

const verifyAdmin = (req,res,next) => {
    if(req.session.email){
        next()
    }
    else{
        res.render('admin/adlogin')
    }
}

/*.................reset password.........................*/
const resetPwdRules = [
    check('password').not().isEmpty().withMessage("Password required").isLength({min:6}).withMessage("Password must be minumum 6 characters").
    custom(
        (value) => {
        // Check if the password contains at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
          throw new Error('Password must contain at least one special character');
        }
        return true;
    }
    ),
    check('confirmpassword').not().isEmpty().withMessage("Confirm password required").
    custom((value,{req})=> {
        if(value != req.body.password){
            throw new Error('Passwords do not match')
        }
        return true;
    }
    )
] 

const pwdValidation = (req,res,next)=>{
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("user/resetpwd",{err:error.mapped()})
    }
    else{
        next()
    }
}

/*...........................................multer...................................................*/

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


/*..................................................category validation.......................................*/
const categoryRules = [ 
    check('category').not().isEmpty().withMessage("Category is required").isString().withMessage("Invalid value").isLength({min:3,max:15}),
    check('description').not().isEmpty().withMessage("Description is required").isString().withMessage("Invalid value")
]

const categValidation =(req,res,next)=>{
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("admin/addcategory",{err:error.mapped()})
    }
    else{
        next()
    }
}
const categoryValidation =(req,res,next)=>{
    // console.log('inside validation')
    // console.log(req.session.category)
    const data = req.session.category
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("admin/editcategory",{err:error.mapped(),data})
    }
    else{
        next()
    }
}


/*.........................................product validation..............................................*/
const productRules = [ 
    check('productname')
    .not().isEmpty().withMessage("Product is required"),
    check('description')
    .not().isEmpty().withMessage("Description is required"),
    check('price')
    .not().isEmpty().withMessage("Price is required")
    .isLength({min:3,max:7}).withMessage("Price should be in 3 digits to 7 digits").
    custom((value , {req})=> {
        const price = parseFloat(value);
        const discount = parseFloat(req.body.discount);

        if(value <= -1){
            throw new Error('Price should not be negative')
        }
       
        if(price < discount){
            throw new Error('Price should higher than discount')
        }
        return true;
    }),
    check('quantity')
    .not().isEmpty().withMessage('Quantity is required')
    .custom(value => value >= 0).withMessage('Quantity should not be negative'),
    check('status')
    .not().isEmpty().withMessage("Status is required")
    .isString().withMessage("Invalid value"),
    check('discount')
    .custom((value,{req})=>{
        if(value <=-1){
            throw new Error('Discount should not be negative')
        }
        return true;
    })
]

const proValidation = (req,res,next)=>{
    
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("admin/addproduct",{err:error.mapped()})
    }
    else{
        next()
    }
}
/*.................................edit validation.............................*/
const productValidation = (req,res,next)=>{
    //console.log('in validation')
    //console.log(req.session.details)
    const data = req.session.details
    let error= validationResult(req)
    console.log(error.mapped())
    if(!error.isEmpty()){
        res.render("admin/editproduct",{err:error.mapped(),data})
    }
    else{
        next()
    }
}

module.exports = {validationRules,
                checkValidation,
                verifyLogin,
                verifyAdmin,
                resetPwdRules,
                pwdValidation,
                upload,
                categoryRules,
                categValidation,
                categoryValidation,
                productRules,
                proValidation,
                productValidation
                }