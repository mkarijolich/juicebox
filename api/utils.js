const express = require('express');


function requireUser(req,res,next) {
    // console.log(req)
    
    if(!req.user) {
    //if the req.user hasn't been set(which means a correct auth token wasn't sent in with the request)
    //send error
        next({
            name:"MissingUserError",
            message: "You must be logged in to perform this action"
        });
    }

    next();
}

function requireActiveUser(req,res,next) {
    if(!req.user || !req.user.active){//
        next({
            name:"MissingActiveUserError",
            message:"You're account is deactivated"
        });
    }

    next();
}



module.exports={
    requireUser,
    requireActiveUser
}