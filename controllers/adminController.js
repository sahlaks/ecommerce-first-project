const bcrypt = require('bcrypt')
const Admin = require("../models/adminModel")
const Product = require("../models/productModel")
const User = require("../models/userModel");
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');


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
 
const adLoginPost = async (req,res,next) => {
  try{
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
    }catch(error){
      console.error(error);
      const err = new Error();
      err.statusCode = 404;
      next(err);
    }
}


/*..................................................dashboard access...................................................*/
const getDashboard = async (req,res,next) => {
    try{
        const category = await Category.find().lean()
        const categories = JSON.stringify(category)
       
        Order.updateMany({}, [
            {
              $set: {
                date: {
                  $toDate: '$date' // Convert the date string to a Date object
                }
              }
            }
          ])
            .then(result => {
              console.log(`${result.modifiedCount} document(s) updated successfully.`);
            })
            .catch(error => {
              console.error(error);
            });

        const result = await Order.aggregate([
        {
          $group: {
            _id: '$category', 
            quantity: { $sum: '$quantity' },
          },
        },
        {
          $project: {
            _id: 0, 
            category: '$_id',
            quantity: 1,
          },
        },
      ]);
        
        const data = await Order.aggregate([
            {
              $group: {
                _id: '$date',
                totalSales: { $sum: '$total' },
              }
            },
            {
              $sort: { _id: 1 }
            }
          ]);
          //console.log(data)
          const formattedSalesData = data.map(item => ({
            _id: new Date(item._id).toLocaleDateString(),
            totalSales: item.totalSales
          }));
          //console.log(formattedSalesData)
          const weeklySales = await Order.aggregate([
            {
              $match: {
                date: {
                  $gte: new Date(new Date() - 7 * 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $group: {
                _id: {
                  week: { $isoWeek: "$date" },
                  year: { $isoWeekYear: "$date" }
                },
                totalSales: { $sum: "$total" }
              }
            },
            {
              $project: {
                _id: 0,
                week: "$_id.week",
                year: "$_id.year",
                totalSales: 1
              }
            }
          ]);
          
          const monthlySales = await Order.aggregate([
            {
              $group: {
                _id: { $month: '$date' },
                totalSales: { $sum: '$total' }
              }
            },
            {
              $project: {
                _id: 0,
                month: {
                  $switch: {
                    branches: [
                      { case: { $eq: ['$_id', 1] }, then: 'January' },
                      { case: { $eq: ['$_id', 2] }, then: 'February' },
                      { case: { $eq: ['$_id', 3] }, then: 'March' },
                      { case: { $eq: ['$_id', 4] }, then: 'April' },
                      { case: { $eq: ['$_id', 5] }, then: 'May' },
                      { case: { $eq: ['$_id', 6] }, then: 'June' },
                      { case: { $eq: ['$_id', 7] }, then: 'July' },
                      { case: { $eq: ['$_id', 8] }, then: 'August' },
                      { case: { $eq: ['$_id', 9] }, then: 'September' },
                      { case: { $eq: ['$_id', 10] }, then: 'October' },
                      { case: { $eq: ['$_id', 11] }, then: 'November' },
                      { case: { $eq: ['$_id', 12] }, then: 'December' }
                    ],
                    default: 'Invalid Month'
                  }
                },
                totalSales: 1
              }
            }

          ]);
          const yearlySales = await Order.aggregate([
            {
              $group: {
                _id: { $year: '$date' },
                totalSales: { $sum: '$total' }
              }
            },
            {
              $project: {
                _id: 0,
                year: '$_id',
                totalSales: 1
              }
            }
          ]);

          const totalSales = await Order.aggregate([
            {
              $match:{
                status: {$ne: 'Cancelled'},
                status: {$ne: 'Returned' }
              }
            },
            {
              $group: {
                _id: null,
                totalSales: { $sum: '$quantity' }
              }
            }
          ]);

        const totalRevenue = await Order.aggregate([
          { $match: {
            payment: 'Success', 
            status: { $ne: 'Cancelled' } 
          }
          },  
          {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$total' }
              }
            }
          ]);

        const getTopProducts = await Order.aggregate([
          {
            $group: {
              _id: '$proId',
              productName: {$first: '$productname'},
              totalQuantity: {$sum: '$quantity'},
            }
          },
          {
            $sort: {totalQuantity: -1},
          },
          {
            $limit: 10
          }
        ]);
        const user = await User.countDocuments()
        res.render('admin/dashboard',{data: JSON.stringify(result),
                                sales: JSON.stringify(totalSales),
                                revenue: JSON.stringify(totalRevenue),
                                dailySales: JSON.stringify(formattedSalesData),
                                top10: JSON.stringify(getTopProducts),
                                weeklySales: JSON.stringify(weeklySales),
                                monthlySales: JSON.stringify(monthlySales),
                                yearlySales: JSON.stringify(yearlySales),
                                count:JSON.stringify(user),
                                result,})
    }catch(error){ 
      console.error(error);
      const err = new Error('Internal server error');
      err.statusCode = 500;
      next(err);
    }
}

const getDailySales = async (req,res,next) => {
  try {
    const date = req.query.date;
    const selectedDate = new Date(date);

    const nextDate = new Date(date);
    nextDate.setDate(selectedDate.getDate() + 1);
    const data = await Order.aggregate([
      {
        $match: {
          date: {
            $gte: selectedDate,
            $lt: nextDate,
          },
        },
      },
      {
        $group: {
          _id: '$date',
          totalSales: { $sum: '$total' },
        },
      },
    ]);

    const formattedSalesData = data.map(item => ({
      _id: new Date(item._id).toLocaleDateString(),
      totalSales: item.totalSales
    }));
    res.json(formattedSalesData)
  }catch(error){
    console.error(error);
    const err = new Error('Internal server error');
    err.statusCode = 500;
    next(err);
  }
}



/*.................................................product page...........................................*/
const getProduct = async (req,res,next) => {
    try{
        var search = '';
        if(req.query.search){
                search = req.query.search;
        }
        var page = 1;
        if(req.query.page){
                page = req.query.page;
        }
        const limit = 6;
        const products = await Product.find({
            list:true,
            $or:[
                {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                {category : {$regex: '.*'+search+'.*',$options:'i'} },
            ]
        })
        .limit( limit * 1 )
        .skip( (page - 1) * limit )
        .lean()

        const count = await Product.find({
            list:true,
            $or:[
                {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                {category : {$regex: '.*'+search+'.*',$options:'i'} },
            ]
        }).countDocuments();

        const totalPages = Math.ceil(count/limit);
        const currentPage = page;

        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
}
    const unlist = await Product.find({list:false}).lean();

    res.render('admin/product',{products,unlist,
                                                totalPages,
                                                currentPage,
                                                pages,})
    }catch(error){
      console.error(error);
      const err = new Error();
      err.statusCode = 500;
      next(err);
    }
}

                                    /*.........list or unlist........*/
const listProduct = async (req,res,next) => {
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

    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}


/*...............................................category page..............................................*/
const getCategoryPage = async (req,res,next) => {
    try{
      var page = 1;
      if(req.query.page){
              page = req.query.page;
      }
      const limit = 6;
        const category = await Category.find()
                        .limit( limit * 1 )
                        .skip( (page - 1) * limit )
                        .sort({_id:-1})
                        .lean()
        const count = await Category.find().countDocuments();
        const totalPages = Math.ceil(count/limit);
        const currentPage = page;

        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
                      }

        res.render('admin/category',{category,totalPages,currentPage,pages})

    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

/*................................................order page.................................................*/
const getOrder = async (req,res,next) => {
    try{

      var search = '';
      if(req.query.search){
              search = req.query.search;
      }
      var page = 1;
      if(req.query.page){
              page = req.query.page;
      }
      const limit = 30;

        const orders = await Order.find({
          $or:[
            {paymentoption: {$regex:'.*'+search+'.*',$options:'i'} },
            {status : {$regex: '.*'+search+'.*',$options:'i'} },
        ]})
        .limit( limit * 1 )
        .skip( (page - 1) * limit )
        .sort({_id:-1})
        .lean()

        const count = await Product.find({
          $or:[
              {paymentoption: {$regex:'.*'+search+'.*',$options:'i'} },
              {status : {$regex: '.*'+search+'.*',$options:'i'} },
          ]
      }).countDocuments();

      const totalPages = Math.ceil(count/limit);
        const currentPage = page;

        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
                      }

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
                appliedCoupons: order.appliedCoupons,
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
        res.render('admin/order',{combinedOrders,totalPages,currentPage,pages})
    }catch(error){
      console.error(error);
      const err =  new Error('Internal server error');
      err.statusCode = 500;
      next(err);
    }
}


/*...............................................delete order....................................................*/
const deleteOrder = async (req,res,next) => {
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
    }catch(error){
      console.error(error);
      const err = new Error('Internal server error');
      err.statusCode = 500;
      next(err);
    }
}

/*..................................................edit order..........................................................*/
const editOrder = async (req,res,next) => {
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
                appliedCoupons: order.appliedCoupons,
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

    }catch(error){
        console.error(error);
        const err =  new Error();
        err.statusCode = 404;
        next(err);
    }
}
                                  /*.......set status........*/
const setStatus = async (req,res,next) => {  
    try{
        const status = req.query.status;
        const id = req.query.id;
        
        const order = await Order.updateMany({cartid:id},{$set:{status:status}})
        res.redirect('/admin/order')
    }catch(error){
      console.error(error);
      const err = new Error();
      err.statusCode = 404;
      next(err);
    }
}

/*.....................................................user control.........................................................*/
const getUsers = async (req,res,next) => {
    try{
      var page = 1;

      if(req.query.page){
          page = req.query.page;
      }
      const limit = 6;

        const users = await User.find()
                      .limit(limit * 1)
                      .skip( (page - 1) * limit)
                      .lean()
        const count = await User.find().countDocuments();
        const totalPages = Math.ceil(count/limit);
        const currentPage = page;
        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
                      }           
        res.render('admin/customers',{users,totalPages,currentPage,pages})

    }catch(error){
      console.error(error);
      const err = new Error();
      err.statusCode = 500;
      next(err);
    }
}

const isBlocked = async (req,res,next) => {
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
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
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
                getDailySales,
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