const http = require('http');

const express = require('express');
const app = express();
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

const hostname = 'localhost';
const port = 3000;

var server = app.listen(port, hostname, function() {
  console.log('Server running at http://'+ hostname + ':' + port + '/');
});

const path = require('path');
const dbPath = path.resolve(__dirname, 'fortipi.db');

//Add header allowing API use by any host (not quite sure how to restrict it at this point)
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Gets all four data values when /dashboard is accessed
app.get('/dashboard', function (req, res)
{
  var temp = getMostRecentRecordData(1, 'Temperature', 'TEMPERATURE', 'TEMP_STATUS', 'C');
  var humidity = getMostRecentRecordData(2, 'Humidity', 'HUMIDITY', 'HUM_STATUS', '%');
  var pressure = getMostRecentRecordData(3, 'Pressure', 'BAROMETRIC_PRESSURE', 'BAR_STATUS', 'hPa');
  var light = getMostRecentRecordData(4, 'Light Intensity', 'LIGHT_INTENSITY', 'LIGHT_STATUS', ' lux');
  res.json([temp, humidity, pressure, light]);
});

//Gets a data value and its status from the most recent recording and returns data in a JSON
function getMostRecentRecordData(categoryId, category, valueColumn, statusColumn, measureUnit)
{
  var db = require('sqlite-sync');
  db.connect(dbPath);
  let sql = 'SELECT MAX(TIMESTAMP), ' + valueColumn + ' value, ' + statusColumn + ' statusColor FROM T_ENV_HIST'
  var rows = db.run(sql); //'rows' since the data will output as an array, even if only one record is selected
  var record = {
    id: categoryId,
	reading: category,
	current_value: Math.round(rows[0].value),
	unit_of_measure: measureUnit,
	status_color: rows[0].statusColor.toLowerCase()
   };
  JSON.stringify(record);
  return (record); 
  db.close();  
}

//Gets data values from all records when /reports is accessed
app.get('/reports', function (req, res)
{
  var db = require('sqlite-sync');
  db.connect(dbPath);
  let sql = 'SELECT TIMESTAMP datetime, TEMPERATURE temp, HUMIDITY humidity, BAROMETRIC_PRESSURE pressure, LIGHT_INTENSITY light FROM T_ENV_HIST ORDER BY datetime DESC'
  var rows = db.run(sql); //'rows' since the data will output as an array, even if only one record is selected
  var i = 0;
  var records = []; //Array of JSON objects to return, each one with data for a racord
  while (i < rows.length) //Loop ot create a JSON object for each record
  {
	//Assigning date from datetime - MM/DD/YYYY
	var date = rows[i].datetime.substr(5,2) + '/' +  rows[i].datetime.substr(8,2) + '/' + rows[i].datetime.substr(0,4);
	//Assigning time from datetime - HH:MM and 12 hour time
	var hour = parseInt(rows[i].datetime.substr(11,2));
	var period = "am";
	if (hour > 12) {
		hour -= 12;
		var period = "pm";
	}
	//Assign each record's values to the right fields in a JSON
	var time = hour + ':' +  rows[i].datetime.substr(14,2) + period;
    var record = {
	  date: date,
	  time: time,
	  temperature: rows[i].temp,
	  humidity: rows[i].humidity,
	  pressure: rows[i].pressure,
	  light: rows[i].light
    };
    JSON.stringify(record);
	records[i] = record;
	i++;
  }
  res.json(records);
  db.close();
});

//Gets all current settings values when /settings is accessed
app.get('/settings', function (req, res)
{
  var db = require('sqlite-sync');
  db.connect(dbPath);
  let sql = 'SELECT * FROM T_ENV_IDEAL'
  var plantRows = db.run(sql); //'rows' since the data will output as an array, even if only one record is selected
  sql = 'SELECT * FROM T_NOTIFICATION'
  var contactRows = db.run(sql); //'rows' since the data will output as an array, even if only one record is selected
  var record = {
    email: contactRows[0].EMAIL,
	phone: contactRows[0].PHONE_NUMBER,
	temperature: plantRows[0].TEMPERATURE,
	t_deviation: plantRows[0].TEMP_DEV,
	humidity: plantRows[0].HUMIDITY,
	h_deviation: plantRows[0].HUM_DEV,
	light: plantRows[0].LIGHT_INTENSITY,
	l_deviation: plantRows[0].LIGHT_DEV,
	pressure: plantRows[0].BAROMETRIC_PRESSURE,
	p_deviation: plantRows[0].BAR_DEV
   };
  JSON.stringify(record);
  res.json(record);
  db.close();  
});

//Posts all new settings values when /settings is accessed
app.post('/settings', function (req, res)
{
  var db = require('sqlite-sync');
  db.connect(dbPath);
  var email = req.body.email;
  var phone = req.body.phone;
  var temp = req.body.temperature;
  var t_dev = req.body.t_deviation;
  var hum = req.body.humidity;
  var h_dev = req.body.h_deviation;
  var light = req.body.light;
  var l_dev = req.body.l_deviation;
  var pressure = req.body.pressure;
  var p_dev = req.body.p_deviation;
  let sql = 'UPDATE T_ENV_IDEAL SET TEMPERATURE = ' + temp + ', TEMP_DEV = ' + t_dev;
  sql += ', HUMIDITY = ' + hum + ', HUM_DEV = ' + h_dev;
  sql += ', LIGHT_INTENSITY = ' + light + ', LIGHT_DEV = ' + l_dev;
  sql += ', BAROMETRIC_PRESSURE = ' + pressure + ', BAR_DEV = ' + p_dev;
  db.run(sql);
  sql = 'UPDATE T_NOTIFICATION SET EMAIL = \'' + email + '\', PHONE_NUMBER = \'' + phone + '\'';
  db.run(sql);
  res.end();
});
