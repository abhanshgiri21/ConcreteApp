/**
 * Created by glitch on 27/11/17.
 */

var mongoose = require('mongoose');
var connection = mongoose.connect(process.env.DB); //('mongodb://localhost:27017/concrete');//connecting to our database named concrete

//creating the USER Schema
var IssueSchema = mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    type:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    resolved:{
        type:Boolean,
        required:true,
        default:false
    },
    orderId:{
        type:mongoose.Schema.Types.ObjectId
    },
    status:{
        type:String,
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    date:{
        type:String,
        required:true
    }
});


var Issue = module.exports = mongoose.model('Issue', IssueSchema);

module.exports.getAllIssuesByUserId = function(id, callback){
    Issue.find({userId:id}, {} , callback);
}

module.exports.addIssue = function(newIssue, callback){
    newIssue.save(newIssue, callback);
}