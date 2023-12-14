// app.js

function createTempChart(timestamps, field1Values) {

    var ctx = document.getElementById('tempChartDHT22').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Temperature',
                data: field1Values,
                borderColor: '#BB86FC',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Internal DHT22 Temperature (C)', // Add your desired title here
                fontColor: 'white',
            },
            scales: {
                xAxes: [{
                    ticks: {
                        display: false,  // This removes the x-axis tick labels

                    },
                    gridLines: {
                        color: 'rgba(0, 0, 0, 0)'  // Set the color of the grid lines
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            legend: {
                display: false  // This removes the legend
            }
        }
    });
}

function getTempData() {
    var url = "https://api.thingspeak.com/channels/2360648/fields/1.json?api_key=6OZ1LVUKJMLMJEE8&results=40000";

    $.getJSON(url, function (data) {
        var field1Values = [];
        var timestamps = [];

        $.each(data.feeds, function (index, feed) {
            field1Values.push(feed.field1);
            timestamps.push(feed.created_at);

        });

        createTempChart(timestamps, field1Values);
    });
}
