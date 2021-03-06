var express             = require("express");
var router              = express.Router();
//var nodemailer          = require("nodemailer");
var request             = require("request");


var mailgun = require("mailgun-js");
var api_key = process.env.MAILGUN_API_KEY;
var DOMAIN = process.env.MAILGUN_DOMAIN;
var mailgun = require('mailgun-js')({apiKey: api_key, domain: DOMAIN});


        // contact form
router.get("/", function(req, res) {
   res.render("contact/contact", {page: 'contact'});
});

router.post("/", function(req, res) {
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
      console.log(req.body);
      req.flash("error", "Please select captcha");
      return res.redirect("back");
    }
    // secret key
    var secretKey = process.env.CAPTCHA;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req
      .connection.remoteAddress}`;
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
      // if not successful
      if (body.success !== undefined && !body.success) {
        req.flash("error", "Captcha Failed");
        return res.redirect("/contact");
      }
      
      // INTERCEPTING THE DATA
      var name = req.body.name;
      var email = req.body.email;
      var phone = req.body.phone;
      var subject = req.body.subject;
      var message = req.body.message;
      

     var data = {
       from: 'chuks <walter4chuks@gmail.com>', //name + " - " + email, // Email and name from the variables
       to: 'evaristus.ihezurumba@gmail.com', //process.env.EMAIL,
       subject: subject,
       text: message,
       phone: phone
      };

      mailgun.messages().send(data, function (error, body) {
        if(error) {
          console.log(error);
          req.flash("error", "Something went wrong... Please try again later!")
          res.redirect("/contact");
        } else {
          console.log(body);
          req.flash("success", "Your email has been sent, we will respond within 24 hours.");
         res.redirect("/campgrounds");
        }

         
        });
        // var smtpTransport = nodemailer.createTransport({
        //     service: 'Gmail', 
        //     auth: {
        //       user: 'walter4chuks@gmail.com',
        //       pass: process.env.GMAILPW
        //     }
        // });
        
        // var mailOptions = {
        //     from: 'evaristus.ihezurumba@gmail.com',
        //     to: 'evaristus.ihezurumba@gmail.com',
        //     replyTo: req.body.email,
        //     subject: "Let's Camp contact request from: " + req.body.name,
        //     text: 'You have received an email from... Name: '+ req.body.name + ' Phone: ' + req.body.phone + ' Email: ' + req.body.email + ' Message: ' + req.body.message,
        //     html: '<h3>You have received an email from...</h3><ul><li>Name: ' + req.body.name + ' </li><li>Phone: ' + req.body.phone + ' </li><li>Email: ' + req.body.email + ' </li></ul><p>Message: <br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + req.body.message + ' </p>'
        // };
        
        // smtpTransport.sendMail(mailOptions, function(err, info){
        //   if(err) {
        //     console.log(err)
        //     req.flash("error", "Something went wrong... Please try again later!");
        //     res.redirect("/contact");
        //   } else {
        //     req.flash("success", "Your email has been sent, we will respond within 24 hours.");
        //     res.redirect("/campgrounds");
            
        //   }
        // });
    });
});

module.exports = router;
         