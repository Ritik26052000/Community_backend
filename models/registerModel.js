 const {Schema, model} = require('mongoose');

const userSchema = new Schema ({
    username: {type: String , required: true},
    email: {type: String , required: true , unique : true},
    password: {type: String , required: true},
    role: { type: String, enum:["user", "organizer", "admin"], default: "admin"},

})


const registerModel = model('users', userSchema);

module.exports = registerModel;