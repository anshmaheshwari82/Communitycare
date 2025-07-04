const DonorPosts=require('../models/DONOR_POSTS.jsx');
const RecieverPosts=require('../models/RECIEVER_POSTS.jsx');

exports.BootUp=async(req,res)=>{
    try {
        const donors=await DonorPosts.find({}).populate('posts').exec();

        
    for(let i=0;i<donors.length;i++){
      if(donors[i].posts.expiresAt.getTime()<new Date(Date.now()).getTime()){
        await DonorPosts.findByIdAndDelete(donors[i]._id)
      }
    }


        const recievers=await RecieverPosts.find({}).populate('posts').exec();


    for(let i=0;i<recievers.length;i++){
      if(recievers[i].posts.expiresAt.getTime()<new Date(Date.now()).getTime()){
        await DonorPosts.findByIdAndDelete(recievers[i]._id)
      }
    }
   
        return res.status(200).json({
            success:true,
            message:"Expired Donor Posts and reciever's posts deleted successfully !!!"
        });
    } catch (error) {
        console.log('bootup controller fata hai ---->  ',error)
        return res.status(402).json({
            success:false,
            message:"something went wrong while reloading posts"
        });
        
    }
}