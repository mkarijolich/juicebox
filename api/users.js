const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');

const { getAllUsers, getUserByUsername, createUser, getUserById, updateUser} = require('../db');
const { requireActiveUser } = require('./utils');

usersRouter.use((req,res,next) => {
    console.log("A request is being made to /users");

    next();
});


usersRouter.get('/', async (req,res) => {//That endpoint will fire whenever a GET request is made to /api/users
    
    const users = await getAllUsers();

    res.send({ //store users to res.body{}
        users
    });
});

usersRouter.post('/login', async(req,res,next) => {
    const { username, password } = req.body; // destructure username and password from req.body{}

    if(!username || !password){//request must have both
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        const user = await getUserByUsername(username);//pass username(req.body) to getUserByUsername and call the func

        if( user && user.password === password) {//verify user && user.password from getUserByUsername and password from req.body
            //create token & return to user
            const userData = { // create userData obj and store id and username from line 35
                id: user.id,
                username: user.username
            };
            const token = jwt.sign(userData, process.env.JWT_SECRET) 

            res.send({ // set message and token res {} and send back
                message: "you are logged in",
                token:token
                });
        }else{
            next({
                name: 'IncorrectCredentialsError', 
                message: 'Username or password is incorrect'
            });
        }
    }catch(error){
        console.log(error);
        next(error);
    }
});

usersRouter.post('/register', async(req,res,next) => {
    const { username, password, name, location } = req.body;//destructure and get them from req.body{}

    try {
        const _user = await getUserByUsername(username);

        if(_user) {//if _user already exists, will display message
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }

        const user = await createUser({//if _user doesn't exists,do below
            username,
            password,
            name,
            location
        });

        const token = jwt.sign({
            id: user.id,
            username
        },process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "thank you for signing up",
            token 
        });
    }catch ({ name, message }) {
        next({ name, message })
    }
});

usersRouter.delete('/:userId', requireActiveUser, async (req, res, next) => {
    try {
      const user = await getUserById(req.params.userId);
  
      if (user && user.id === req.user.id) {
        const updatedUser = await updateUser(user.id, { active: false });
  
        res.send({ post: updatedUser });
      } else {
        
        next(user ? { 
          name: "UnauthorizedUserError",
          message: "You cannot delete a user which is not yours"
        } : {
          name: "UserNotFoundError",
          message: "That user does not exist"
        });
      }
  
    } catch ({ name, message }) {
      next({ name, message })
    }
  });









module.exports = usersRouter;

//Any time a request is made to a path starting with /api the apiRouter will be held responsible for making decisions, calling middleware, etc.
// apiRouter will match paths now with the /api portion removed
// This means that if we hit /api/users, apiRouter will try to match /users (which it can), and it will then pass on the responsibility to the usersRouter
// Finally usersRouter will try to match (now with /api/users removed from the original matching path), and fire any middleware.