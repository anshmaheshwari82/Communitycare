const OTP=require('../models/OTP.jsx');
const otpGenerator=require('otp-generator');
const User=require('../models/User.jsx');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
require('dotenv').config();
//------------------------------------------SENDOTP-------------------------------------------

exports.sendOtp=async(req,res)=>{
try {
    const {email}=req.body;
    // console.log(email.trim())

if(!email||email.trim()==''){
    return res.status(400).json({
        success:false,
        message:'All field are mandatory !!!'
    })
}


let otp=otpGenerator.generate(6,{
    upperCaseAlphabets:false,
    lowerCaseAlphabets:false,
    specialChars: false
 });
 otp=otp.toString();
// otp=otp.toString();
console.log(otp);

const otpCreated=await OTP.create({email:`${email}`,otp:`${otp}`});

if(!otpCreated){
    return res.status(401).json({
        success:false,
        message:'Error while sending OTP ,please try again later'
    })
}

return res.status(200).json({
    success:true,
    message:"OTP sent successfully !!!"
})

} catch (error) {
    console.log('sendOtp fata hai ----> ',error)
    return res.status(400).json({
        success:false,
        message:'something went wrong while sending otp'
    })
}

}


//--------------------------------SIGNUP--------------------------------------------------------


exports.signUp=async(req,res)=>{
   try {
    const {firstName,lastName,phoneNo,email,password,confirmPassword,role,otp}=req.body;

    if(!firstName||!lastName||!phoneNo||!email||!password||!confirmPassword||!role||!otp){
        return res.status(400).json({
            success:false,
            message:'All fields are mandatory !!!'
        })
    }

    if(firstName.trim()==''||lastName.trim()==''||phoneNo.trim()==''||email.trim()==''||password.trim()==''||confirmPassword.trim()==''||role.trim()==''||otp.trim()==''){
        return res.status(400).json({
            success:false,
            message:'All fields are mandatory !!!'
        })
        
    }

    // console.log('-----<>',firstName.length)
    // console.log('-----<>',firstName.trim().length)

 
    if(phoneNo.length!=10){
        return res.status(400).json({
            success:false,
            message:'Phone Number Must Have 10 Digits'
        })
    }

    const user=await User.findOne({email:`${email}`});

    if(user){
        return res.status(401).json({

            success:false,
            message:'User already exists ,Please Login'
        })
    }
    
    const recentOtp=await OTP.findOne({email:`${email}`}).sort({createdAt:-1}).limit(1);
    if(!recentOtp){
        return res.status(401).json({
    
            success:false,
            message:'Please generate OTP first !!!'
        })
        
    }

    if(password!==confirmPassword){
        return res.status(401).json({
            success:false,
            message:'Passwords not matching !!!'
        })
    }
// console.log((recentOtp.createdAt).getTime())
// console.log(new Date(new Date(recentOtp.createdAt).getTime()+2*60*1000).getTime())
// console.log(new Date(new Date(Date.now()).getTime()).getTime())

    if(new Date(new Date(recentOtp.createdAt).getTime()+2*60*1000).getTime()<new Date(new Date(Date.now()).getTime()).getTime()){
        return res.status(403).json({
            success:false,
            message:"OTP expired !!!"
        })
    }
    
    if(otp!=recentOtp.otp){
        return res.status(402).json({
            success:false,
            message:'Wrong OTP !!!'
        })

    }

const hashedPass=await bcrypt.hash(password,10);
// console.log('Type --->',typeof(hashedPass),hashedPass)



const newUser=await User.create({
    firstName,
    lastName,
    email,
    phoneNo,
    password:hashedPass,
    role,
    profileUrl:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
})

return res.status(200).json({
    success:true,
    message:"Sign Up successful ,Please Login"
})

   } catch (error) {
    console.log('signup fata hai ----> ',error)
    return res.status(400).json({

        success:false,
        message:'something went wrong while signing up',
        error:error.message
    })
}

   }


//-------------------------------------------LOGIN---------------------------

exports.login=async(req,res)=>{
    try {
        const {email,password}=req.body;

    if(!email||!password){
        return res.status(400).json({
            success:false,
            message:'All fields are mandatory !!!'
        })
    }

    if(email.trim()==''||password.trim()==''){
        return res.status(400).json({
            success:false,
            message:'All fields are mandatory !!!'
        })
        
    }

    const user=await User.findOne({email});

    if(!user){
        return res.status(400).json({
            success:false,
            message:"User doesn't exists ,Please Signup !!!"
        })
    }

    const pass=await bcrypt.compare(password,user.password);

    if(!pass){
        return res.status(402).json({
            success:false,
            message:"Password Incorrect !!!"
        })
    }

    const payload={
        email:user.email,
        id:user._id,
       
        role:user.role

    }

    const token=jwt.sign(payload,process.env.JWT_SECRET,{
        expiresIn:'2h'
    })

    user.token=token;
    user.password=undefined;

    const option={
        expire:Date.now()+3*24*60*60*1000,
        httpOnly:true
    }

     res.cookie('token',token,option).header('Authorization', 'Bearer '+ token).status(200).json({
        success:true,
        message:'Logged in Successfully !!!',
        token,
        user
    });

    } catch (error) {
        console.log('login fata hai ----> ',error)
        return res.status(400).json({
    
            success:false,
            message:'something went wrong while logging in',
            error:error.message
        })
    }
    

}