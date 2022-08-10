class Session extends GameSession {
    constructor(document, window) {
        super(document, window);

        var gs = this;

        this.IOSocket.on("doDeleteFogOfWar", function(payload) {
            var obj = JSON.parse(payload);
            gs.doDeleteFogOfWar(obj);
        });
        this.IOSocket.on("doTogglePlayerLocked", function (payload) {
            var obj = JSON.parse(payload);
            gs.doTogglePlayerLocked(obj);
        });
        this.IOSocket.on("doTogglePlayerVisible", function (payload) {
            var obj = JSON.parse(payload);
            gs.doTogglePlayerVisible(obj);
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
    }

    doLoadFogOfWar(){
        var gs = this;
        var fogs = this.Stage.find(function(node){
            return node.getAttr("name") === 'fog-of-war';
        });
        fogs.fill('black')
        fogs.opacity(1);
        fogs.show();
        fogs.stroke('black');
        fogs.listening(true); 
        fogs.on("mouseenter", function (e) {
            gs.inFogOfWar = true;
        });    
        fogs.on("mouseout", function (e) {
            gs.inFogOfWar = false;
        });    
        for (var key in this.Scene.fog_of_war){
            var fogOfWar = this.Stage.find(function (node) {
                return node.getAttr("id") === key;
            })[0];
            if(!fogOfWar){
                delete this.Scene.fog_of_war[key]
                continue;
            }
            fogOfWar.visible(this.Scene.fog_of_war[key].enabled);
        }
        this.Stage.drawHit();
        this.Stage.batchDraw();
    }

    doToggleFogOfWar(obj) {
        this.Scene.fog_of_war[obj.key].enabled = obj.bool_1;
        var fogOfWar = this.Stage.find(function (node) {
            return node.getAttr("id") === obj.key;
        })[0];
        if(obj.bool_1){
            fogOfWar.show();
        }
        else {
            fogOfWar.hide()
        }
        this.Stage.batchDraw();
    }

    doTogglePlayerLocked(obj) {
        if (this.Scene.key !== obj.scene_key) {
            return;
        }

        for (var key in this.Scene.tiles) {
            var tile = this.Stage.find(function (node) {
                return node.getAttr("id") === "G" + key;
            })[0];
            if (!tile) {
                continue;
            }
            if (!_c(this.Scene.tiles[key].owner)) {
                tile.setAttr("draggable", false);
            } else {
                tile.setAttr("draggable", !obj.bool_1);
            }
            this.Scene.player_locked = obj.bool_1;
        }
    }

    doTogglePlayerVisible(obj) {
        if (this.Scene.key !== obj.scene_key) {
            return;
        }
        this.init();
    }

    doUnlockTile(obj) {
        if (obj.scene_key !== this.Scene.key) {
            return;
        }
        if (this.Scene.player_locked) {
            return;
        }
        if (!_c(this.Scene.tiles[obj.id].owner)) {
            return;
        }
        this.Stage.find(function (node) {
            return node.getAttr("id") === "G" + obj.id;
        })[0].setAttr("draggable", true);
    }

    requestNewFogOfWar(name){}
    fogDrawClick(){}
    fogDrawMove(){}
    fogDrawStop(){return false;}

    requestSaveScene() {
        if (this.Scene.player_locked) {
            return;
        }

        var stage = this.Stage
        var scene = this.Scene;

        var fogOfWars = stage.find(function (node) {
            return node.getAttr("name") === "fog-of-war";
        });

        fogOfWars.opacity(1);
        fogOfWars.stroke("black");
        
        scene.stage = stage.toJSON();

        var p = new Payload();
        p.scene = scene;
        p.scene_key = scene.key;
        this.IOSocket.emit("requestGMSaveScene", p);
    }

    sessionLockScene(player_locked) {
        for (var key in this.Scene.tiles) {
            var tile = this.Stage.find(function (node) {
                return node.getAttr("id") === "G" + key;
            })[0]
            if(tile){
                tile.setAttr("draggable", !player_locked);
            } else {
                delete this.Scene.tiles[key]
            }
        }
    }
}

function _g() {
    return false;
}

function _c(key) {
    return key === $("#__PlayerKey").val();
}

function _s(key) {
    return key === $("#__PlayerKey").val();
}

function _p() {
    return $("#__PlayerKey").val();
}
