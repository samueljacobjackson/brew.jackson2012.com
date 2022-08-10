function showAlert(title, message, clazz) {
    var alertDom =
        '<div class="alert alert-' + clazz + ' alert-dismissible alert-fixed fade show" role="alert">' +
        '<strong>' + title + '</strong> ' + message +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '</div>'
    $('#alerts').append(alertDom);
    alertTimeout(3000);
}

function randomString(length) {
    var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

function alertTimeout(wait) {
    setTimeout(function () {
        $('#alerts').children('.alert:first-child').remove()
    }, wait);
}

function filterBoards(tags) {
    var classes = ''
    for (var tag of tags) {
        classes += '.' + tag.replace('.', '-').toLowerCase();
    }
    if(classes == ''){
        $('.board-item').removeClass('d-none');
        $('.board-item').removeClass('d-flex');
        $('.board-item').addClass('d-flex');
    }
    else {
        $('.board-item').addClass('d-none');
        $('.board-item').removeClass('d-flex');
        $(classes).addClass('d-flex');
        $(classes).removeClass('d-none');
    }
}

function filterTiles(tags) {
    var classes = ''
    for (var tag of tags) {
        classes += '.' + tag.replace(' .', '-').toLowerCase();
    }
    if(classes == ''){
        $('.tile-item').removeClass('d-none');
        $('.tile-item').removeClass('d-flex');
        $('.tile-item').addClass('d-flex');
    }
    else {
        $('.tile-item').addClass('d-none');
        $('.tile-item').removeClass('d-flex');
        $(classes).addClass('d-flex');
        $(classes).removeClass('d-none');
    }
    $('#tile-gallery-modal').modal('handleUpdate');
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255)
        throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}

function makeToast(title, message, icon) {
    var timer = 0;
    var notify = {}
    var clock = {}
    var notifyId = randomString(10);

    clock[notifyId] = setInterval(function() {
        timer += 5;
        if(timer >= 3600) {
            notify[notifyId].update('title', ' '+ title +' <small class="float-right">'  + Math.floor(timer / 3600) + ' hr ago</small>');
        }
        else if(timer >= 60 && timer < 360){
            notify[notifyId].update('title', ' '+ title +' <small class="float-right">'  + Math.floor(timer / 60) + ' min ago</small>');
        }
        else {
            notify[notifyId].update('title', ' '+ title +' <small class="float-right">'  + timer + ' sec ago</small>');
        }
    }, 5000);

    notify[notifyId] = $.notify(
    {
        icon: icon,
        title: title,
        message: message
    },
    {
        placement :{
            from: 'bottom'
        },
        newest_on_top: false,
        allow_dismiss: true,
        type: 'minimalist',
        z_index: 1150,
        delay: 0,
        onClose: function(){ clearInterval(clock[notifyId]); },
        template:
            '<div data-notify="container" class="col-xs-11 col-sm-3 alert alert-{0}" role="alert">' +
            '<button type="button" aria-hidden="true" class="close" data-notify="dismiss" style="line-height: 0.5">&times;</button>' +
            '<div style="width: 100%; padding-right: 30px;">' + 
            '<span data-notify="icon"></span>' +
            '<span data-notify="title"> {1} <small class="float-right">Just Now</small></span>' +
            '</div>' +
            '<span data-notify="message">{2}</span>' +
            '</div>'
    });

    return notify[notifyId]
}

function addTheBrackets(list, delim) {
    var out = "";
    list.forEach(function (word, index) {
        out += "[" + word + "] ".replace('-', '.');
    });
    return out.trim();
}

function toClass(list) {
    var out = "";
    list.forEach(function(word, index) {
        out += word + ' ';
    });
    return out.trim();
}

function validateEmail(email){
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(email);
}