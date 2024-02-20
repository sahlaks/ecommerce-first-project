const Product = require("../models/productModel")
const User = require("../models/userModel");
const Category = require('../models/categoryModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const Address = require('../models/addressModel');
const Wallet = require('../models/walletModel')
const { default: mongoose, SchemaType } = require("mongoose");
const Order = require("../models/orderModel");
const Razorpay = require('razorpay');
const Coupon = require("../models/couponModel");
var easyinvoice = require('easyinvoice');
var fs = require('fs');
require('dotenv').config();


/*.......razorpay.........*/
const raz = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})




/*.....................................................add to cart......................................*/
                                                /*....update database....*/
const addCart = async (req,res) => {
    try{
        const userId = req.session.uid;
        const pId = req.params.pid;

        const user = await Cart.findOne({userId})
        if(user){
            const existpro = user.products.find(p => p.proId == pId)
            if(existpro){
                existpro.quantity +=1;
            }
            else{
                user.products.push({proId:pId,quantity:1})
            }
            await user.save();
        }else{
            const cartData = {userId,
                            products:[{proId:pId,quantity:1}]
                             }
                
            const newCart = await Cart.create(cartData);
            }
        res.redirect('/cart')
           
    }catch(error){
        throw new Error(error.message)
    }
}
                                    /*.......view page of cart.......*/
const cart = async (req,res) => {
    try{
        const userId = req.session.uid;
        const cart = await Cart.findOne({userId})
        if(!cart || cart.products.length === 0){
            res.render('products/cartempty',{user:true})
        }
        else{

            console.log(cart._id)
            req.session.cartid = cart._id;

        const result = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
        ])
        const sum = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
          {
            $group: {
                _id: null,
                subtotal: { $sum: "$subtotal" },
                discount: { $sum: "$discountProduct" },
              },
          },
          {
            $project: {
                proId: 1,
                quantity: 1,
                product: 1,
                subtotal: 1,
                discount: 1,
                total: { $subtract: ["$subtotal" , "$discount"]}
           },
          }

        ])
       const { subtotal,discount,total } = sum[0]
        res.render('products/cart',{user:true, cartData: result, subtotal,discount,total})
    }
        }catch(err){
        throw new Error(err.message)
    }
}

/*.....................................update cart.........................................*/
const updateCart = async (req,res) => {
    const count = req.query.count;
    console.log(count)
    const pId = req.query.id;
    const userId = req.session.uid;
    try{
        
        const cart = await Cart.findOne({userId});
        const existpro = cart.products.find(p => p.proId == pId)
        if(existpro){
            if(count == -1 && existpro.quantity == 1){

            }
            else{
            await Cart.findOneAndUpdate(
                { userId, 'products.proId': pId },
                { $inc: { 'products.$.quantity': count } }
            );
            }
        }
        res.redirect('/cart')
    }catch(err){
        throw new Error(err.message)
    }
}
                                            /*...delete cart...*/
const deleteCart = async (req,res) => {
    const userId = req.session.uid;
    const pId = req.params.productId;
    try {
      const user = await Cart.findOne({userId});
      const existpro = user.products.find(p => p.proId == pId)
      if(existpro){
          user.products.pull(existpro)
      }
      await user.save();
      const cart = await Cart.findOne({userId});
      if(cart.products.length === 0){
            const user1 = await Cart.deleteOne({userId})
      }
      res.redirect('/cart')
    } catch (err) {
      throw new Error(err.message)
    }
  }



/*..................................................wish list..............................................*/
                                            /*...updating database...*/
const wishlist = async (req,res) => {
    try{
        let userId = req.session.uid
        let pid = req.params.pid
        const user = await Wishlist.findOne({userId})
        if(user){
            const existpro = user.products.find(p => p.pId === pid)
            if(existpro){
                user.products.pull(existpro)
            }
            else{
                user.products.push({pId:pid})
            }
            await user.save()
        }else{
            const wishlistData = {
                userId,
                products:[{pId:pid}]
            }
            const newWishlist = await Wishlist.create(wishlistData);
        }
        res.redirect('/products')
    }
    catch(err){
        throw new Error(err.message)
    }
}   

                                            /*.....view page.......*/
const wishlistView = async (req,res) => {
    try{
        const userId = req.session.uid;
        const result = await Wishlist.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    pId: "$products.pId",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {pId: {$toObjectId: "$pId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$pId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    pId: "$pId",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    pId: 1,
                    product: 1,
               },
          },

        ])
        res.render('products/wishlist',{user:true, wishlist: result})
        }catch(err){
        throw new Error(err.message)
    }
}
                                    /*....delete wishlist....*/
const deleteWishlist = async (req,res) => {
    try{
        let userId = req.session.uid
        let pid = req.params.pid
        const user = await Wishlist.findOne({userId})
        const existpro = user.products.find(p => p.pId === pid)
            if(existpro){
                user.products.pull(existpro)
            }
        await user.save();
        const wishlist = await Wishlist.findOne({userId});
            if(wishlist.products.length === 0){
                  const user1 = await Wishlist.deleteOne({userId})
            }
        res.redirect('/wishlistview')
        }
        catch(err){
            throw new Error(err.message)
        }
}

/*.................................................checkout....................................................*/
const checkout = async (req,res) => {
    try{
        const userId = req.session.uid;
        const error = req.query.error
        const result = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
        ])
          
      
        const sum = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
          {
            $group: {
                _id: null,
                subtotal: { $sum: "$subtotal" },
                discount: { $sum: "$discountProduct" },
              },
          },
          {
            $project: {
                proId: 1,
                quantity: 1,
                product: 1,
                subtotal: 1,
                discount: 1,
                total: { $subtract: ["$subtotal" , "$discount"]}
           },
          }

        ])
        const { subtotal,discount,total } = sum[0]
        const coupons = await Coupon.aggregate([{$match:{minAmount : {$lte: total}}},{
            $match:{'users':{
                $not:{
                    $elemMatch:{
                        $eq:req.session.uid
                    }
                }
            }}
        }])
       
        console.log(coupons)
        let user = await Address.findOne({userId})
       console.log('user address',user)
    if(user){
        const address = await Address.aggregate([
                                                {$match: {
                                                    userId:userId,
                                                    'addresses.type':'home'
                                                }},
                                                {
                                                    $unwind:'$addresses'
                                                },
                                                {
                                                    $match:{
                                                        'addresses.type':'home'
                                                    }
                                                }
                                                ])
        if (address.length > 0 && address[0].addresses) {
            var addr;
            addr = address[0].addresses;
            req.session.checkoutaddress = addr;
            res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr,coupons,error});
            }
        else {
            var addr = null;
            res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr,coupons,error});
            }
    }else{
        var addr = null;
        res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr,coupons,error});
    }
    }catch(err){
        throw new Error(err.message)
    }
}


/*...............................................selecting address.................................................*/
const takeAddress = async (req,res) => {
    let type = req.query.type;
    req.session.type = type;
    const userId = req.session.uid;
    console.log(userId)
    console.log(type)
    try{
    
        var result = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
        ])
        const sum = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
          {
            $group: {
                _id: null,
                subtotal: { $sum: "$subtotal" },
                discount: { $sum: "$discountProduct" },
              },
          },
          {
            $project: {
                proId: 1,
                quantity: 1,
                product: 1,
                subtotal: 1,
                discount: 1,
                total: { $subtract: ["$subtotal" , "$discount"]}
           },
          }

        ])
        const { subtotal,discount,total } = sum[0]
        //coupons
        const coupons = await Coupon.find({minAmount : {$lte: total}}).lean()
        let user = await Address.findOne({userId})
        if(user){
            const address = await Address.aggregate([
                {$match: {
                    userId:userId,
                    'addresses.type':type
                }},
                {
                    $unwind:'$addresses'
                },
                {
                    $match:{
                        'addresses.type':type
                    }
                }
                ])
                if(address.length > 0 ){
                var addr;
                addr = (address[0].addresses);
                res.render('products/checkout',{user:true,addr,cartData: result,subtotal,discount,total,coupons})
                }
                else{
                var addr = null;
                res.render('products/checkout',{user:true,type,addr, cartData: result, subtotal,discount,total,coupons})
                }
            }
            else{
                console.log('user not exist')
                res.render('products/checkout',{user:true,cartData: result,subtotal,discount,total,coupons})
            }
    }catch(err){    
        throw new Error(err.message)
    }
}

 

/*..........................................from checkout..................................................*/
const checkoutForm = async (req,res) => {
    const userId = req.session.uid;
    let typeaddr = req.session.type;
    const formData = req.body;
    const user = await Address.findOne({userId});
    if(user){
        const addr = await Address.findOne({userId, 'addresses.type' : typeaddr})
       // console.log(addr)
        if(!addr){
        user.addresses.push({
            fname: formData.fname,
            sname: formData.sname,
            address: formData.address,
            locality: formData.locality,
            district: formData.district,
            pincode: formData.pincode,
            mobilenumber: formData.mobilenumber,
            email: formData.email,
            type: typeaddr,
        });
        await user.save();
            }
    }else{
    const newAddress = new Address({
            userId:userId,
            addresses:[{
            fname:formData.fname,
            sname:formData.sname,
            address:formData.address,
            locality:formData.locality, 
            district:formData.district,
            pincode:formData.pincode,
            mobilenumber:formData.mobilenumber,
            email:formData.email,
            type:typeaddr,
            }]
        })
        await newAddress.save();
    }
    const selectedPaymentOption = formData.paymentOption;
    try{
        
        const result = await Cart.aggregate([
            { $match: { userId: userId } },
            {
              $unwind: '$products',
            },
            {
                $project: {
                    proId: "$products.proId",
                    quantity: "$products.quantity",
                }
            },
            {
                $lookup: {
                  from: 'products', 
                  let: {proId: {$toObjectId: "$proId"} },
                  pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
                  as: 'productDetails',
                },
              },
              {
                $project: {
                    proId: "$proId",
                    quantity: "$quantity",
                    product: { $arrayElemAt: ["$productDetails", 0] },
               },
          },
          {
               $project: {
                    proId: 1,
                    quantity: 1,
                    product: 1,
                    subtotal: { $multiply: ["$quantity", "$product.price"] },
                    discountProduct: { $multiply: ["$quantity", "$product.discount"] }
               },
          },
        ])
    const sum = await Cart.aggregate([
        { $match: { userId: userId } },
        {
          $unwind: '$products',
        },
        {
            $project: {
                proId: "$products.proId",
                quantity: "$products.quantity",
            }
        },
        {
            $lookup: {
              from: 'products', 
              let: {proId: {$toObjectId: "$proId"} },
              pipeline: [{$match: {$expr: {$eq: ["$_id", "$$proId"] } } } ],
              as: 'productDetails',
            },
          },
          {
            $project: {
                proId: "$proId",
                quantity: "$quantity",
                product: { $arrayElemAt: ["$productDetails", 0] },
           },
      },
      {
           $project: {
                proId: 1,
                quantity: 1,
                product: 1,
                subtotal: { $multiply: ["$quantity", "$product.price"] },
                discountProduct: { $multiply: ["$quantity", "$product.discount"] }
           },
      },
      {
        $group: {
            _id: null,
            subtotal: { $sum: "$subtotal" },
            discount: { $sum: "$discountProduct" },
          },
      },
      {
        $project: {
            proId: 1,
            quantity: 1,
            product: 1,
            subtotal: 1,
            discount: 1,
            total: { $subtract: ["$subtotal" , "$discount"]}
       },
      }
    ])
    const { subtotal,discount,total } = sum[0]
    const orderlists = result.map((item) => {
        return new Order({
            userId: userId,
            fname: formData.fname,
            sname: formData.sname,
            address: formData.address,
            locality: formData.locality,
            district: formData.district,
            pincode: formData.pincode,
            mobilenumber: formData.mobilenumber,
            email: formData.email,
            paymentoption: selectedPaymentOption,
            cartid:req.session.cartid,
                proId: item.proId,
                productname: item.product.productname,
                price:item.product.price,
                subtotalprod:item.subtotal,
                category:item.product.category,
                image:item.product.image,
            quantity:item.quantity,
            subtotal:subtotal,
            discount:discount,
            total:total,
        }) 
    })
    const newOrder = await Order.create(orderlists);

    if (total > 1000 && selectedPaymentOption === 'COD') {
        res.redirect('/checkout?error=COD+not+allowed+for+orders+above+1000')
        }
    else if (selectedPaymentOption === 'COD') {
        await Cart.deleteOne({_id:req.session.cartid})
        const data = await Order.find({cartid:req.session.cartid})
        await Order.updateMany({cartid:req.session.cartid},{$set : {payment:'Success'}})
        await Promise.all(
            data.map(async (order) => {
              try {
                const product = await Product.findOne({ _id: order.proId });
                if (product && product.quantity >= order.quantity) {
                    product.quantity -= order.quantity;
                    await product.save();
                } else {
                    console.error(`Insufficient quantity or product not found for proId: ${order.proId}`);
                }
            } catch (error) {
                console.error(`Error updating product quantity for proId ${order.proId}: ${error}`);
            }
            })
        )
       res.render('products/cod-success',{user:true,formData,subtotal,discount,total})
    }
    else if(selectedPaymentOption === 'Razorpay') {
        //var addr =  req.session.checkoutaddress;
        const razorpayOrder = await raz.orders.create({
            amount: total*100, //amount in paisa (100) 
            currency: 'INR',
            receipt: 'order_receipt_123',
          });
          console.log(razorpayOrder);
          req.session.razorid = razorpayOrder.id;
          req.session.razorpayOrder = razorpayOrder;
         // const razpayid = req.session.razorid;
       res.render('products/success',{keyId:process.env.RAZORPAY_KEY_ID,razorpayOrder,formData,subtotal,discount,total})
    }
    else if(selectedPaymentOption === 'Wallet'){
        const data = await Wallet.find({userId:req.session.uid})
        var totalAmount = data[0].total;
        if(total > totalAmount){
            res.redirect('/checkout?error=There+is+no+sufficient+amount+in+wallet!')
            }
        else{
            totalAmount -= total;
            await Cart.deleteOne({_id:req.session.cartid})
            req.session.walletAmount = totalAmount;
            await Wallet.updateMany({userId:req.session.uid},{$set: {total: totalAmount}})
            await Order.updateMany({cartid:req.session.cartid},{$set : {payment:'Success'}})
            res.render('products/wallet-success',{user:true})
            }
    }

    }catch(err){
        throw new Error(err.message)
    }
}

/*.............................................razorpay validate......................................*/
const razorpayChecking = async (req,res)=>{
    try{

    var crypto = require('crypto')
    var razorpaysecret = process.env.RAZORPAY_SECRET_KEY;
    var hmac = crypto.createHmac("sha256",razorpaysecret)
    hmac.update(req.session.razorid + "|" + req.body.razorpay_payment_id);
    hmac = hmac.digest("hex");
    
    if(hmac == req.body.razorpay_signature){
    
        console.log("payment successful");
        await Cart.deleteOne({_id:req.session.cartid})
        const data = await Order.find({cartid:req.session.cartid})
        await Order.updateMany({cartid:req.session.cartid},{$set : {payment:'Success'}})
        await Promise.all(
            data.map(async (order) => {
              try {
                const product = await Product.findOne({ _id: order.proId });
                if (product && product.quantity >= order.quantity) {
                    product.quantity -= order.quantity;
                    await product.save();
                } else {
                    console.error(`Insufficient quantity or product not found for proId: ${order.proId}`);
                }
            } catch (error) {
                console.error(`Error updating product quantity for proId ${order.proId}: ${error}`);
            }
            })
        )

        res.render('products/razorpaysuccess',{user:true})
    }else{
        await Order.deleteMany({cartid:req.session.cartid})
        console.log("payment not successfull")
        res.send('payment failed')
    }
}catch(error){
   // res.status(500).send('Something went wrong').json({err:error.message})
   res.status(500).json({
    success: false,
    message: 'Payment processing failed',
    error: error.message,
});
}

} 


/*.............................................view order............................................*/
const viewOrder = async (req,res) => {
    try{
        const user = req.session.uid;
        const orders = await Order.find({userId:user}).sort({_id:-1}).lean()
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

    // Convert the map values back to an array
    const combinedOrders = Array.from(groupedOrders.values());
    res.render('products/orderlist',{user:true,combinedOrders})
    }catch(err){
        throw new Error(err.message)
    }
}

/*......................................view order details and change status.......................................*/
const viewOrderList = async (req,res) => {
        const orderId = req.query.oid;
        const msg = req.query.message;
    try{
        const orders = await Order.find({cartid:orderId}).lean()
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
    console.log(combinedOrders)
    res.render('products/vieworder',{user:true,combinedOrders,orderId,msg})
    
    }catch(err){
        throw new Error(err.message)
    }
}

/*..............................................cancel order.....................................................*/
const cancelOrder = async (req,res) => {
    try{
        const orderid = req.query.oid;
        const order = await Order.updateMany({cartid: orderid},{$set:{status:'Cancelled'}});
        const data = await Order.find({cartid:orderid})
        await Promise.all(
            data.map(async (order) => {
              try {
                const product = await Product.findOne({ _id: order.proId });
                if (product) {
                    product.quantity += order.quantity;
                    await product.save();
                } else {
                    console.error(`product not found for proId: ${order.proId}`);
                }
            } catch (error) {
                console.error(`Error updating product quantity for proId ${order.proId}: ${error}`);
            }
            })
        )

        res.render('products/cancelorder',{user:true})
    }catch(err){
        throw new Error(err.message)
    }
}

/*.........................................return order and update wallet..................................................*/
const returnOrder = async (req,res) => {
    try{
        const orderid = req.query.oid;
        const order = await Order.updateMany({cartid: orderid},{$set:{status:'Returned'}});
        const user = await Order.findOne({cartid:orderid});
        
        const id = user.userId;
        var sum = user.total;
        var total = 0; 
        total += sum;
        const newWallet = new Wallet({
                userId:req.session.uid,
                amount:sum,
                orderId:orderid,
                total : 0,
            })
        
        await newWallet.save()

        const totalAmount = await Wallet.aggregate([
                {$match:{userId:id}},
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
            const result = totalAmount.length > 0 ? totalAmount[0].total : 0;    
            req.session.walletAmount = result;
            await Wallet.updateMany({userId:id},{$set:{total:result}})
        const data = await Order.find({cartid:orderid})
        await Promise.all(
            data.map(async (order) => {
              try {
                const product = await Product.findOne({ _id: order.proId });
                if (product) {
                    product.quantity += order.quantity;
                    await product.save();
                } else {
                    console.error(`product not found for proId: ${order.proId}`);
                }
            } catch (error) {
                console.error(`Error updating product quantity for proId ${order.proId}: ${error}`);
            }
            })
        )

        res.render('products/returnorder',{user:true,id})

    }catch(err){
        throw new Error(err.message)
    }
}

/*...................................................view wallet.........................................................................*/
const viewWallet = async (req,res) => {
    try{
        const user = req.session.uid;
        const details = await Wallet.find({userId:user}).sort({_id:1}).lean()
        var value = details.length > 0 ? details[0].total : 0;      
        res.render('user/wallet',{user:true,details,value})

    }catch(err){
        throw new Error(err.message);
    }
}
const viewInvoice = async (req,res) => {
    try{
        const cartId = req.query.cid;
        const orders = await Order.find({cartid:cartId}).lean()
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
        console.log(combinedOrders)
        const invoices = Array.from(groupedOrders.values());
        invoices.forEach((invoice) => {
            const products = invoice.products.map(product => ({
                "quantity": product.quantity,
                "description": product.productname,
                "tax-rate": 0,
                "price": product.price,
            }));
        var data = {
            
            "client": {
                "company": `${invoice.fname} ${invoice.sname}`,
                    "address": invoice.address,
                    "zip": invoice.pincode,
                    "city": invoice.locality,
                    "district": invoice.district,
                    "country": "India"
            },
        
            // sender details
            "sender": {
                "company": "Reflections",
                "address": "Street 123",
                "zip": "1234 AB",
                "city": "Bngalore",
                "country": "India"
            },
            "images": {
                logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",
            },
            "information": {
                // Invoice number
                "number": invoice.cartid,
                "date": invoice.date,
                "due-date": invoice.date,
            },
            "products": products,
            "bottomNotice": "Kindly pay your invoice within 15 days.",
            "settings": {
                "currency": "INR",
            },
            "translate": {},
            "customize": {},
        };
        easyinvoice.createInvoice(data, function (result) {
            //fs.writeFileSync("invoice.pdf", result.pdf, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');
            res.send(Buffer.from(result.pdf, 'base64'));
        });
    });
    }catch(err){
        throw new Error(err.message)
    }
}
module.exports = {
                addCart,
                cart,
                updateCart,
                deleteCart,
                wishlist,
                wishlistView,
                deleteWishlist,
                checkout,
                takeAddress,
                checkoutForm,
                viewOrder,
                viewOrderList,
                cancelOrder,
                razorpayChecking,
                returnOrder,
                viewWallet,
                viewInvoice
                }