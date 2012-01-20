
module.exports = function(app, model) {
    
    var mongoose = model.mongoose,
        ObjectId = mongoose.Schema.ObjectId;

    var Counter = new mongoose.Schema({
        _id     : String
      , value   : {type: Number, default: 0}
    });

    Counter.methods.getNextValue = function(callback) {
        var self = this;
        this.save(function(err) {
            CounterModel.collection.findAndModify( {_id: self._id},
                                                [],
                                                {$inc: {value: 1}},
                                                {new: true},
                                                function(err, doc) {
                if(err) callback(err, null);
                else {
                    self.value = doc.value;
                    callback(null, doc.value);
                }
            });
        });
    };

    Counter.methods.reset = function(callback) {
        this.value = 0;
        this.save(callback);
    };
    
    var CounterModel = mongoose.model('Counter', Counter);
    return CounterModel;
}

