class Session extends GameSession {
    constructor(document, window) {
        super(document, window);

        var gs = this;

        this.IOSocket.on("doDeleteFogOfWar", function(payload) {
            var obj = JSON.parse(payload);
            gs.doDeleteFogOfWar(obj);
        });
        this.IOSocket.on("doDrawFogOfWar", function (payload) {
            var obj = JSON.parse(payload);
            gs.doDrawFogOfWar(obj);
        });
        this.IOSocket.on('doGMSaveScene', function (payload) {
            var obj = JSON.parse(payload);
            gs.doGMSaveScene(obj)
        })
        this.IOSocket.on("doListBoards", function (payload) {
            var obj = JSON.parse(payload);
            gs.doListBoards(obj);
        });
        this.IOSocket.on('doManageFogOfWar', function(payload){
            var obj = JSON.parse(payload);
            gs.doManageFogOfWar(obj)
        });
        this.IOSocket.on("doToggleFogOfWar", function(payload) {
            var obj = JSON.parse(payload);
            gs.doToggleFogOfWar(obj);
        });
        this.IOSocket.on("doUnlockTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doUnlockTile(obj);
        });
    }

    doDeleteFogOfWar(obj) {
        delete this.Scene.fog_of_war[obj.key]
        var fogOfWar = this.Stage.find(function (node) {
            return node.getAttr("id") === obj.key;
        })[0];
        fogOfWar.destroy();
        this.Stage.batchDraw();
        $('#' + obj.key).remove();
    }

    doDrawFogOfWar(obj){
        $('#modal-new-fog').modal('hide');
        $('#modal-new-fog-name').val('');
        this.Stage.container().style.cursor = 'crosshair';
        this.fogOfWar.key = obj.key;
        this.fogOfWar.name = obj.name;
        this.fogOfWar.mode = 'draw';
    }

    doGMSaveScene(obj) {
        this.requestSaveScene(obj.scene);
    }

    doListBoards(obj) {
        $("#modal-select-board-gallery").empty();
        for (var board of obj.list_1) {
            this.appendBoard(board);
        }
        $("#modal-select-board").modal("show");
    }

    doLoadFogOfWar(){
        var gs = this;
        var fogs = this.Stage.find(function(node){
            return node.getAttr("name") === 'fog-of-war';
        });
        fogs.fillPatternRepeat('repeat');
        fogs.opacity(0.36);
        fogs.show();
        fogs.stroke('red');
        fogs.listening(false);
        fogs.on("mouseenter", function (e) {
            gs.inFogOfWar = false;
        });    
        fogs.on("mouseout", function (e) {
            gs.inFogOfWar = false;
        });    
        var image = new Image();
        image.onload = function(){
            fogs.fillPatternImage(image);
        }
        image.src = "/static/img/stripes-background.png";
        
        for (var key in this.Scene.fog_of_war){
            var fogOfWar = this.Stage.find(function (node) {
                return node.getAttr("id") === key;
            })[0];
            if(!fogOfWar){
                delete this.Scene.fog_of_war[key]
                continue;
            }
            fogOfWar.closed(this.Scene.fog_of_war[key].enabled);
        }
        this.Stage.drawHit();
        this.Stage.batchDraw();
    }

    doManageFogOfWar(obj) {
        var gs = this;
        $('#modal-manage-fog-list').empty();
        var fogs = obj.list_1;
        for (var n in fogs){
            var dom = 
            '<li id="' + fogs[n].key + '"class="list-group-item w-100">' + 
                '<h5 style="display:inline-block;">' + fogs[n].name + '</h5>' +
                '<div class="float-right">' + 
                    this.getEnabled(fogs[n]) +
                    '<button type="button" class="btn btn-outline-dark mr-1 btn-fog-delete" data-key="' + fogs[n].key + '">' + 
                        '<i class="fas fa-trash"></i>' +
                    '</button>' +
                '</div>' +
            '</li>'
            $('#modal-manage-fog-list').append(dom)
        }
        $('.btn-fog-toggle').bind('click', function(e){
            var p = new Payload();
            p.key = $(e.currentTarget).data('key');
            p.bool_1 = $(e.currentTarget).data('toggle') == 'enable' ? true : false;
            p.scene_key = gs.Scene.key;
            gs.IOSocket.emit('requestToggleFogOfWar', p)
        });
        $('.btn-fog-delete').bind('click', function(e){
            var p = new Payload();
            p.key = $(e.currentTarget).data('key');
            p.scene_key = gs.Scene.key;
            gs.IOSocket.emit('requestDeleteFogOfWar', p)
        });
        $('#modal-manage-fog').modal('show')
    }

    getEnabled(fog){
        var dom
        if(fog.enabled) {
            dom =
            '<button id="FogToggle' + fog.key + '" type="button" class="btn btn-outline-dark btn-fog-toggle mr-1" data-key="' + fog.key + '" data-toggle="disable">' + 
                '<i class="fas fa-sun"></i>'+
            '</button>'
        }
        else {
            dom =
            '<button id="FogToggle' + fog.key + '" type"button" class="btn btn-outline-dark btn-fog-toggle mr-1" data-key="' + fog.key + '" data-toggle="enable">' + 
                '<i class="fas fa-cloud-sun"></i>' +
            '</button>'
        }
        return dom
    }

    doToggleFogOfWar(obj) {
        this.Scene.fog_of_war[obj.key].enabled = obj.bool_1;
        this.Stage.find(function (node) {
            return node.getAttr("id") === obj.key;
        }).closed(obj.bool_1);
        this.Stage.batchDraw();
        this.requestManageFogOfWar();
    }

    doUnlockTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }
        if (!_c(this.Scene.tiles[obj.id].owner)) {
            return;
        }
        this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0].setAttr("draggable", true);
    }

    requestCreateScene(name, description, player, locked, key) {
        var p = new Payload();
        p.name = name;
        p.string_1 = description;
        p.bool_1 = player;
        p.bool_2 = locked;
        p.key = key;
        this.IOSocket.emit("requestCreateScene", p);
    }

    requestDeleteScene() {
        var p = new Payload();
        p.scene_key = this.Scene.key;
        this.IOSocket.emit("requestDeleteScene", p);
    }

    requestListBoards() {
        var p = new Payload();
        this.IOSocket.emit("requestListBoards", p);
    }

    requestLoadBoard(key) {
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.scene = this.Scene;
        p.key = key;
        this.IOSocket.emit("requestLoadBoard", p);
    }

    requestManageFogOfWar() {
        var p = new Payload();
        p.scene_key = this.Scene.key;
        this.IOSocket.emit('requestManageFogOfWar', p);
    }

    requestNewFogOfWar(name) {
        var p = new Payload();
        p.name = name;
        p.scene_key = this.Scene.key;
        this.IOSocket.emit('requestNewFogOfWar', p);
    }

    requestTogglePlayerLocked(player_locked) {
        this.Scene.player_locked = player_locked;
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.scene = this.Scene;
        p.bool_1 = player_locked;
        this.IOSocket.emit("requestTogglePlayerLocked", p);
    }

    requestTogglePlayerVisible(player_visible) {
        this.Scene.player_visible = player_visible;
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.scene = this.Scene;
        p.bool_1 = player_visible;
        this.IOSocket.emit('requestTogglePlayerVisible', p);
    }

    requestSaveScene(scene) {
        if(!scene || scene.key == this.Scene.key){
            scene = this.Scene;
            scene.stage = this.Stage.toJSON();
        }
        var p = new Payload();
        p.scene = scene;
        p.scene_key = scene.key;
        this.IOSocket.emit('requestSaveScene', p);
    }

    sessionLockScene(player_locked) {}

    fogDrawClick(){
        var gs = this
        if(!_g()) {
            return;
        }
        if(this.fogOfWar.mode !== 'draw'){
            return;
        }

        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };
        var stagePos = this.Stage.getAbsolutePosition();
        var scale = this.Stage.scale().x;
        if(scale === 0) {return;}
        var x = (this.CurrentPos.x - stagePos.x) / scale;
        var y = (this.CurrentPos.y - stagePos.y) / scale;
        
        var pos = { x: x, y: y }
        
        var fogOfWarLayer = this.Stage.find(function (node) {
            return node.getAttr("id") === "fog-of-war-layer";
        })[0];
        
        if(this.fogOfWar.isOverStart) {
            this.fogOfWar.isDrawing = false;
            this.fogOfWar.mode = 'none'
            this.fogOfWar.points = [];
            this.fogOfWar.line.closed(true);
            this.fogOfWar.line.opacity(0.36);

            var fogOfWarRects = this.Stage.find(function (node) {
                return node.getAttr("name") === "fog-of-war-rect";
            });
            for(var i = 0; i < fogOfWarRects.length; i++){
                fogOfWarRects[i].destroy();
            }
            this.Stage.container().style.cursor = 'auto';
            this.Stage.batchDraw();

            this.Scene.fog_of_war[this.fogOfWar.key] = {
                key: this.fogOfWar.key,
                enabled: true,
                name: this.fogOfWar.name
            }
            this.requestSaveScene();
            return;
        }
        
        this.fogOfWar.isDrawing = true;

        var rect = new Konva.Rect({
            name: 'fog-of-war-rect',
            x: pos.x - 3,
            y: pos.y - 3,
            width: 6,
            height: 6,
            fill: "white",
            stroke: "red",
            strokeWidth: 3,
        })
        if(this.fogOfWar.line === null || this.fogOfWar.points.length === 0){
            if(this.fogOfWar.key.trim().length === 0){
                return;
            }
            rect.hitStroke = 12;
            rect.on('mouseenter', function(e) {
                gs.fogStartMouseEnter(e);
            });
            rect.on('mouseout', function(e){ 
                gs.fogStartMouseOut(e)
            });  
            this.fogOfWar.line = new Konva.Line({
                name: 'fog-of-war',
                id: gs.fogOfWar.key,
                points : [pos.x, pos.y, pos.x, pos.y],
                stroke: "red",
                strokeWidth: 4,
                lineCap: 'round',
                lineJoin: 'round',
                listening: true
            });
            this.fogOfWar.line.fillPatternRepeat('repeat');
            var image = new Image();
            image.onload = function(){
                gs.fogOfWar.line.fillPatternImage(image);
            }
            image.src = "/static/img/stripes-background.png";
            this.fogOfWar.points.push(pos.x, pos.y);
            this.fogOfWar.points.push(pos.x, pos.y);
            fogOfWarLayer.add(this.fogOfWar.line)
        }
        else {
            this.fogOfWar.points.push(pos.x, pos.y);
            this.fogOfWar.points.push(pos.x, pos.y);
        }
        
        fogOfWarLayer.add(rect);
        this.Stage.batchDraw();
    }

    fogDrawStop(){
        if(this.fogOfWar.mode !== 'draw'){
            return false;
        }
        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };
        this.fogOfWar.line.destroy();
        var fogOfWarRects = this.Stage.find(function (node) {
            return node.getAttr("name") === "fog-of-war-rect";
        });
        for(var i = 0; i < fogOfWarRects.length; i++){
            fogOfWarRects[i].destroy();
        }
        this.fogOfWar.isDrawing = false;
        this.fogOfWar.mode = 'none'
        this.fogOfWar.points = [];
        this.Stage.container().style.cursor = 'auto';
        this.Stage.batchDraw();
        return true;
    }

    fogDrawMove(){
        if(!_g()) {
            return null;
        }
        if(this.fogOfWar.mode !== 'draw' || !this.fogOfWar.isDrawing){
            return;
        }
        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };
        var stagePos = this.Stage.getAbsolutePosition();
        var scale = this.Stage.scale().x;
        if(scale === 0) {return;}
        var x = (this.CurrentPos.x - stagePos.x) / scale;
        var y = (this.CurrentPos.y - stagePos.y) / scale;
        var pos = {x: x, y: y}

        this.fogOfWar.points.pop();
        this.fogOfWar.points.pop();
        this.fogOfWar.points.push(pos.x, pos.y);
        this.fogOfWar.line.points(this.fogOfWar.points);
        this.Stage.batchDraw();
    }

    fogStartMouseEnter(e){
        if(!this.fogOfWar.isDrawing || this.fogOfWar.points.length < 3){
            return;
        }
        e.target.scale({x:2, y:2});
        this.fogOfWar.isOverStart = true;
    }

    fogStartMouseOut(e){
        e.target.scale({x:1, y:1});
        this.fogOfWar.isOverStart = false;
    }

    appendBoard(board) {
        var gs = this;

        var ele =
            '<li class="list-group-item d-flex board-item ' +
            toClass(board.tags) +
            '" id="' +
            board.key +
            '">' +
            '<div class="container col-xs-2 col-lg-2 thumb">' +
            '<a class="image-thumb thumbnail" href="#" data-key="' +
            board.key +
            '"' +
            'data-toggle="modal" data-target="#image-box" data-name="' +
            board.name +
            '"' +
            'data-image="' +
            board.src +
            '">' +
            '<img class="img-thumbnail" src="' +
            board.src +
            '" alt="' +
            board.name +
            '">' +
            "</a>" +
            "</div>" +
            '<div class="container col-xs-7 col-lg-7 caption">' +
            "<span>" +
            "<h4>" +
            board.name +
            "</h4>" +
            "</span>" +
            "<span>" +
            board.description +
            "</span>" +
            '<p class="text-lowercase font-weight-light">' +
            addTheBrackets(board.tags, " ") +
            "</p>" +
            "</div>" +
            '<div class="container col-xs-1 col-lg-1 align-middle ">' +
            '<a href="#" class="btn btn-info btn-xs modal-select-board-button" role="button"' +
            'data-key="' +
            board.key +
            '">Select</a>' +
            "</div>" +
            "</li>";
        $("#modal-select-board-gallery").append(ele);
        $(".modal-select-board-button").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var key = $(e.currentTarget).data("key");

            $("#modal-create-scene-name").val(board.name);
            $("#modal-create-scene-description").val(board.description);
            $("#modal-create-scene-key").val(key);
            $("#modal-select-board").modal("hide");
            $("#modal-create-scene").modal("show");
        });
        $(".thumbnail").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var image = $(e.currentTarget).data("image");
            $("#image-box-image").attr("src", image);
            $("#image-box").modal("show");
        });
        $("#modal-select-board").modal("handleUpdate");
    }
}

function _g() {
    return true;
}

function _c(key) {
    return true;
}

function _s(key) {
    return key === $("#__PlayerKey").val();
}

function _p() {
    return $("#__PlayerKey").val();
}
