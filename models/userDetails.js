const mongoose = require('mongoose');
const User = require("./user");
const Schema = mongoose.Schema;
const userDetailSchema = new Schema({
    _id: { 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    profileImage:{
        url:String,
        filename: String    
        
    },
    fullName: {
            type: String,
            default: '',
            required: true
        
    },
    institution:{
        type: String,
        required: true
    },
    department: String,
    followers: {
        type: Number,
        default: 0
    },
    followedBy:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }]
    
});
const UserDetail = mongoose.model('UserDetail', userDetailSchema);
module.exports = UserDetail;