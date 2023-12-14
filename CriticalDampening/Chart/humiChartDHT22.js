
function createHumiChart(timestamps, field2Values) {
    var ctx = document.getElementById('humiChartDHT22').getContext('2d');

    var chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: 'Humidity',
                data: field2Values,
                borderColor: '#BB86FC',
                backgroundColor: 'transparent',
                borderWidth: 1,
                pointRadius: 0
            }]
        },
        options: {
            title: {
                display: true,
                text: 'Internal DHT22 Humidity (%)', 
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

function getHumiData() {
    var url = "https://api.thingspeak.com/channels/2360648/fields/2.json?api_key=6OZ1LVUKJMLMJEE8&results=20000";

    $.getJSON(url, function (data) {
        var field2Values = [];
        var timestamps = [];

        $.each(data.feeds, function (index, feed) {
            field2Values.push(feed.field2);
            timestamps.push(feed.created_at);
            console.log("Humi data importing");
        });

        createHumiChart(timestamps, field2Values);
    });
}
