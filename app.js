const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set("json spaces", 2);



app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/',express.static('public'));

app.get('/', (req, res) => {
  res.send("<h1>SimCareerServer</h1>");
});

module.exports = app;
