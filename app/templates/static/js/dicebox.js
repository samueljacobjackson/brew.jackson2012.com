"use strict";

class DiceBox {
    constructor() {
        this.resize = function(){}
        this.shownOnce = false;
    }

    dice_initialize(container, pk) {
        var self = this;

        this.pk = pk;

        var canvas = teal.id('canvas');
        var width = $('#modal-dice-box-container').innerWidth();
        var height = $('#modal-dice-box-container').innerHeight();
        canvas.style.width = width  + 'px';
        canvas.style.height = height + 'px';
        var label = teal.id('label');
        var set = teal.id('set');
        var selector_div = teal.id('selector_div');
        var info_div = teal.id('info_div');

        this.on_set_change = () => { set.style.width = set.value.length + 3 + 'ex'; }
        this.stringify_notation = (notation) => { return teal.dice.stringify_notation(notation); }

        this.on_set_change();

        teal.dice.use_true_random = false;

        teal.bind(set, 'keyup', self.on_set_change);
        teal.bind(set, 'mousedown', function(ev) { ev.stopPropagation(); });
        teal.bind(set, 'mouseup', function(ev) { ev.stopPropagation(); });
        teal.bind(set, 'focus', function(ev) { teal.set(container, { class: '' }); });
        teal.bind(set, 'blur', function(ev) { teal.set(container, { class: 'noselect' }); });

        teal.bind(teal.id('clear'), ['mouseup', 'touchend'], function(ev) {
            ev.stopPropagation();
            set.value = '0';
            self.on_set_change();
        });

        var params = teal.get_url_params();

        if (params.chromakey) {
            teal.dice.desk_color = 0x00ff00;
            info_div.style.display = 'none';
            teal.id('control_panel').style.display = 'none';
        }
        if (params.shadows == 0) {
            teal.dice.use_shadows = false;
        }
        if (params.color == 'white') {
            teal.dice.dice_color = '#808080';
            teal.dice.label_color = '#202020';
        }

        var box = new teal.dice.dice_box(canvas, { w: 500, h: 300 });
        box.animate_selector = false;

        teal.bind(window, 'resize', function() {
            self.resize();
        });

        this.reroll = (values, notation) => {
            set.value = ""
            self.on_set_change();
            for(var i = 0; i < notation.length; i++){
                set.value += teal.dice.stringify_notation({set: notation[i]});
                self.on_set_change();
            }
            box.reroll(notation_getter, before_roll, after_roll, values);
        }

        this.resize = function(){
            var width = $('#modal-dice-box-container').innerWidth();
            var height = $('#modal-dice-box-container').innerHeight();
            canvas.style.width = width  + 'px';
            canvas.style.height = height + 'px';
            box.reinit(canvas, { w: 500, h: 300 });
        }

        function show_selector() {
            info_div.style.display = 'none';
            selector_div.style.display = 'block';
            box.draw_selector();
        }

        function before_roll(vectors, notation, callback) {
            info_div.style.display = 'none';
            selector_div.style.display = 'none';

            $.post(
                "/getdicevalues/", {notation:JSON.stringify(notation), pk:self.pk}, function(result){
                    callback(JSON.parse(result));
                }
            )
        }

        function notation_getter() {
            return teal.dice.parse_notation(set.value);
        }

        function after_roll(notation, result) {
            if (params.chromakey || params.noresult) return;
            var r = [];
            for(var i = 0; i < result.length; i++) {
                if(notation.set[i] === 'd100'){
                    if(result[i] === 0 && result[i + 1] === 0){
                        r.push(100);
                    } else {
                        r.push(result[i] + result[i + 1]);
                    }
                    i++;
                }
                else{
                    r.push(result[i]);
                }
            }
            result = r;
            var res = result.join(' ');
            if (notation.constant) {
                if (notation.constant > 0) res += ' +' + notation.constant;
                else res += ' -' + Math.abs(notation.constant);
            }
            if (result.length >= 1) res += ' = ' + 
                    (result.reduce(function(s, a) { return s + a; }) + notation.constant);
            label.innerHTML = res;
            info_div.style.display = 'block';
        }

       // box.bind_mouse(container, notation_getter, before_roll, after_roll);
        box.bind_throw(teal.id('throw'), notation_getter, before_roll, after_roll);

        teal.bind(container, ['mouseup', 'touchend'], function(ev) {
            ev.stopPropagation();
            if (selector_div.style.display == 'none') {
                if (!box.rolling) show_selector();
                box.rolling = false;
                return;
            }
            var name = box.search_dice_by_mouse(ev);
            if (name != undefined) {
                var notation = teal.dice.parse_notation(set.value);
                notation.set.push(name);
                set.value = teal.dice.stringify_notation(notation);
                self.on_set_change();
            }
        });

        if (params.notation) {
            set.value = params.notation;
        }
        if (params.roll) {
            teal.raise_event(teal.id('throw'), 'mouseup');
        }
        else {
            show_selector();
        }
        show_selector()
    }
}