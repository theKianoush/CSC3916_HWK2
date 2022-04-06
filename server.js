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


router.route('/movies')


    // GET = supposed to return all movies when no parameters are entered
    .get(authJwtController.isAuthenticated, function (req,res){           // searches for one
        Movie.find({}, function (err, movies) {
            if (err) throw err;
            else
                res.json(movies);
        })

    })



    // POST = supposed to save a single movie to database
    .post(authJwtController.isAuthenticated, function (req, res) {
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


    //PUT = is supposed to FAIL and not return anything because we don't have parameter
    .put(authJwtController.isAuthenticated, function(req, res) {
            res.json({ msg: 'Must specify which movie you want to update.'});
    })



    //DELETE = is supposed to FAIL and not return anything because we don't have parameter
    .delete(authJwtController.isAuthenticated, function(req, res) {
            res.json({msg: 'Must specify which movie you want to delete.'});
    });



//------------------------------------------------------------------------------------------






router.route('/movies/:id')




    // get a single movie by ID
    .get(authJwtController.isAuthenticated, function (req,res) {
        const movie = new Movie();

        Movie.findById(req.params._id, movie, function (err) {
            if (err) {
                res.send(err);
                console.log(err);
            }

            res.json({success: true, movie: movie})
        })
    })





    .delete(authJwtController.isAuthenticated, function(req, res) {

        Movie.findByIdAndRemove(req.params._id, function(err, movie) {
                if (err) {
                    res.json(req.params._id);
                    res.send(err);

                }
               else {
                    res.json(req.params._id);
                    res.json({success: true, message: 'deleted'});
                }
            });

    })



    .delete(authJwtController.isAuthenticated, function(req, res) {

            console.log(eq.params._id);
    })



    .put(authJwtController.isAuthenticated, function(req, res) {

        const movie = new Movie();

        movie.Title = req.body.Title;
        movie.YearReleased = req.body.YearReleased;
        movie.Genre = req.body.Genre;
        movie.Actors = req.body.Actors;

        Movie.findByIdAndUpdate(req.params._id, movie, function (err) {
            if (err) {
                res.send(err);
                console.log(err);
            }

            res.json({success:true, movieupdated: movie});
        });

    });





















app.use('/', router);
app.listen(process.env.PORT || 8080);
//module.exports = app; // for testing only


