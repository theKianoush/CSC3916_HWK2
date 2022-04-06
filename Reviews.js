var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;


try {
    mongoose.connect( process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log("connected"));
}catch (error) {
    console.log("could not connect");
}
mongoose.set('useCreateIndex', true);

//user schema
var ReviewSchema = new Schema({                         // all for the reviewer
    nameOfReviewer: {type: String, required: true},             // name of reviewer who i assume is the person loggedin
    comment: {type: String},                                    // quote/comment to say
    rating: {type: Number, required: true},                     // rating to give the movie
    titleOfMovie: {type: String, required: true},               // title of the movie
   // movieId: {type: Schema.Types.ObjectId, ref: "movieSchema", required: true},   // this extra
    //userId: {type: Schema.Types.ObjectId, ref: "userSchema", required: true}   // this extra

});

//return the model to server
module.exports = mongoose.model('Review', ReviewSchema);