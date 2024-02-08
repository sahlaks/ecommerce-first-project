const Product = require("../models/productmodel")
const User = require("../models/usermodel");
const Category = require('../models/categorymodel');
const Cart = require('../models/cartmodel');
const Wishlist = require('../models/wishlistmodel');
const Address = require('../models/addressmodel');
const Wallet = require('../models/walletmodel')
const { default: mongoose, SchemaType } = require("mongoose");
const Order = require("../models/ordermodel");
const Razorpay = require('razorpay')
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

        //console.log(req.session.uid)
       // console.log(req.params.pid)
        
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
       // console.log(result)
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
        //console.log(sum)
       const { subtotal,discount,total } = sum[0]
       //console.log(subtotal)
       //console.log(discount)
       //console.log(total)
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
        console.log(existpro)
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
    //console.log(pId)
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
        console.log('_id',userId)

       // const cart = await Cart.findOne({userId})
    
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
        console.log(sum)
        const { subtotal,discount,total } = sum[0]
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
            res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr});
            }
        else {
            var addr = null;
            res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr});
            }
    }else{
        var addr = null;
        res.render('products/checkout', {user: true,cartData: result,subtotal,discount,total,addr});
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
    let user = await Address.findOne({userId})
    
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

        console.log(sum)
        const { subtotal,discount,total } = sum[0]
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
                //console.log(address)
                var addr;
                addr = (address[0].addresses);

        res.render('products/checkout',{user:true,addr,cartData: result,subtotal,discount,total})
    }else{
        res.render('products/checkout',{user:true,addr, cartData: result, subtotal,discount,total})
    }
    }catch(err){    
        throw new Error(err.message)
    }
}

 

/*..........................................from checkout..................................................*/
const checkoutForm = async (req,res) => {
    //console.log('hi in new route');
   // console.log(req.body);
    const userId = req.session.uid;
    let typeaddr = req.session.type;
    const formData = req.body;
    console.log(formData)
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
        // user.addresses.push(newAddress);
        // addr = await user.save();
        // console.log(addr)
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
    console.log(result)
    console.log('in',)
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
    console.log(subtotal,discount,total)
    
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
        // await orderlist.save();
        const newOrder = await Order.create(orderlists);
        console.log(newOrder)

    if (selectedPaymentOption === 'COD') {
       await Cart.deleteOne({_id:req.session.cartid})
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

    }

    }catch(err){
        throw new Error(err.message)
    }
}

/*.............................................razorpay validate......................................*/
const razorpayChecking = async (req,res)=>{
    try{
    //console.log(req.body)
    var crypto = require('crypto')
    var razorpaysecret = process.env.RAZORPAY_SECRET_KEY;
    // console.log(razorpaysecret)
    // console.log(req.session.razorid)
    var hmac = crypto.createHmac("sha256",razorpaysecret)
    hmac.update(req.session.razorid + "|" + req.body.razorpay_payment_id);
    hmac = hmac.digest("hex");
    
    if(hmac == req.body.razorpay_signature){
    
        console.log("payment successful");
        await Cart.deleteOne({_id:req.session.cartid})
        res.render('products/razorpaysuccess',{user:true})
    }else{
        console.log("payment not successfull")
        await Order.deleteMany({cartid:req.session.cartid})
        res.send('payment failed')
    }
}catch(error){
    res.status(500).send('Something went wrong').json({err:error.message})
}

} 


/*..............................view order.........................................*/
const viewOrder = async (req,res) => {
    try{
        const user = req.session.uid;
        const orders = await Order.find({userId:user}).sort({_id:-1}).lean()
        //console.log(orderItems)
        //order.forEach(item)
        //console.log(orderItems.products.proId)
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

const viewOrderList = async (req,res) => {
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
    console.log(combinedOrders)
    var value = combinedOrders[0].status;

    let resultplaced = false;
    let resultshipped = false;
    let resultdelivered = false;
    let result = false;

    if(value === 'Placed'){
       resultplaced = true;
    }else if(value === 'Shipped'){
        resultshipped = true;
    }else if(value === 'Delivered'){
       resultdelivered = true;
    }else{
        result = true;
    }

    console.log(resultplaced,resultshipped,resultdelivered,result)
    res.render('products/vieworder',{user:true,combinedOrders,orderId})
    
    }catch(err){
        throw new Error(err.message)
    }
}



const cancelOrder = async (req,res) => {
    try{
        const orderid = req.query.oid;
        console.log("cartid ",orderid);
        const order = await Order.updateMany({cartid: orderid},{$set:{status:'Cancelled'}});
        console.log(order)
        res.render('products/cancelorder',{user:true})
    }catch(err){
        throw new Error(err.message)
    }
}

const returnOrder = async (req,res) => {
    try{
        const orderid = req.query.oid;
        const order = await Order.updateMany({cartid: orderid},{$set:{status:'Returned'}});
        const user = await Order.findOne({cartid:orderid});
        console.log(user);
        const id = user.userId;
        const sum = user.total;
        const wallet = await Wallet.findOne({userId:id})
        if(wallet){
            Wallet.updateOne({userId:id},{$inc:{amount:total}})
        }
        res.render('products/returnorder',{user:true,id,sum})
    }catch(err){
        throw new Error(err.message)
    }
}

const viewWallet = async (req,res) => {
    try{
        console.log(req.body.id)
        console.log(req.body.sum)
    }catch(err){
        throw new Error(err.message);
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
                viewWallet
                }