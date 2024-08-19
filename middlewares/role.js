const registerModel = require("../models/registerModel");

const role = (roles)=>{
    return async(req, res, next)=>{
        const user_email = req.user.email;
        const user = await registerModel.findOne({email: user_email});
        if(roles.includes(user.role)){
            next();
        }
        else{
            return res.status(401).json({message: "you are not authorized"})
        }
    }
}

module.exports = role