const Coupon = require("../models/couponModel")

function generateCouponCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }


const getCoupon = async (req,res) => {
    try{
        const coupons = await Coupon.find({}).lean()
        res.render('admin/coupon',{coupons})
    }catch(err){
        throw new Error(err.message)
    }
}


const postNewCoupon = async (req,res) => {
    try{
    const code = generateCouponCode();
    const { minAmount, discount, expirationDate } = req.body;
    // Save the coupon to the database
    const newCoupon = new Coupon({
      code,
      minAmount,
      discount,
      expirationDate
    });
  
    await newCoupon.save();
    res.redirect('/admin/coupons'); 
    }catch(err){
        throw new Error(err.message)
    }
}


const deleteCoupon = async (req,res) => {
    try{
        const couponId = req.query.id;
        const data = await Coupon.findByIdAndDelete({_id:couponId})
        res.redirect('/admin/coupons')
    }catch(err){
        throw new Error(err.message)
    }
}


const getCoupons = async (req,res) => {
    try{
        const coupons = await Coupon.find({}).lean()
        res.render('user/coupons',{user:true,coupons})
    }catch(err){
        throw new Error(err.message)
    }
}

const checkCoupon = async (req,res) => {
    try{
        console.log('iam zayda in coupon')
        const cId = req.query.id;
        console.log(cId);
        // const coupons = await Coupon.find({minAmount : {$lte: total}})
        // console.log(coupons)

    }catch(err){
        throw new Error(err.message)
    }
}

module.exports = {getCoupon,
                    postNewCoupon,
                    deleteCoupon,
                    getCoupons,
                    checkCoupon}