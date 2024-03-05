const Banner = require("../models/bannerModel")


/*....................................................show banner......................................................*/
const getBanner = async (req,res,next) => {
    try{
        const data = await Banner.find({}).lean()
        res.render('admin/banner',{data})

    }catch(error){
        console.error(error);
        const err = new Error('Internal server error');
        err.statusCode = 500;
        next(err);
    }
}

/*...................................................add banner.................................................*/
const addBanner = async (req,res,next) => { 
    try{
        if (req.files && req.files.length > 0) {
        const newImages = req.files.map( file => file.filename)
        var image = req.body.selectedImage;
        if(req.body.selectedImage){
            if(image == 'image1'){
                await Banner.updateOne({},{$set: {image1: newImages[0]}})
            }else{
                await Banner.updateOne({},{$set: {image2: newImages[0]}})
            }
        }
        else
        {
        const newBanner = new Banner({
            image1 : newImages[0],
            image2 : newImages[1]
        });

        await newBanner.save();
        }
        res.redirect('banner')
    }
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

/*......................................................delete banner..............................................................*/
const deleteBanner = async (req,res,next) => {
    try{
        const name = req.query.name;
        const result =await Banner.findOne({})
        
        if(result.image1 == name){

            await Banner.updateOne(
                { image1: name },
                { $unset: { image1: 1 } }
            );
        }
        else if (result.image2 === name) {
            await Banner.updateOne({}, { $unset: { image2: 1 } });
        } else {
            const err = new Error('Banner not found');
            err.statusCode = 404;
            throw err;
        }
        res.redirect('banner')
    }catch(error){
        console.error(error);
        const err = new Error();
        err.statusCode = 500;
        next(err);
    }
}

module.exports={getBanner,addBanner,deleteBanner}