// Initialize pubnub
var pubnub = PUBNUB.init({
  publish_key   : "pub-c-53bd279e-0efc-4539-ad9a-dba3d7866792",
  subscribe_key : "sub-c-4d90db16-e50a-11e4-8370-0619f8945a4f"
});

var uuid = pubnub.uuid();

var loading = true;
$("#output").html("Ansluter till chatten..");

pubnub.subscribe({
	'channel'   : 'tasty-chat',
	connect: function(){
        $("#output").html("Ansluten!<br/>----------------------");
        loading = false;
    },
    error: function (error) {
      // Handle error here
      $("#output").html("Kunde inte ansluta till chatten :(");
      console.log(JSON.stringify(error));
    },
	callback  : function(message) {
        navigator.geolocation.getCurrentPosition(
            function(position){
                // Större longitud -> Mer österut
                // Större latitud -> Mer norrut
                var messageSentFromNorth;
                var messageSentFromEast;
                
                if(message.location.longitude > position.coords.longitude){
                    messageSentFromEast = true;
                } else {
                    messageSentFromEast = false;
                }

                if(message.location.latitude > position.coords.latitude){
                    messageSentFromNorth = true;
                } else {
                    messageSentFromNorth = false;
                }

                var diffLong = position.coords.longitude - message.location.longitude;  // X
                var diffLat = position.coords.latitude - message.location.latitude;     // Y
                console.log("Longs: " + position.coords.longitude + " " + message.location.longitude);
                console.log("Lats: " + position.coords.latitude + " " + message.location.latitude);
                console.log(diffLat + " " + diffLong);
                var relativeAngle;

                // Dela upp i kvadranter
                if(messageSentFromEast && messageSentFromNorth){
                    console.log("nordost");
                    relativeAngle = Math.atan(diffLong/diffLat) * (180/Math.PI); // Grader
                    // relativeAngle = Math.atan(diffLong/diffLat);
                } else if(messageSentFromEast && !messageSentFromNorth){
                    console.log("sydost");
                    relativeAngle = 90 + Math.atan(diffLat/diffLong) * (180/Math.PI); // Grader
                    // relativeAngle = Math.PI * 0.5 + Math.atan(diffLat/diffLong);
                } else if(!messageSentFromEast && !messageSentFromNorth){
                    console.log("sydväst");
                    relativeAngle = 180 + Math.atan(diffLong/diffLat) * (180/Math.PI); // Grader
                    // relativeAngle = Math.PI + Math.atan(diffLong/diffLat);
                } else {
                    console.log("nordväst");
                    relativeAngle = 270 + Math.atan(diffLat/diffLong) * (180/Math.PI); // Grader
                    // relativeAngle = Math.PI * 1.5 + Math.atan(diffLat/diffLong);
                }

                var angleDifference = (Math.abs((message.location.heading - relativeAngle + 180)) % 360) - 180;
                console.log(angleDifference);
                if(Math.abs(angleDifference)<45){
                    // GO TIME!
                    console.log("You are looking the right way! Very good, do you like what you see? ");
                } else {
                    // Fuck you :(
                    console.log("Fuck you :(");
                }
                console.log(message);
                console.log(position);
            }, showError);

        console.log("Fick meddelande: " + JSON.stringify(message));
        if(getObjectSize(message)>2){
        	$("#output").html($(
        		"#output").html() + '<br />' + message.data + "<p class='geoData'>Användaren är vid " + message.location.longitude.toFixed(5) + " " + message.location.latitude.toFixed(5) + " och tittar mot " + message.location.heading + "°</p>");
        };
    }
});


$(function(){
    $("#input").keyup(function(e){
        if (e.keyCode === 13) {
            sendMessageWithPos();
        }
    });
});

var welcomeOnConnect = function() {
    $("#output").html($("#output").html() + "Ansluten till chatten..");
};

var sendMessages = function(){
	if($("#input").val()!=""){
	    console.log("Skickar: " + $("#input").val());
	    // send messages
	    pubnub.publish({
	        channel : 'tasty-chat',
	        message : {
	        	data: $("#input").val(),
	        	uuid: uuid
        	},
	        callback: function(){
	            console.log("Skickade: " + $("#input").val())
	            $("#input").val("");
			},
	        error: function(e){
	        	console.log("Något gick snett: "+e);
	        }
	        // 'pos'     : pos
	    });
	}
};

var recieveHistory = function(){
	console.log("Hämtar historik..")
    // check history
	$("#output").html("");
	pubnub.history({
		count : 10,
		channel : 'tasty-chat',
		callback : function (message) {
			$("#output").append(message[0].join("<br />"))
		}
	});
}

var sendMessageWithPos = function() {
    if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(locationMessage, showError);
    } else { 
        alert("Geolocation is not supported by this browser.");
    }
}

var locationMessage = function(position) {
	if($("#input").val()!=""){
		console.log("Skickar: " + $("#input").val());
		console.log("Från position: lon " + position.coords.longitude + " lat " + position.coords.latitude)
	    // send messages
		pubnub.publish({
			channel : 'tasty-chat',
			message : {
	        	data: $("#input").val(),
	        	uuid: uuid,
	        	location: {
	        		longitude: position.coords.longitude,
	        		latitude: position.coords.latitude,
	        		heading: userHeading
        		}
        	},
			callback: function(){
				console.log("Skickade: " + $("#input").val())
				$("#input").val("");
			},
	        error: function(e){
	        	console.log("Något gick snett: "+e);
	        }
		});
	};
}

var showError = function(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}

var getObjectSize = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

init();
var count = 0;
var userHeading = 0;

function init() {
  if (window.DeviceOrientationEvent) {
    // Listen for the deviceorientation event and handle the raw data
    window.addEventListener('deviceorientation', function(eventData) {
      // // gamma is the left-to-right tilt in degrees, where right is positive
      // var tiltLR = eventData.gamma;
      
      // // beta is the front-to-back tilt in degrees, where front is positive
      // var tiltFB = eventData.beta;
      
      // alpha is the compass direction the device is facing in degrees
      var dir = eventData.alpha
      
      // call our orientation event handler
      deviceOrientationHandler(dir);
      }, false);
  }
}

function deviceOrientationHandler(dir) {
  document.getElementById("heading").innerHTML = Math.round(dir);
  
  // Apply the transform to the image
  var logo = document.getElementById("compass");
  logo.style.webkitTransform = "rotate("+ dir +"deg)";
  logo.style.MozTransform = "rotate("+ dir +"deg)";
  logo.style.transform = "rotate("+ dir +"deg)";
  userHeading = dir;
}