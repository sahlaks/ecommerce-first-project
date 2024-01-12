const mongoose = require("mongoose")
const Connection = ()=>{

    const dbName = "ecommerce"
    const connection = `mongodb://localhost:27017/${dbName}`
    mongoose.connect(connection).then(()=>{
        console.log('Database connected successfully..')
    }).catch((error)=>{
        console.log('Database connection error'+error)
    })

}

module.exports = Connection