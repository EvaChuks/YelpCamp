// SCHEMA
var mongoose   = require("mongoose");
var campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
    imageId: String,
    descriptions: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    comment: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "comment"
        
    }
    ]
},{usePushEach: true});
module.exports = mongoose.model("Campground", campgroundSchema);