// vim:fdm=syntax
// by tuberry
/* exported init */
'use strict';

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { St, Gio, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const _ = ExtensionUtils.gettext;
const Me = ExtensionUtils.getCurrentExtension();
const Fields = Me.imports.fields.Fields;
const Mpris = Me.imports.mpris;
const Lyric = Me.imports.lyric;
const Paper = Me.imports.paper;
let gsettings = null;

const genParam = (type, name, ...dflt) => GObject.ParamSpec[type](name, name, name, GObject.ParamFlags.READWRITE, ...dflt);

class SwitchItem extends PopupMenu.PopupSwitchMenuItem {
    static {
        GObject.registerClass(this);
    }

    constructor(text, active, callback, params) {
        super(text, active, params);
        this.connect('toggled', (x_, y) => callback(y));
    }
}

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

class DesktopLyric extends GObject.Object {
    static {
        GObject.registerClass({
            Properties: {
                location: genParam('string', 'location', ''),
                interval: genParam('uint', 'interval', 50, 500, 60),
                position: genParam('int64', 'position', 0, Number.MAX_SAFE_INTEGER, 0),
            },
        }, this);
    }

    constructor() {
        super();
        this._lyric = new Lyric.Lyric();
        this._mpris = new Mpris.MprisPlayer();
        this._paper = new Paper.Paper(gsettings, this._mpris);
        this.bind_property('position', this._paper, 'position', GObject.BindingFlags.DEFAULT);
        this.bind_property('location', this._lyric, 'location', GObject.BindingFlags.DEFAULT);
        this._mpris.connectObject('update', this._update.bind(this),
            'closed', () => (this.status = 'Stopped'),
            'status', (player, status) => (this.status = status),
            'seeked', (player, position) => (this.position = position / 1000), this);
        Main.overview.connectObject('showing', () => (this.view = true), 'hidden', () => (this.view = false), this);
        [[Fields.INTERVAL, 'interval'], [Fields.LOCATION, 'location']]
            .forEach(([x, y, z]) => gsettings.bind(x, this, y, z ?? Gio.SettingsBindFlags.GET));
    }

    get hide() {
        return this.status !== 'Playing' || this._menus?.hide.state;
    }

    set drag(drag) {
        this._drag = drag;
        this._menus?.unlock.setToggleState(drag);
    }

    set interval(interval) {
        this._interval = interval;
        if(this._refreshId) this.playing = true;
    }

    set playing(playing) {
        if (playing) {
            this._paper.play = true;
            this._paper.hide = false;
        } else {
            this._paper.play = false;
            this._paper.fadeOut();
            this._paper.hide = true;
        }
        clearInterval(this._refreshId);
        if(playing) this._refreshId = setInterval(() => (this.position += this._interval + 1), this._interval);
    }

    get status() {
        return this._status ?? this._mpris.status;
    }

    set status(status) {
        this._status = status;
        this.playing = status === 'Playing';
    }

    _syncPosition(callback) {
        this._mpris.getPosition().then(scc => (this.position = callback(scc / 1000))).catch(() => (this.position = 0));
    }

    _update(_player, title, artists, length) {
        this._paper.hide = true;
        this._paper.fadeOut();
        if(!this._lyric) return;
        if(this._title === title && JSON.stringify(this._artists) === JSON.stringify(artists)) {
            this._syncPosition(x => length - x > 5000 || !length ? x : 50);
        } else {
            this._title = title;
            this._artists = artists;
            this._lyric.find(title, artists).then(text => {
                this._paper.play = true;
                this._paper.text = text;
                this._paper.length = length;
                this._syncPosition(x => length - x > 5000 || !length ? x : 50); // some buggy mpris
                this.playing = this._mpris.status === 'Playing';
            }).catch(() => {
                this.playing = false;
                this._paper.play = false;
                this._paper.text = '';
            });
        }
    }

    destroy() {
        this.playing = null;
        Main.overview.disconnectObject(this);
        ['_mpris', '_lyric', '_paper'].forEach(x => { this[x].destroy(); this[x] = null; });
    }
}

class Extension {
    static {
        ExtensionUtils.initTranslations();
    }

    enable() {
        gsettings = ExtensionUtils.getSettings();
        this._ext = new DesktopLyric();
    }

    disable() {
        this._ext.destroy();
        gsettings = this._ext = null;
    }
}

function init() {
    return new Extension();
}


