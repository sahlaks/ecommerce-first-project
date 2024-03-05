const Coupon = require("../models/couponModel")

function generateCouponCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }


const getCoupon = async (req,res,next) => {
    try{
        const coupons = await Coupon.find({}).lean()
        res.render('admin/coupon',{coupons})
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}


const postNewCoupon = async (req,res,next) => {
    try{
    const code = generateCouponCode();
    const { minAmount, discount, expirationDate } = req.body;
    const newCoupon = new Coupon({
      code,
      minAmount,
      discount,
      expirationDate
    });
  
    await newCoupon.save();
    res.redirect('/admin/coupons'); 
    }catch(error){
        console.error(error);
        const err = new Error('Internal server error');
        err.statusCode = 500;
        next(err);
    }
}


const deleteCoupon = async (req,res,next) => {
    try{
        const couponId = req.query.id;
        const data = await Coupon.findByIdAndDelete({_id:couponId})
        if(!data){
            const err = new Error('Coupon not found');
            err.statusCode = 404;
            throw err;
        }
        res.redirect('/admin/coupons')
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}


const getCoupons = async (req,res,next) => {
    try{
        const coupons = await Coupon.find({}).lean()
        res.render('user/coupons',{user:true,coupons})
    }catch(error){
        console.error(error);
        const err = new Error('Failed to fetch coupons');
        err.statusCode = 404;
        next(err);
    }
}


const applyCoupon = async (req,res,next) => {
    try{
        const cId = req.query;
        const coupons = await Coupon.updateOne({_id:req.query.couponId},{
            $push:{
                users:req.session.uid
            }
        })
        res.json({success:true})

    }catch(error){
        console.error(error);
        const err = new Error()
        err.statusCode = 500
        next(err)
    }
}

module.exports = {getCoupon,
                    postNewCoupon,
                    deleteCoupon,
                    getCoupons,
                    applyCoupon}