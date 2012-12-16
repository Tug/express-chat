
module.exports = function(app, model) {

    var mongoose      = app.libs.mongoose;
    var randomString  = app.libs.util.randomString;
    var life = 2 * 24 * 60 * 60 * 1000; // 2 days

    var Room = new mongoose.Schema({
          _id             : { type: String, index: {unique: true}, default: randomString }
        , title           : String
        , creationDate    : { type: Date, default: Date.now }
        , deathDate       : Date
        , messageCount    : {type: Number, default: 0 }
        , ispublic        : {type: Boolean, default: false, index: true}
        , users           : [{ type: String }]
    },
    {safe: undefined});

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

    Room.pre('save', function(next) {
        this.deathDate = new Date(Date.now()+life);
        next();
    });

    Room.post('remove', function() {
        var MessageModel = model.mongoose.model('Message');
        var CounterModel = model.mongoose.model('Counter');
        MessageModel.allFrom(this._id, 0, function(err, messages) {
            if(messages != null) {
                messages.forEach(function(msg) {
                    msg.remove();
                });
            }
        });
        CounterModel.reset(this._id, function() {});
    });
    
    var RoomModel = model.mongoose.model('Room', Room);
    return RoomModel;
}

