function createCombinedHumiChart(timestamps, field1Values, field2Values) {
    var dateLabels = timestamps.map(timestamp => {
        var date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} ${date.getHours()}:${('0' + date.getMinutes()).slice(-2)}`;
    });

    var ctx = document.getElementById('combinedHumiChart').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
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
                text: 'Humidity (%)', 
                fontColor: 'white',
                position: 'left' 
            },
            scales: {
                xAxes: [{
                    ticks: {
                        fontColor: 'white',  
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
                        min: 40,
                        max: 100
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


function getCombinedHumiData() {
    var url1 = "https://api.thingspeak.com/channels/2360648/fields/2.json?api_key=6OZ1LVUKJMLMJEE8&results=5000";
    var url2 = "https://api.thingspeak.com/channels/2365749/fields/1.json?api_key=X3TCCD9UVIXBTSI8&results=5000";

    $.when(
        $.getJSON(url1),
        $.getJSON(url2)
    ).done(function(data1, data2) {
        var field1Values = [];
        var field2Values = [];
        var timestamps = [];

        $.each(data1[0].feeds, function(index, feed) {
            timestamps.push(feed.created_at);
            field1Values.push(feed.field2); 
        });


        $.each(data2[0].feeds, function(index, feed) {
            var timestamp = feed.created_at;
            var indexInData1 = findClosestTimestampIndex(timestamp, timestamps);

            if (indexInData1 !== -1) {
                field2Values.push(feed.field1);
            }
        });

        createCombinedHumiChart(timestamps, field1Values, field2Values);
    });
}

