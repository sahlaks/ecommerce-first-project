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
const { nextTick } = require("process");
require('dotenv').config();


/*.......razorpay.........*/
const raz = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
})




/*.....................................................add to cart......................................*/
                                                /*....update database....*/
const addCart = async (req,res,next) => {
    try{
        const userId = req.session.uid;
        const pId = req.params.pid;
        const product = await Product.findById({_id:pId})

        if (!product) {
            res.json({ added: false, message: 'Product not found.' });
            return;
        }
        if(product.quantity == 0){
            res.json({ added: false, message: 'Out of stock. Cannot add product to cart.' });
            return;
            //res.redirect('/products?msg=Out+of+stock.+Cannot+add+product+to+cart')
        }
        else{
        const user = await Cart.findOne({userId})
        if(user){
            const existpro = user.products.find(p => p.proId == pId)
            if(existpro){
                if (existpro.quantity >= product.quantity) {
                    res.json({ added: false, message: 'Out of stock. Cannot add product to cart.' });
                    return;
                }
                existpro.quantity +=1;
            }
            else{
                user.products.push({proId:pId,quantity:1})
            }
            await user.save();
            res.json({ added: true, message: 'Item added to cart.' });

        }else{
            const cartData = {userId,
                            products:[{proId:pId,quantity:1}]
                             }
                
            const newCart = await Cart.create(cartData);
            res.json({ added: true, message: 'Item added to cart.' });
            }
        //res.redirect('/cart')
        } 
    }catch(error){
        consolr.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}
                                    /*.......view page of cart.......*/
const cart = async (req,res,next) => {
    try{
        const Error = req.query.msg;
        const userId = req.session.uid;
        const cart = await Cart.findOne({userId})
        if(!cart || cart.products.length === 0){
            res.render('products/cartempty',{user:true})
        }
        else{

            //console.log(cart._id)
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
        res.render('products/cart',{user:true, cartData: result, subtotal,discount,total,Error})
    }
        }catch(error){
            console.error(error);
            const err = new Error();
            err.statusCode = 404;
            next(err);
    }
}

/*.....................................update cart.........................................*/
const updateCart = async (req,res,next) => {
    const count = req.query.count;
   // console.log(count)
    const pId = req.query.id;
    const userId = req.session.uid;
    try{
        
        const cart = await Cart.findOne({userId});
        const existpro = cart.products.find(p => p.proId == pId)
        if(existpro){
            const product = await Product.findById(pId);
            if(count == -1 && existpro.quantity == 1){

            }
            else{
            const updatedQuantity = existpro.quantity + parseInt(count);
            if (updatedQuantity <= product.quantity ) {
            await Cart.findOneAndUpdate(
                { userId, 'products.proId': pId },
                { $inc: { 'products.$.quantity': count } }
            );
           } else {
                res.status(400);
                res.redirect('/cart?msg=Insufficient+quantity+in+stock!');
              // return res.json({ message: 'Insufficient quantity in stock' });
            }
        }
        }
        res.redirect('/cart')
    }catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}
                                            /*...delete cart...*/
const deleteCart = async (req,res,next) => {
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
    } catch (error) {
        console.error(error)
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
  }



/*..................................................wish list..............................................*/
                                            /*...updating database...*/
const wishlist = async (req,res,next) => {
    try{
        let userId = req.session.uid
        let pid = req.params.pid
        const user = await Wishlist.findOne({userId})
        if(user){
            const existpro = user.products.find(p => p.pId === pid)
            if(existpro){
                user.products.pull(existpro)
                await user.save()
                res.json({ added:false })
            }
            else{
                user.products.push({pId:pid})
                await user.save()
                res.json({ added:true })
            }
            
        }else{
            const wishlistData = {
                userId,
                products:[{pId:pid}]
            }
            const newWishlist = await Wishlist.create(wishlistData);
            res.json({ added: true });
        }
        //res.redirect('/products')
    }
    catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}   

                                            /*.....view page.......*/
const wishlistView = async (req,res,next) => {
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
        }catch(error){
            console.error(error)
            const err = new Error()
            err.statusCode = 404
            next(err);
    }
}
                                    /*....delete wishlist....*/
const deleteWishlist = async (req,res,next) => {
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
        catch(error){
            console.error(error)
            const err = new Error()
            err.statusCode = 500
            next(err)
        }
}

/*.................................................checkout....................................................*/
const checkout = async (req,res,next) => {
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
       
        let user = await Address.findOne({userId})
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
    }catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}


/*...............................................selecting address.................................................*/
const takeAddress = async (req,res,next) => {
    let type = req.query.type;
    req.session.type = type;
    const userId = req.session.uid;
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
    }catch(error){   
        console.error(error) 
        const err = new Error()
        err.statusCode = 500
        next(err);
    }
}

 

/*..........................................from checkout..................................................*/
const checkoutForm = async (req,res,next) => {
    const userId = req.session.uid;
    let typeaddr = req.session.type;
    const formData = req.body;
    const user = await Address.findOne({userId});
    if(user){
        const addr = await Address.findOne({userId, 'addresses.type' : typeaddr})
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
    // const couponDiscount = formData.couponDiscount;
    // const couponId = formData.couponId;
    const appliedCoupons = JSON.parse(req.body.appliedCoupons);

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
            appliedCoupons: appliedCoupons,
        }) 
    })
    const couponDiscount = appliedCoupons.reduce((acc, coupon) => acc + coupon.discount, 0);
    orderlists.forEach((orderItem) => {
        orderItem.total -= couponDiscount;
    });
    
    const newOrder = await Order.create(orderlists);

    if (total > 1000 && selectedPaymentOption === 'COD') {
        await Order.deleteMany({ cartid: req.session.cartid });
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
        const razorpayOrder = await raz.orders.create({
            amount: total*100, //amount in paisa (100) 
            currency: 'INR',
            receipt: 'order_receipt_123',
          });
         // console.log(razorpayOrder);
          req.session.razorid = razorpayOrder.id;
          req.session.razorpayOrder = razorpayOrder;
         // const razpayid = req.session.razorid;
       res.render('products/success',{keyId:process.env.RAZORPAY_KEY_ID,razorpayOrder,formData,subtotal,discount,total})
    }

    else if(selectedPaymentOption === 'Wallet'){
        const data = await Wallet.find({userId:req.session.uid})
        if (data && data.length > 0) {
        var totalAmount = data[0].total || 0;
        
        if(total > totalAmount){
            await Order.deleteMany({ cartid: req.session.cartid });
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
        else{
            await Order.deleteMany({ cartid: req.session.cartid });
            res.redirect('/checkout?error=Wallet+is+empty!');
        }
    } 

    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

/*.............................................razorpay validate......................................*/
const razorpayChecking = async (req,res,next)=>{
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
       // res.send('payment failed')
       const err = new Error();
       err.statusCode = 500
       next(err)
       return;
    }
}catch(error){
   console.error(error);
   const err = new Error();
   err.statusCode = 500
   next(err);
}
}

/*.........................................pay from order list...........................................*/
const razorpayCheck = async (req,res,next)=>{
    try{
        const cartId = req.query.orderid;
        console.log(cartId);
    var crypto = require('crypto')
    var razorpaysecret = process.env.RAZORPAY_SECRET_KEY;
    var hmac = crypto.createHmac("sha256",razorpaysecret)
    hmac.update(req.session.razorid + "|" + req.body.razorpay_payment_id);
    hmac = hmac.digest("hex");
    
    if(hmac == req.body.razorpay_signature){
    
        console.log("payment successful");
        await Cart.deleteOne({_id:req.session.cartid})
        const data = await Order.find({cartid:cartId})
        await Order.updateMany({cartid:cartId},{$set : {payment:'Success'}})
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
        //await Order.deleteMany({cartid:cartId})
        console.log("payment not successfull")
       // res.send('payment failed')
       const err = new Error();
       err.statusCode = 500
       next(err)
       return;
    }
}catch(error){
   console.error(error);
   const err = new Error();
   err.statusCode = 500
   next(err);
}
}





/*.............................................view order............................................*/
const viewOrder = async (req,res,next) => {
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
            payment: order.payment,

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

    const formatOrderDate = (date) => date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });
    const combinedOrders = Array.from(groupedOrders.values()).map(order => {
        order.date = formatOrderDate(order.date);
        order.status = (order.payment === 'Failure') ? 'Pending' : order.status;
        order.payment = (order.paymentoption === 'COD') ? 'Pending' : order.payment;
        order.payment = (order.paymentoption === 'COD' && order.status === 'Delivered') ? 'Success' : order.payment;
        return order;
        });
    res.render('products/orderlist',{user:true,combinedOrders})
    }catch(error){
        console.error(error)
        const err = new Error()
        err.statusCode = 404
        next(err);
    }
}

/*......................................view order details and change status.......................................*/
const viewOrderList = async (req,res,next) => {
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
                payment: order.payment,

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
    const formatOrderDate = (date) => date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });

    const combinedOrders = Array.from(groupedOrders.values()).map(order => {
        order.date = formatOrderDate(order.date);
        order.status = (order.payment === 'Failure') ? 'Pending' : order.status;
        order.payment = (order.paymentoption === 'COD') ? 'Pending' : order.payment;
        order.payment = (order.paymentoption === 'COD' && order.status === 'Delivered') ? 'Success' : order.payment;
        return order;
    });
        
        const razorpayOrder = await raz.orders.create({
            amount: combinedOrders[0].total*100, 
            currency: 'INR',
            receipt: 'order_receipt_123',
          });
         
          const fname = combinedOrders[0].fname
          const email = combinedOrders[0].email
          req.session.razorid = razorpayOrder.id;
          req.session.razorpayOrder = razorpayOrder;
    res.render('products/vieworder',{user:true,combinedOrders,orderId,msg,keyId:process.env.RAZORPAY_KEY_ID,razorpayOrder,fname,email})
    
    }catch(error){
        console.error(error)
        const err = new Error()
        err.statusCode = 404
        next(err);
    }
}

/*..............................................cancel order.....................................................*/
const cancelOrder = async (req,res,next) => {
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
    }catch(error){
        console.error(error)
        const err = new Error()
        err.statusCode = 500
        next(err);
    }
}

/*.........................................return order and update wallet..................................................*/
const returnOrder = async (req,res,next) => {
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

    }catch(error){
        console.error(error)
        const err = new Error()
        err.statusCode = 500
        next(err);
    }
}

/*...................................................view wallet.........................................................................*/
const viewWallet = async (req,res,next) => {
    try{
        const user = req.session.uid;
        const details = await Wallet.find({userId:user}).sort({_id:1}).lean()
        if(!details){
            const err = new Error('Wallet not found');
            err.statusCode = 404;
            throw err;
        }
        var value = details.length > 0 ? details[0].total : 0;      
        res.render('user/wallet',{user:true,details,value})

    }catch(error){
        console.error(error)
        const err = new Error();
        err.statusCode = 500
        next(err);
    }
}

/*...............................................view invoice....................................................*/
const viewInvoice = async (req,res) => {
    try{
        const cartId = req.query.cid;
        const orders = await Order.find({cartid:cartId}).lean()
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
                razorpayCheck,
                returnOrder,
                viewWallet,
                viewInvoice
                }