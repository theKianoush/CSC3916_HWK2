/*
CSC3916 HW2
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var mongoose = require('mongoose')
var Movie = require('./Movies');
var Review = require('./Reviews');
//require('dotenv').config();

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

//mongoose.Promise = global.Promise;
//const uri = process.env.DB;


//mongoose.connect(uri, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true}).
//catch(err => console.log(err));

//console.log("connected to mongo atlas (users)");


function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err){
                if(err.code == 11000)
                    return res.json({success: false, message: 'A user with that username already exists. '});
                else
                    return res.json(err);

            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });


    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }
        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = {id: user.id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});





//------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------------------


router.route('/movies')




    // POST = supposed to save a single movie to database
    .post(authJwtController.isAuthenticated, function (req, res) {
        if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actors || !req.body.imageUrl  ) {
            res.json({success: false, message: "An input should contian: Title, year released, Genre, imageUrl, and 3 Actors"});
        } else {

            var movie = new Movie();

            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            movie.imageUrl = req.body.imageUrl;

            console.log(Movie);
            movie.save(function(err){

                if (err) {
                    return res.json(err);
                }
                res.json({success: true, msg: 'Movie was saved successfuly.'});
            })

        }
    })


    //PUT = is supposed to FAIL and not return anything because we don't have parameter
    .put(authJwtController.isAuthenticated, function(req, res) {
            res.json({ msg: 'FAIL: need parameter to update movie'});
    })



    //DELETE = is supposed to FAIL and not return anything because we don't have parameter
    .delete(authJwtController.isAuthenticated, function(req, res) {
            res.json({msg: 'FAIL: need parameter to delete movie '});
    })





    // IF we have query params it should return all movies,
    // and each movie should have its reviews appended to the end of it,
    // as well as one extra field appended to the end -ratings field
    // it should also return all movies sorted by average rating in descending order

    // ELSE it will just print all movies in collection
    .get(authJwtController.isAuthenticated, function (req,res){           // searches for one
        if (req.query && req.query.reviews && req.query.reviews === "true") {

            Movie.find({}, function (err, movies) {
                if (err) throw err;
                else {


                    Movie.aggregate([{
                        $lookup: {
                            from: "reviews",
                            localField: "title",
                            foreignField: "title",
                            as: "reviews"
                        }
                    }, {
                        $addFields: {avgRating: {$avg: "$reviews.rating"}}
                    }, {$sort:
                            {avgRating: -1}
                    }
                    ]).exec(function (err, movies) {
                        if (err) {
                            res.json(err);
                        } else {

                            res.json(movies);
                        }
                    })

                }

            })
        }
        else{
            Movie.find({}, function(err, movies) {
                if (err) throw err;
                else {res.json(movies);}
            })
        }

});



//-----------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------





router.route('/movies/:movieId')





    //POST = is supposed to FAIL and not return anything
    .post(authJwtController.isAuthenticated, function(req, res) {
        res.json({msg: 'FAIL: movie is already saved'});
    })



    //PUT = is supposed to update movie with parameter
    .put(authJwtController.isAuthenticated, function(req, res) {
        Movie.findByIdAndUpdate(req.params.movieId, {$set:req.body}, function (err, movie) {
            if (err) {
                res.send(err);
                console.log(err);
            }

            res.json({success:true, movieupdated: movie});
        });

    })



    // DELETE === is supposed to delete movie with parameter
    .delete(authJwtController.isAuthenticated, function(req, res) {
        Movie.findByIdAndDelete(req.params.movieId, function (err) {
            if (err) {
                res.send(err);
                console.log(err);
            }

            res.json({success: true, message: "movie deleted"});
        });
    })






    // GET = gets a movie with the movieId parameter
    // if we have the query param = true, then we will append the review for that movie to the end of the movie
    // if not we will just get the movie with movieId
    .get(authJwtController.isAuthenticated, function (req,res) {

        if (req.query && req.query.reviews && req.query.reviews === "true") {

            Movie.findById(req.params.movieId, function (err, movie) {
                if (err) {
                    res.send(err);
                    console.log(err);
                } else {
                    Movie.aggregate([{
                        $match: {"title": movie.title}
                    },{
                        $lookup: {
                            from: "reviews",
                            localField: "title",
                            foreignField: "title",
                            as: "reviews"
                        }
                    },{
                        $addFields: {
                            avgRating: {$avg: "$reviews.rating"}
                        }
                    }
                    ]).exec(function(err,movie){
                        if(err){
                            res.json(err);
                        }else{

                            res.json(movie[0]);
                        }
                    })
                }
            })
        }

        else {
            Movie.findById(req.params.movieId, function (err, movie) {
                if (err) {
                    res.send(err);
                    console.log(err);
                } else {
                    res.json(movie);

                }
            })
        }
    });


//-------------------------------------------------------------------------------------------------------
//                  assignment four - reviews section
//-------------------------------------------------------------------------------------------------------




router.route('/reviews')


// POST = saves a review and then appends movie to the end of that review
    .post(authJwtController.isAuthenticated, function(req,res)  {
        if(!req.body.rating || !req.body.comment)
        {
            res.status(403).json({success: false, message: "comment and rating is required"    });
        }
        else {
            var review = new Review();
            review.title = req.body.title;
            review.reviewersname = req.body.reviewersname;
            review.rating = req.body.rating;
            review.comment = req.body.comment;

            review.save(function(err, result){
                if (err){
                    if (err.code == 11000){
                        return res.json({ success: false, message: 'already exists.'});
                    }
                    else{
                        return res.json(err.message);
                }

            }
                else{return res.json(result); }



            });
        }

    });














app.use('/', router);
app.listen(process.env.PORT || 8080);
//module.exports = app; // for testing only


