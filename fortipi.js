const http = require('http');

const express = require('express');
const app = express();

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
  var temp = getMostRecentRecordData(1, 'Temperature', 'TEMPERATURE', 'TEMP_STATUS', 'F');
  var humidity = getMostRecentRecordData(2, 'Humidity', 'HUMIDITY', 'HUM_STATUS', '%');
  var pressure = getMostRecentRecordData(3, 'Pressure', 'BAROMETRIC_PRESSURE', 'BAR_STATUS', 'mbp');
  var light = getMostRecentRecordData(4, 'Light Intensity', 'LIGHT_INTENSITY', 'LIGHT_STATUS', 'lm');
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
	current_value: rows[0].value,
	unit_of_measure: measureUnit,
	status_color: rows[0].statusColor
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
      datetime: rows[i].datetime,
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
