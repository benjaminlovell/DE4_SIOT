function createAPITempChart(timestamps, field2Values) {
    var ctx = document.getElementById('APITempChart').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Temperature',
                data: field2Values,
                borderColor: '#03DAC6',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'External API Temperature (C)', 
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
                display: false  
            }
        }
    });
}

function getAPITempData() {
    var url = "https://api.thingspeak.com/channels/2365749/fields/2.json?api_key=X3TCCD9UVIXBTSI8&results=20000";

    $.getJSON(url, function (data) {
        var field2Values = [];
        var timestamps = [];

        $.each(data.feeds, function (index, feed) {
            field2Values.push(feed.field2);
            timestamps.push(feed.created_at);

        });

        createAPITempChart(timestamps, field2Values);
    });
}