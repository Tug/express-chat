
$(function(){
  var roomID = document.location.pathname;
  var nextMsgId = 0;
  var users = [];

  $('#SendMsgForm').submit(function(){
    var messagebox = $('#message');
    var msg = messagebox.val();
    if(msg) {
      $.post(roomID+'/live', { message: msg }, function(){
        ;
      });
    } else {
      messagebox.css('border', '1px solid red');
    }
    return false;
  });

  $('#SendNameForm').submit(function(){
    var namebox = $('#name');
    if(namebox.val())
      var name = namebox.val();
      if($.inArray(name, users) != -1) {
        namebox.css('border', '1px solid red');
      } else {
        $.post(roomID+'/live', { name: namebox.val() }, function(){
          ;
        });
      }
    return false;
  });

  // Longpoll
  (function pollForMessages(){
    $.getJSON(roomID+'/live/msg/'+nextMsgId, function(response){
      var messages = response.messages;
      $.each(messages, function(i, msg){
        $('#messages')
          .append('<li>' + msg + '</li>')
          .get(0).scrollTop = $('#messages').get(0).scrollHeight
        nextMsgId++;
      });
      pollForMessages();
    });
  })();

  (function initUsers(){
    $.getJSON(roomID+'/users', function(response){
      users = response;
      refreshUserList();
      pollForUsers();
    });
  })();

  function refreshUserList(){
    $('#users').empty();
    $.each(users, function(i, usr){
      $('#users').append('<li>' + usr + '</li>');
    });
  };

  function pollForUsers(){
    $.getJSON(roomID+'/live/users', function(response){
      var newusers = response.newusers;
      var usersleft = response.usersleft;
      $.each(usersleft, function(i, usr){
        users = $.grep(users, function(value) {
          return value != usr;
        });
      });
      $.each(newusers, function(i, usr){
        users.push(usr);
      });
      refreshUserList();
      pollForUsers();
    });
  };

  $('#message').keyup(function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { // ENTER
      if($('#message').val() != '\n')
        $('#SendMsgForm').submit();
      $('#message').val('');
    }
  });

  setInterval(function(){
    $.getJSON(roomID+"/keepalive", function(data){});
  }, 30*1000);

  $(window).unload(function () {
    $.getJSON(roomID+"/part", function(data){});
  });



 	$("#uploader").pluploadQueue({
	  // General settings
	  runtimes : 'html5,gears,flash,silverlight,browserplus,html4',
	  url : roomID+'/upload',
	  max_file_size : '200mb',
	  chunk_size : '1mb',
	  unique_names : true,

	  // Resize images on clientside if we can
	  //resize : {width : 320, height : 240, quality : 90},

	  // Specify what files to browse for
	  //filters : [
	  //	{title : "Image files", extensions : "jpg,gif,png"},
	  //	{title : "Zip files", extensions : "zip"}
	  //],

	  // Flash settings
	  flash_swf_url : '/public/javascripts/plupload/plupload.flash.swf',

	  // Silverlight settings
	  silverlight_xap_url : '/public/javascripts/plupload/plupload.silverlight.xap'
	});

	// Client side form validation
	$('#UploadForm').submit(function(e) {
		var uploader = $('#uploader').pluploadQueue();

		// Validate number of uploaded files
		if (uploader.total.uploaded == 0) {
			// Files in queue upload them first
			if (uploader.files.length > 0) {
				// When all files are uploaded submit form
				uploader.bind('UploadProgress', function() {
					if (uploader.total.uploaded == uploader.files.length)
						$('#UploadForm').submit();
				});

				uploader.start();
			} else
				alert('You must at least upload one file.');

			e.preventDefault();
		}
	});

  //$('#uploader').hide();
  
  //$('#uploadshow').click(function() {
  //  $('#uploader').show(400);
  //  return false;
  //});

})

