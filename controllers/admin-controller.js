const bcrypt = require('bcrypt')

const Admin = require("../models/adminmodel")
const Product = require("../models/productmodel")
const User = require("../models/usermodel");
const Category = require('../models/categorymodel');
const Order = require('../models/ordermodel');


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

/*.................................................product page...........................................*/
const getProduct = async (req,res) => {
    try{
         
    const products = await Product.find({list:true}).lean();
    const unlist = await Product.find({list:false}).lean();

   // console.log(products)
    res.render('admin/product',{products,unlist})
    }catch(err){
        throw new Error(err.message)
    }
}

                                    /*.........list or unlist........*/
const listProduct = async (req,res) => {
    try{

    const id = req.params.id;
    const item = await Product.findOne({_id:id})
    let result;
    if(item.list === true){
        result = false;
    }else{
        result = true;
    }
    
    
    const data = await Product.findByIdAndUpdate({_id:id},{$set: {list:result}})
    res.redirect('/admin/product')

    }catch(err){
        throw new Error(err.message)
    }
}


/*...............................................category page..............................................*/
const getCategoryPage = async (req,res) => {
    try{
        const category = await Category.find().sort({_id:-1}).lean()
        res.render('admin/category',{category})

    }catch(err){
        throw new Error(err.message)
    }
}

/*................................................order page.................................................*/
const getOrder = async (req,res) => {
    try{
        const orders = await Order.find().sort({_id:-1}).lean()
        const groupedOrders = new Map();

        orders.forEach((order) => {
        const key = `${order.userId}_${order.cartid}`;
        if (!groupedOrders.has(key)) {
            groupedOrders.set(key, {
                userId: order.userId,
                fname: order.fname,
                sname: order.sname,
                address: order.address,
                locality: order.locality,
                district: order.district,
                pincode: order.pincode,
                mobilenumber: order.mobilenumber,
                email: order.email,
                paymentoption: order.paymentoption,
                cartid: order.cartid,
                status: order.status,
                date: order.date,
                
                subtotal: order.subtotal,
                discount: order.discount,
                total: order.total,
                products: [],
            });
        }
    
        const groupedOrder = groupedOrders.get(key);
        groupedOrder.products.push({
            proId: order.proId,
            productname: order.productname,
            price: order.price,
            category: order.category,
            image: order.image,
            quantity: order.quantity,
        });
    });
    const combinedOrders = Array.from(groupedOrders.values());
        res.render('admin/order',{combinedOrders})
    }catch(err){
        throw new Error(err.message)
    }
}


/*...............................................delete order....................................................*/
const deleteOrder = async (req,res) => {
    const orderId = req.params.oid;
    try{
        const deleteOrder = await Order.deleteOne({cartid:orderId})
        if(deleteOrder){
            const order = await Order.find().lean()
            res.redirect('/admin/order')
        }
        else{
            res.render("admin/order",{Error: 'Order not found!'})
        }
    }catch(err){
        throw new Error(err.message)
    }
}

/*..................................................edit order..........................................................*/
const editOrder = async (req,res) => {
    const orderId = req.params.oid;
    try{
        const orders = await Order.find({cartid:orderId}).lean()
        console.log(orders)
        const groupedOrders = new Map();

        orders.forEach((order) => {
        const key = `${order.userId}_${order.cartid}`;
        if (!groupedOrders.has(key)) {
            groupedOrders.set(key, {
                userId: order.userId,
                fname: order.fname,
                sname: order.sname,
                address: order.address,
                locality: order.locality,
                district: order.district,
                pincode: order.pincode,
                mobilenumber: order.mobilenumber,
                email: order.email,
                paymentoption: order.paymentoption,
                cartid: order.cartid,
                status: order.status,
                date: order.date,
                
                subtotal: order.subtotal,
                discount: order.discount,
                total: order.total,
                products: [],
            });
        }
    
        const groupedOrder = groupedOrders.get(key);
        groupedOrder.products.push({
            proId: order.proId,
            productname: order.productname,
            price: order.price,
            category: order.category,
            image: order.image,
            quantity: order.quantity,
            subtotalprod: order.subtotalprod,
        });
    });
    const combinedOrders = Array.from(groupedOrders.values());    

        res.render('admin/editorder',{combinedOrders,orderId})

    }catch(err){
        throw new Error(err.message)
    }
}

const setStatus = async (req,res) => {  
    console.log('setstatus function called..') 
    try{
        const status = req.query.status;
        const id = req.query.id;
        
        const order = await Order.updateMany({cartid:id},{$set:{status:status}})
        res.redirect('/admin/order')
    }catch(err){
        throw new Error(err.message)
    }
}

/*.....................................................user control.........................................................*/
const getUsers = async (req,res) => {
    try{
        const users = await User.find().lean()
        res.render('admin/customers',{users})

    }catch(err){
        throw new Error(err.message)
    }
}

const isBlocked = async (req,res) => {
    try{
    const userId = req.params.id
    const datas = await User.findOne({_id:userId})
    let value;
    if(datas.isblocked === true){
        value = false
    }else{
        value = true
    }

    const data = await User.findByIdAndUpdate({_id:userId},{$set: {isblocked:value}})
    res.redirect('/admin/customers')
    }catch(err){
        throw new Error(err.message)
    }

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
                listProduct,
                getCategoryPage,
                getOrder,
                deleteOrder,
                editOrder,
                setStatus,
                getUsers,
                isBlocked,
                logout
                }