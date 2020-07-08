const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set("json spaces", 2);

//routes
const utRoute=require('./api/utenti');
const teamRoute=require('./api/team');
const autoRoute=require('./api/auto');
const campionatiRoute=require('./api/campionati');
const classificheRoute=require('./api/classifiche');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//use routes
app.use('/utenti', utRoute);
app.use('/teamRoute',teamRoute);
app.use('/auto',autoRoute);
app.use('/campionati',campionatiRoute);
app.use('/classifiche',classificheRoute);

app.use('/',express.static('public'));

app.get('/', (req, res) => {
  res.send("<h1>SimCareerServer</h1>");
});

module.exports = app;
