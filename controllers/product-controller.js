const Product = require("../models/productmodel")
const Category = require("../models/categorymodel")
const Cart = require("../models/cartmodel")
const Wishlist = require("../models/wishlistmodel")


/*..............................................add product......................................................*/
const addPro = async (req,res) => {
    try{
        
        const category = await Category.find().lean()
        res.render('admin/addproduct',{category})
    }
    catch(error){
        throw new Error(error.message)
    }
}

const addProduct = async (req,res) => {

    console.log(req.body)
    const filepath = req.file.filename;
    
    const pro = await Product.create(req.body)
    const productId = pro._id
    const proup = await Product.findByIdAndUpdate(
        productId,
        { image: filepath }
    );
          res.redirect('/admin/product')
}


/*..............................................delete product...................................................*/
const deleteProduct = async (req,res) => {
    const proId = req.params.id 
    try{
        const deletePro = await Product.deleteOne({_id: proId})
        if(deletePro){
            console.log('deleted...')
            const product = await Product.find().lean();
            res.redirect('/admin/product')
        }else{
            res.render('admin/product',{Error:'Product not found..'})
        }

    }catch (error){
        throw new Error(error.message)
    }
}

/*............................................update product....................................................*/
const updatePro = async (req,res) => {
    const catId = req.params.id;
    //console.log(catId)
    req.session.catId = catId;
    try{
        const data = await Product.findById({_id:catId}).lean()
        req.session.details = data
        //console.log(req.session.details)
        res.render('admin/editproduct',{catId,data})
     
    }
    catch(error){
        throw new Error(error.message)
    }

}
                                    /*.....edit product.....*/
const editProduct = async (req,res) => {
    const proId = req.params.id;
    req.session.proId = proId;
    console.log(req.body)
    try{
        //const data = await Product.findById({_id:proId}).lean()
        const data = await Product.findByIdAndUpdate({_id: proId},
                    {$set:{productname:req.body.productname,
                    description:req.body.description,
                    price:req.body.price,quantity:req.body.quantity,
                    discount:req.body.discount,status:req.body.status}}) 
            if(data){
                res.redirect('/admin/product')
            }
        
    } catch (error){
           throw new Error(error.message)
     }
}

                                    /*....edit image....*/
const editimage = async (req,res) => {
    const proId = req.params.proId;
    try{
        const newImage = req.file.filename;
        console.log(newImage)
        const data = await Product.updateOne({_id: proId},{$set:{image:newImage}})
        res.redirect('/admin/product')
    }
    catch(error){
        throw new Error(error.message)
    }
}

                                    /*.....delete image.....*/
const deleteImage = async (req,res) => {
    try{
        const proId = req.params.id;
        const product = await Product.findOneAndUpdate({_id:proId},{$unset: {image:1}})
        const data = await Product.findOne({_id:proId}).lean()
        console.log(data)
       res.render('admin/editproduct',{data})
    }catch(err){
        throw new Error(err.message)
    }
}

                                        /*......edit images......*/
const editimages = async (req,res) => {
    const proId = req.params.proId;
    try{
        const newImages = req.files.map( file => file.filename)
        console.log(newImages)
        const data = await Product.updateOne({_id: proId},{$push: {subImage:{$each: newImages}}})
        res.redirect('/admin/product')
    }
    catch(error){
        throw new Error(error.message)
    }
}

                                        /*.......delete images.......*/
const deleteImages = async (req,res) => {
    try{
        const name = req.query.name;
        const product = await Product.findOne({subImage: {$in:[name] }})
        //console.log(product)
        //console.log(name)
        await Product.findOneAndUpdate({_id:product._id},
                                        {$pull: {subImage: name}})
        const data = await Product.findOne({_id:product._id}).lean()
        res.render('admin/editproduct',{data})

    }catch(err){
        throw new Error(err.message)
    }
}



/*.............................................add category...................................................*/
const listCategory = (req,res) => {
    res.render('admin/addcategory')
}

const addCategory = async (req,res) => {
    
    try{
    const filepath = req.file.filename;
    const result = await Category.findOne({ category: req.body.category });
    if (result) {
        res.render('admin/addcategory',{Error:'Category already exists..! Please enter an unique category..!'})
    }
    else{
        const category = await Category.create(req.body)
        const categtId = category._id
        const categry = await Category.findByIdAndUpdate(
            categtId,
            { image: filepath }
        );
        res.redirect('/admin/category')
    }
    }
    catch(error){
    throw new Error(error.message)
    }
}


/*.............................................delete category.......................................*/
const deleteCategory = async (req,res) => {
    const catId = req.params.id 
    try{
        const deleteCat = await Category.deleteOne({_id: catId})
        if(deleteCat){
            console.log('deleted...')
            const category = await Category.find().lean();
            res.redirect('/admin/category')
        }else{
            res.render('admin/category',{Error:'Category not found..'})
        }

    }catch (error){
        console.log(error)
    }
}

/*.............................................edit category................................................*/
const editCat = async (req,res) => {
    const catId = req.params.id;
    //console.log(catId)
    req.session.catId = catId;
    try{
        const data = await Category.findById({_id:catId}).lean()
        req.session.category = data
        //console.log(req.session.category)
        res.render('admin/editcategory',{catId,data})
     
    }
    catch(error){
        throw new Error(error.message)
    }
}

/*.........................................details........................................*/
const editcategory = async (req,res) => {
    const catId = req.params.id;
    try{
        const data = await Category.findById({_id:catId}).lean()
        const result = await Category.findOne({ category: req.body.category });
        if (result) {
            res.render('admin/editcategory',{catId,data,Error:'Category already exists..! Please enter an unique category..!'})
        }
        else{
            const data = await Category.updateOne({_id: catId},{$set:{category:req.body.category,description:req.body.description}}) 
            if(data){
                res.redirect('/admin/category')
            }
        }
    } catch (error){
            throw new Error(error.message)
    }

}

/*..............................................image............................................*/
const updateimage = async (req,res) => {
    const catId = req.params.catId;
    try{
        const newImage = req.file.filename;
        console.log(newImage)
        const data = await Category.updateOne({_id: catId},{$set:{image:newImage}})
        res.redirect('/admin/category')
    }
    catch(error){
        throw new Error(error.message)
    }
}


/*..............................................displayproducts.................................*/
const products = async (req,res) => {
    try{

        var search = '';
        if(req.query.search){
                search = req.query.search;
        }
        var page = 1;
        if(req.query.page){
                page = req.query.page;
        }

        
        const limit = 6;
        const products = await Product.find({
            list:true,
            $or:[
                {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                {category : {$regex: '.*'+search+'.*',$options:'i'} },
            ]
        })
        .limit( limit * 1 )
        .skip( (page - 1) * limit )
        .lean()

        const count = await Product.find({
            list:true,
            $or:[
                {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                {category : {$regex: '.*'+search+'.*',$options:'i'} },
            ]
        }).countDocuments();

        const totalPages = Math.ceil(count/limit);
        const currentPage = page;

        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
}

        // console.log('search',products)
        // const products = await Product.find().lean()
        const category = await Category.find().lean()
        res.render('products/products',{user:true,products,
                                        category,
                                        totalPages,
                                        currentPage,
                                        pages,
                                    });
    }catch(error){
        throw new Error(error.message)
    }
   
}

/*..............................................display product details............................................*/
const productDetails = async (req,res) => {
try{
        const pId = req.params.id;
        //console.log(pId)
        req.session.pid = pId;
        const details = await Product.findById({_id:pId}).lean()
        //console.log(details)
        res.render('products/product_details',{user:true,details})
    
    }catch(err){
        throw new Error(err.message)
    }
    
}




module.exports = {addPro,
                addProduct,
                listCategory,
                addCategory,
                deleteCategory,
                editCat,
                editcategory,
                updateimage,
                deleteProduct,
                updatePro,
                editProduct,
                editimage,
                deleteImage,
                editimages,
                deleteImages,
                products,
                productDetails
            }