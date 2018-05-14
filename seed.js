var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment   = require("./models/comment");

var data = [
       { name: "Niger Sea View Afam",
         image:"https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=b571d709d77cb1a87463b13f9aefcc99&auto=format&fit=crop&w=500&q=60",
         descriptions:"Lorem ipsum dolor sit amet, ut laudem aliquando mei. Meis labitur eruditi pro cu. Iuvaret appetere conclusionemque an est. Ne vix oblique docendi detracto, debet quando imperdiet est ne. Mel ut semper quaerendum."
       },
        { name: "Afam Forest",
         image:"https://images.unsplash.com/photo-1445287295867-134337e27c2a?ixlib=rb-0.3.5&s=f78c98b94fc1a467682e342ae08b65c5&dpr=1&auto=format&fit=crop&w=525&q=60",
         descriptions:"Denique lobortis signiferumque ei ius, ea invenire explicari per. An mel unum putant omittam, eum rebum option sadipscing no. Ne fuisset torquatos per. Fugit altera percipit et eum, duo ut enim nullam dissentias. Cum ne choro regione habemus, mea laoreet cotidieque at, Zril quidam forensibus vis ea, te consul eligendi vix. An qui tempor possim accumsan, id vel virtute percipit dissentiunt. Malis viris posidonium ne per, recteque constituam vel te. Nihil nominavi ad pro, putent adversarium an nec."
       },
       
        { name: "Mountain View",
         image:"https://images.unsplash.com/photo-1467649165350-bdae46d9779b?ixlib=rb-0.3.5&s=0b6901c89ea5541cb96ee3e2c0992a5d&dpr=1&auto=format&fit=crop&w=525&q=60",
         descriptions:"Pri voluptua aliquando in, aliquam scaevola pro ut, modus vivendum urbanitas mel no. No mel alia admodum, ei brute omnium cum. Id vidisse iuvaret dissentiunt sit. Usu labore eligendi assueverit ex, nihil consetetur mei no, soluta audire habemus eum ei. Eu ius natum everti indoctum, accusamus hendrerit ne quo, ex eam utroque persecuti. Vix harum sonet iudico no, iriure inciderint ad qui, erat iisque delenit ius eu."
       }
    ];

function seedDB(){
   Campground.remove({}, function(err){
        if(err) {
        console.log(err);
          }
         console.log("campgrounds removed!!");
  }); 
   
  // ADD FEW CAMPGROUNDS
  data.forEach(function(seed){
      Campground.create(seed, function(err, campground){
          if(err){
              console.log(err);
          } else {
              console.log("campgrounds created");
          }
          // CREATE COMMENTS
          Comment.create({
              text: "I never know phyton taste great",
              author: "Aba Ada"
          }, function(err, comment){
              if(err) {
                  console.log(err);
              } else {
                  campground.comment.push(comment);
                  campground.save();
                  console.log("new comment created!");
              }
               
          });
      });
   });
   
   // ADD FEW CEMMENTS
}

module.exports = seedDB;
