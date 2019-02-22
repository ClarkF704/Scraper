var express = require('express');
var handlebars = require('express-handlebars');
var cheerio = require('cheerio');
var axios = require('axios');
var mongojs = require("mongojs");

// If deployed, use the port heroku specifies. Otherwise use port 3000
var PORT = process.env.PORT || 3000;
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGO_URL = process.env.MONGODB_URI || "scraper";


var app = express();

// tells it to use index.html in the public folder
app.use(express.static("public"));

var collections = ["scrapedData"];

// connecting the mongo js to the db variable
var db = mongojs(MONGO_URL, collections);

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
                function(err, insert){
                    if (err){
                        console.log(err);
                    } else {
                        console.log(insert);
                    }
                });
            }
        });
    });

    res.send("scrape complete");
});

// Clear the DB
app.get("/clearall", function(req, res) {
    // Remove every note from the notes collection
    db.scrapedData.remove({}, function(error, response) {
      // Log any errors to the console
      if (error) {
        console.log(error);
        res.send(error);
      }
      else {
        // Otherwise, send the mongojs response to the browser
        // This will fire off the success function of the ajax request
        console.log(response);
        res.send(response);
      }
    });
  });

// App listening port
app.listen(PORT, function(){
    console.log("app is runnning on port", PORT);
});