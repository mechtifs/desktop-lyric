// vim:fdm=syntax
// by tuberry
/* exported Paper */
'use strict';

const Main = imports.ui.main;
const Overview = imports.ui.overview;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { Gio, Clutter, St, GObject } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Fields = Me.imports.fields.Fields;

const splitAt = i => x => [x.slice(0, i), x.slice(i)];
const toMS = x => x.split(':').reverse().reduce((a, v, i) => a + parseFloat(v) * 60 ** i, 0) * 1000; // 1:1 => 61000 ms
const genParam = (type, name, ...dflt) => GObject.ParamSpec[type](name, name, name, GObject.ParamFlags.READWRITE, ...dflt);

class MenuItem extends PopupMenu.PopupMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(text, callback, params) {
        super(text, params);
        this.connect('activate', callback);
    }

    setLabel(label) {
        if(this.label.text !== label) this.label.set_text(label);
    }
}

var Paper = class extends GObject.Object {
    static {
        GObject.registerClass({
            Properties: {
                hide:     genParam('boolean', 'hide', false),
                offset:   genParam('int', 'offset', -100000, 100000, 0),
                position: genParam('int64', 'position', 0, Number.MAX_SAFE_INTEGER, 0),
            },
        }, this);
    }

    constructor(gsettings, mpris) {
        super();
        this.length = 0;
        this.text = '';
        this._gsettings = gsettings;
        this._mpris = mpris;
        this._button = new PanelMenu.Button(0.0, null, false);
        this._label = new St.Label({ text: '---', style_class: 'app-menu panel-button', 'y-align': Clutter.ActorAlign.CENTER });
        this._button.actor.add_actor(this._label);
        Main.panel.addToStatusArea(Me.metadata.uuid, this._button, 2, 'left');
        this._button.hide();
        this._addMenuItems();
        this.play = false;
        this.showing = Main.overview.connect('showing', () => {
            if (this.play) {
                this.hide = true;
                this.fadeOut();
            }
            this.view = true;
        });
        this.hiding = Main.overview.connect('hiding', () => {
            if (this.play) {
                this.fadeIn();
                this.hide = false;
            }
            this.view = false;
        });
    }

    set position(position) {
        this._position = position;
        if (!this.hide && !this.view) {
            this.draw();
        }
    }

    _syncPosition(callback) {
        this._mpris.getPosition().then(scc => (this.position = callback(scc / 1000))).catch(() => (this.position = 0));
    }

    _addMenuItems() {
        this._menus = {
            resync:   new MenuItem(_('Resynchronize'), () => this._syncPosition(x => x + 50)),
            slower:   new MenuItem(_('500ms Slower'), () => { this.offset -= 500; }),
            faster:   new MenuItem(_('500ms Faster'), () => { this.offset += 500; }),
            sep:      new PopupMenu.PopupSeparatorMenuItem(),
            settings: new MenuItem(_('Settings'), () => ExtensionUtils.openPrefs()),
        };
        for(let p in this._menus) this._button.menu.addMenuItem(this._menus[p]);
    }

    fadeIn() {
        this._button.show();
        this._button.remove_all_transitions();
        this._button.ease({
            opacity: 255,
            duration: Overview.ANIMATION_TIME * .5,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
        });
    }

    fadeOut() {
        this._button.remove_all_transitions();
        this._button.ease({
            opacity: 0,
            mode: Clutter.AnimationMode.EASE_OUT_QUAD,
            duration: Overview.ANIMATION_TIME,
            onComplete: () => this._button.hide(),
        });
    }

    set text(text) {
        this._text = text.split(/\n/)
            .flatMap(x => (i => i > 0 ? [splitAt(i + 1)(x)] : [])(x.lastIndexOf(']')))
            .flatMap(x => x[0].match(/(?<=\[)[^\][]+(?=])/g).map(y => [Math.round(toMS(y)), x[1]]))
            .sort((u, v) => u[0] > v[0])
            .reduce((a, v, i, arr) => a.set([v[0]], [v[0], arr[i + 1] ? arr[i + 1][0] : Math.max(this.length, v[0]), v[1]]), new Map());
        this._tags = Array.from(this._text.keys()).reverse();
        this.offset = 0;
    }

    get text() {
        let now = this._position + this.offset;
        let key = this._tags.find(k => parseFloat(k) <= now);
        if(key === undefined) return [0, ''];
        let [s, e, t] = this._text.get(key);
        return [now >= e || s === e ? 1 : (now - s) / (e - s), t];
    }

    draw() {
        let [position, txt] = this.text
        if (txt) {
            this._label.set_text(txt);
            this.fadeIn();
        // } else {
        //     this.fadeOut();
        }
    }

    destroy() {
        this._button.destroy();
        Main.overview.disconnect(this.showing);
        Main.overview.disconnect(this.hiding);
        delete this._button;
        delete this.showing;
        delete this.hiding;
    }
};

