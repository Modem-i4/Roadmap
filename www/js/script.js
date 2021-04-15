var map, postMap;
var lastPostMarker;
const DOMAIN = "http://www.struktur-stmk.at";
window.initMap = function() {
	let GrazCoords = { lat: 47.07018099431958, lng: 15.439704404807907 };
	map = new google.maps.Map(document.getElementById("map"), {
		center: GrazCoords,
		zoom: 17,
		disableDefaultUI: true,
		zoomControl: true,
		myLocationEnabled: true
		});
		
	postMap = new google.maps.Map(document.getElementById("post-map"), {
		center: GrazCoords,
		zoom: 17,
		disableDefaultUI: true,
		zoomControl: true,
		myLocationEnabled: true
		});
};
var rememberedFields = ['username', 'phone', 'e-mail', 'instagram', 'telegram'];

function homeLoad() {
	//get images
	$.get(`${DOMAIN}/getPhotos.php?deviceId=${device.uuid}`, 
	function(response) {
		$images = response;
		if($images.length) {
			$('#last-photos').html('<h2 class="center-text">Your previous commits</h2>');
		} else {
			$('#last-photos').html('<div class="center-text no-commits"><img src="img/no-commits.svg"></div>');
		}
		
		$images.forEach(image => {
			$('#last-photos').append(`<div class="gallery" data-id="${image.id}" style="background: url('data:image/jpg;base64,${image.thumb}')"></div>`)
		});
		$('.gallery').click(LaunchDetailsPage);
	});
}

function getPhotoFromCamera() { 
		navigator.camera.getPicture(onPhotoSuccess, onFail, { 
		quality: 85, 
		sourceType: navigator.camera.PictureSourceType.CAMERA, 
		destinationType: navigator.camera.DestinationType.DATA_URL, 
	}); 
} 
function getPhotoFromAlbum(){ 
	navigator.camera.getPicture(onPhotoSuccess, onFail,{ 
		quality: 85, 
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
	location.hash = "#home";
	showMessage("Thanks!<br>Your post has been submited!");
}


function validateForm(e) {
	e.preventDefault();

	let valid = true;

	let usernameInput = $("#contact-info .username");
	let emailInput = $("#contact-info .email");
	let phoneInput = $("#contact-info .phone");
	$(".error-label").html("");
	$('.ui-input-text').removeClass("input-error");

	if(usernameInput.val().length < 5) {
		$(".name-error").html("Please enter your full name");
		usernameInput.parent().addClass("input-error");
		valid = false;
	}
	if(emailInput.val().length < 5 && phoneInput.val().length < 5) {
		$(".contact-error").html("Please enter your email or mobile phone");
		emailInput.parent().addClass("input-error");
		phoneInput.parent().addClass("input-error");
		valid = false;
	}
	if (valid) {
		let data = $('#contact-info').serialize();
		$('.loading-bg').removeClass('hidden')
		$.post(`${DOMAIN}/upload.php`, data, LaunchThanksPage);
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
var postId;
function LaunchDetailsPage() {
	location.hash = "#details";
	postId = this.getAttribute('data-id');
	$("#details .loading-spinner").removeClass('hidden');
	$("#details-content").addClass('hidden');
	$.get(`${DOMAIN}/getPost.php?id=${postId}`,
	function(response) {
		$post = response;
		$html = `
		<div class="center-text">
			<img class="main-photo" src="data:image/jpg;base64,${$post.image}">
			<span style="float: left;">${moment($post.date).format('MMM DD, YYYY HH:mm')}</span>
			<span style="float: right; font-weight: bold;">${$post.username}</span>
		</div><br><hr/>`;
		if($post.comment) {
			$html += `
			<div class="center-text"><h3>Your comment:</h3></div>
			<span>${$post.comment}</span>`;
		}
		else {
			$html += `<span>You have not commented this photo</span>`;
		}
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
			$html += `</div><hr/>`;
			$('#post-contacts').html($html);
		}
		$("#details .loading-spinner").addClass('hidden');
		$("#details-content").removeClass('hidden');
		let pos = { lat: parseFloat($post.lat), lng: parseFloat($post.lon) };
		postMap.setCenter(pos);
		map.setZoom(17);
		if(lastPostMarker != null) {
			lastPostMarker.setMap(null);
		}
		var lastPostMarker = new google.maps.Marker({
			position: pos,
			map: postMap
		});
			
	});
}

function showModal() {
	$("#details .modal-container").removeClass('hidden-animated');
}
function hideModal() {
	$("#details .modal-container").addClass('hidden-animated');
}
function showMessage(msg) {
	$("#home .modal-container").removeClass('hidden-animated');
	$("#home .modal-container h3").html(msg);
}
function hideMessage() {
	$("#home .modal-container").addClass('hidden-animated');
}

function deletePost() {
	$.post(`${DOMAIN}/deletePost.php`, {id: postId})
	.success(function() {
		location.hash = "#home";
		showMessage("Your post has been deleted!");
		hideModal();
	});
}

$(function() {
	$('#get-album-photo').click(getPhotoFromAlbum);
	$('#get-camera-photo').click(getPhotoFromCamera);
	$('#accept-geo').click(LaunchContactForm);
	
	$('#remove-post').click(showModal);
	$('#details .modal button.yes').click(deletePost);
	$('#details .modal button.close').click(hideModal);
	$('#home .modal button.close').click(hideMessage);
	

	$("#contact-info").submit(validateForm);
	$(document).on("deviceready", homeLoad);
	$(document).on('pageshow', '#home', homeLoad);
	$(document).on('pageshow', '#contactform', contactLoad);

	$.shifter({maxWidth: "1024px"});
	$(".shifter-page").on("swipeleft", openShifterWithSwipe);
	$('.shifter-navigation a').click(() => $.shifter("close")); 
});
