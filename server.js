'use strict';

const express = require('express');
const dns = require('dns');
const mongoose = require('mongoose');
var cors = require('cors');
const urlModel = require('./models/urlModel').urlModel;

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect('mongodb://localhost/fcc_urlshortner', { useMongoClient: true })
  .then(() => console.log('Connect to db'))
  .catch(err => console.log(err.message));

app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.post('/api/shorturl/new', (req, res) => {
  const urlregex = /^(http|https):\/\/www\./;
  let url = req.body.url;
  let isValidUrl = urlregex.test(url);
  
  if (!isValidUrl) res.json({ "error": "invalid URL" });
  
  else {
    let tempurl = url.substring(url.indexOf("://") + 3);
    console.log(tempurl);
    dns.lookup(tempurl, { hints: dns.ADDRCONFIG | dns.V4MAPPED }, 
      async (err, address, family) => {        
      if (err) res.json({ "error": "invalid Hostname" });
      else {
        try {
          let count = await urlModel.count({}) + 1;

          let myurl = new urlModel({ 
            original_url: url, 
            short_url: count
          });

          myurl = await myurl.save();           
          res.json({ url, count });

        } catch (err) {
          console.log(err.message);
        }        
      }
    });
  }
});

app.get('/api/shorturl/:url', async (req, res) => {
  console.log(req.params.url);
  let surl = parseInt(req.params.url);
  const myurl = await urlModel.findOne({ short_url: surl });
  
  if (!myurl) res.status(404).send('Not found');
  console.log(myurl.original_url);
  res.redirect(myurl.original_url);
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});