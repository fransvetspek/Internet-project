var express = require('express');
var router = express.Router();
var Liedje = require('../models/liedje');
var Stem = require('../models/stem');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

exports.index = function(req, res) {
    res.render('homepage', {title:'CHIRO'});
};

// Display list of top 10 Liedjes.
exports.liedje_list = function(req, res, next) {
  Liedje.find()
    .sort([['aantStemmen', 'descending']])
    .exec(function (err, list_liedjes) {
      if (err) { return next(err); }
      var top10=[];
      //Successful, so render
      if(list_liedjes.length>=10){
        for(i=0;i<10;i++){
            top10[i]=list_liedjes[i];
        }
    }
      else{
          top10=list_liedjes;
      }
      res.render('top_10', { title: 'Top 10', liedje_list: top10});
    });

};

//Display gezochte liedje
exports.liedje_zoek = function(req,res){
    var urlParams = new URLSearchParams(req.url);
    var searchParams = new URLSearchParams(urlParams);

    // Display the values
    for(var value of searchParams.values()) {
        Liedje.find({'titel': {'$regex': value, '$options': 'i'}}).select('-_id titel artiestNaam aantStemmen')
        .sort([['aantStemmen', 'descending']])  
        .exec(function(err,gezochte_liedjes){
            if(err){return next(err);}
            res.send(gezochte_liedjes);

        });
    }
};

//stem
exports.stem =function(req, res ,next){
    var stem= new Stem({
       titel: req.body.titel2,
       artiestNaam: req.body.artiest2,
       email:req.user.email
    });
    if(req.user.aantStemmen===0){
        //res.render('account');
        req.flash('error',"Je hebt al je stemmen opgebruikt, liedje is niet toegevoegd");
        res.redirect('/users/account')
    }
    else{
        Stem.findOne({ titel: req.body.titel2, artiestNaam: req.body.artiest2, email:req.user.email})
            .exec( function(err, found_liedje_user) {
                if (err) { return next(err); }
                if (found_liedje_user) {
                    req.flash('error', 'Je hebt al op dit liedje gestemd');
                    res.redirect('/liedje');
                }
                else{
                    stem.save(function (err) {
                        if (err) {
                            req.flash('error', 'Er was een probleem met je stem');
                            res.redirect('/liedje');
                        } 
                    });
                    req.user.aantStemmen=req.user.aantStemmen - 1;
                    req.user.save(function (err) {
                        if (err) {
                            req.flash('error', 'Er was een probleem met je liedje op te slaan, probeer opnieuw');
                            res.redirect('/liedje');
                        } // saved!
                    });
                    Liedje.findOne({ titel: req.body.titel2, artiestNaam: req.body.artiest2})
                        .exec( function(err, found_liedje) {
                            if (err) { return next(err); }
                            if (found_liedje) {
                                found_liedje.aantStemmen = found_liedje.aantStemmen + 1;
                                found_liedje.save(function (err) {
                                    if (err) {
                                        req.flash('error', 'Er was een probleem met je liedje op te slaan, probeer opnieuw');
                                        res.redirect('/liedje');
                                    } // saved!
                                });
                               res.redirect('/liedje/top-10')
                            }

                           else {
                                var liedje=new Liedje({
                                titel: req.body.titel2,
                                artiestNaam: req.body.artiest2
                                });
                                liedje.save(function (err) {
                                    if (err) {
                                        req.flash('error', 'Er was een probleem met je liedje op te slaan, probeer opnieuw');
                                        res.redirect('/liedje');
                                        //return handleError(err);
                                    } // saved!
                                 });
                                res.redirect('/liedje/top-10')
                            }
                    });
                }
        });
    }
}

// Handle Liedje create on POST.
exports.liedje_create_post =function(req, res ,next){
    //sanitize
        sanitizeBody('titel').trim().escape(),
        sanitizeBody('artiestNaam').trim().escape(),
        req.checkBody('titel', 'Vul een titel in').isLength({ min: 1 }).trim();
         
    req.getValidationResult()
        .then(function(result) {
            if (result.isEmpty() === false) {
                result.array().forEach((error) => {
                    req.flash('error', error.msg);
                })
            res.redirect('/liedje');}
            else{      
                var request = require("request");
                var options = { method: 'GET', 
                  url: 'http://ws.audioscrobbler.com/2.0/',
                  qs: 
                   { method: 'track.search',
                    track: req.body.titel,
                    artist: req.body.artiestNaam,
                     user: 'test',
                     api_key: '361509ff27fc66e53f9418a2e1f10b65',
                     limit: '3',
                     format: 'json',
                    },
                  headers: 
                   { 
                       'cache-control': 'cache' } 
                    };

                request(options, function (error, response, body) {
                    var myJSON=body;
                    var myobj=JSON.parse(myJSON);
                    var imgArr= ["","","","",""];
                    var i=0;
                    if(myobj.results.trackmatches.track.length===0){
                        var niets=0;
                    }
                    else niets=1;
                    for (i=0;i< myobj.results.trackmatches.track.length;i++){
                        imgArr[i]=myobj.results.trackmatches.track[i].image[1]['#text'];
                    }
                    res.render('liedje_form',{tracks:myobj,img:imgArr,niets:niets,user:req.user});
                    });
                }
            })
};
