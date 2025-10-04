const mongoose= require("mongoose");
const User = require("./user");
const Comment = require("./comment");
const MaterialSchema =new mongoose.Schema(
    {
    title:{
        type: String,
        required : true
    },
    description: String,
    file: {
        url:{
            default: "",
            type: String
        },
    filename:{
        type: String,
        default:"",
      },
    },

    comments :[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref : "Comment"
        }
    ],
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    isRestricted: {
        type: Boolean,
        default: false
    },
    allowedInstitutes: [{
        type: String
    }],
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' 
    }],
    likeCount:{
        type: Number,
        default:0
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date
    }
    }
)
const Material= mongoose.model("Material",MaterialSchema);
module.exports = Material;