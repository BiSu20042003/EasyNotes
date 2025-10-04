const mongoose= require("mongoose");
const passportLocalMongoose= require("passport-local-mongoose");

const userSchema =new mongoose.Schema(
    {
    username: { 
        type: String,
        required: true,
    },
    email:{
        type: String,
        required : true
    },
    
    isVerified:{
        type: Boolean,
        default: false
    },
    verificationCode: String,
    verificationCodeExpires: Date,
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
},
 { timestamps: true }
)
userSchema.plugin(passportLocalMongoose);
const User= mongoose.model("User",userSchema);
module.exports = User;