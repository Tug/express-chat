
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
        var cssbak = namebox.css('border');
        namebox.css('border', '4px solid red');
        setTimeout(function() { namebox.css('border', cssbak); }, 2*1000);
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
      if(!messages || messages.length == 0) {
        addMessage("!! Server Error !! Please reload application.");
        return;
      }
      $.each(messages, function(i, msg){
        addMessage(msg);
        nextMsgId++;
      });
      pollForMessages();
    });
  })();

  function addMessage(msg) {
    $('#messages')
      .append('<li>' + msg + '</li>')
      .get(0).scrollTop = $('#messages').get(0).scrollHeight
  }

  function refreshUserList(){
    users.sort(function(a,b){return a.toLowerCase() > b.toLowerCase()});
    $('#users').empty();
    $.each(users, function(i, usr){
      $('#users').append('<li>' + usr + '</li>');
    });
  };

  (function initUsers(){
    $.getJSON(roomID+'/users', function(response){
      users = response;
      refreshUserList();
      pollForUsers();
    });
  })();

  function pollForUsers(){
    $.getJSON(roomID+'/live/users', function(response){
      var newusers = response.newusers;
      var usersleft = response.usersleft;
      if( (!newusers && !usersleft) || (newusers.length == 0 && usersleft.length == 0) ) {
        addMessage("!! Server Error !! Please reload application.");
        return;
      }
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

  $('#creatorname').click(function() {
    $('#creatorname').val('');
  });

  // actions to take when arriving in the page
  var timer = setInterval(function() {
    clearInterval(timer);
    
  }, 10);

  setInterval(function(){
    $.getJSON(roomID+"/keepalive", function(data){});
  }, 30*1000);

  $(window).unload(function () {
    $.getJSON(roomID+"/part", function(data){});
  });

	var uploader = new plupload.Uploader({
		runtimes : 'gears,flash,silverlight,browserplus,html5,html4',
		browse_button : 'pickfiles',
		container : 'container',
		url : roomID+'/upload',
	  max_file_size : '200mb',
    multipart: true,
		// Flash settings
	  flash_swf_url : '/public/javascripts/plupload/plupload.flash.swf',
	  // Silverlight settings
	  silverlight_xap_url : '/public/javascripts/plupload/plupload.silverlight.xap'
		/*filters : [
			{title : "Image files", extensions : "jpg,gif,png"},
			{title : "Zip files", extensions : "zip"}
		],
		resize : {width : 320, height : 240, quality : 90}
    */
	});

	uploader.bind('Init', function(up, params) {
		$('#filelist').html("<div>Current runtime: " + params.runtime + "</div>");
	});

  uploader.bind('FilesAdded', function(up, files) {
		$.each(files, function(i, file) {
			$('#filelist').append(
				'<div id="' + file.id + '">' +
				'File: ' + file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
				'</div>'
			);
		});
	});
  
	uploader.bind('UploadProgress', function(up, file) {
		$('#' + file.id + " b").html(file.percent + "%");
	});

	$('#uploadfiles').click(function(e) {
		uploader.start();
		e.preventDefault();
	});

	uploader.init();

  //$('#uploader').hide();
  
  //$('#uploadshow').click(function() {
  //  $('#uploader').show(400);
  //  return false;
  //});

})

