const http = require('http');

const express = require('express');
const app = express();

const hostname = 'localhost';
const port = 3000;

var server = app.listen(port, hostname, function() {
  console.log('Server running at http://'+ hostname + ':' + port + '/');
});

const sqlite3 = require('sqlite3').verbose();
	
const path = require('path');
const dbPath = path.resolve(__dirname, 'fortipi.db');
const db = new sqlite3.Database(dbPath);

app.get('/dashboard', function (req, res)
{
  var temp = getMostRecentRecordData(1, 'Temperature', 'TEMPERATURE', 'TEMP_STATUS', 'F');
  var humidity = getMostRecentRecordData(2, 'Humidity', 'HUMIDITY', 'HUM_STATUS', '%');
  var pressure = getMostRecentRecordData(3, 'Pressure', 'BAROMETRIC_PRESSURE', 'BAR_STATUS', 'mbp');
  var light = getMostRecentRecordData(4, 'Light Intensity', 'LIGHT_INTENSITY', 'LIGHT_STATUS', 'lm');
  console.log(temp);
  return res.json([temp, humidity, pressure, light]);
});

function getMostRecentRecordData(categoryId, category, valueColumn, statusColumn, measureUnit, callback)
{
  let sql = 'SELECT MAX(TIMESTAMP), ' + valueColumn + ' value, ' + statusColumn + ' statusColor FROM T_ENV_HIST';
  db.each(sql, (err, row) => {
    if (err) {
      throw err;
    }
	var record = {
      id: categoryId,
	  reading: category,
	  current_value: row.value,
	  unit_of_measure: measureUnit,
	  status_color: row.statusColor
    };
	JSON.stringify(record);
	console.log(record);
	return record;
  });
}	
