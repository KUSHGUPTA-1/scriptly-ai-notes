const mongoose = require('mongoose');
const User=require('./User');

const noteSchema = new mongoose.Schema({
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    content:{
        type:String,
        trim:true,
        required:true
    },
    keywords:{
        type:[String],

    }
}, {timestamps:true})


let Note = mongoose.model('Note' , noteSchema);
module.exports = Note;