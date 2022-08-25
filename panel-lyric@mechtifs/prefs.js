// vim:fdm=syntax
// by tuberry
/* exported init buildPrefsWidget */
'use strict';

const { Adw, Gio, Gtk, GObject } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const _ = ExtensionUtils.gettext;
const gsettings = ExtensionUtils.getSettings();
const { Fields } = Me.imports.fields;
const UI = Me.imports.ui;

function buildPrefsWidget() {
    return new DesktopLyricPrefs();
}

function init() {
    ExtensionUtils.initTranslations();
}

class DesktopLyricPrefs extends Adw.PreferencesGroup {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super();
        this._buildWidgets();
        this._bindValues();
        this._buildUI();
    }

    _buildWidgets() {
        this._field_interval = new UI.Spin(50, 500, 10);
        this._field_folder   = new UI.File({ action: Gtk.FileChooserAction.SELECT_FOLDER });
    }

    _buildUI() {
        [
            [[_('Lyric location')], this._field_folder],
            [[_('Refresh interval')], this._field_interval],
        ].forEach(xs => this.add(new UI.PrefRow(...xs)));
    }

    _bindValues() {
        [
            [Fields.INTERVAL, this._field_interval, 'value'],
            [Fields.LOCATION, this._field_folder,   'file'],
        ].forEach(xs => gsettings.bind(...xs, Gio.SettingsBindFlags.DEFAULT));
    }
}

