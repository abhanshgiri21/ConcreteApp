/**
 * Created by glitch on 27/11/17.
 */

var mongoose = require('mongoose');
var connection = mongoose.connect('mongodb://localhost:27017/concrete');//('mongodb://localhost:27017/concrete');//connecting to our database named concrete
var bcrypt = require('bcrypt');
//creating the USER Schema
var UserSchema = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    custType:{
        type:String
    },
    email:{
        type:String,
        required:true
    },
    contact:{
        type:Number,
        required:true
    },
    userType:{
        type:String,
        required:true
    },
    pan:{
        type:String,
        required:true
    },
    gstin:{
        type:String,
        required:true
    },
    password:{
        type:String,
        bcrypt:true,
        required:true
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpire:{
        type:String
    },
    customerSite:[{
        name:{
            type:String
        },
        lat:{
            type:String
        },
        long:{
            type:String
        },
        address:{
            type:String
        }
    }]
});


var User = module.exports = mongoose.model('User', UserSchema);

module.exports.findByUsername = function (username, callback) {
    console.log(username);
    User.findOne({email:username}, callback);
};

module.exports.createUser = function (newUser, callback) {
    bcrypt.hash(newUser.password, 10, function(err, hash){
        if(err)throw err;
        newUser.password = hash;
        newUser.save(newUser, callback);
    });
};

module.exports.comparePassword = function(candidatePassword, password, callback){
    bcrypt.compare(candidatePassword, password, function(err, isMatch){
        if(err)return callback(err, false);
        return callback(null, isMatch);
    })
}

module.exports.findOneById = function(id, callback){
    User.findOne({_id:id}, {}, callback);
}

module.exports.findOneByEmail = function(email, callback){
    User.findOne({email:email}, callback);
}
module.exports.findOneForResetPassword = function(resetPasswordToken, callback){
    User.findOne({resetPasswordToken:resetPasswordToken, resetPasswordExpire: {$gt:Date.now()}}, callback)
}
module.exports.saveUserResetPassword = function(user, callback){
    bcrypt.hash(user.password, 10, function(err, hash){
        if(err)throw err;
        user.password = hash;
        user.save(callback); 
    });    
}
module.exports.updateUser = function(id, newUser, callback){
    User.findOneAndUpdate({_id:id}, newUser, callback);
}

module.exports.addSite = function(customerSite, id,callback){
    console.log(customerSite);
    User.findOneAndUpdate({_id:id}, {$push: {'customerSite':customerSite}}, {safe:true, upsert:true}, callback);   
}

module.exports.removeSite = function(userid, siteid, callback){
    User.findOneAndUpdate({_id:userid}, {$pull: {customerSite : {_id:siteid}}},callback);
}