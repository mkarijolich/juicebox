const express = require('express');
const postsRouter = express.Router();
const { getAllPosts, updatePost,createPost,getPostById } = require('../db');
const { requireActiveUser } = require('./utils');

postsRouter.use((req,res,next) => {
    console.log("A request is being made to /posts");

    next();
});

postsRouter.post('/', requireActiveUser, async (req, res, next) => {//create post
    
    const { title, content, tags = "" } = req.body; //destructure and get them from req.body
    // tag = "" --> default value
    const tagArr = tags.trim().split(/\s+/) //" #happy #bloated #full" --> tagArr will be equal to ["#happy", "#boated", "#full"]
    const postData = {};

    if(tagArr.length) { // if there is data in tagArr,set postData{tags:tagArr}
        postData.tags = tagArr;
    }

    try {
        postData.authorId = req.user.id; //set postData{authorId:req.user.id} reference to req.user 
        postData.title = title;          //set postData{title:title(req.body)}
        postData.content = content;      //set postData{content:content(req.body)}

        const post = await createPost(postData);//pass the postData to createPost and call the func
        if(post){
            res.send({ post });
        }else{
            next({
                name:"Post Creation Error",
                message: "Post Creation Error"
            });
        }
    }catch({name,message}){
        next({name,message}) ;
    }
});




postsRouter.get('/', async (req, res, next) => {
    try {
      const allPosts = await getAllPosts();
  
      const posts = allPosts.filter(post => {
        // if author is inactive and if logged in user is not author,do not display the posts by inactive user

        if(post.author.active === false && post.author.id !==req.user.id){
            return false;
        }

        // keep a post if it is either active, or if it belongs to the current user
        if(post.active) {
            return true;
        }
        // the post is not active, but it belongs to the current user
        if (req.user && post.author.id === req.user.id) {
            return true;
        }// none of the above are true
        return false;
      });
  
      res.send({
        posts
      });
    } catch ({ name, message }) {
      next({ name, message });
    }
  });

postsRouter.patch('/:postId', requireActiveUser, async (req, res, next) => {
    const { postId } = req.params;
    const { title, content, tags } = req.body;
  
    const updateFields = {};
  
    if (tags && tags.length > 0) {
      updateFields.tags = tags.trim().split(/\s+/);
    }
  
    if (title) {
      updateFields.title = title;
    }
  
    if (content) {
      updateFields.content = content;
    }
  
    try {
      const originalPost = await getPostById(postId);
  
      if (originalPost.author.id === req.user.id) {
        const updatedPost = await updatePost(postId, updateFields);
        res.send({ post: updatedPost })
      } else {
        next({
          name: 'UnauthorizedUserError',
          message: 'You cannot update a post that is not yours'
        })
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
});


postsRouter.delete('/:postId', requireActiveUser, async (req, res, next) => {
    try {
      const post = await getPostById(req.params.postId);
  
      if (post && post.author.id === req.user.id) {
        const updatedPost = await updatePost(post.id, { active: false });
  
        res.send({ post: updatedPost });
      } else {
        // if there was a post, throw UnauthorizedUserError, otherwise throw PostNotFoundError
        next(post ? { 
          name: "UnauthorizedUserError",
          message: "You cannot delete a post which is not yours"
        } : {
          name: "PostNotFoundError",
          message: "That post does not exist"
        });
      }
  
    } catch ({ name, message }) {
      next({ name, message })
    }
  });

















module.exports = postsRouter;

