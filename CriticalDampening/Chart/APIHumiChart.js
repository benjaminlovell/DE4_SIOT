function createAPIHumiChart(timestamps, field1Values) {
    var ctx = document.getElementById('APIHumiChart').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Humidity',
                data: field1Values,
                borderColor: '#03DAC6',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'External API Humidity (%)', 
                fontColor: 'white',
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: false,  

                    },
                    gridLines: {
                        color: 'rgba(0, 0, 0, 0)'  
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false  // Removing the legend.
            }
        }
    });
}

function getAPIHumiData() {
    var url = "https://api.thingspeak.com/channels/2365749/fields/1.json?api_key=X3TCCD9UVIXBTSI8&results=20000";

    $.getJSON(url, function (data) {
        var field1Values = [];
        var timestamps = [];

        $.each(data.feeds, function (index, feed) {
            field1Values.push(feed.field1);
            timestamps.push(feed.created_at);

        });

        createAPIHumiChart(timestamps, field1Values);
    });
}