/**
 * Created by glitch on 27/11/17.
 */

var mongoose = require('mongoose');
var connection = mongoose.connect(process.env.DB); //('mongodb://localhost:27017/concrete');//connecting to our database named concrete
var bcrypt = require('bcrypt');
//creating the USER Schema
var OrderSchema = mongoose.Schema({
    generationDate:{
        type:String,
        required:true
    },
    requiredByDate:{
        type:String,
        required:true
    },
    quantity:{
        type:String,
        required:true
    },
    quality:{
        type:String,
        required:true
    },
    requestedBy:{
        type:String,
        required:true
    },
    requestedById:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    supplierId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    companyName:{
        type:String,
        required:true
    },
    customerSite:{
        type:mongoose.Schema.Types.ObjectId
    },
    status:String,
    statusDate:String,
    statusDesc:String
});


var Order = module.exports = mongoose.model('Order', OrderSchema);

module.exports.getAllOrdersByUserId = function(id, callback){
    Order.find({requestedById:id}, {} , callback);
}

module.exports.getAllOrderdBySupplierId = function(id, callback){
    Order.find({supplierId:id}, {} , callback);
}

module.exports.createOrder = function(newOrder, callback){
    newOrder.save(newOrder, callback);
}

module.exports.cancelOrder = function(orderId, reason, callback){
    Order.findOne({_id:orderId}, function(err, order){
        if(err)throw err;
        order.statusDesc = reason;
        order.status = 'cancelled';
        order.statusDate = Date.now();
        order.save(function(err){
            callback(err, order);
        });
    })
}   


module.exports.getOrdersForResponseBySupplierId = function(id, callback){
    Order.find({ supplierId:id ,status:'submitted'}, callback);
}


module.exports.updatePendingOrder = function(orderId, status, statusDesc, statusDate, callback){
    Order.findOneAndUpdate({_id:orderId}, {status:status, statusDesc:statusDesc, statusDate:statusDate}, callback);
}