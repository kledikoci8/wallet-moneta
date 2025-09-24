import ratelimit  from "../config/upstash.js";

const rateLimiter = async (req, res ,next) => {

    try {
        //ktu e kemi simple 
        // ne rastet e verteta te krijimit ose ne rreal world app me sakte kerkohet user id ose  ip address as your key
        const {success}=await ratelimit.limit("my-rate-limit")
       
        if(!success){
            return res.status(429).json({
              message:"Too many requests,please try again later."


            })
        }

    next();

    } catch (error) {      
     console.error("Rate limit error",error)
     next(error)   

 }

};

export default rateLimiter