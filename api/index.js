
const jwt = require('jsonwebtoken');//To create a JSON web token using a combination of a server-side-secret and our user-supplied data
const { getUserById } = require('../db');
const { JWT_SECRET } = process.env;
const express = require('express');
const apiRouter = express.Router();

apiRouter.use(async (req,res,next)=> {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');

    if(!auth) {//IF: The Authorization header wasn't set.
        //we can not set a user if their data isn't passed to us.
        next();
    }else if(auth.startsWith(prefix)){//ELSE IF: It was set, and begins with Bearer followed by a space
        const token = auth.slice(prefix.length);//recover the token

        try{//On successful verify, try to read the user from the database
            const { id } = jwt.verify(token,JWT_SECRET);//recover the data

            if(id){
                req.user = await getUserById(id);//get the user from the database
                next();
            }
        }catch({ name,message }) {//We read the name and message on the error and pass it to next().
            next( {name, message });
        }
    }else {//ELSE: A user set the header, but it wasn't formed correctly. We send a name and message to next()
        next({
            name: 'AuthorizationHeaderError', 
            message: `Authorization token must start with ${ prefix }`
        });
    }
});

apiRouter.use((req,res,next) => {
    if(req.user) {
        console.log("User is set:" , req.user);
    }

    next();
});


const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);

//Now any time middleware that the apiRouter might be the parent router for calls next
// with an object (rather than just next()), we will skip straight to the error handling middleware and send back the object to the front-end.
apiRouter.use((error, req,res,next) => {
    res.send({
        name: error.name,
        message: error.message
    });
});



module.exports = apiRouter;