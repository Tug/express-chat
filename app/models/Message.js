
module.exports = function(app, model) {
    
    var mongoose = model.mongoose,
        ObjectId = mongoose.Schema.ObjectId;
    
    var Message = new mongoose.Schema({
        roomid      : { type: String, index: true }
      , num         : { type: Number, index: true }
      , username    : String
      , userip      : String
      , body        : String
      , date        : { type: Date, default: Date.now }
      , _attachment : { type: mongoose.Schema.Types.ObjectId, ref: 'File' }
    });
    
    Message.pre('save', function(next) {
        var RoomModel = mongoose.model('Room');
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

    Message.pre('remove', function(next) {
        if(this._attachment != null) {
            if(this._attachment.remove) {
                this._attachment.remove(next);
            } else {
                Message
                .findById(this._id)
                .populate('_attachment')
                .exec(function(err, file) {
                    this._attachment.remove(next);
                });
            }
        }
        next();
    });

    Message.statics.createEmptyFileMessage = function(roomid, file) {
        return new MessageModel({
            roomid            : roomid
          , username          : file.uploadername
          , userip            : file.uploaderip
          , _attachment       : file
        });
    };

    Message.statics.allFrom = function(roomid, messageNum, callback) {
        MessageModel
        .where('roomid', roomid)
        .where('num').gte(messageNum)
        .sort('num')
        .populate('_attachment')
        .exec(callback);
    };

    Message.methods.publicFields = function() {
        return {
            num         : this.num
          , username    : this.username
          , body        : this.body
          , date        : this.date
          , attachment  : ((this._attachment) ? this._attachment.publicFields() : null)
        };
    };

    
    var MessageModel = mongoose.model('Message', Message);
    return MessageModel;
}

