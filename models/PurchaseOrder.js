/**
 * Created by glitch on 27/11/17.
 */

var mongoose = require('mongoose');
var connection = mongoose.connect(process.env.DB); //('mongodb://localhost:27017/concrete');//connecting to our database named concrete
var bcrypt = require('bcrypt');
//creating the USER Schema
var POSchema = mongoose.Schema({
    generationDate:{
        type:String,
        required:true
    },
    validTill:{
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
    price:{
        type:Number,
        required:true
    },
    customerSite:{
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
    confirmedBySupplier:{
        type:Boolean,
        default:false
    },
    deletedByContractor:{
        type:Boolean,
        default:false
    }
});


var PO = module.exports = mongoose.model('PO', POSchema);

module.exports.createPO = function(newPO, callback){
    newPO.save(newPO, callback);
}

module.exports.deletePOByContractor = function(id, callback){
    PO.findOneAndUpdate({_id:id}, {deletedByContractor:true}, callback);
}

module.exports.confirmPOBySupplier = function(id, callback){
    PO.findOneAndUpdate({_id:id}, {confirmedBySupplier:true}, callback);
}

module.exports.findPendingPOSupplier = function(id, callback){
    PO.find({supplierId:id}, callback);
}

module.exports.findPoByContractor = function(id, callback){
    PO.find({requestedById: id} , callback);
}