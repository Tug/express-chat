
var mongoose = require('mongoose')
  , ObjectId = mongoose.Schema.ObjectId;

module.exports = function(app, model) {
    
    var Counter = new mongoose.Schema({
        _id     : String
      , value   : {type: Number, default: 0}
    });

    Counter.statics.getNextValue = function(roomid, callback) {
        var self = this;
        var counter = new CounterModel({_id: roomid, value: 0});
        counter.save(function(errSave) {
            CounterModel.findByIdAndUpdate(roomid, {$inc: {value: 1}}, function(errUpdate, theCounter) {
                var value = theCounter && theCounter.value;
                callback(errUpdate, value);
            });
        });
    };

    Counter.statics.reset = function(roomid, callback) {
        CounterModel.collection.remove({_id: roomid}, callback);
    };
    
    var CounterModel = mongoose.model('Counter', Counter);
    
    return CounterModel;
}

