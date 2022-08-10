class Tile {
    constructor() {    
        this.description = '';
        this.details = '';
        this.filename = '';
        this.height = 256;
        this.hidden = false;
        this.id = '';
        this.key = '';
        this.name = '';
        this.owner = '';
        this.player_visible = false;
        this.scaleX = 1;
        this.scaleY = 1;
        this.src = '';
        this.tags = [];
        this.tooltip = '';
        this.width = 256;
    }
}

class Board{
    constructor() {
        this.filename = '';
        this.grid = -1;
        this.height = 1080;
        this.key = '';
        this.src = '';
        this.width = 1920;
    }
}

class Scene {
    constructor() {
        this.description = '';
        this.filename = '';
        this.grid = 120;
        this.height = 1080;
        this.key = '';
        this.name = '';
        this.player_locked = true;
        this.player_visible = false;
        this.src = '';
        this.stage = '{"attrs":{"width":1279,"height":1287},"className":"Stage","children":[{"attrs":{"id":"tile-layer"},"className":"Layer","children":[{"attrs":{"width":1279,"height":1287,"id":"board","name":"board"},"className":"Image"}]},{"attrs":{"id":"tooltip-layer"},"className":"Layer","children":[{"attrs":{"id":"tooltip","opacity":0.75,"visible":false,"name":"tooltip"},"className":"Label","children":[{"attrs":{"id":"tooltip-tag","fill":"black","lineJoin":"round","shadowColor":"black","shadowBlur":10,"shadowOffsetX":10,"shadowOffsetY":10,"shadowOpacity":0.5,"name":"tooltip-tag","width":10,"height":28},"className":"Tag"},{"attrs":{"id":"tooltip-text","fontSize":18,"padding":5,"fill":"white","name":"tooltip-text"},"className":"Text"}]}]}]}';
        this.tiles = [];
        this.width = 1920;
    }
}
 
class Payload {
    constructor() {
        this.scene = new Scene();
        this.board = new Board();
        this.tile = new Tile();

        this.scene_key = '';
        this.player_key = '';
        this.key = '';
        this.id = '';
        this.name = '';
        
        this.string_1 = '';
        
        this.bool_1 = false;
        this.bool_2 = false;
        
        this.decimal_1 = 0.0;
        
        this.list_1 = [];

        this.map_1 = {};
    }
}