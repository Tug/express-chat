
module.exports = function(app, model) {
    
    var mongoose = app.libs.mongoose;
    
    var Counter = new mongoose.Schema({
        _id     : String
      , value   : {type: Number, default: 0}
    },
    {safe: undefined});

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
        CounterModel.remove({_id: roomid}, callback);
    };
    
    var CounterModel = model.mongoose.model('Counter', Counter);
    
    return CounterModel;
}

