
module.exports = function(app, model) {
    
    var mongoose = model.mongoose;
    
    var Message = new mongoose.Schema({
        roomid      : { type: String, index: true }
      , num         : { type: Number, index: true }
      , username    : String
      , userip      : String
      , body        : String
      , date        : { type: Date, default: Date.now }
    });
    
    

    Message.pre('save', function(next) {
        var RoomModel = mongoose.model('Room');
        var self = this;
        //TODO: update query with fields = { "messageCount: 1 } when available in node-mongodb-native
        RoomModel.collection.findAndModify( {_id: self.roomid},
                                            [],
                                            {$inc: {messageCount: 1}},
                                            {new: true},
                                            function(err, doc) {
            if(err) next(err);
            else {
                self.num = doc.messageCount;
                next();
            }
        });
    });

    Message.statics.allFrom = function(roomid, messageNum, callback) {
        MessageModel.find({'roomid': roomid})
               .where('num').gte(messageNum)
               .only('num','username', 'body', 'date')
               .run(callback);
    };

    Message.methods.publicFields = function() {
        return {
            num         : this.num
          , username    : this.username
          , body        : this.body
          , date        : this.date
        };
    };
    
    var MessageModel = mongoose.model('Message', Message);
    return MessageModel;
}

