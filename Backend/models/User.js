const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        trim:true,
        required:true,
        unique:true
    }
})


// userSchema.plugin(passportLocalMongoose);
userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });



let User = mongoose.model('User' , userSchema);
module.exports = User;