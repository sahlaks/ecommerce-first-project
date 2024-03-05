const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const Cart = require("../models/cartModel")
const Wishlist = require("../models/wishlistModel")
var showproducts;
var countprod;

/*..............................................add product......................................................*/
const addPro = async (req,res,next) => {
    try{
        
        const category = await Category.find().lean()
        res.render('admin/addproduct',{category})
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

const addProduct = async (req,res) => {
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
const deleteProduct = async (req,res,next) => {
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
        console.error(error)
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

/*............................................update product....................................................*/
const updatePro = async (req,res,next) => {
    const catId = req.params.id;
    req.session.catId = catId;
    try{
        const data = await Product.findById({_id:catId}).lean()
        req.session.details = data
        res.render('admin/editproduct',{catId,data})
     
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }

}
                                    /*.....edit product.....*/
const editProduct = async (req,res,next) => {
    const proId = req.params.id;
    req.session.proId = proId;
    try{
        const data = await Product.findByIdAndUpdate({_id: proId},
                    {$set:{productname:req.body.productname,
                    description:req.body.description,
                    price:req.body.price,quantity:req.body.quantity,
                    discount:req.body.discount,status:req.body.status}}) 
            if(data){
                res.redirect('/admin/product')
            }
            else{
                const err = new Error('Product not found');
                err.statusCode = 404;
                next(err);
            }
        
    } catch (error){
        console.error(error);
        const err = new Error('Internal Server Error');
        err.statusCode = 500;
        next(err);
    }
}

                                    /*....edit image....*/
const editimage = async (req,res,next) => {
    const proId = req.params.proId;
    try{
        const newImage = req.file.filename;
        const data = await Product.updateOne({_id: proId},{$set:{image:newImage}})
        res.redirect('/admin/product')
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

                                    /*.....delete image.....*/
const deleteImage = async (req,res) => {
    try{
        const proId = req.params.id;
        const product = await Product.findOneAndUpdate({_id:proId},{$unset: {image:1}})
        const data = await Product.findOne({_id:proId}).lean()
        res.render('admin/editproduct',{data})
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

                                        /*......edit images......*/
const editimages = async (req,res) => {
    const proId = req.params.proId;
    try{
        const newImages = req.files.map( file => file.filename)
        const data = await Product.updateOne({_id: proId},{$push: {subImage:{$each: newImages}}})
        res.redirect('/admin/product')
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

                                        /*.......delete images.......*/
const deleteImages = async (req,res) => {
    try{
        const name = req.query.name;
        const product = await Product.findOne({subImage: {$in:[name] }})
        await Product.findOneAndUpdate({_id:product._id},
                                        {$pull: {subImage: name}})
        const data = await Product.findOne({_id:product._id}).lean()
        res.render('admin/editproduct',{data})

    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
} 



/*.............................................add category...................................................*/
const listCategory = (req,res) => {
    res.render('admin/addcategory')
}

const addCategory = async (req,res) => {
    
    try{
    const filepath = req.file.filename;
    const categoryCheck = new RegExp(`^${req.body.category}$`, 'i');
    const result = await Category.findOne({ category: categoryCheck });
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
    console.error(error);
    const err = new Error();
    err.statusCode = 500;
    next(err);
    }
}


/*.............................................delete category.......................................*/
const deleteCategory = async (req,res,next) => {
    const catId = req.params.id 
    try{
        const deleteCat = await Category.deleteOne({_id: catId})
        if(deleteCat){
            const category = await Category.find().lean();
            res.redirect('/admin/category')
        }else{
            res.render('admin/category',{Error:'Category not found..'})
        }

    }catch (error){
        console.error(error)
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}

/*.............................................edit category................................................*/
const editCat = async (req,res,next) => {
    const catId = req.params.id;
    req.session.catId = catId;
    try{
        const data = await Category.findById({_id:catId}).lean()
        req.session.category = data
        res.render('admin/editcategory',{catId,data})
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

/*.........................................details........................................*/
const editcategory = async (req,res,next) => {
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
            console.error(error);
            const err = new Error();
            err.statusCode = 404;
            next(err);
    }

}

/*..............................................image............................................*/
const updateimage = async (req,res,next) => {
    const catId = req.params.catId;
    try{
        const newImage = req.file.filename;
        console.log(newImage)
        const data = await Category.updateOne({_id: catId},{$set:{image:newImage}})
        res.redirect('/admin/category')
    }
    catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
}


/*..............................................displayproducts.................................*/
const products = async (req,res,next) => {
    try{
        const Error = req.query.msg;
        var search = '';
        if(req.query.search){
                search = req.query.search;
        }
        var page = 1;
        if(req.query.page){
                page = req.query.page;
        }

        const limit = 6;

        const priceRange = req.query.priceRange;
        console.log('price',priceRange)
        const filter = req.query.category || [];
        const sortOption = req.query.sort; 
        
        if(filter.length > 0){
            const parsedPriceRange = priceRange.split(',').map(Number);
            const minPrice = 0;
            const maxPrice = parsedPriceRange[0] || Number.MAX_VALUE;
            if (!isNaN(minPrice) && !isNaN(maxPrice)) {
                
                const categoryFilter = filter.length > 0 ? { category: { $in: filter } } : {};
                const priceFilter = {
                    price: {
                        $gte: minPrice,
                        $lte: maxPrice,
                    },
                };
                const combinedFilter = {
                    list: true,
                    $and: [categoryFilter, priceFilter],
                };
                
                if(sortOption){
                    let sortOptionval;
                    if (sortOption === 'highToLow') {
                        sortOptionval = -1; 
                    } else {
                        sortOptionval = 1; 
                    }
                showproducts = await Product.find(combinedFilter)
                .limit( limit * 1 )
                .sort({ price: sortOptionval })
                .skip( (page - 1) * limit )
                .lean();
                }else{
                    showproducts = await Product.find(combinedFilter).lean();
                }
                countprod = await Product.countDocuments(combinedFilter);
            } else {
                console.log('Invalid priceRange values');
            }

        }else{

            if(sortOption){

                let sortOptionval;
                if (sortOption === 'highToLow') {
                    sortOptionval = -1; 
                } else {
                    sortOptionval = 1; 
                }

                showproducts = await Product.find({
                    list:true,
                    $or:[
                    {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                    {category : {$regex: '.*'+search+'.*',$options:'i'} },
                    ]
                    })
                    .limit( limit * 1 )
                    .skip( (page - 1) * limit )
                    .sort({price : sortOptionval})
                    .lean()

                countprod = await Product.find({
                    list:true,
                    $or:[
                        {productname: {$regex:'.*'+search+'.*',$options:'i'} },
                        {category : {$regex: '.*'+search+'.*',$options:'i'} },
                        ]
                    }).countDocuments();
                
                }else{
                    showproducts = await Product.find({
                        list: true,
                        $or: [
                            { productname: { $regex: '.*' + search + '.*', $options: 'i' } },
                            { category: { $regex: '.*' + search + '.*', $options: 'i' } },
                        ]
                    })
                        .limit(limit * 1)
                        .skip((page - 1) * limit)
                        .lean();
    
                    countprod = await Product.find({
                        list: true,
                        $or: [
                            { productname: { $regex: '.*' + search + '.*', $options: 'i' } },
                            { category: { $regex: '.*' + search + '.*', $options: 'i' } },
                        ]
                    }).countDocuments();
                }
                
            }
        const totalPages = Math.ceil(countprod/limit);
        const currentPage = page;

        const pages = [];
        for (let j = 1; j <= totalPages; j++) {
            pages.push({
                        pageNumber: j,
                        isCurrent: j == currentPage,
                        });
        }
        const existingCategories = req.query.category || [];
        const category = await Category.find().lean()
        res.render('products/products',{user:true,showproducts,
                                        category,
                                        existingCategories,
                                        totalPages,
                                        currentPage,
                                        pages,
                                        Error
                                    });
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
    }
   
}

/*..............................................display product details............................................*/
const productDetails = async (req,res,next) => {
try{
        const pId = req.params.id;  
        req.session.pid = pId;
        const details = await Product.findById({_id:pId}).lean()
        if(details.quantity == 0){
              await Product.findByIdAndUpdate({_id:pId},{$set: {status:'Out of stock'}})
          }
        else if(details.quantity <= 5){
            await Product.findByIdAndUpdate({_id:pId},{$set: {status:'low-stock'}})
          }
          else{
            await Product.findByIdAndUpdate({_id:pId},{$set: {status:'In stock'}})
          }
        res.render('products/product_details',{user:true,details})
    
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 404;
        next(err);
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