
module.exports = function(app, model) {
    
    var mongoose = model.mongoose,
        ObjectId = mongoose.Schema.ObjectId;

    var Counter = new mongoose.Schema({
        _id     : String
      , value   : {type: Number, default: 0}
    });

    Counter.statics.getNextValue = function(roomid, callback) {
        var self = this;
        var collection = CounterModel.collection;
        collection.insert({_id: roomid, value: 0}, function(err, docs) {
            collection.findAndModify({_id: roomid}, [], {$inc: {value: 1}}, {new: true}, function(err, theCounter) {
                var value = theCounter && theCounter.value;
                callback(err, value);
            });
        });
    };

    Counter.statics.reset = function(roomid, callback) {
        CounterModel.collection.remove({_id: roomid}, callback);
    };
    
    var CounterModel = mongoose.model('Counter', Counter);
    return CounterModel;
}

