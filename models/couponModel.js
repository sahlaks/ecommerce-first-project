const mongoose = require('mongoose')
const moment = require('moment')

const couponSchema = new mongoose.Schema({
code: {
    type: String,
},
minAmount: {
    type:Number,
},
discount:{
    type:Number,
},      
expirationDate:{
    type:String,
},
addedAt:{
    type:String,
    default:new Date().toDateString()
},
isUsed:{
    type:Boolean,
    default:false
},
status:{
    type: String,
    default: 'active',
},
users:[]

})


const Coupon = mongoose.model("Coupon",couponSchema)
module.exports = Coupon

