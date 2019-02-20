var express = require('express');
var handlebars = require('express-handlebars');
var mongoose = require('mongoose');
var cheerio = require('cheerio');
var axios = require('axios');
var userWeb = ('https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States');
var mongojs = require("mongojs");
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.connect(MONGODB_URI);


var app = express();

var databaseUrl = "scraper";
var collections = ["scraped data"];


// connecting the mongo js to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error){
    console.log("Database Error:" , error)
});


// this is the main root AKA where the webpage first pulls up.
app.get("/", function(req, res){
    res.send("Hello world")
})

// this is where the retrieved data from the database goes

app.get("/all", function(req,res){
    // find all the results
    db.scrapedData.find({}, function(error, found){
        // throw errors  if we get any
        if (error) {
            console.log(error);
        } else{
            // if no errors send the data to the browser as json
            res.json(found)
        }
    });
});

// SCRAPE DATA FROM SITE AND PLACE IT INTO DATABASE

app.get("/scrape", function (req, res) {
    // get link
    axios.get("https://www.foxnews.com/").then(function(response){
        // load the html body using axios and cheerio
        var $  = cheerio.load(response.data);
        // this is where we specify the class or id
        $(".title").each(function(i, element){
            // saveing link and href in the class
            var title = $(element).children("a").text();
            var link = $(element).children("a").attr("href");

            // if this element had both a title and a link
            if (title && link){
                // insert data into scrapedData db
                db.scrapedData.insert({
                    title: title,
                    link: link
                },
                function(err, inserted){
                    if (err){
                        console.log(err);
                    } else {
                        console.log(inserted);
                    }
                });
            }
        });
    });

    res.send("scrape complete");
});

// App listening port
app.listen(3000, function(){
    console.log("app is runnning on port 3000");
});