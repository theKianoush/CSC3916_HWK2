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
var Movie = require('./Movies');
var Review = require('./Reviews');
//require('dotenv').config();

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

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





// movie routes
router.route('/movies')
    // saving a movie
    .post(authJwtController.isAuthenticated, function (req, res) {
        //console.log(req.body);
        if (!req.body.title || !req.body.year || !req.body.genre || !req.body.actors ) {
            res.json({success: false, message: "An input should contian: Title, year released, Genre, and 3 Actors"});
        } else {

            var movie = new Movie();

            movie.title = req.body.title;
            movie.year = req.body.year;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;

            console.log(Movie);
            movie.save(function(err){

                if (err) {
                    return res.json(err);
                }
                res.json({success: true, msg: 'Movie was saved successfuly.'});
            })

        }
    })

    // updating a movie
    .put(authJwtController.isAuthenticated, function(req, res) {
        if(!req.body.title){
            res.json({success:false, message: "Title is required."});
        }else{      // data provided
            if (req.body.newTitle){
                Movie.findOneAndUpdate(req.body.title, req.body.newTitle, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Error: Could not make a change."});
                    }else{
                        res.status(200).json({success: true, message: "Title has been updated successfully"});
                    }
                });
            }
            if (req.body.newYear){
                Movie.findOneAndUpdate(req.body.year, req.body.newYear, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Error: Could not make a change."});
                    }else{
                        res.status(200).json({success: true, message: "Released year has been updated successfully"});
                    }
                });
            }
            if (req.body.newGenre){
                Movie.findOneAndUpdate(req.body.genre, req.body.newGenre, function(err, movie) {
                    if(err){
                        res.status(403).json({success:false, message: "Error: Could not make a change."});
                    }else{
                        res.status(200).json({success: true, message: "Genre has been updated successfully"});
                    }
                });
            }
        }
    })

    //Delete movies
    .delete(authJwtController.isAuthenticated, function(req, res) {
        if (!req.body.title) {
            res.json({success: false, msg: 'Please pass a Movie Title to delete.'});
        }
        else {
            Movie.findOneAndRemove({title: req.body.title}, function (err) {
                if (err) throw err;
                res.json({success: true, msg: 'Movie successfully deleted.'});
            })
            //}
            //})
        }
    })

    // getting a movie with parameter
    .get(authJwtController.isAuthenticated, function (req,res){           // searches for one
        Movie.findOne({title: req.body.title}).select('title image genre release characters').exec(function(err, movie){
            if(err){
                res.json({message: "Error Finding Movie"})    // if we cant find movie or some error
            }
            else{
                if (movie === null){
                    res.json({success : false, msg: "no movie exists"})
                }else{
                    if(req.body.review === 'true'){
                        Review.find({movieID: movie.id}).select('nameOfReviewer comment rating').exec(function (err, review){
                            if(err){
                                return res.status(403).json({success: false, msg: "Cant Get Reviews"})
                            }
                            var rating = movie.avgRating.reduce(function(a,b){ return a+b;})
                            return res.status(200).json({ movieDetails: movie, Movie_Review : review, avgRating : "rating"})

                        })
                    }
                    else{res.status(200).json({success: true, msg :'movie found', movieDetails : movie})}         // else return the movie}
                }
            }
        })
});









router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        if(!req.body.quote || !req.body.rating || !req.body.movieid){
            console.log("Reviewer name, Quote, Rating, or Movie not found!");
            res.json({success: false, message: "Reviewer name, Quote, Rating, or Movie not found!"});
        }

        else{

            const userToken = req.headers.authorization;
            const token = userToken.split(' ');
            const decoded = jwt.verify(token[1], process.env.SECRET_KEY);
            console.log(decoded);

            const id = req.body.movieid;

            Movie.findById(id, function(err, okay) {
                if (err) {
                    res.json({success: false, message: "Error. Movie doesn't exist"});
                }
                else if (okay) {

                    var review = new Review();
                    review.movieid = req.body.movieid;
                    review.reviewer = decoded.username;
                    review.quote = req.body.quote;
                    review.rating = req.body.rating;


                    review.save(function (err){

                        if(err){
                            console.log(err);
                            res.json({success: false, message: "Error. You cannot make multiple reviews for same movie!"})
                        }

                        else{
                            res.json({success: true, message: "Review saved"});
                        }
                    });
                }

            });
        }

    })

    .get(authJwtController.isAuthenticated, function (req, res){
        console.log(req.body);

        Review.find(function(err, review){
            if (err){
                res.json({success: false, message: "Could not get reviews."});
            }

            else{
                res.json(review)
            }


        });

    });



app.use('/', router);
app.listen(process.env.PORT || 8080);
//module.exports = app; // for testing only


