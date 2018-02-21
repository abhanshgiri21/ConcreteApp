var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var nodemailer = require('nodemailer');
//this is used for generating SVG Captchas
var svgCaptcha = require('svg-captcha');
var async = require('async');
var jwt = require('jsonwebtoken');
const secret = "supersecretkey";

//importing passport and its local strategy
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var LocalStrategy = require('passport-local').Strategy;

//here we import the User model
var User  = require('../models/User');
var Order = require('../models/Orders');
var Issue = require('../models/Issues');
var Quote = require('../models/Quotations');
var PO    = require('../models/PurchaseOrder');


//These are all the get requests

/* GET home page. */
router.get('/', isAuthenticated, function(req, res, next){
    console.log(res.locals);
    getAllUserDashboardDetails(req, res, res.locals.userId);
    
});

//for getting signup page
router.get('/signup', function(req, res, next){
    res.render('signup');
});



function getAllUserDashboardDetails(req, res, userId, token){
    

    async.parallel({
        orders: function(callback) {
            Order.getAllOrdersByUserId(userId, callback)
        },
        issues: function(callback) {
            Issue.getAllIssuesByUserId(userId, callback)
        },
        quotes: function(callback){
            Quote.getAllQuotesByUserId(userId, callback)
        }
    }, function(err, results) {
        // results is now equals to: {one: 1, two: 2}
        if(err){
            return handleError(err);
        }
        return res.json({
            success:true, 
            results:results,
            token:token
        })
    });
    
}


//These are all the POST requests

//POST for login
//this takes username, password and captcha
router.post('/login', function(req, res, next){

    //extracting all the info from request parameters
    var username = req.body.username;
    var password = req.body.password;
    //var captcha = req.body.captcha;
    //console.log(req);
    //checking all the form-data is right
    req.checkBody('username', 'please enter a valid username').isEmail();
    req.checkBody('password', 'please enter a valid password').notEmpty();
    //req.checkBody('captcha', 'Captcha is incorrect').equals(req.session.captcha);
    console.log('login hit');
    //console.log(req.body);
    //getting all the validation errors
    var errors = req.validationErrors();
    if(errors){
        res.send(errors)
    }else{
        //console.log('else called');
        console.log(username, password);
        //checking the user credentials for loggin him in with session
        User.findByUsername(username, function (err, user) {
            if(err){
                console.log(err);
                return handleError(err, null, res);
            }
            console.log(user);
            if(!user){
                console.log("user with username : " + username + " not found");
                msg = "user with this username does not exist";
                return handleError(null, msg, res);
            }
            User.comparePassword(password, user.password, function (err, isMatch) {
                if(err){
                    return handleError(err, null, res);
                }
                if(!isMatch){
                    return handleError(null, "wrong password", res);
                }
                jwt.sign({id: user._id}, secret, function(err, token){
                    if(err)handleError(err, null, res);
                    return getAllUserDashboardDetails(req, res, user._id, token);
                })
            });

        });

    }
});


//this route is for creating new user
router.post('/signup', function(req, res, next){
    var name = req.body.name;
    var email = req.body.email;
    var custType = req.body.customertype || 'Buyer' ;
    var contact = req.body.contact;
    var pan = req.body.pan || null;
    var gstin = req.body.gstin || null;
    var password = req.body.password;
    var password2 = req.body.password2;
    var userType = 'contractor';

    //console.log(req.body.name);
    //console.log(name);

    req.checkBody('name', 'Name cannot be empty').notEmpty();
    req.checkBody('email', 'Email cannot be empty').notEmpty();
    req.checkBody('contact', 'contact cannot be empty').notEmpty();
    req.checkBody('pan', 'Pan cannot be empty').notEmpty();
    //req.checkBody('gstin', 'GSTIN cannot be empty').notEmpty();
    req.checkBody('email', "Enter a valid email").isEmail();
    req.checkBody('password', 'password cannot be empty').notEmpty();
    req.checkBody('password2', 'confirm password cannot be empty').notEmpty();
    req.checkBody('password', 'Passwords do not match').equals(password2);

    var errors = req.validationErrors();
    //console.log(errors);

    if(errors){
        //console.log(errors);
        return handleError(errors, null, res);
    }else{
        //console.log('else block called');
        var newUser = new User({
            name:name,
            email:email,
            custType:custType,
            contact:contact,
            pan:pan,
            gstin:gstin,
            password:password,
            userType:userType
        });

        User.createUser(newUser, function (err, user) {
            if(err){
                return handleError(err, null, res);
            }else{
                //console.log(user);
                res.json({
                    success:true,
                    msg: 'user created'
                });
            }
        });
    }
});

//this route is used to add a customer site
router.post('/addsite', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;
    
        var name = req.body.name;
        var lat = req.body.lat;
        var long = req.body.long;
        var address = req.body.address;

        req.checkBody('name', 'Name cannot be empty').notEmpty();
        req.checkBody('lat', 'lat cannot be empty').notEmpty();
        req.checkBody('long', 'long cannot be empty').notEmpty();
        req.checkBody('address', 'address cannot be empty').notEmpty();

        var errors = req.validationErrors();
        //console.log(errors);

        if(errors){
            //console.log(errors);
            res.send(errors);
        }else{
            //console.log('else block called');
            var customerSite = {
                name:name,
                lat:lat,
                long:long,
                address:address
            };
            //console.log(customerSite);

            User.addSite(customerSite, userId, function (err, user) {
                if(err){
                    return handleError(err, null, res);
                }else{
                    //console.log(user);
                    res.json({
                        success:true,
                        msg: 'user created'
                    });
                }
            })
        }
    });
})


//this route deletes site from the site array in user document
router.post('/deletesite', function(req, res){
    //change this to pick userid from req header and site id  from req.body

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;
    
        User.removeSite( userId, req.body.siteid, function(err, site){
            if(err){
                return handleError(err, null, res);
            }
            res.json({
                success:true,
                msg:"site deleted",
                site:site
            })
        });
    });
});



//this route returns the profile info of the current logged in user
router.get('/profile', function(req,res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;
    
        User.findOneById( userId, function(err, user){
            if(err){
                return handleError(err, null, res);
            }
            res.json({
                success:true,
                user:user
            });
        });
    });
});

//this route is called as POST when profile change is required
router.post('/profile', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

    
        var id = userId;
        var name = req.body.name;
        var email = req.body.email;
        var contact = req.body.contact;
        var pan = req.body.pan;
        var gstin = req.body.gstin;

        //console.log(req.body.name);
        //console.log(name);

        req.checkBody('id', 'id cannot be empty').notEmpty();
        req.checkBody('name', 'Name cannot be empty').notEmpty();
        req.checkBody('email', 'Email cannot be empty').notEmpty();
        req.checkBody('contact', 'contact cannot be empty').notEmpty();
        req.checkBody('pan', 'Pan cannot be empty').notEmpty();
        req.checkBody('gstin', 'GSTIN cannot be empty').notEmpty();
        req.checkBody('email', "Enter a valid email").isEmail();
        
        var errors = req.validationErrors();
        //console.log(errors);

        if(errors){
            //console.log(errors);
            return handleError(errors, null, res);
        }else{
            User.findOneById(id, function(err, user){
                if(err){
                    handleError(err, null, res);
                }
                user.name = name;
                user.email = email;
                user.contact = contact;
                user.pan = pan;
                user.gstin = gstin;

                User.updateUser(id, user, function(err){
                    if(err){
                        handleError(err, null, res);
                    }
                    res.json({
                        success:true,
                        user:user
                    })
                })
            })
        }
    });
});




//this route returns all the order(cancelled as well as successful)
router.get('/history', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;


        Order.getAllOrderdByUserId( userId, function(err, orders){
            res.json(orders);
        });
    });
});



//this is post for forgot password which requires user's email id
router.post('/forgot', function(req, res){
    var email = req.body.email;
    
    User.findOneByEmail(email, function(err, user){
        if(err){
            return handleError(err, null, res)
        }
        if(!user){
            return handleError(null, "no user with this username exists", res);
        }
        crypto.randomBytes(20, function(err, buf){
            if(err){
                return handleError(err, null, res);
            }
            var token = buf.toString('hex');
            user.resetPasswordToken = token;
            user.resetPasswordExpire = Date.now() + 3600000; //1hour

            user.save(function(err){
                if(err){
                    return handleError(err, null, res);
                }
            });

            var smtpTransport = nodemailer.createTransport({
                service:'SendGrid',
                auth:{
                    user:'jarvis123',
                    pass:'abhansh@123'
                }
            });
            var mailOptions = {
                to:user.email,
                from:'passwordreset@demo.com',
                subject:'concrete password reset',
                text:'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err){
                if(err){
                    return handleError(err, msg, res);
                }
                res.json({
                    success:true,
                    msg:"a mail has been sent to your registered mail id"
                });
            })
        })
    })
});

//this route will verify the password token hasn't expire and returns a json response
router.get('/reset/:token', function(req, res) {
    User.findOneForResetPassword(req.params.token, function(err, user) {
      if (!user) {
          var result = {
              err:true,
              msg:'Password reset token is invalid or has expired.'
          }
        return res.status(200).json(result);
      }
      var result = {
          msg:"reset your password", 
          user:user
      }
      res.status(200).json(result);
    });
});

//POST for password reset and if token hasn't expired, the password of user is reset.
router.post('/reset/:token', function(req, res){
    User.findOneForResetPassword(req.params.token, function(err, user){
        if(err){
            return handleError(err);
        }
        if(!user){
            var result = {
                msg:"this token has expired"
            }
            return res.status(200).json(result);
        }
        user.password = req.body.password;
        user.resetPasswordExpire = undefined;
        user.resetPasswordToken = undefined;

        User.saveUserResetPassword(user, function(err){
            if(err){
                return handleError(err, null, res);
            }
            req.logIn(user, function(err){
                res.status(200).json("password has been reset successfully");
            });
        });
    });
});


router.post('/requestquote', function(req, res){
    //console.log(req);

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

        var quality = req.body.quality;
        var quantity = req.body.quantity;
        var customerSite = req.body.customerSite;
        var generationDate =  Date.now();
        var requiredDate = req.body.requiredDate;
        var requestedBy = req.user.name;
        var requestedById = userId;

        req.checkBody('quantity', 'quantity cannot be empty').notEmpty();
        req.checkBody('quality', 'quality cannot be empty').notEmpty();
        req.checkBody('customerSite', 'customerSite cannot be empty').notEmpty();
        req.checkBody('requiredDate', 'requiredDate cannot be empty').notEmpty();

        var errors = req.validationErrors();
        console.log(errors);
        
        if(errors){
            return handleError(errors, null, res);
        }else{
            var newQuote = new Quote({
                quantity : quantity,
                quality : quality,
                customerSite : customerSite,
                generationDate : generationDate,
                requiredDate : requiredDate,
                requestedBy : requestedBy,
                requestedById : requestedById
            });

            Quote.addQuote(newQuote, function(err, quote){
                if(err){
                    return handleError(err, null, res);
                }
                res.json('new request for quote submitted for ' + quote.quantity + ' of ' + quote.quality  + ' quality redimix.');
            })
        };
    });
});


//this route will cancel an existing quote that was created by contractor
router.post('/cancelquote', function(req, res){
    
    var quoteId = req.body.quoteId;
    console.log(quoteId);
    //console.log(req.body);
    Quote.cancelQuote(quoteId, function(err, quote){
        if(err){
            return handleError(err, null, res);
        }
        res.json('quote is cancelled' + quote);
    })
});


//this route will create a purchase order between contractor and supplier
router.post('/createpo', function(req, res){
    
    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

        var generationDate = Date.now();
        var validTill = req.body.validTill;
        var quantity = req.body.quantity;
        var quality = req.body.quality;
        var price = req.body.price;
        var customerSite = req.body.customerSite;
        var requestedBy = req.body.requestedBy;
        var requestedById = userId;
        var supplierId = req.body.supplierId;

        var newPO = new PO({
            generationDate : generationDate,
            validTill : validTill,
            quantity : quantity,
            quality : quality,
            price : price,
            customerSite : customerSite,
            requestedBy : requestedBy,
            requestedById : requestedById,
            supplierId : supplierId,
            confirmedBySupplier:false
        });

        PO.createPO(newPO, function(err, PO){
            if(err){
                return handleError(err, null, res);
            }
            res.json('PO created ' + PO);
        });
    });
});


//this api will delete PO from from the contractor side but it will still be visible for the sake of history
router.post('/deletepo', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

        var id = req.body.id;

        PO.deletePOByContractor(id, function(err, po){
            if(err){
                return handleError(err, null, res);
            }
            res.send('the PO has been deleted' + po);
        });
    });
})



//API to add an Order
router.post('/addorder', function(req, res, next){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

        var date = Date.now();
        var requiredByDate = req.body.requiredDate;
        var quantity = req.body.quantity;
        var quality = req.body.quality;
        var requestedBy = req.body.requestedBy;
        var requestedById = userId;
        var supplierId = req.body.supplierId;
        var companyName = req.body.companyName;
        var customerSite = req.body.customerSite;
        var status = 'submitted';
        var statusDate = Date.now();
        var statusDesc = 'Your orders is submitted and is waiting to get confirmation from seller';

        //console.log(req.body.quantity);
        //console.log(quantity);

        req.checkBody('quantity', 'quantity cannot be empty').notEmpty();
        req.checkBody('quality', 'quality cannot be empty').notEmpty();
        req.checkBody('requestedBy', 'requestedBy cannot be empty').notEmpty();

        var errors = req.validationErrors();
        //console.log(errors);

        if(err){
            return handleError(err, null, res);
        }else{
            //console.log('else block called');
            var newOrder = new Order({
                generationDate:date,
                requiredByDate:requiredByDate,
                quality:quality,
                quantity:quantity,
                requestedBy:requestedBy,
                requestedById:requestedById,
                supplierId:supplierId,
                companyName:companyName,
                customerSite:customerSite,
                status:status,
                statusDate:statusDate,
                statusDesc:statusDesc
            });

            Order.createOrder(newOrder, function (err, order) {
                if(err){
                    return handleError(err, null, res);
                }else{
                    //console.log(order);
                    res.status(200).json({
                        success:true,
                        msg:'order created',
                        order:order
                    });
                }
            })
        }
    });
});



//this api is for cancelling a order and it takes an orderId and cancellation reason
router.post('/cancelorder', function(req, res){
    var orderId = req.body.orderId;
    var reason = req.body.reason;
    console.log(orderId);
    console.log(reason);
    console.log(req.body);
    Order.cancelOrder(orderId, reason, function(err, order){
        if(err){
            return handleError(err, null, res);
        }
        res.send('order is cancelled' + order);
    })
});



//this post request is to add issues with some orders
router.post('/addissue', function(req, res){

    jwt.verify(req.headers.authorization, secret, function(err, decoded){
        if(err){
            //console.log("%%%%%%%%%%%%%%%%%%%" + err);
            res.json({
                msg:"some error occured"
            })
            return;
        }
        var userId =  decoded.id;

        //console.log(req.user);
        var title = req.body.title;
        var description = req.body.description;
        var orderId = req.body.orderId;
        var userId = req.userId;
        var type = req.body.type;
        var date = Date.now();
        var status = 'submitted to manager';

        req.checkBody('title', 'title cannot be empty').notEmpty();
        req.checkBody('description', 'description cannot be empty').notEmpty();
        req.checkBody('orderId', 'orderId cannot be empty').notEmpty();
        req.checkBody('type', 'type cannot be empty').notEmpty();

        var errors = req.validationErrors();
        console.log(errors);
        
        if(errors){
            res.send(errors, null, res);
        }else{
            var newIssue = new Issue({
                title:title,
                type:type,
                description:description,
                orderId:orderId,
                userId:userId,
                date:date,
                status:status
            });

            Issue.addIssue(newIssue, function(err, issue){
                if(err){
                    return handleError(err, null, res);
                }
                res.json({
                    success:true,
                    issue:issue,
                    msg:"issue raised successfully"
                })
            })
        }
    });
});



//this function checks if the user is in session or not
function isAuthenticated(req, res, next){
    if(req.headers['x-access-token']){
        jwt.verify(req.headers['x-access-token'], secret, function(err, decoded){
            if(err){
                console.log(err);
                return handleError(err, null, res);
            }
            res.locals.userId = decoded.id;
            console.log("calling next now and " + res.locals.userId);
            return next();
        })
    }else{
        res.json({
            success:false,
            auth:false,
            msg:"authentication unsuccessful, please login again"
        });
    }
}

//this function is a general error handler
function handleError(err, msg, res){
    console.log(err);
    if(msg == undefined){
        msg = "there was some error at the server";
    }
    return res.json({
        success:false,
        msg: msg,
        err:err
    });
}
module.exports = router;

































//after this, the routes are not required in app 

//Passport serializing and deserializing user from a session
passport.serializeUser(function(user, done) {
    //console.log('user serialized');
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findOneById(id, function(err, user) {
        done(err, user);
    });
});



//creating passport local strategy for login with email and password
passport.use(new LocalStrategy(

    function (username, password, done) {
        console.log('local st called')
        User.findByUsername(username, function (err, user) {
            if(err){
                return done(err);
            }
            if(!user){
                console.log("user with username : " + username + " not found");
                done(null, false, {usermsg:"user with this username does not exist"});
            }
            User.comparePassword(password, user.password, function (err, isMatch) {
                if(err)throw err;
                if(!isMatch){
                    return done(null, false, {passmsg:"Password is incorrect"});
                }
                return done(null, user);
            });

        })
    }
));


//for login page
router.get('/login', function(req, res, next){
    //here we generate captcha
    var captcha = svgCaptcha.create();
    //now we store the captcha text in req.session object
    // for later verification on POST
    req.session.captcha = captcha.text;

    //we send along the captcha SVG(image) in the captcha variable
    res.render('login',{
        captcha:captcha.data
    });
});
