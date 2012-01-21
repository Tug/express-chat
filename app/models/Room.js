
module.exports = function(app, model) {

    var mongoose = model.mongoose;
    var randomString = app.libs.util.randomString;

    var Room = new mongoose.Schema({
          _id             : { type: String, index: {unique: true}, default: randomString }
        , creationDate    : { type: Date, default: Date.now }
        , deathDate       : Date
        , messageCount    : {type: Number, default: 0 }
        , ispublic        : {type: Boolean, default: false, index: true}
    });

    var RoomModel = mongoose.model('Room', Room);
    return RoomModel;
}

