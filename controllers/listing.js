const Comments = require('../models/comment'); 
const userDetails = require("../models/userDetails");
const Material = require("../models/Material");
const cloudinary = require('cloudinary');

module.exports.home = async (req, res) => { //render all author autometically 
    const allAuthor= await userDetails.find({});
    res.json(allAuthor);
};

module.exports.searchAuthor = async (req, res) => { //render when there is any seacrhed name 
    const {fullName} = req.query; 
    if (!fullName) {
        return res.status(400).json({ message: 'Search term is required.' });
    }
    const authors = await userDetails.find({
        fullName: { $regex: fullName, $options: 'i' } 
    });
    res.json(authors);
};
module.exports.showMaterials = async (req, res) => { 
    let {id} = req.params;
    const materials = await Material.find({ owner: id});
    if (!materials) {
        return res.status(404).json({ message: 'No Material  Found!' });
    }
    res.json(materials);
};
module.exports.materialDetails = async (req, res) => {
    let {id} = req.params;
    const material = await Material.findById(id).populate('owner', 'username').populate({
        path: 'comments',
        populate: {
          path: 'owner',
          select: 'username', 
        }
      });
    if (!material){
        return res.status(404).json({ message: 'Something went wrong' });
    }
    res.json(material);
};

module.exports.createNew = async (req, res) => {
 try {
    if (!req.body || !req.body.author) {
      return res.status(400).json({ message: 'Author data is required.' });
    }

    const existingAuthor = await userDetails.findById(req.user._id);
    if (existingAuthor) {
      return res.status(409).json({ message: 'An author profile already exists for this user.' });
    }

    const newAuthor = new userDetails(req.body.author);
    newAuthor._id = req.user._id;

    if (req.body.author.profileImage) {
      newAuthor.profileImage = req.body.author.profileImage;
    }

    await newAuthor.validate();
    await newAuthor.save();

    return res.status(201).json({ message: 'New Author created successfully!', authorId: newAuthor._id });
  } catch (error) {
    console.error('createNew error:', error);
    return res.status(500).json({ message: 'An error occurred while creating the author profile.' });
  }
};
module.exports.deleteAuthor = async (req, res)=>{
    const {id }= req.params;
    
  try {
    const author = await userDetails.findById(id);
    const materials = await Material.find({ owner: id });
    for (const mat of materials) {
      if (mat.comments.length) {
        await Comment.deleteMany({ _id: { $in: mat.comments } });
      }
    }
    await Material.deleteMany({ owner: id });
    if (author.profileImage && author.profileImage.filename) {
            try {
                await cloudinary.uploader.destroy(author.profileImage.filename);
            } catch (cloudinaryError) {
    
                console.error("Cloudinary deletion failed", cloudinaryError);
            }
        }
    await userDetails.deleteOne({ _id: id });

    res.json({ message: "Author profile deleted" });
  } catch (err) {
    console.error("Error deleting author profile:", err);
    res.status(500).json({ message: "Failed to delete author profile."});
  }
}

module.exports.createNewMaterial = async (req, res) => {
    try {
    if (!req.body || !req.body.material) {
      return res.status(400).json({ message: 'Material data is required.' });
    }

    const newMaterial = new Material(req.body.material);

    if (!newMaterial.title && !newMaterial.description && !req.body.material.file) {
      return res.status(400).json({ message: 'Material is empty.' });
    }

    newMaterial.owner = req.user._id;

    if (req.body.material.file) {
      newMaterial.file = req.body.material.file; 
    }

    if (!newMaterial.title) newMaterial.title = 'New Material';

    await newMaterial.save();

    return res.status(201).json({ message: 'New Material added!', materialId: newMaterial._id });
  } catch (err) {
    console.error('createNewMaterial error:', err);
    return res.status(500).json({ message: 'Server error while creating material.', error: err.message });
  }
};

module.exports.follow = async (req, res) => {
    try {
        const {id} = req.params;
        const currentUserId = req.user._id;

        const authorDetail = await userDetails.findById(id);

    
        if (!authorDetail) {
            return res.status(404).json({ message: 'Author not found.' });
        }

        const isFollowing = authorDetail.followedBy.includes(currentUserId);
        
        let updatation;
        if (isFollowing) {
            updatation = {
                $pull: { followedBy: currentUserId }, 
                $inc: { followers: -1 } 
            };
        } else {
            updatation = {
                $push: { followedBy: currentUserId },
                $inc: { followers: 1 } 
            };
        }

        const updatedAuthorDetail = await userDetails.findByIdAndUpdate(
            id,
            updatation,
            {new: true} 
        );

        res.status(200).json({
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            authorDetail: updatedAuthorDetail
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
module.exports.updateMaterial = async (req, res) => { 
    let {id} = req.params;
    let material = await Material.findById(id);
    if (!material) {
        return res.status(404).json({ message: 'material not found!' });
    }
    const updatedMaterial = await Material.findByIdAndUpdate(id, { ...req.body.material }, { new: true, runValidators: true });

    if (req.file){
        updatedMaterial.file = { url: req.file.path, filename: req.file.filename };
    } 
    await updatedMaterial.save(); 

    res.status(200).json({ message: 'Material updated successfully!', material: updatedMaterial  });
};
module.exports.getMaterial = async (req, res) => {
    let {id} = req.params;
    const material = await Material.findById(id);
    if (!material) {
        return res.status(404).json({ message: 'Material Not Found!' });
    }
    if (!req.user || !material.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'You are not authorized to edit this Material.' });
    }
    res.json(material);
};

module.exports.deleteMaterial = async (req, res) => { 
    let { id } = req.params;
    const material = await Material.findById(id);
    if (!material) {
        return res.status(404).json({ message: 'Material not found!' });
    }

    if (material.file && material.file.filename) {
            try {
                await cloudinary.uploader.destroy(material.file.filename);
            } catch (cloudinaryError) {
    
                console.error("Cloudinary deletion failed", cloudinaryError);
            }
        }

    await Comments.deleteMany({ _id: { $in: material.comments }});

    await Material.findByIdAndDelete(id);
    res.status(200).json({ message: 'Material deleted successfully!' });
};


module.exports.createComment = async (req, res) => { 
    let {id} = req.params;
    const material = await Material.findById(id);
    if (!material) {
        return res.status(404).json({ message: 'Something went wrong, Please try again!!' });
    }
    if (!req.user) {
        return res.status(401).json({ message: 'You must be logged in to add a comment.' });
    }

    const newComment = new Comments(req.body);
    newComment.owner = req.user._id;
    material.comments.push(newComment);
    await newComment.save();
    await material.save();
    res.status(201).json({ message: 'comment added successfully!', comment: newComment });
};
module.exports.deleteComment = async (req, res) => { 
    let {id, commentId} = req.params;
    const comment = await Comments.findOne({ _id: commentId, owner: req.user._id });
    if (!comment) {
        return res.status(404).json({ message: 'Comment not found or you are not the owner.' });
    }
    await Material.findByIdAndUpdate(id, { $pull: { comments: commentId } });
    await Comments.findByIdAndDelete(commentId);
    res.status(200).json({ message: 'Comment deleted !!' });
};
module.exports.Liked = async (req, res) => { 
    let {id} = req.params;
    if (!req.user) {
        return res.status(401).json({ message: 'You must be logged' });
    }
    let material = await Material.findById(id);
    if(!material) {
        return res.status(404).json({ message: 'something went wrong!' });
    }
    const userId = req.user._id;
    const userIdString = userId.toString(); 
    const hasLiked = material.likedBy.includes(userIdString);

    if (hasLiked) {
        material.likedBy.pull(userId);
        material.likeCount -= 1;
        await material.save();
        return res.status(200).json({ message: 'unliked.', material });
    } else {
        material.likedBy.push(userId);
        material.likeCount += 1;
        await material.save();
        return res.status(200).json({ message: 'liked.', material });
    }
};
