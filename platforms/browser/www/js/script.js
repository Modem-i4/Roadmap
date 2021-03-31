var map, postMap;
var lastPostMarker;
window.initMap = function() {
	let ViennaCoords = { lat: 48.41731983024014, lng: 16.307378810941803 };
	map = new google.maps.Map(document.getElementById("map"), {
		center: ViennaCoords,
		zoom: 11,
		disableDefaultUI: true,
		zoomControl: true,
		myLocationEnabled: true
		});
		
	postMap = new google.maps.Map(document.getElementById("post-map"), {
		center: ViennaCoords,
		zoom: 11,
		disableDefaultUI: true,
		zoomControl: true,
		myLocationEnabled: true
		});
};
var rememberedFields = ['username', 'phone', 'e-mail', 'instagram', 'telegram'];

function homeLoad() {
	//get images
	$.get(`http://192.168.1.6/roadmap/getPhotos.php?deviceId=0f53a856863919d0`,//${device.uuid}`, 
	function(response) {
		$images = JSON.parse(response);
		if($images.length) {
			$('#last-photos').html('<h2 class="center-text">Your previous commits</h2>');
		} else {
			$('#last-photos').html('<div class="center-text no-commits"><img src="img/no-commits.png"><p>No commits yet</p></div>');
		}
		
		$images.forEach(image => {
			$('#last-photos').append(`<div class="gallery" data-id="${image.id}" style="background: url('data:image/jpg;base64,${image.thumb}')"></div>`)
		});
		$('.gallery').click(LaunchDetailsPage);
	});
}

function getPhotoFromCamera() { 
		navigator.camera.getPicture(onPhotoSuccess, onFail, { 
		quality: 75, 
		sourceType: navigator.camera.PictureSourceType.CAMERA, 
		destinationType: navigator.camera.DestinationType.DATA_URL, 
	}); 
} 
function getPhotoFromAlbum(){ 
	navigator.camera.getPicture(onPhotoSuccess, onFail,{ 
		quality: 75, 
		sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY, 
		destinationType: navigator.camera.DestinationType.DATA_URL 
	}); 
} 
function onPhotoSuccess(imageData){ 
	$('input[name=image]').val(imageData);
	LaunchGPSPage();
}
function onFail(message){ 
	if(message == "20") {
		alert("You must allow access to your storage");
	}
	else {
		alert("Photo was not selected");
	}
}

function LaunchGPSPage() {
	location.hash = "#geolocation";
	centerMapToUser();
}
function LaunchContactForm() {
	location.hash = "#contactform";
	$('.loading-bg').addClass('hidden');
}

function contactLoad() {
	$('input[name=comment]').val('');
	$('input[name=lat]').val(map.center.lat());
	$('input[name=lon]').val(map.center.lng());
	$('input[name=uuid]').val(device.uuid);
	alert(map.center.lng());
	// load fields
	rememberedFields.forEach(item => {
		$('#'+item).val(window.localStorage.getItem(item));
	});
}

function centerMapToUser() {
	navigator.geolocation.getCurrentPosition(
		(position) => {
			let latLng = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
			map.setCenter(latLng);
			
			new google.maps.Marker({
				position: latLng,
				map: map,
				icon: {
					path: google.maps.SymbolPath.CIRCLE,
					scale: 10,
					fillOpacity: 1,
					strokeWeight: 2,
					fillColor: '#5384ED',
					strokeColor: '#ffffff',
				},
			});
		},
		function onError(error) {
			alert('code: '    + error.code    + '\n' +
		  'message: ' + error.message + '\n');
		},{
			enableHighAccuracy: false
		});
}
function LaunchThanksPage() {
	location.hash = "#thanks";
}


function validateForm(e) {
	let valid = true;
	e.preventDefault();
	$('.loading-bg').removeClass('hidden')
	if (valid) {
		let data = $('#contact-info').serialize();
		$.post("http://192.168.1.6/roadmap/upload.php", data, LaunchThanksPage);
		// save fields
		rememberedFields.forEach(item => {
			window.localStorage.setItem(item, $('#'+item).val());
		});
	}
}

function openShifterWithSwipe() {
	if($.mobile.activePage.attr('id') != "geolocation")
		$.shifter("open");
}

function LaunchDetailsPage() {
	location.hash = "#details";
	$("#post-details").html('<div class="center-text loading-spinner"><img src="img/load.gif"></div>');
	$("post-map").addClass('hidden');
	$.get(`http://192.168.1.6/roadmap/getPost.php?id=${this.getAttribute('data-id')}`,
	function(response) {
		$post = JSON.parse(response);
		$html = `
		<div class="center-text">
			<img class="main-photo" src="data:image/jpg;base64,${$post.image}">
			<span style="float: left;">${moment($post.date).format('MMM DD, YYYY HH:mm')}</span>
			<span style="float: right; font-weight: bold;">${$post.username}</span>
		</div><br>`;
		if($post.comment) {
			$html += `
			<div class="center-text"><h3>Your comment:</h3></div>
			<span>${$post.comment}</span>`;
		}
		else {
			$html += `<span>You have not commented this photo</span>`;
		}
		$html += `<div class="center-text"><h3>Map:</h3></div>`;
		$('#post-details').html($html);
		if($post.phone || $post.email || $post.instagram || $post.telegram) {
			$html = `<div class="center-text"><h3>Your contacts:</h3></div>
						<div class="contacts">`;
			if($post.phone)
				$html += `<div class="phone">${$post.phone}</div>`;
			if($post.email) 
				$html += `<div class="email">${$post.email}</div>`;
			if($post.instagram) 
				$html += `<div class="instagram">${$post.instagram}</div>`;
			if($post.telegram) 
				$html += `<div class="telegram">${$post.telegram}</div>`;
			$html += `</div>`;
			$('#post-contacts').html($html)
		}
		$("post-map").removeClass('hidden');
		let pos = { lat: parseFloat($post.lat), lng: parseFloat($post.lon) };
		postMap.setCenter(pos);
		map.setZoom(11);
		if(lastPostMarker != null) {
			lastPostMarker.setMap(null);
		}
		var lastPostMarker = new google.maps.Marker({
			position: pos,
			map: postMap
		});
			
	});
}

$(function() {
	$('#get-album-photo').click(getPhotoFromAlbum);
	$('#get-camera-photo').click(getPhotoFromCamera);
	$('#accept-geo').click(LaunchContactForm);
	$("#contact-info").submit(validateForm);
	$(document).on("deviceready", homeLoad);
	$(document).on('pageshow', '#home', homeLoad);
	$(document).on('pageshow', '#contactform', contactLoad);

	$.shifter({maxWidth: "1024px"});
	$(".shifter-page").on("swipeleft", openShifterWithSwipe);
	$('.shifter-navigation a').click(() => $.shifter("close")); 
});
