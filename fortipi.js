const http = require('http');

const express = require('express');
const app = express();

const hostname = 'localhost';
const port = 3000;

var server = app.listen(port, hostname, function() {
  console.log('Server running at http://'+ hostname + ':' + port + '/');
});

var db = require('sqlite-sync');

const path = require('path');
const dbPath = path.resolve(__dirname, 'fortipi.db');
db.connect(dbPath);

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
}
