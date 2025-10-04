const mongoose= require("mongoose");
const User = require("./user");
const CommentSchema =new mongoose.Schema(
    {
    description: {
        type: String,
        required: true
        },
        owner:{
            type:mongoose.Schema.Types.ObjectId,
            ref : "User"
        },
        replies:[
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
    }
)
const Comments= mongoose.model("Comment",CommentSchema);
module.exports = Comments;