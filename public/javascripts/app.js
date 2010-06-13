
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


  function longPollJSON(geturl, success_callback, timeout) {
    if(!timeout) timeout = 50000;
    $.ajax({
      type: "GET",
      async: true,
      cache: false,
      dataType: 'json',
      url: geturl,
      timeout: timeout,
      success: success_callback,
      error: function(request, status){
        if(status == "timeout") {
          setTimeout(function() {
            success_callback({});
          }, 1000);
        } else {
          addMessage("Connection lost! Retry later.");
        }
      }
    });
  }

  (function pollForMessages(){
    longPollJSON(roomID+'/live/msg/'+nextMsgId, function(response){
      var messages = response.messages;
      if(messages && messages.length > 0) {
        $.each(messages, function(i, msg){
          addMessage(msg);
          nextMsgId++;
        });
      }
      pollForMessages();
    });
  })();

  function pollForUsers(){
    longPollJSON(roomID+'/live/users', function(response){
      var newusers = response.newusers;
      var usersleft = response.usersleft;
      if((newusers && newusers.length > 0) || (usersleft && usersleft.length > 0)) {
        $.each(usersleft, function(i, usr) {
          users = $.grep(users, function(value) {
            return value != usr;
          });
        });
        $.each(newusers, function(i, usr){
          users.push(usr);
        });
        refreshUserList();
      }
      pollForUsers();
    });
  };

  (function initUsers(){
    $.getJSON(roomID+'/users', function(response){
      users = response;
      refreshUserList();
      pollForUsers();
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

  $('#message').keyup(function(e) {
    var code = (e.keyCode ? e.keyCode : e.which);
    if(code == 13) { // ENTER
      if($('#message').val() != '\n')
        $('#SendMsgForm').submit();
      $('#message').val('');
    }
  });

  $('#SendMsgForm').submit( function() {
    $('#message').val('');
    return false;
  });

  $('#creatorname').click(function() {
    $('#creatorname').val('');
  });

  // actions to take when arriving in the page
  var timer = setInterval(function() {
    clearInterval(timer);

  }, 10);

  $(window).bind('beforeunload', function () {
    $.getJSON(roomID+"/part", function(data){});
  });

  var button = $('#uploadButton'), interval;
  new AjaxUpload(button, {
    action: roomID+'/upload',
    name: 'file',
    autoSubmit: true,
    responseType: false,
    onSubmit : function(file, ext) {
			// change button text, when user selects file			
			button.text('Uploading');
			// If you want to allow uploading only 1 file at time,
			// you can disable upload button
			this.disable();
			// Uploading -> Uploading. -> Uploading...
			interval = window.setInterval(function(){
				var text = button.text();
				if (text.length < 13){
					button.text(text + '.');
				} else {
					button.text('Uploading');
				}
			}, 200);
		},
		onComplete: function(file, response){
      if(response != "<pre>OK</pre>")
        file += " -- Error: File size limit exceeded !"
      else
        file += " -- OK"
			button.text('Upload');
			window.clearInterval(interval);
			// enable upload button
			this.enable();
      $('<div class="file"></div>').appendTo('#fileList').text(file);
		},
    data: [{ "MAX_FILE_SIZE": $("#maxFileSize").text() }]
  });

})

