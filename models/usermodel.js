const mongoose = require('mongoose')
const userSchema = new mongoose.Schema({
    username: {
        type:String,
        required: true
    },
    email: {
        type: String,
        required:true,
      
    },
    password: {
        type:String,
        required: true
    },
    mobilenumber: {
        type: String,
        required : true
    },
    isblocked: {
        type: Boolean,
        default : false
    },
    islogin :{
        type: Boolean,
        default: false
    }
});
const User = mongoose.model("User",userSchema)
module.exports = User
