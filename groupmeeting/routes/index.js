var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {

  // Rendering the index view with the title 'Welcome'
  res.render('index', { title: 'Welcome'});

});

module.exports = router;
