const mongoose = require('mongoose')
const addressSchema = new mongoose.Schema({
    userId: {
        type:String
    },
   addresses:[{
    fname: {
        type:String
    },
    sname: {
        type:String
    },
    pincode: {
        type: String
    },
    locality: {
        type: String
    },
    address :{
        type: String
    },
    district :{
        type: String
    },
    state :{
        type: String
    },
    landmark :{ 
        type: String
    },
    phone : {
            type: String
        },
    email:{
            type:String,
            },
     mobilenumber: {
            type: String
        },
    type : {type: String},
    }]
});
const Address = mongoose.model("Address",addressSchema)
module.exports = Address
