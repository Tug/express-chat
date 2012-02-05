
$(document).ready(function() {

    $.getJSON('/rooms/list', function(rooms) {
        rooms = rooms || [];
        rooms.forEach(function(room) {
            var roomName = ;
            var roomUrl = '/r/'+room.id;
            $('#rooms').append('<li></li>');
        });
    });

});
