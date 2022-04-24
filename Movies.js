var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;


mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);




// movies schema
var MovieSchema = new Schema({
    title: {type: String, required: true},
    year: {type: String, required: true},
    genre: {type: String, required: true, enum:['Action', 'Adventure',  'Comedy',  'Drama',  'Fantasy',  'Horror',  'Mystery',  'Thriller', 'Western'] },
    actors: {type: [{actorName: String, characterName: String}], required: true },
    imageUrl: {type: String},
    avgRating: {type: [Number]}
});

// return the model to server
module.exports = mongoose.model('Movie', MovieSchema);