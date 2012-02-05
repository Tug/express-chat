
module.exports = function(app, model) {

    var mongoose = model.mongoose;
    var randomString = app.libs.util.randomString;

    var Room = new mongoose.Schema({
          _id             : { type: String, index: {unique: true}, default: randomString }
        , title           : String
        , creationDate    : { type: Date, default: Date.now }
        , deathDate       : Date
        , messageCount    : {type: Number, default: 0 }
        , ispublic        : {type: Boolean, default: false, index: true}
    });

    Room.statics.exist = function(roomid, callback) {
        RoomModel.count({_id: roomid}, callback);
    };

    Room.methods.publicFields = function() {
        return {
            id            : this._id,
            creationDate  : this.creationDate,
            title         : this.title,
            messageCount  : this.messageCount
        };
    };
    
    var RoomModel = mongoose.model('Room', Room);
    return RoomModel;
}

