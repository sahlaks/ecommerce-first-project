const mongoose = require('mongoose')
const productSchema = new mongoose.Schema({
    productname:{ type:String},
    category: {type:String},
    description: {type: String},
    price: {type:Number},
    image: {type:String},
    quantity:{type: Number},
    discount:{type:Number},
    status:{type:String},
    addedAt:{type:String,
            default: function() {
                return new Date().toDateString()
            }},
    subImage:[{type:String}],
    list : {type:Boolean,
            default:true}

});
const Product = mongoose.model("Product",productSchema)
module.exports = Product

