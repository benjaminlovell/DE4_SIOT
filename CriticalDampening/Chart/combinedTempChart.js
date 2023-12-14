//This code is creating a combined chart of the indoor and outdoor temperature levels.

//Defining the combined chart function.
function createCombinedChart(timestamps, field1Values, field2Values) {
    // Mapping the timestamps to date labels for the X-axis
    var dateLabels = timestamps.map(timestamp => {
        // Converting each timestamp to a Date object
        var date = new Date(timestamp);
        // Formatting the date as MM/DD/YYYY HH:mm
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}`;
    });
    
    //Linking to the html ID.
    var ctx = document.getElementById('combinedTempChart').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            //Setting up formatting for the chart.
            datasets: [
                {
                    label: 'Internal',
                    data: field1Values,
                    borderColor: '#BB86FC',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0
                },
                {
                    label: 'External',
                    data: field2Values,
                    borderColor: '#03DAC6',
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0
                }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'Temperature (Celsius)',
                fontColor: 'white',
                position: 'left'
            },
            scales: {
                xAxes: [{
                    ticks: {
                        fontColor: 'white', 
                        //Converting the X axis ticks to be at 12 intervals for a clearer visualisation.
                        callback: function(value, index, values) {
                            return dateLabels[index];
                        },
                        maxTicksLimit: 12,
                    },
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                }],
                yAxes: [{
                    ticks: {
                        fontColor: 'white',
                        beginAtZero: true
                    },
                    gridLines: {
                        color: 'rgba(255, 255, 255, 0.2)' 
                    }
                }]
            },
            legend: {
                display: true,
                labels: {
                    fontColor: 'white'  
                }
            }
        }
    });
}


function getCombinedTempData() {
    //Thingspeak 'Read' URLs
    var url1 = "https://api.thingspeak.com/channels/2360648/fields/1.json?api_key=6OZ1LVUKJMLMJEE8&results=5000";
    var url2 = "https://api.thingspeak.com/channels/2365749/fields/2.json?api_key=X3TCCD9UVIXBTSI8&results=5000";

    //Fetching JSON entries from the respective Thingspeak channels and fields.
    $.when(
        $.getJSON(url1),
        $.getJSON(url2)
    ).done(function(data1, data2) {
        var field1Values = [];
        var field2Values = [];
        var timestamps = [];

        // Extracting timestamps and values from the first dataset
        $.each(data1[0].feeds, function(index, feed) {
            timestamps.push(feed.created_at);
            field1Values.push(feed.field1);
        });

        // Extracting timestamps and values from the second dataset, considering a tolerance
        $.each(data2[0].feeds, function(index, feed) {
            var timestamp = feed.created_at;
            var indexInData1 = findClosestTimestampIndex(timestamp, timestamps);

            if (indexInData1 !== -1) {
                field2Values[indexInData1] = feed.field2;
            }
        });
        
        //generate the cha
        createCombinedChart(timestamps, field1Values, field2Values);
    });
}

// Function to find the index of the closest timestamp in the array
function findClosestTimestampIndex(timestamp, timestamps) {
    var closestIndex = -1;
    var minDifference = Infinity;

    for (var i = 0; i < timestamps.length; i++) {
        var difference = Math.abs(new Date(timestamps[i]) - new Date(timestamp));
        if (difference < minDifference) {
            minDifference = difference;
            closestIndex = i;
        }
    }

    return closestIndex;
}