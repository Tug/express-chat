
module.exports = function(app, model) {
    
    var mongoose  = app.libs.mongoose;
    
    var Message = new mongoose.Schema({
        roomid      : { type: String, index: true }
      , num         : { type: Number, index: true }
      , username    : String
      , userip      : String
      , body        : String
      , date        : { type: Date, default: Date.now }
    },
    {safe: undefined});
    
    Message.pre('save', function(next) {
        var RoomModel = model.mongoose.model('Room');
        var self = this;
        RoomModel.findByIdAndUpdate(self.roomid,
                                    {$inc: {messageCount: 1}},
                                    {select: 'messageCount'},
                                    function(err, doc) {
            if(err || !doc) next(err || new Error('doc is null'));
            else {
                self.num = doc.messageCount;
                next();
            }
        });
    });

    Message.statics.allFrom = function(roomid, messageNum, callback) {
        MessageModel
        .where('roomid', roomid)
        .where('num').gte(messageNum)
        .sort('num')
        .exec(callback);
    };

    Message.methods.publicFields = function() {
        return {
            num         : this.num
          , username    : this.username
          , body        : this.body
          , date        : this.date
        };
    };
    
    var MessageModel = model.mongoose.model('Message', Message);
    return MessageModel;
}

