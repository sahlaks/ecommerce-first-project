const bcrypt = require('bcrypt')

const Admin = require("../models/adminmodel")
const Product = require("../models/productmodel")
const User = require("../models/usermodel");
const Category = require('../models/categorymodel');


/*.............................................save admin data...............................................*/
async function saveUser(email, password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new Admin({
            email,
            password: hashedPassword
        });
        
            await newAdmin.save();
            console.log('User saved successfully.');

        
    } catch (error) {
        console.error('Error saving user:', error.message);
    }
} 
//saveUser('sahlaanasks@gmail.com','sahla@');



/*...........................................admin login...................................................*/
const adminLogin = (req,res) => {
    res.render('admin/adlogin')
}

const adLoginPost = async (req,res) => {
    const admin = await Admin.findOne({ email: req.body.email });
    if (admin) {
      bcrypt.compare(req.body.password, admin.password, (err,result)=>{
        if(result){ 
            req.session.email = req.body.email;
            res.redirect("/admin/dashboard")
        }else{
            res.render('admin/adlogin',{Error: 'Incorrect password.. Please try again'})
          }
        })
      
      } else {
        res.render('admin/adlogin',{Error: 'We cannot find an account!'});
      }
}


/*..................................................dashboard access...................................................*/
const getDashboard = (req,res) => {
    res.render('admin/dashboard')
}


const getProduct = async (req,res) => {
    const products = await Product.find().sort({_id: -1}).lean();
    res.render('admin/product',{products})
}


const getCategoryPage = async (req,res) => {
    const category = await Category.find().sort({_id:-1}).lean()
    res.render('admin/category',{category})
}


const getOrder = (req,res) => {
    res.render('admin/order')
}

/*.....................................................user control.........................................................*/
const getUsers = async (req,res) => {
    const users = await User.find().lean()
    res.render('admin/customers',{users})
}

const isBlocked = async (req,res) => {
    const userId = req.params.id
    const datas = await User.findOne({_id:userId})
    let val;
    if(datas.isblocked === true){
        val = false
    }else{
        val = true
    }

    const data = await User.findByIdAndUpdate({_id:userId},{$set: {isblocked:val}})
    res.redirect('/admin/customers')
}


/*...............................................logout......................................................*/
const logout = (req,res) =>{
        req.session.destroy();
        res.redirect('/admin')
}

module.exports = {adminLogin,
                adLoginPost,
                getDashboard,
                getProduct,
                getCategoryPage,
                getOrder,
                getUsers,
                isBlocked,
                logout
                }