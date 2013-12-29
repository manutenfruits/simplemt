window.emt = {
	markers: {}
};

function getParadas(){

	var stopId = $("#searchstop").val();
	if(!stopId) return;

	$("#waitingTimes").empty();
	changeBtn("Cargando...", "c");

	getTiempoEspera(stopId).then(function(data){
		var times = parseWaitingTimes(data);
		redrawWaitingTimes(times, $("#waitingTimes"));
	}, function(data){
		changeBtn("Ha ocurrido un error interno", "d");
	});


	function getTiempoEspera(stopId){
		return $.ajax({
			url: 'api/getArriveStop',
			data:{
				"stop":stopId,
			},
			cache:false,
			type: "get",
			dataType:"json"
		});
	}

	function parseWaitingTimes(json){

		var result = {};

		if(!(json && json.Arrives && json.Arrives.Arrive)){
			return result;
		}else{
			json.Arrives.Arrive.forEach(function(item, i){
				var idLine = item.idLine[0];
				if(!result[idLine]){
					result[idLine]= {
						buses:[],
						destination: item.Destination[0]
					};
				}

				result[idLine].buses.push({
					time: Number(item.TimeLeftBus[0]),
					distance: Number(item.DistanceBus[0])
				});
			});
		}

		return result;
	}

	function redrawWaitingTimes(data, $ul){
		$ul.empty();

		if($.isEmptyObject(data)){
			changeBtn("La parada no existe", "d");
		}else{
			updateButton($("#searchstop").val());
		}

		$.each(data, function(idLine, line){
			$("<li>", {
				"data-role":"list-divider",
				"data-theme": "f",
				"text": line.destination
			}).append(
			$("<span>",{
				"class":"ui-li-count",
				"text":idLine
			})
			).appendTo($ul);


			line.buses.forEach(function(bus){
				return $("<li>", {"class":"bus-data-li"})
				.append(drawBusItem("location", bus.distance))
				.append(drawBusItem("time", bus.time))
				.appendTo($ul);
			});
		});

		$ul.listview("refresh");
		$ul.find(".bus-data-item > a").buttonMarkup();

		function drawBusItem(icon, data){

			var $a = $("<a>", {
				"href":"#",
				"data-role":"button",
				"data-inline":"true",
				"data-icon": "flat-"+icon,
				"data-theme":"a",
				"data-iconpos": "notext",
			});

			if(icon=="location"){
				var value = parseDistance(data);
			}else{
				var value = parseTime(data);
				if (data >= 999999)
					$a.attr("data-theme", "d");
				else if(data >= 10*60)
					$a.attr("data-theme", "e");
				else if(data < 2)
					$a.attr("data-theme", "f");
			}

			return $("<div>",{"class":"bus-data-item"})
			.append($a)
			.append($("<h2>").text(value))
		}

		function parseTime(time){
			if(time >= 999999)
				return "> 20:00";
			else if(time == 0)
				return "En parada";
			else{
				var seconds = time%60;
				if(seconds < 10)seconds = "0"+seconds;
				var minutes = Math.floor(time/60);

				return minutes+":"+seconds;
			}
		}

		function parseDistance(dist){
			return dist+" m";
		}
	}
}

$(document).on("panelbeforeopen", "#fav-panel", function(e){
	var $favs = $("#favorites");
	$favs.children(":not(.fav-title)").remove();

	var favs = JSON.parse(localStorage.favorites || '[]');

	if($.isEmptyObject(favs)){
		$favs.append($("<li>", {"text":"No hay favoritos"}));
	}else{
		$.each(favs, function(id, fav){
			$("<li>")
			.append($("<a>", {"href":"javascript:loadFavorite("+id+")","text":fav}))
			.append($("<span>", {"class":"ui-li-count","text":id}))
			.appendTo($favs);
		});
	}
	$favs.listview("refresh");
});

function updateButton(idStop){
	var desc = getFavorite(idStop);

	if(!!desc)
		changeBtn(desc, "e", "flat-cross", function(){
			var $dialog = $("#fav-rem-dialog");
			$dialog.data("idStop", idStop);
			$("#fav-rem-cancelbtn").on("vclick", function(){
				$dialog.popup("close");
			});
			$("#fav-rem-confirm").on("vclick", function(){
				removeFavorite($dialog.data("idStop"));
				$dialog.popup("close");
			});
			$dialog.popup("open");
		});
	else
		changeBtn("Añadir a favoritos", "e", "flat-plus", function(){
			$("#stop").val(idStop);
			$("#fav-add-dialog").one("popupafteropen", function(){
				$("#desc").focus();
			}).popup("open");
		});
}

function addFavorite(idStop, description){
	var idStop = idStop || $("#stop").val();
	var description = description || $("#desc").val();

	var favs = JSON.parse(localStorage.favorites || '{}');
	favs[idStop] = description;
	localStorage.favorites = JSON.stringify(favs);
	$("#fav-add-dialog").popup("close");

	updateButton(idStop);
}

function removeFavorite(idStop){
	var favs = JSON.parse(localStorage.favorites || '[]');
	delete favs[idStop];
	localStorage.favorites = JSON.stringify(favs);

	updateButton(idStop);
}

function getFavorite(idStop){
	var favs = JSON.parse(localStorage.favorites || '[]');
	return favs[idStop] || null;
}

function loadFavorite(idStop){
	$("#fav-panel").one("panelclose", function(){
		$("#searchstop").val(idStop).parent()[0].submit();
	}).panel("close");
}

function changeBtn(text, theme, icon, action){
	$("#statusBtn")
	.buttonMarkup({theme: theme, icon: icon || null})
	.off("vclick").on("vclick", action || null)
	.find(".ui-btn-text").text(text);
}

$(document).on("pageshow", "#paradas", function(){
	initMap().then(showLocation);
}).on("pageinit", "#paradas", function(){
	$("#centerOnPosition").on("vclick", function(){
		centerOnPosition();
	});
});

function initMap(){
	var dfdMap = $.Deferred();

	if(!emt.map){
		var MADRID = new google.maps.LatLng(40.416775,-3.70379);

		var mapOptions = {
			backgroundColor:'#f2f2f2',
			streetViewControl:false,
			mapTypeControl:false,
			zoom: 10,
			center: MADRID,
			styles: [
				{
					"featureType": "transit.station.bus",
					"stylers": [
					{ "visibility": "off" }
					]
				}
			],
			mapTypeId: google.maps.MapTypeId.ROADMAP
		}
		emt.map =  new google.maps.Map($("#stopMap")[0], mapOptions);
		var transitLayer = new google.maps.TransitLayer();
		transitLayer.setMap(emt.map);

		google.maps.event.addListener(emt.map, 'idle', function() {

			clearTimeout(emt.timer);
			if(!!emt.streq) emt.streq.abort();

			if(emt.map.getZoom() < 16){
				$("#mapMsg").text("Acérquese más para cargar las paradas").removeClass("dismissed");
			}else{
				emt.timer = setTimeout(function(){
					$("#mapMsg").addClass("dismissed");

					var center = emt.map.getCenter();
					var bounds = emt.map.getBounds();
					var radius = Math.ceil(google.maps.geometry.spherical.computeDistanceBetween(bounds.getNorthEast(), bounds.getSouthWest()) / 2);
					getParadasCercanas({
						lat: center.lat(),
						lng: center.lng(),
						radius:radius
					}).then(drawStops, function(a){
						console.log("ERROR", a);
					});
				}, 1000);
			}
		});

		dfdMap.resolve();
	}else{
		dfdMap.resolve();
	}

	return dfdMap;
}

function showLocation(){
	var dfdLocation = $.Deferred();
	var firstTime = true;

	emt.location =  new google.maps.Marker({
		map: emt.map,
		title:"Ubicación actual",
		icon:{
			url: 'img/location.png',
			scaledSize: new google.maps.Size(12, 12),
			size: new google.maps.Size(34, 34),
			origin: new google.maps.Point(0,0),
			anchor: new google.maps.Point(6, 6)
		}
	});
	emt.circle = new google.maps.Circle({
		map:emt.map,
		fillColor:"#3498db",
		fillOpacity:.2,
		strokeWeight:0
	});

	if(navigator.geolocation){
		navigator.geolocation.watchPosition(function(position){
			var latlng = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			emt.location.setPosition(latlng);
			emt.circle.setCenter(latlng);
			emt.circle.setRadius(Number(position.coords.accuracy));
			if(firstTime){
				firstTime = false;
				centerOnPosition();
			}
		});
	}else{
		dfdLocation.reject();
	}
}


function centerOnPosition(){
	emt.map.setCenter(emt.location.getPosition());
	emt.map.setZoom(17);
}

function getParadasCercanas(position){
	if(!!emt.streq) emt.streq.abort();

	$("#mapMsg").text("Cargando paradas...").removeClass("dismissed");

	emt.streq = $.ajax({
		url: 'api/getStopsFromXY',
		data: position,
		cache:false,
		type: "get",
		dataType:"json"
	}).success(function(){
		$("#mapMsg").addClass("dismissed");
	});

	return emt.streq;
}

function drawStops(data){
	var stops = data.Output.Stop;

	if(!stops) return false;

	stops.forEach(function(item){
		var stop= emt.markers[item.IdStop[0]];

		if(!stop){
			var marker = new google.maps.Marker({
				map:emt.map,
				title:"Parada  " + item.IdStop[0],
				position: new google.maps.LatLng(item.CoordinateY[0], item.CoordinateX[0]),
				icon:{
					url: 'img/marker.png',
					scaledSize: new google.maps.Size(12, 12),
					size: new google.maps.Size(32, 32),
					origin: new google.maps.Point(0,0),
					anchor: new google.maps.Point(6, 6)
				},
				animation:google.maps.Animation.DROP
			});

			var lines = [];

			item.Line.forEach(function(line){
				lines.push(line.Label[0]);
			});

			stop = emt.markers[item.IdStop[0]]= {
				marker: marker,
				lines: lines,
				stopId:item.IdStop[0],
				address: item.Name[0]
			};

			google.maps.event.addListener(marker, 'click', function() {
				displayInfoWindow(stop);
			});
		}

	});

	function displayInfoWindow(stop){
		if(!emt.infowindow){
			emt.infowindow = new google.maps.InfoWindow();
		}

		var $content = $("<div>").addClass("infoWindow");

		$("<div>", {"class":"iw-stopid", "text":stop.stopId}).appendTo($content);
		$("<div>", {"class":"iw-addr", "text":stop.address}).appendTo($content);

		var $lineWrap = $("<div>", {"class":"iw-lines"}).appendTo($content);
		stop.lines.forEach(function (line){
			var $line = $("<span>", {"class":"lineLabel", "text":line}).appendTo($lineWrap);
			if(line.charAt(0) == "N")
				$line.addClass("nightBus");
			else if(line.charAt(0) == "L")
				$line.addClass("metroBus");
		});

		$("<a>", {
			"href":"#",
			"data-role":"button",
			"data-icon":"search",
			"data-iconpos":"left",
			"data-theme":"b",
			"text":"Consultar parada",
		}).on("vclick", function(e){
			e.preventDefault();
			checkStop(stop.stopId);
		}).buttonMarkup()
		.appendTo($content);

		emt.infowindow.setContent($content[0]);

		emt.infowindow.open(emt.map, stop.marker);
	}

	function checkStop(stopId){
		$("#searchstop").val(stopId);
		var $page = $("#tiempos").on("pageshow", function(){
			$("#searchstop").closest("form")[0].submit();
		});
		$.mobile.changePage($page,{
			transition:"slide",
			reverse:true
		});
	}
}
