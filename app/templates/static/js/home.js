class Home {
    constructor() {
        var h = this;
        $("input[type='number']").inputSpinner();
        $("#modal-add-item-file").fileinput(h.getFileInput()).on('fileuploaded', function(event, previewId, index, fileId) { h.onFileAdded(event, previewId, index, fileId) });
        $('#modal-edit-item-file').fileinput(h.getFileInput()).on('fileuploaded', function(event, previewId, index, fileId) { h.onFileUpdated(event, previewId, index, fileId) });
        $("#modal-tile-details").summernote(h.getSummerNote());

        $('.game-accept-invite').on('click', function(e){
            h.acceptInvite(e);
        });
        $('#modal-item-add').on('click', function(e) {
            h.addItem(e);
        });
        $('.page-toggle').on('click', function(e) {
            h.changePage(e);
        });
        $('#create-game-submit').on('click', function(e) {
            h.createGame(e);
        });
        $('.game-decline-invite').on('click', function(e) {
            h.declineInvite(e);
        });
        $('#modal-delete-item-submit').on('click', function(e) {
            h.deleteItem(e);
        });
        $('#modal-delete-item-cancel').on('click', function(e) {
            h.dontDeleteItem(e);
        });
        $('#modal-item-delete').on('click', function(e) {
            h.getDeleteItem(e);
        });
        $('.game-edit-game').on('click', function(e) {
            h.getEditGame(e);
        });
        $('#modal-invite-send').on('click', function(e) {
            h.invitePlayer(e);
        });
        $('#modal-item').on('hidden.bs.modal', function(e) {
            h.itemClearAll(e);
        });
        $('.btn-add-item').on('click', function(e) {
            h.itemOpenModal(e);
        });
        $('.game-play-game').on('click', function(e) {
            h.playGame(e);
        });
        $('#modal-remove-submit').on('click', function(e){
            h.removeSend(e);
        })
        $('#modal-revoke-submit').on('click', function(e){
            h.revokeSend(e);
        })
        $('#modal-accept-submit').on('click', function(e) {
            h.sendAccept(e);
        });
        $('#modal-decline-submit').on('click', function(e) {
            h.sendDecline(e);
        });
        $('#card-select-game').on('show', function(e) {
            h.showGameList(e);
        });
        $('#modal-item-edit').on('click', function(e) {
            h.updateItem(e);
        });
    }
    acceptInvite(e){
        var game_key = $(e.currentTarget).data('gamekey');
        $('#modal-accept-game-key').val(game_key);
        $('#modal-accept').modal('show');
    }

    addItem(e) {
        $('#modal-item-add').prop('disabled', true);
        $("#modal-add-item-file").fileinput('upload');
    };
 
    afterAddItem(data) {
        $('#modal-item').modal('hide');
        this.itemClearAll();
        this.loadItems(data.type);
    }

    afterUpdateItem(data) {
        $('#modal-item').modal('hide');
        this.itemClearAll();
        this.loadItems(data.type);
    }

    getEditItem(e) {
        var type = $(e.currentTarget).data('type');
        var item_key = $(e.currentTarget).data('key');
        var game_key = $('#update-game-key').val()
        var h = this;
        var url = '/getedititem';
        $.ajax({
            url: url,
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'item_key': item_key, 'game_key': game_key, 'type': type }),
            method: 'POST',
            success: function(data){
                if(data.error == false){
                    h.editItem(data);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        })
    }

    changePage(e) {
        var target = $(e.currentTarget).data('target');
        var name = $(e.currentTarget).data('name');
        var current;
        $('.page').each(function(i, page) {
            if ($(page).is(':visible')) {
                current = $(page).attr('id');
            }
        })
        if($('#' + target).attr('id') === current){
            return;
        }
        $('.page').each(function(i, page) {
            $(page).addClass('d-none');
            $(page).removeClass('d-block');
        });
        $('#' + target).removeClass('d-none');
        $('#' + target).addClass('d-block');
        $('#' + target).trigger('show');
        $('#navbar-brand').text(name)
    };

    createGame(e) {
        var name = $('#create-game-name').val();
        var player = $('#create-game-player').val();
        var description = $('#create-game-description').val();
        if(name.trim() === ''){
            return;
        }
        if(description.trim() === ''){
            description = name;
        }
        $.ajax({
            url: '/creategame',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({name: name,description: description, player:player}),
            method: 'POST',
            success: function(data){
                if (data.error===false) {
                    $('#card-create-game').addClass('d-none');
                    $('#card-create-game').removeClass('d-block');
                    $('#create-game-name').val();
                    $('#create-game-player').val();
                    $('#create-game-description').val();

                    $('#card-update-game').removeClass('d-none');
                    $('#card-update-game').addClass('d-block');
                    editGame(data)
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    };

    declineInvite(e){
        var game_key = $(e.currentTarget).data('gamekey');
        $('#modal-decline-game-key').val(game_key);
        $('#modal-decline').modal('show');
    }

    deleteItem(e){
        var key = $('#modal-item-key').val();
        var game_key = $('#update-game-key').val();
        var type = $('#modal-item-type').val()
        
        var h = this;

        $('#modal-delete-item-submit').prop('disabled', true);

        $.ajax({
            url: '/deleteitem',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'game_key': game_key, 'key': key, 'type': type }),
            method: 'POST',
            success: function(data){
                if(data.error === false){
                    $('#modal-delete-item').modal('hide');
                    $('#modal-delete-item-key').val('');
                    $('#modal-delete-item-type').val('');
                    $('#modal-item').modal('hide');
                    h.itemClearAll();
                    h.loadItems(data.type);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    dontDeleteItem(e){
        $('#modal-delete-item').modal('hide');
        $('#modal-delete-item-key').val('');
        $('#modal-delete-item-type').val('');
    }

    loadItems(type) {
        if(type === 'boards') {
            this.loadBoards();
        }
        else if (type === 'tiles') {
            this.loadTiles();
        }
        else if(type === 'players') {
            this.loadPlayers();
        }
        else {
            this.loadBoards();
            this.loadTiles();
            this.loadPlayers();
        }
    }

    loadBoards() {
        var h = this;
        var game_key = $('#update-game-key').val();
        $.ajax({
            url: '/getitems',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'game_key': game_key, 'type': 'board' }),
            method: 'POST',
            success: function(data){
                if(data.error === false){
                    var boards = JSON.parse(data.items)
                    h.listBoards(boards);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    listBoards(boards){
        var h = this;
        $('#update-game-boards').empty();
        for(var key in boards){
            var dom = h.makeItemDom(boards[key], 'board');
            $('#update-game-boards').append(dom);
        }
        $('.edit-item').bind('click', function(e) {
            h.getEditItem(e);
        });
    }

    loadTiles() {
        var h = this;
        var game_key = $('#update-game-key').val();
        $.ajax({
            url: '/getitems',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'game_key': game_key, 'type': 'tile' }),
            method: 'POST',
            success: function(data){
                if(data.error === false){
                    var tiles = JSON.parse(data.items)
                    h.listTiles(tiles);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    listTiles(tiles) {
        var h = this;
        $('#update-game-tiles').empty();
        for(var key in tiles){
            var dom = h.makeItemDom(tiles[key], 'tile');
            $('#update-game-tiles').append(dom);
        }
        $('.edit-item').bind('click', function(e){
            h.getEditItem(e);
        });
    }

    loadPlayers() {
        var h = this;
        var game_key = $('#update-game-key').val();
        $.ajax({
            url: '/getitems',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'game_key': game_key, 'type': 'player' }),
            method: 'POST',
            success: function(data){
                if(data.error === false){
                    var players = JSON.parse(data.items)
                    h.listPlayers(players, data.is_gm)
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    listPlayers(players, is_gm){
        var h = this;
        $('#update-game-players').empty();
        for(var key in players) {
            var buttons = ''
            if(is_gm) {
                if(players[key].accepted) {
                    buttons =
                    '<div class="btn-group btn-group-sm float-right">' + 
                    '<button type="button" class="btn btn-primary remove-player" data-key="' + key + '">Remove Player</button>' + 
                    '</div>'
                }
                else {
                    buttons =
                    '<div class="float-right"><h5 class="m-2 mt-0 mb-0" style="display: inline-block">Invited </h5><div class="btn-group btn-group-sm">' +
                    '<button type="button" class="btn btn-primary revoke-invite" data-key="' + key +'">Revoke</button>' + 
                    '<button type="button" class="btn btn-primary resend-invite" data-key="' + key +'">Resend</button>' +
                    '</div></div>'
                }
            }
            var dom = '<span class="w-100 list-group-item list-group-item-action flex-column align-items-start">' + players[key].name + buttons + '</span>'
            $('#update-game-players').append(dom);
        }
        $('.revoke-invite').on('click', function(e){
            h.revokeInvite(e)
        });
        $('.remove-player').on('click', function(e){
            h.removePlayer(e);
        });
    }

    editGame(data){
        var h = this;

        var game = JSON.parse(data.game);
        $('.gm').prop( "disabled", !data.is_gm );
        $('#navbar-brand').text(game.name);
        $('#update-game-name').val(game.name);
        $('#update-game-description').val(game.description);
        $('#update-game-key').val(game.key);
        $('#update-game-players').empty();
        $('#update-game-boards').empty();
        $('#update-game-tiles').empty();

        this.listBoards(game.boards);
        this.listTiles(game.tiles);
        this.listPlayers(game.players, data.is_gm);

        $('.page').each(function(i, card) {
            $(card).addClass('d-none');
            $(card).removeClass('d-block'); 
        });
        $('#card-update-game').addClass('d-block');
        $('#card-update-game').removeClass('d-none');

        $('.edit-item').bind('click', function(e) {
            h.getEditItem(e);
        })
        
        $('#update-game-submit').on('click', function () {
            var game_key = $('#update-game-key').val()
            var name = $('#update-game-name').val();
            var description = $('#update-game-description').val();
            var url = '/updategame';
            $.ajax({
                url: url,
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ 'game_key': game_key, 'name': name, 'description': description }),
                method: 'POST',
                success: function(data){
                    if(data.error == false){
                        $('#navbar-brand').text(data.name);
                        showAlert('Update Game', 'Success', 'success')
                    }
                    else {
                        showAlert(data.title, data.message, 'danger')
                    }
                }
            });
        });
    }

    editItem(data) {
        var type = data.type;
        var item = JSON.parse(data.item);
        var modal = $('#modal-item');

        modal.find('.toggles').addClass('d-none');
        modal.find('.toggles').removeClass('d-block');
        modal.find('.' + type + '-only').removeClass('d-none');
        modal.find('.' + type + '-only').addClass('d-block');

        modal.find('.item-add').removeClass('d-block');
        modal.find('.item-add').addClass('d-none');
        modal.find('.item-edit').removeClass('d-none');
        modal.find('.item-edit').addClass('d-block');
        

        modal.find('#modal-item-name').val(item.name);
        if(item.details) {
            modal.find('#modal-tile-details').summernote('reset');
            modal.find('#modal-tile-details').summernote('pasteHTML', item.details);
        }
        modal.find('#modal-item-description').val(item.description);
        modal.find('#modal-board-grid').val(item.grid);
        modal.find('#modal-tile-width').val(item.scalex);
        modal.find('#modal-tile-height').val(item.scaley);
        for(var i = 0; i < item.tags.length; i++){
            modal.find('#modal-item-tags').tagsinput('add', item.tags[i]);
        }
        modal.find('#modal-item-player_visible').prop('checked', item.player_visible);
        $('#modal-item-key').val(item.key);
        $('#modal-item-type').val(type);

        modal.modal('show');
    }
   
    getDeleteItem(e){
        var key = $('#modal-item-key').val();
        var game_key = $('#update-game-key').val();
        var type = $('#modal-item-type').val()
        
        $('#modal-item-update').prop('disabled', true);
        $('#modal-item-delete').prop('disabled', true);

        $.ajax({
            url: '/getiteminscene',
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({ 'game_key': game_key, 'key': key, 'type': type }),
            method: 'POST',
            success: function(data){
                if(data.error === false){
                    if(data.exists){
                        $('.delete-warning').addClass('d-block');
                        $('.delete-warning').removeClass('d-none');
                    }
                    else {
                        $('.delete-warning').addClass('d-none');
                        $('.delete-warning').removeClass('d-block');
                    }
                    $('#modal-delete-item').modal('show');
                    $('#modal-delete-item-submit').prop('disabled', false);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    getEditGame(e){ 
        var h = this;

        var key = $(e.currentTarget).data('gamekey');   
        $.ajax({
            url: '/getgame',
            async: false,
            data: key,
            method: 'POST',
            success: function(data){
                if(data.error == false){
                    h.editGame(data);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        })
    };

    getFileInput(route) {
        return {
            uploadUrl: '/upload',
            enableResumableUpload: false,
            maxFileCount: 1,
            showUpload: false,
            autoReplace: true,
            dataShowPreview: false,
            allowedFileTypes: ['image'],
            showCancel: false,
            theme: 'fas',
            maxImageWidth: 4096,
            maxImageHeight: 4096,
            maxFileSize: 10240,
        }
    }
  
    getSummerNote() {
        return {
            height: 300,
            toolbar: [
                ["para", ["style"]],
                ["style", ["bold", "italic", "underline", "clear"]],
                ["font", ["strikethrough", "superscript", "subscript"]],
                ["fontsize", ["fontsize"]],
                ["fontname", ["fontname"]],
                ["color"],
                ["para", ["ul", "ol", "paragraph"]],
                ["link"],
            ],
            disableDragAndDrop: true,
        }
    };

    inviteClearAll(){
        $('#modal-invite-email').val('');
        $('#modal-invite-message').val('');
        $('#modal-invite-name').val('');
    }

    invitePlayer(e) {
        var h = this;

        var modal = $('#modal-invite');
        var valid = true;
        var email = modal.find('#modal-invite-email').val().trim();
        var message = modal.find('#modal-invite-message').val().trim();
        var name = modal.find('#modal-invite-from').val().trim();
        var game_key = $('#update-game-key').val();

        if(game_key.trim() === ''){
            $('#modal-invite').modal('hide');
            this.inviteClearAll();
            showAlert('Key Error', 'Game Key not found.', 'danger')
        }

        if(!validateEmail(email)){
            modal.find('#modal-invite-email').addClass('is-invalid');
            modal.find('#modal-invite-email').removeClass('is-valid');
            valid = false;
        }
        else {
            modal.find('#modal-invite-email').addClass('is-valid');
            modal.find('#modal-invite-email').removeClass('is-invalid');
        }
        if(name === ''){
            modal.find('#modal-invite-from').addClass('is-invalid');
            modal.find('#modal-invite-from').removeClass('is-valid');
            valid = false;
        }
        else {
            modal.find('#modal-invite-from').addClass('is-valid');
            modal.find('#modal-invite-from').removeClass('is-invalid');
        }
        modal.find('#modal-invite-message').addClass('is-valid');
        modal.find('#modal-invite-message').removeClass('is-invalid');

        if(!valid){
            return;
        }
        var data = { 'email': email, 'name': name, 'message': message, 'game_key': game_key }
        $.ajax({
            url: '/sendinvite',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error===false) {
                    $('#modal-invite').modal('hide');
                    h.loadPlayers();
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    itemClearAll() {
        $("#modal-item-tags").tagsinput("removeAll");
        $('#modal-item-name').val('');
        $('#modal-item-description').val('');
        $('#modal-tile-details').summernote("reset");
        $('#modal-item-type').val('');
        $('#modal-board-grid').val('64');
        $('#modal-tile-width').val('1');
        $('#modal-tile-height').val('1');
        $('#modal-item-player_visible').prop("checked", false);
        $("#modal-add-item-file").fileinput('clear');
        $("#modal-edit-item-file").fileinput('clear');
        $('#modal-item-key').val('');
        $('#modal-item-type').val('');
        $('#modal-item-update').prop('disabled', false);
        $('#modal-item-add').prop('disabled', false);
        $('#modal-item-delete').prop('disabled', false);
    }

    itemOpenModal(e) {
        this.itemClearAll()
        var type = $(e.currentTarget).data('type');
        var modal = $('#modal-item');
        modal.find('.toggles').addClass('d-none');
        modal.find('.toggles').removeClass('d-block');
        modal.find('.' + type + '-only').removeClass('d-none');
        modal.find('.' + type + '-only').addClass('d-block');
        
        modal.find('.item-add').removeClass('d-none');
        modal.find('.item-add').addClass('d-block');
        modal.find('.item-edit').removeClass('d-block');
        modal.find('.item-edit').addClass('d-none');

        modal.modal('show');

        $('#modal-item-type').val(type);
    }


    makeItemDom(item, type) {
        return '<li id="li-' + item.key + '" class="list-group-item list-group-item-action flex-column align-items-start">' +
            this.updateItemDom(item, type) +
        '</li>'
    }

    onAddItem(data) {
        var h = this;

        var data = {
            height: data.height,
            width: data.width,
            filename: data.filename,
            tags: $("#modal-item-tags").tagsinput("items"),
            game_key: $('#update-game-key').val(),
            name: $('#modal-item-name').val(),
            description: $('#modal-item-description').val(),
            details: $('#modal-tile-details').val(),
            type: $('#modal-item-type').val(),
            grid: parseInt($('#modal-board-grid').val()),
            scalex: parseInt($('#modal-tile-width').val()),
            scaley: parseInt($('#modal-tile-height').val()),
            player_visible: $('#modal-item-player_visible').prop("checked")
        };
        $.ajax({
            url: '/additem',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error===false) {
                    h.afterAddItem(data);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    onUpdateItem(data, newFile){
        var data = {
            height: data.height,
            width: data.width,
            filename: data.filename,
            key: $("#modal-item-key").val(),
            tags: $("#modal-item-tags").tagsinput("items"),
            game_key: $('#update-game-key').val(),
            name: $('#modal-item-name').val(),
            description: $('#modal-item-description').val(),
            details: $('#modal-tile-details').val(),
            type: $('#modal-item-type').val(),
            grid: parseInt($('#modal-board-grid').val()),
            scalex: parseInt($('#modal-tile-width').val()),
            scaley: parseInt($('#modal-tile-height').val()),
            player_visible: $('#modal-item-player_visible').prop("checked"),
            newFile: newFile
        };
        var h = this;
        $.ajax({
            url: '/updateitem',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error===false) {
                    h.afterUpdateItem(data);
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    onFileAdded (event, previewId, index, fileId) {
        try{
            var data = JSON.parse(previewId.response.filename);
            if(data.error){
                $('#modal-item').modal('hide');
                this.itemClearAll();
                showAlert(data.title, data.message, 'danger');
            }
            return;
        }
        catch(err){
            console.error(err.message);
        }
        this.onAddItem(previewId.response);
    }

    onFileUpdated(event, previewId, index, fileId) {
        try{
            var data = JSON.parse(previewId.response.filename);
            if(data.error){
                $('#modal-item').modal('hide');
                this.itemClearAll();
                showAlert(data.title, data.message, 'danger');
            }
            return;
        }
        catch(err){
            console.error(err.message);
        }
        this.onUpdateItem(previewId.response, true);
    }

    playGame(e) {
        var key = $(e.currentTarget).data('gamekey');
        $.ajax({
            url: '/startsession',
            async: false,
            data: key,
            method: 'POST',
            success: function(data){
                if (data === key) {
                    window.location.replace('/session');
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    };

    removePlayer(e){
        var key = $(e.currentTarget).data('key');
        $('#modal-remove-key').val(key);
        $('#modal-remove').modal('show');
    }

    removeSend(e){
        var h = this;
        var key = $('#modal-remove-key').val()
        var game_key = $('#update-game-key').val()
        var data = { 'game_key': game_key, 'key': key }
        $.ajax({
            url: '/removeplayer',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error === false) {
                    $('#modal-remove-key').val();
                    $('#modal-remove').modal('hide');
                    h.loadPlayers();
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    revokeInvite(e) {
        var key = $(e.currentTarget).data('key');
        $('#modal-revoke-key').val(key);
        $('#modal-revoke').modal('show');
    }

    revokeSend(e){
        var h = this;
        var key = $('#modal-revoke-key').val()
        var game_key = $('#update-game-key').val()
        var data = { 'game_key': game_key, 'key': key }
        $.ajax({
            url: '/revokeinvite',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error === false) {
                    $('#modal-revoke-key').val();
                    $('#modal-revoke').modal('hide');
                    h.loadPlayers();
                }
                else {
                    showAlert(data.title, data.message, 'danger')
                }
            }
        });
    }

    sendAccept(e){
        var h = this;

        var game_key = $('#modal-accept-game-key').val()
        var name = $('#modal-accept-name').val()
        var data = { name: name, game_key: game_key }
        $.ajax({
            url: '/acceptinvite',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error === false) {
                    $('#modal-accept').modal('hide');
                    $('#modal-accept-name').val('');
                    $('#modal-accept-game-key').val('');
                    h.showGameList();
                }
                else {
                    showAlert(data.title, data.message, 'danger');
                }
            }
        });
    }

    sendDecline(e){
        var h = this;

        var game_key = $('#modal-decline-game-key').val()
        var data = { game_key: game_key }
        $.ajax({
            url: '/declineinvite',
            async: true,
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify(data),
            method: 'POST',
            success: function(data){
                if (data.error === false) {
                    $('#modal-decline').modal('hide');
                    $('#modal-decline-game-key').val('');
                    h.showGameList();
                }
                else {
                    showAlert(data.title, data.message, 'danger');
                }
            }
        });
    }

    showGameList(){
        var h = this;

        $('#game-list').empty();
        $.ajax({
            url:'/getgamelist',
            async: false,
            data: '',
            method:'POST',
            success: function(data){
                var games = JSON.parse(data.games)
                for(var i = 0; i < games.length; i++){
                    var dom = 
                    '<a href="#" class="list-group-item list-group-item-action flex-column align-items-start">' +
                        '<div class="d-flex w-100 justify-content-between">' +
                            '<h5 class="mb-1">' + games[i].name + '</h5>' +
                            '<small>GM:' + games[i].gm + '</small>' +
                        '</div>' +
                        '<div class="row w-100">' +
                            '<div class="col-sm-8 col-md-9 col-lg-10">' +
                                '<p class="mb-1">' + games[i].description + '</p>' +
                            '</div>' +
                            '<div class="col-sm-4 col-md-3 col-lg-2">' +
                                '<div class="btn-group-vertical float-sm-right" role="group">' +
                                    h.whenInvite(games[i]) + 
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</a>'
                    $('#game-list').append(dom);
                }
                $('.game-play-game').bind('click', function(e) {
                    h.playGame(e);
                });
                $('.game-edit-game').bind('click', function(e) {
                    h.getEditGame(e);
                });
                $('.game-accept-invite').bind('click', function(e) {
                    h.acceptInvite(e);
                });
                $('.game-decline-invite').bind('click', function(e){
                    h.declineInvite(e);
                });
            }
        })
    };

    updateItem(){
        var h = this;

        var key = $('#modal-item-key').val();
        var game_key = $('#update-game-key').val();
        var type = $('#modal-item-type').val()
        $('#modal-item-update').prop('disabled', true);
        $('#modal-item-delete').prop('disabled', true);

        if($('#modal-edit-item-file').fileinput('getFilesCount') > 0) {
            $('#modal-edit-item-file').fileinput('upload')

            $.ajax({
                url: '/deleteimage',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ 'game_key': game_key, 'key': key, 'type': type }),
                method: 'POST',
                success: function(data){
                    if(data.error === false){
                        // Do nothing
                    }
                    else {
                        showAlert(data.title, data.message, 'danger')
                    }
                }
            });
        } else {
            $.ajax({
                url: '/getitemdata',
                async: false,
                contentType: 'application/json',
                dataType: 'json',
                data: JSON.stringify({ 'game_key': game_key, 'key': key, 'type': type }),
                method: 'POST',
                success: function(data){
                    if(data.error === false){
                        data = JSON.parse(data.item);
                        h.onUpdateItem(data, false);
                    }
                    else {
                        showAlert(data.title, data.message, 'danger')
                    }
                }
            });
        }
    }

    updateItemDom(item, type) {
        return '<div id="container-' + item.key + '" class="container"><div class="row">' +
            '<div class="container col-2 thumb">' +
                '<a class="image-thumb thumbnail" href="#" data-key="' + item.key + '"' + 'data-toggle="modal" data-target="#image-box" data-name="' + item.name + '"' + 'data-image="' + item.src + '">' +
                    '<img class="img-thumbnail" src="' + item.src + '" alt="' + item.name + '">' +
                '</a>' +
            '</div>' +
            '<div class="col-10">' +
                '<strong>' +  this.whenOwned(item, item.key, type) + ' </strong>' +
                '<br>' + item.description + 
            '</div>' + 
        '</div></div>'
    }

    
    whenInvite(game){
        if(game.invite) {
            var dom =
            '<button class="btn btn-secondary game-accept-invite" data-gamekey="' + game.key + '">Accept Invite</button>' +
            '<button class="btn btn-secondary game-decline-invite" data-gamekey="'+ game.key + '">Decline Invite</button>'
        }
        else {
           var dom =
            '<button class="btn btn-secondary game-play-game" data-gamekey="' + game.key + '">Play</button>' +
            '<button class="btn btn-secondary game-edit-game" data-gamekey="'+ game.key + '">Edit</button>'
        }
        return dom;
    }
    whenOwned(item, key, type) {
        return item.does_own ? '<a href="#" data-key="' + key + '" data-type="' + type + '" class="edit-item">' + item.name + '</a>' : item.name;
    }
}