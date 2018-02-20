/**
 * Created by glitch on 27/11/17.
 */

var mongoose = require('mongoose');
var connection = mongoose.connect(process.env.DB); //('mongodb://localhost:27017/concrete');//connecting to our database named concrete
var bcrypt = require('bcrypt');
//creating the USER Schema
var QuoteSchema = mongoose.Schema({
    generationDate:{
        type:String,
        required:true
    },
    requiredDate:{
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
    responses:[{
        rmxId:mongoose.Schema.Types.ObjectId,
        price:Number,
        validTill:String
    }]
});


var Quote = module.exports = mongoose.model('Quote', QuoteSchema);

module.exports.getAllQuotesForSupplier = function(callback){
    console.log("about to find quotes");
    Quote.find({}, callback);
}
module.exports.getAllQuotesByUserId = function(id, callback){
    Quote.find({requestedById:id}, {} , callback);
}

module.exports.addQuote = function(newQuote, callback){
    newQuote.save(newQuote, callback);
}

module.exports.respondToQuote = function(quoteId, response, callback){
    console.log(response);
    Quote.findOneAndUpdate({_id:quoteId}, {$push : {'responses':response}}, {safe:true, upsert:true} , callback);
}

module.exports.deleteResponse = function(quoteId, responseId, callback){
    Quote.findOneAndUpdate({_id:quoteId}, {$pull: {responses:{_id:responseId}}}, callback);
}

module.exports.cancelQuote = function(quoteId, callback){
    Quote.findOneAndRemove({_id:quoteId}, callback);
}