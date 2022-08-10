class GameSession {
    constructor(document, window) {
        this.window = window;
        this.document = document;

        var gs = this;

        this.Stage = null;

        this.Scene = new Scene();
        this.DiceBox = new DiceBox();

        var container = document.getElementById("modal-dice-box-body");
        this.DiceBox.dice_initialize(container, $("#__PlayerKey").val());

        this.TileObjs = {};
        this.BoardObj = null;

        this.fogOfWar = {};
        this.fogOfWar.isOverStart = false;
        this.fogOfWar.isDrawing = false;
        this.fogOfWar.line = null;
        this.fogOfWar.mode = 'none';
        this.fogOfWar.points = [];
        this.fogOfWar.key = '';

        this.inFogOfWar = false;
        this.inTile = false;
        this.tooltipInterval = null;

        this.dice;

        this.IOSocket = io.connect(
            location.protocol + "//" + document.domain + ":" + location.port
        );
        this.IOSocket.on("displayError", function (payload) {
            gs.displayError(payload);
        });
        this.IOSocket.on("displayInfo", function (payload) {
            gs.displayInfo(payload);
        });
        this.IOSocket.on("displayWarning", function (payload) {
            gs.displayWarning(payload);
        });
        this.IOSocket.on("doAddTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doAddTile(obj);
        });
        this.IOSocket.on("doDeleteScene", function (payload) {
            var obj = JSON.parse(payload);
            gs.doDeleteScene(obj);
        });
        this.IOSocket.on("doDeleteTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doDeleteTile(obj);
        });
        this.IOSocket.on("doEditDetails", function (payload) {
            var obj = JSON.parse(payload);
            gs.doEditDetails(obj);
        });
        this.IOSocket.on("doEditTooltip", function (payload) {
            var obj = JSON.parse(payload);
            gs.doEditTooltip(obj);
        });
        this.IOSocket.on("doHideTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doHideTile(obj);
        });
        this.IOSocket.on("doLoadBoard", function (payload) {
            var obj = JSON.parse(payload);
            gs.doLoadBoard(obj);
        });
        this.IOSocket.on("doLoadScene", function (payload) {
            var obj = JSON.parse(payload);
            gs.doLoadScene(obj);
        });
        this.IOSocket.on("doLockTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doLockTile(obj);
        });
        this.IOSocket.on("doMoveTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doMoveTile(obj);
        });
        this.IOSocket.on("doRollDice", function (payload) {
            var obj = JSON.parse(payload);
            gs.doRollDice(obj);
        });
        this.IOSocket.on("doRotateTile", function (payload) {
            var obj = JSON.parse(payload);
            gs.doRotateTile(obj);
        });
        this.IOSocket.on("doShowRollResults", function (payload) {
            var obj = JSON.parse(payload);
            gs.doShowRollResults(obj);
        });
        this.IOSocket.on("doShowTooltip", function (payload) {
            var obj = JSON.parse(payload);
            gs.doShowTooltip(obj);
        });
        this.IOSocket.on("doViewDetails", function (payload) {
            var obj = JSON.parse(payload);
            gs.doViewDetails(obj);
        });
        this.IOSocket.on("doListScenes", function (payload) {
            var obj = JSON.parse(payload);
            gs.doListScenes(obj);
        });
        this.IOSocket.on("doListTiles", function (payload) {
            var obj = JSON.parse(payload);
            gs.doListTiles(obj);
        });
        this.IOSocket.on("doPrependDiceLog", function (payload) {
            var obj = JSON.parse(payload);
            gs.doPrependDiceLog(obj);
        });
        this.IOSocket.on("doDeliverMessage", function (payload) {
            var obj = JSON.parse(payload);
            gs.doDeliverMessage(obj);
        });
        this.IOSocket.on("doPrependMessageLog", function (payload) {
            var obj = JSON.parse(payload);
            gs.doPrependMessageLog(obj);
        });
        this.IOSocket.on("doViewMessage", function (payload) {
            var obj = JSON.parse(payload);
            gs.doViewMessage(obj);
        });
        this.IOSocket.on('connect', function(){
            console.log('Connected')
            gs.IOSocket.emit("player_join", _p());
        });
        this.CurrentObj = null;
        this.ContextMenu = $("#context-menu-tile");
        this.CurrentPos = { x: 0, y: 0 };

        this.ScaleBy = 1.09;

        this.init();
    }

    init() {
        var gs = this;

        this.Stage = new Konva.Stage({
            container: "stage",
            width: innerWidth,
            height: innerHeight,
            draggable: false,
        });
        this.Stage.on("wheel", function (e) {});
        this.Stage.on("contextmenu", function (e) {
            e.evt.preventDefault();
        });
        this.Stage.on("dragmove", function (e) {});
        this.Stage.on("dragstart", function (e) {});
        this.Stage.on("dragend", function (e) {});
        this.Stage.on("mouseenter", function (e) {});
        this.Stage.on("mouseout", function (e) {});
        this.Stage.on("mousemove", function (e) {});
        this.Stage.on("click", function (e) {});

        window.addEventListener("click", function () {
            gs.ContextMenu.hide();
        });

        var tileLayer = new Konva.Layer({
            id: "tile-layer"
        });
        this.Stage.add(tileLayer);

        var fogOfWarLayer = new Konva.Layer({
            id: "fog-of-war-layer"
        });
        this.Stage.add(fogOfWarLayer);

        var tooltipLayer = new Konva.Layer({
            id: "tooltip-layer"
        });
        this.Stage.add(tooltipLayer);

        var tooltip = new Konva.Label({
            id: "tooltip",
            x: 0,
            y: 0,
            opacity: 0.75,
            visible: false,
            name: "tooltip",
        });

        tooltip.add(
            new Konva.Tag({
                id: "tooltip-tag",
                fill: "black",
                lineJoin: "round",
                shadowColor: "black",
                shadowBlur: 10,
                shadowOffsetX: 10,
                shadowOffsetY: 10,
                shadowOpacity: 0.5,
                name: "tooltip-tag",
            })
        );

        var tooltipText = new Konva.Text({
            id: "tooltip-text",
            text: "",
            fontSize: 18,
            padding: 5,
            fill: "white",
            name: "tooltip-text",
        });

        tooltip.add(tooltipText);
        tooltipLayer.add(tooltip);

        WebFont.load({
            custom: {
                families: ["FontAwesome"],
                urls: ["/static/css/fa-all.css"],
                testStrings: {
                    FontAwesome: "\uf00c\uf000",
                },
            },
            active: function () {
                console.log("active: loaded all web fonts");
                tooltipText.fontFamily("fontAwesome");
                tooltipLayer.draw();
            },
        });

        this.Scene.src = "/static/img/defaultBoard.jpg";

        this.BoardObj = new Image();
        this.BoardObj.onload = function (image) {
            var board = new Konva.Image({
                x: 0,
                y: 0,
                image: gs.BoardObj,
                width: innerWidth,
                height: innerHeight,
                id: "board",
                name: "board",
            });
            tileLayer.add(board);
            tileLayer.batchDraw();
        };

        this.BoardObj.crossOrigin = "Anonymous";
        this.BoardObj.src = this.Scene.src;
        this.Stage.batchDraw();
    }

    displayError(msg) {
        var title = "Hey!";
        if (typeof msg === "object") {
            title = msg.title;
            msg = msg.message;
        }
        showAlert(title, msg, "danger");
    }

    displayInfo(msg) {
        var title = "Hey!";
        if (typeof msg === "object") {
            title = msg.title;
            msg = msg.message;
        }
        showAlert("Hey!", msg, "info");
    }

    displayWarning(msg) {
        var title = "Hey!";
        if (typeof msg === "object") {
            title = msg.title;
            msg = msg.message;
        }
        showAlert("Hey!", msg, "warning");
    }

    doAddTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        var gs = this;

        this.Scene.tiles[obj.id] = obj.tile;
        var draggable = _c(this.Scene.tiles[obj.id].owner);
        this.TileObjs[obj.id] = new Konva.Group({
            id: "G" + obj.id,
            draggable: draggable,
            name: "tile-group",
            offsetX: 0,
            offsetY: 0,
            scaleX: obj.tile.scalex,
            scaleY: obj.tile.scaley
        });
        this.TileObjs[obj.id].id = "G" + obj.id;

        var image = new Image();
        image.onload = function (e) {
            gs.onAddTile(e, obj);
        };
        image.crossOrigin = "Anonymous";
        image.pos = obj.map_1;
        image.src = obj.tile.src;
    }

    doDeleteTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        this.Stage.batchDraw();

        var tile = this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0];

        try {
            tile.destroy();
        } catch {}
        delete this.Scene.tiles[obj.id];

        this.Stage.batchDraw();
        if (obj.bool_1) {
            this.requestSaveScene();
        }
    }

    doDeleteScene(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }
        $("#modal-delete-scene").modal("hide");
        this.init();
    }

    doDeliverMessage(obj) {
        var gs = this;

        var title = obj.map_1.title;
        var message =
            '<div id="message-' +
            obj.map_1.key +
            '" class="truncated">' +
            obj.map_1.message +
            "</div>" +
            '<br><a href="#" class="view-message" data-key="' +
            obj.map_1.key +
            '">[View Message]</a>';
        var icon = obj.map_1.icon;

        var notify = makeToast(title, message, icon);

        $(".view-message").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            $("#modal-log-view").modal("hide");
            $("#modal-view-message").modal("show");

            var key = $(e.currentTarget).data("key");
            gs.requestViewMessage(key);
            notify.close();
        });
    }

    doEditDetails(obj) {
        $("#modal-tile-details-editor").summernote("reset");
        $("#modal-tile-details-title").text(obj.name);
        if (obj.text.trim() != "") {
            $("#modal-tile-details-editor").summernote("pasteHTML", obj.text);
        }
        $("#modal-tile-details").modal("show");
    }

    doEditTooltip(obj) {
        $("#modal-edit-tooltip-text").val(obj.tile.tooltip);
        $("#modal-edit-tooltip").modal("show");
    }

    doHideTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        var tile = this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0];

        var icon = this.Stage.find(function (node) {
            return node.getAttr("id") === "Icon" + obj.id;
        })[0];

        var iconText = this.Stage.find(function (node) {
            return node.getAttr("id") === "IconText" + obj.id;
        })[0];

        this.Scene.tiles[obj.id].hidden = obj.bool_1;
        if (!obj.bool_1) {
            tile.show();
            icon.setPosition({ x: 0, y: 0 });
            icon.hide();
        } else {
            iconText.fontFamily("fontAwesome");
            icon.setPosition({ x: 0, y: 0 });
            icon.show();
            if (!_c(this.Scene.tiles[obj.id].owner)) {
                tile.hide();
            } else {
                tile.show();
            }
        }

        this.Stage.batchDraw();
        if (obj.bool_2) {
            this.requestSaveScene();
        }
    }

    doListScenes(obj) {
        $("#modal-select-scene-gallery").empty();
        for (var scene of obj.list_1) {
            this.appendScene(scene);
        }
        $("#modal-select-scene").modal("show");
    }

    doListTiles(obj) {
        $("#modal-select-tile-gallery").empty();
        for (var tile of obj.list_1) {
            this.appendTile(tile);
        }
        $("#modal-select-tile").modal("show");
    }

    doLoadBoard(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        var gs = this;

        this.Scene.width = obj.scene.width;
        this.Scene.height = obj.scene.height;
        this.Scene.filename = obj.scene.filename;
        this.Scene.grid = obj.scene.grid;
        this.Scene.src = obj.scene.src;
        this.BoardObj = new Image();
        this.BoardObj.onload = function (e) {
            gs.onLoadBoard(e, obj);
        };
        this.BoardObj.crossOrigin = "Anonymous";
        this.BoardObj.src = this.Scene.src;
    }

    doLoadScene(obj) {
        var gs = this;
        this.Scene = obj.scene;

        this.Stage = Konva.Node.create(this.Scene.stage, "stage");

        this.Stage.on("wheel", function (e) {
            gs.onWheel(e);
        });
        this.Stage.on("contextmenu", function (e) {
            gs.onContextMenu(e);
        });
        this.Stage.on("dragmove", function (e) {
            gs.onDragMove(e);
        });
        this.Stage.on("dragstart", function (e) {
            gs.onDragStart(e);
        });
        this.Stage.on("dragend", function (e) {
            gs.onDragEnd(e);
        });
        this.Stage.on("mousemove", function (e) {
            gs.onMouseMove(e);
        });
        this.Stage.on("click", function (e) {
            gs.onClick(e);
        });

        this.Stage.draggable(true);
        this.Stage.size({
            width: innerWidth,
            height: innerHeight,
        });

        this.BoardObj = new Image();
        this.BoardObj.onload = function () {
            gs.onLoadScene();
        };
        this.BoardObj.crossOrigin = "Anonymous";
        this.BoardObj.src = this.Scene.src;

        this.TileObjs = {};
        for (var key in this.Scene.tiles) {
            this.Scene.tiles[key].editMode = false;
            this.TileObjs[this.Scene.tiles[key].id] = new Image();
            this.TileObjs[this.Scene.tiles[key].id].id = this.Scene.tiles[key].id;
            this.TileObjs[this.Scene.tiles[key].id].onload = function (e) {
                gs.onLoadTile(e);
            };
            this.TileObjs[this.Scene.tiles[key].id].crossOrigin = "Anonymous";
            this.TileObjs[this.Scene.tiles[key].id].src = this.Scene.tiles[
                key
            ].src;
        }

        var fogOfWar = this.Stage.find(function(node) {
            return node.getAttr("name") === "fog-of-war";
        });
        for (var i = 0; i < fogOfWar.length; i++) {
            if (!(fogOfWar[i].getAttr("id") in this.Scene.fog_of_war)) {
                fogOfWar[i].destroy();
            }
        }

        this.doLoadFogOfWar();

        var tiles = this.Stage.find(function (node) {
            return node.getAttr("name") === "tile-group";
        });

        for (var i = 0; i < tiles.length; i++) {
            if (!(tiles[i].getAttr("id").substring(1) in this.Scene.tiles)) {
                tiles[i].destroy();
            }
        }

        $("#nav-scene-player_visible").prop(
            "checked",
            this.Scene.player_visible
        );
        $("#nav-scene-player_locked").prop("checked", this.Scene.player_locked);
        if ($(".nav-scene-open").hasClass("d-none")) {
            $(".nav-scene-open").removeClass("d-none");
            $(".nav-scene-open").addClass("d-block");
        }
        
        this.requestSaveScene();
    }

    doLockTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }
        var tile = this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0];
        tile.setAttr("draggable", false);
    }

    doMoveTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        var tile = this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0];
        tile.x(obj.map_1.x);
        tile.y(obj.map_1.y);
        this.Stage.batchDraw();
    }

    doPrependDiceLog(obj) {
        var gs = this;

        var dom =
            '<li class="list-group-item flex-column align-items-start">' +
            '<div class="d-flex w-100 justify-content-between">' +
            '<h5 class="mb-1"><i class="' +
            obj.map_1.icon +
            '"></i> ' +
            obj.map_1.title +
            '</h5></div><div class="message truncated">' +
            obj.map_1.message +
            "</div>" +
            obj.map_1.link +
            "</li>";

        $("#modal-log-view-list").prepend(dom);

        $(".btn-roll").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $("#modal-view-log").modal("hide");
            $("#modal-dice-box").modal("show");

            var values = $(e.currentTarget).data("values");
            var nn = $(e.currentTarget).data("notation");

            gs.DiceBox.reroll(values, nn);
        });
    }

    doPrependMessageLog(obj) {
        var gs = this;

        var dom =
            '<li class="list-group-item flex-column align-items-start">' +
            '<div class="d-flex w-100 justify-content-between">' +
            '<h5 class="mb-1"><i class="' +
            obj.map_1.icon +
            '"></i> ' +
            obj.map_1.title +
            '</h5></div><div class="message truncated">' +
            obj.map_1.message +
            "</div>" +
            obj.map_1.link +
            "</li>";

        $("#modal-view-log-list").prepend(dom);

        $(".view-message").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            $("#modal-view-log").modal("hide");
            $("#modal-view-message").modal("show");

            var key = $(e.currentTarget).data("key");
            gs.requestViewMessage(key);
        });
    }

    doRollDice(obj) {
        console.log(obj.dec);
        this.DiceTray.roll(obj.dice, $("#modal-dice-tray-canvas"));
        $("#modal-dice-tray-total").text("Total: " + obj.dec);
    }

    doRotateTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        var tileImage = this.Stage.find(function (node) {
            return node.getAttr("id") === obj.id;
        });

        tileImage.rotation(obj.decimal_1);
        this.Stage.batchDraw();
        if (obj.bool_1) {
            this.requestSaveScene();
        }
    }

    doShowRollResults(obj) {
        var notation = this.DiceBox.stringify_notation(
            JSON.parse(obj.string_1)
        );
        var title = obj.map_1.title;
        var message = obj.map_1.message + '<br>' + obj.map_1.link
        var icon = obj.map_1.message;

        var notify = makeToast(title, message, icon);

        var dom =
        '<li class="list-group-item flex-column align-items-start py-1">' +
            '<div class="d-flex w-100 justify-content-between">' +
                '<small class="mb-1"><b><i class="' + obj.map_1.icon + '"></i> ' + obj.map_1.title + '</b></small>' +
            '</div>' +
            '<div class="message truncated small">' +
                    obj.map_1.message +
            '</div>' +
            '<small>' +
                    obj.map_1.link +
            '</small>' +
        '</li>'

        $('#modal-dice-box-log').prepend(dom);

        var gs = this;

        $(".btn-roll").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation(); 
            $("#modal-view-log").modal("hide");
            $("#modal-dice-box").modal("show");

            var values = $(e.currentTarget).data("values");
            var nn = $(e.currentTarget).data("notation");

            notify.close();
            gs.DiceBox.reroll(values, nn);
        });
    }

    doShowTooltip(obj){
        var gs = this;
        gs.doShowTooltip_Deep(obj);
    }

    doShowTooltip_Deep(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }

        if(this.inFogOfWar) {
            return;
        }

        var tooltip = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip";
        })[0];

        var tooltipText = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip-text";
        })[0];

        tooltipText.text(obj.string_1);
        tooltip.absolutePosition({ x: 0, y: 0 });
        this.Stage.batchDraw();

        var tooltipRect = {
            x: 0,
            y: 0,
            width: tooltip.width(),
            height: tooltip.height(),
        };
        var tileRect = this.CurrentObj.getClientRect();

        var newX = tileRect.x;
        var newY = tileRect.y;

        var navHeight = $("#navbar-main-nav").height();
        if ($("#nav-toggler").attr("aria-expanded") == "false") {
            navHeight = 0;
        }

        if (
            tileRect.x - 10 - (tooltipRect.width / 2 - tileRect.width / 2) <
            0
        ) {
            newX += tileRect.width; // tileWidth;
            newY += tileRect.height / 2 - tooltipRect.height / 2;
        } else if (
            tileRect.x + tooltipRect.width + tileRect.width / 2 - 20 >
            innerWidth
        ) {
            newX -= tooltipRect.width;
            newY += tileRect.height / 2 - tooltipRect.height / 2;
        } else if (tileRect.y - tooltipRect.height - 10 < navHeight) {
            newX += tileRect.width / 2 - tooltipRect.width / 2;
            newY += tileRect.height;
        } else {
            newX += tileRect.width / 2 - tooltipRect.width / 2;
            newY = tileRect.y - tooltipRect.height;
        }
        tooltip.absolutePosition({ x: newX, y: newY });
        
        if(!this.inTile) {
            return;
        }

        tooltip.show();
        this.Stage.batchDraw();
    }

    doViewDetails(obj) {
        $("#modal-view-tile-details-div").html(obj.tile.details);
        $("#modal-view-tile-details-title").text(obj.tile.name);
        $("#modal-view-tile-details").modal("show");
    }

    doViewMessage(obj) {
        $("#modal-view-message-div").html(obj.map_1.message);
        $("#modal-view-message-title").text(obj.map_1.title);
        $("#modal-view-message").modal("show");
    }

    requestAddTile(key, hidden) {
        var p = new Payload();
        p.key = key;
        p.scene_key = this.Scene.key;
        p.bool_1 = hidden;
        p.string_1 = _p();

        this.CurrentPos.x =
            (this.CurrentPos.x - this.Stage.absolutePosition().x) /
            this.Stage.scaleX();
        this.CurrentPos.y =
            (this.CurrentPos.y - this.Stage.absolutePosition().y) /
            this.Stage.scaleY();
        p.map_1 = this.CurrentPos;

        this.IOSocket.emit("requestAddTile", p);
    }

    requestDeleteTile() {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var p = new Payload();
        p.id = this.CurrentObj.getAttr("id");
        p.scene_key = this.Scene.key;
        this.IOSocket.emit("requestDeleteTile", p);
    }

    requestDeliverMessage(players, message) {
        var p = new Payload();
        p.list_1 = players;
        p.string_1 = message;
        this.IOSocket.emit("requestDeliverMessage", p);
    }

    requestDiceTrayClear(container) {
        container.empty();
        this.DiceTray.clear();
    }

    requestEditDetails() {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.key = this.Scene.tiles[this.CurrentObj.getAttr("id")].key;
        this.IOSocket.emit("requestEditDetails", p);
    }

    requestEditTooltip() {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.id = this.CurrentObj.getAttr("id");
        this.IOSocket.emit("requestEditTooltip", p);
    }

    requestHideTile(hide) {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var p = new Payload();
        p.bool_1 = hide;
        p.scene_key = this.Scene.key;
        p.id = this.CurrentObj.getAttr("id");
        this.IOSocket.emit("requestHideTile", p);
    }

    requestListScenes() {
        var p = new Payload();
        this.IOSocket.emit("requestListScenes", p);
    }

    requestListTiles() {
        var p = new Payload();
        this.IOSocket.emit("requestListTiles", p);
    }

    requestLoadScene(key) {
        var p = new Payload();
        p.scene_key = key;
        this.IOSocket.emit("requestLoadScene", p);
    }

    requestLockTile(id) {
        var p = new Payload();
        p.scene_key = this.Scene.key;
        p.id = id;
        this.IOSocket.emit("requestLockTile", p);
    }

    requestMoveTile(pos, id) {
        var p = new Payload();
        p.map_1 = pos;
        p.scene_key = this.Scene.key;
        p.id = id;
        this.IOSocket.emit("requestMoveTile", p);
    }

    requestRerollDice(dice) {
        var dice = dice.replace(/'/g, "");
        var d = JSON.parse(dice);
        this.DiceTray.roll(d, $("#modal-reroll-dice-tray-canvas"));
    }

    RequestResizeDiceBox() {
        if (!this.DiceBox.shownOnce) {
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.resize();
            this.DiceBox.shownOnce = true;
        }
        this.DiceBox.resize();
    }

    requestRollDice(dice, text) {
        var p = new Payload();
        p.map_1 = dice;
        p.string_1 = text;
        this.IOSocket.emit("requestRollDice", p);
    }

    requestRotateTile() {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }

        var p = new Payload();

        var angle = this.CurrentObj.getAbsoluteRotation();
        angle += 90;
        if (angle >= 360) {
            angle -= 360;
        }
        p.decimal_1 = angle;
        p.scene_key = this.Scene.key;
        p.id = this.CurrentObj.getAttr("id");
        this.IOSocket.emit("requestRotateTile", p);
    }

    requestSaveTile() {
        $("#modal-tile-details").modal("hide");
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var text = $("#modal-tile-details-editor").summernote("code");
        if (text.trim() == "") {
            delete this.Scene.tiles[this.CurrentObj.getAttr("id")].details;
        } else {
            this.Scene.tiles[
                this.CurrentObj.getAttr("id")
            ].details = text.trim();
        }
        var p = new Payload();
        p.tile = this.Scene.tiles[this.CurrentObj.getAttr("id")];
        this.IOSocket.emit("requestSaveTile", p);
    }

    requestSaveTooltip() {
        $("#modal-edit-tooltip").modal("hide");
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var tooltip = $("#modal-edit-tooltip-text").val();
        if (tooltip.trim() === "") {
            delete this.Scene.tiles[this.CurrentObj.getAttr("id")].tooltip;
        } else {
            this.Scene.tiles[
                this.CurrentObj.getAttr("id")
            ].tooltip = tooltip.trim();
        }
        this.requestSaveScene();
    }

    requestSetName(name) {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        name = name.trim();
        if (name !== "") {
            this.Scene.tiles[this.CurrentObj.getAttr("id")].name = text.trim();
        }
        this.requestSaveScene();
    }

    requestShowTooltip(id) {
        var gs = this;
        var p = new Payload();
        p.id = id;
        p.scene_key = this.Scene.key;
        this.tooltipInterval = setTimeout(function() {
            gs.IOSocket.emit("requestShowTooltip", p);
        },300);
    }

    requestToggleHideTile(hide) {
        if (!_c(this.Scene.tiles[this.CurrentObj.getAttr("id")].owner)) {
            return;
        }
        var p = new Payload();
        p.id = this.CurrentObj.getAttr("id");
        p.scene_key = this.Scene.key;
        p.bool_1 = hide;
        this.IOSocket.emit("requestToggleHideTile", p);
    }

    requestUnlockTile(id) {
        var p = new Payload();
        p.id = id;
        p.scene_key = this.Scene.key;
        this.IOSocket.emit("requestUnlockTile", p);
    }

    requestViewDetails() {
        var p = new Payload();
        p.key = this.Scene.tiles[this.CurrentObj.getAttr("id")].key;
        p.scene_key = this.Scene.key;
        this.IOSocket.emit("requestViewDetails", p);
    }

    requestViewMessage(key) {
        var p = new Payload();
        p.key = key;
        this.IOSocket.emit("requestViewMessage", p);
    }

    onAddTile(e, obj) {
        var gs = this;

        var tileLayer = this.Stage.find(function (node) {
            return node.getAttr("id") === "tile-layer";
        })[0];

        var width = this.Scene.tiles[obj.id].width;
        var height = this.Scene.tiles[obj.id].height;
        if (width > height) {
            height = (this.Scene.grid / width) * height;
            width = this.Scene.grid;
        } else {
            width = (this.Scene.grid / height) * width;
            height = this.Scene.grid;
        }
        var x = (this.Scene.grid - width) / 2;
        var y = (this.Scene.grid - height) / 2;

        var tile = new Konva.Image({
            x: x,
            y: y,
            image: e.currentTarget,
            draggable: false,
            id: obj.id,
            width: width,
            height: height,
            offsetX: width / 2,
            offsetY: height / 2,
            name: "tile-image",
        });
        this.TileObjs[obj.id].on("mouseenter", function (e) {
            gs.onMouseEnter(e);
        });
        this.TileObjs[obj.id].on("mouseout", function (e) {
            gs.onMouseOut(e);
        });

        if (this.Scene.tiles[obj.id].hidden) {
            if (!_c(this.Scene.tiles[obj.id].owner)) {
                tile.hide();
            } else {
                tile.show();
            }
        }
        this.TileObjs[obj.id].add(tile);
        this.TileObjs[obj.id].position({
            x: e.currentTarget.pos.x,
            y: e.currentTarget.pos.y,
        });

        var iconScale = this.Scene.grid / 120;
        var icon = new Konva.Label({
            id: "Icon" + obj.id,
            x: 0,
            y: 0,
            opacity: 0.75,
            visible: false,
            name: "tooltip",
            offsetX: 60,
            offsetY: 60,
            scaleX: iconScale,
            scaleY: iconScale
        });

        icon.add(
            new Konva.Tag({
                id: "IconTag" + obj.id,
                fill: "black",
                lineJoin: "round",
                shadowColor: "black",
                shadowBlur: 10,
                shadowOffsetX: 10,
                shadowOffsetY: 10,
                shadowOpacity: 0.5,
                name: "icon-tag"
            })
        );

        var iconFontSize = 18;
        var iconText = new Konva.Text({
            id: "IconText" + obj.id,
            text: "\uf070",
            fontSize: iconFontSize,
            padding: 5,
            fill: "white",
            name: "icon-text"
        });

        icon.add(iconText);
        this.TileObjs[obj.id].add(icon);

        tileLayer.add(this.TileObjs[obj.id]);
        this.Stage.batchDraw();
        if (obj.bool_1) {
            this.requestSaveScene();
        }
    }

    onContextMenu(e) {
        e.evt.preventDefault();

        if(this.fogDrawStop()) {
            return;
        }

        if(this.inFogOfWar) {
            return;
        }

        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };

        if (e.target.getAttr("name") == "tile-image") {
            if (this.Scene.tiles[e.target.getAttr("id")].hidden) {
                $("#ctx-btn-show-tile").show();
                $("#ctx-btn-hide-tile").hide();
            } else {
                $("#ctx-btn-show-tile").hide();
                $("#ctx-btn-hide-tile").show();
            }
            if (
                !_c(this.Scene.tiles[e.target.getAttr("id")].owner) ||
                (this.Scene.player_locked && !_g())
            ) {
                this.ContextMenu = $("#ctx-menu-tile");
            } else {
                this.ContextMenu = $("#ctx-menu-tile-owned");
            }
        } else {
            if (this.Scene.player_locked && !_g()) {
                return;
            }
            this.ContextMenu = $("#ctx-menu-stage");
        }
        this.CurrentObj = e.target;
        this.ContextMenu.show();
        var containerRect = this.Stage.container().getBoundingClientRect();
        this.ContextMenu.css(
            "left",
            containerRect.left + this.Stage.getPointerPosition().x + 4 + "px"
        );
        this.ContextMenu.css(
            "top",
            containerRect.top + this.Stage.getPointerPosition().y + 4 + "px"
        );
    }

    onDragEnd(e) {
        if (e.target.getAttr("name") === "tile-group") {
            this.requestUnlockTile(e.target.getAttr("id").substring(1));
            this.requestSaveScene();
        } else {
            this.changeTheHamburger();
        }
    }

    onDragMove(e) {
        if (e.target === this.Stage) {
            return;
        }
        
        if(this.inFogOfWar) {
            return;
        }

        if (this.Scene.player_locked && !_g()) {
            return;
        }
        var pos = {
            x: e.target.getAttr("x"),
            y: e.target.getAttr("y"),
        };
        var id = e.target.getAttr("id").substring(1);
        this.requestMoveTile(pos, id);
    }

    onDragStart(e) {
        var tooltip = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip";
        })[0];
        
        tooltip.hide();

        this.Stage.batchDraw();

        if(this.inFogOfWar) {
            return;
        }

        if (e.target == this.Stage) {
            return;
        }
        if (e.target.getAttr("name") === "tile-group" && !_c(this.Scene.tiles[e.target.getAttr("id").substring(1)].owner)) {
            e.target.draggable(false);
        }
        this.requestLockTile(e.target.getAttr("id").substring(1));
    }

    onLoadBoard(e, obj) {
        var board = this.Stage.find(function (node) {
            return node.getAttr("id") === "board";
        })[0];
        board.image(this.BoardObj);
        board.size({
            width: this.Scene.width,
            height: this.Scene.height,
        });
        this.Stage.batchDraw();
        this.changeTheHamburger();
        if (obj.bool_1) {
            this.requestSaveScene();
        }
    }

    onLoadScene() {
        var board = this.Stage.find(function (node) {
            return node.getAttr("id") === "board";
        })[0];
        var tooltip = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip";
        })[0];
        board.image(this.BoardObj);
        board.size({
            width: this.Scene.width,
            height: this.Scene.height,
        });
        this.Stage.position({ x: 0, y: 0 });
        this.Stage.scale({ x: 1, y: 1 });
        tooltip.scale({ x: 1, y: 1 });
        this.sessionLockScene(this.Scene.player_locked);
        this.Stage.batchDraw();
        this.changeTheHamburger();
    }

    onLoadTile(e) {
        var gs = this;

        if (this.Scene.tiles[e.currentTarget.id].hidden) {
            if (!_c(this.Scene.tiles[e.currentTarget.id].owner)) {
                this.Stage.find("#G" + e.currentTarget.id).hide();
            } else {
                this.Stage.find("#G" + e.currentTarget.id).show();
            }
        }
        this.Stage.find("#" + e.currentTarget.id).on("mouseenter", function (
            e
        ) {
            gs.onMouseEnter(e);
        });
        this.Stage.find("#" + e.currentTarget.id).on("mouseout", function (e) {
            gs.onMouseOut(e);
        });
        this.Stage.find("#" + e.currentTarget.id).image(e.currentTarget);
        if (this.Scene.player_locked && !_g()) {
            this.Stage.find("#G" + e.currentTarget.id).draggable(false);
        } else {
            this.Stage.find("#G" + e.currentTarget.id).draggable(
                _c(gs.Scene.tiles[e.currentTarget.id].owner)
            );
        }
        this.Stage.batchDraw();
    }

    onMouseEnter(e) {
        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };
        this.inTile = true;
        if (e.target.getAttr("name") == "tile-image") {
            var id = e.target.getAttr("id");
            if(!this.inFogOfWar) {
                this.requestShowTooltip(id);    
            }
        } else {
            var tooltip = this.Stage.find(function (node) {
                return node.getAttr("id") === "tooltip";
            })[0];
            this.inTile = false;
            clearTimeout(this.tooltipInterval);
            tooltip.hide();
        }
        this.CurrentObj = e.target;
    }

    onMouseOut(e) {
        this.CurrentPos = {
            x: this.Stage.getPointerPosition().x,
            y: this.Stage.getPointerPosition().y,
        };
        this.inTile = false;
        clearTimeout(this.tooltipInterval);
        var tooltip = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip";
        })[0];
        tooltip.hide();
        this.Stage.batchDraw();
    }

    onWheel(e) {
        e.evt.preventDefault();
        if (e.target.getAttr("name") == "tile") {
            return;
        } else {
            this.scale(e, this.Stage);
        }
    }

    onClick(e){
        this.fogDrawClick()
    }

    onMouseMove(e){
        if (!this.inTile){
            clearTimeout(this.tooltipInterval);
            var tooltip = this.Stage.find(function (node) {
                return node.getAttr("id") === "tooltip";
            })[0];
            tooltip.hide();
            this.Stage.batchDraw();
        }
        this.fogDrawMove();
    }

    tileSaveInfo(info) {
        if (info.trim() === "") {
            return;
        }
        this.Scene.tiles[this.CurrentObj.getAttr("id")].info = info;
        this.requestSaveScene();
    }

    scale(e, target) {
        var tooltip = this.Stage.find(function (node) {
            return node.getAttr("id") === "tooltip";
        })[0];

        var tooltipScaleBy = 1 / this.ScaleBy;

        var oldScale = target.scaleX();
        var oldTooltipScale = tooltip.scaleX();

        var mousePointTo = {
            x: target.getPointerPosition().x / oldScale - target.x() / oldScale,
            y: target.getPointerPosition().y / oldScale - target.y() / oldScale,
        };

        var newScale =
            e.evt.deltaY < 0
                ? oldScale * this.ScaleBy
                : oldScale / this.ScaleBy;

        var newPos = {
            x:
                -(mousePointTo.x - target.getPointerPosition().x / newScale) *
                newScale,
            y:
                -(mousePointTo.y - target.getPointerPosition().y / newScale) *
                newScale,
        };

        var tooltipScale =
            e.evt.deltaY < 0
                ? oldTooltipScale * tooltipScaleBy
                : oldTooltipScale / tooltipScaleBy;

        target.scale({ x: newScale, y: newScale });
        target.position(newPos);
        tooltip.scale({ x: tooltipScale, y: tooltipScale });

        this.Stage.batchDraw();
    }

    changeTheHamburger() {
        var board = this.Stage.find(function (node) {
            return node.getAttr("id") === "board";
        })[0];
        if (board === undefined) {
            return;
        }
        var data = board.getContext().getImageData(16, 16, 16, 16).data;
        var colorSum = 0;
        let r, g, b, avg;
        for (let x = 0, len = data.length; x < len; x += 4) {
            r = data[x];
            g = data[x + 1];
            b = data[x + 2];
            avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
        }
        const brightness = Math.floor(colorSum / (16 * 16));
        if ($("#nav-toggler").attr("aria-expanded") == "true") {
            $("#nav-toggler").css("color", "black");
        } else if (
            this.Stage.absolutePosition().x > 22 ||
            this.Stage.absolutePosition().y > 22
        ) {
            $("#nav-toggler").css("color", "#cccccc");
        } else if (brightness < 85) {
            $("#nav-toggler").css("color", "#cccccc");
        } else {
            $("#nav-toggler").css("color", "#000000");
        }
    }

    resizeWindow() {
        this.Stage.size({
            width: innerWidth,
            height: innerHeight,
        });
        this.Stage.batchDraw();
    }

    appendScene(scene) {
        var gs = this;
        var ele =
            '<li class="list-group-item d-flex" id="' +
            scene.key +
            '">' +
            '<div class="container col-xs-2 col-lg-2 thumb">' +
            '<a class="image-thumb thumbnail" href="#"' +
            'data-name="' +
            scene.name +
            '"' +
            'data-image="' +
            scene.src +
            '">' +
            '<img class="img-thumbnail" src="' +
            scene.src +
            '" alt="' +
            scene.name +
            '">' +
            "</a>" +
            "</div>" +
            '<div class="container col-xs-7 col-lg-7 caption">' +
            "<span>" +
            "<h4>" +
            scene.name +
            "</h4>" +
            "</span>" +
            "<span>" +
            scene.description +
            "</span>" +
            "</div>" +
            '<div class="container col-xs-1 col-lg-1 align-middle "> ' +
            '<a href="#" class="btn btn-info btn-xs modal-select-scene-button" role="button"' +
            'data-key="' +
            scene.key +
            '">Select</a>' +
            "</div>" +
            "</li>";
        $("#modal-select-scene-gallery").append(ele);
        $(".modal-select-scene-button").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var key = $(e.currentTarget).data("key");
            $("#modal-select-scene").modal("hide");
            gs.requestLoadScene(key);
        });
        $(".thumbnail").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var image = $(e.currentTarget).data("image");
            $("#image-box-image").attr("src", image);
            $("#image-box").modal("show");
        });
        $("#modal-select-scene").modal("handleUpdate");
    }

    appendTile(tile) {
        var gs = this;
        var ele =
            '<li class="list-group-item d-flex tile-item ' + toClass(tile.tags) + '" id="' + tile.key + '">' +
                '<div class="container col-xs-2 col-lg-2 thumb">' +
                    '<a class="image-thumb thumbnail" href="#" data-key="' + tile.key + '"' + 'data-toggle="modal" data-target="#image-box" data-name="' + tile.name + '"' + 'data-image="' + tile.src + '">' +
                        '<img class="img-thumbnail" src="' + tile.src + '" alt="' + tile.name + '">' +
                    "</a>" +
                "</div>" +    
                '<div class="container col-xs-7 col-lg-7 caption">' +
                    "<span>" +
                        "<h4>" + tile.name + "</h4>" +
                    "</span>" +
                    "<span>" + tile.description + "</span>" +
                    '<p class="text-lowercase font-weight-light">' + addTheBrackets(tile.tags, " ") + "</p>" +
                "</div>" +
                '<div class="container col-xs-1 col-lg-1 align-middle ">' +
                    '<a href="#" class="btn btn-info btn-xs modal-select-tile-button" role="button"' + 'data-key="' + tile.key + '">Select</a>' +
                "</div>" +
            "</li>";
        $("#modal-select-tile-gallery").append(ele);
        $(".modal-select-tile-button").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var key = $(e.currentTarget).data("key");
            var hidden = $("#modal-select-tile-hidden").prop("checked");

            $("#modal-select-tile").modal("hide");
            gs.requestAddTile(key, hidden);
        });
        $(".thumbnail").on("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            var image = $(e.currentTarget).data("image");
            $("#image-box-image").attr("src", image);
            $("#image-box").modal("show");
        });
        $("#modal-select-tile").modal("handleUpdate");
    }
}
