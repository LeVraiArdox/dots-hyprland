const { Gio, GLib } = imports.gi;
import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { exec, execAsync } = Utils;

class CheatService extends Service {
    static {
        Service.register(
            this,
            { 'updated': [], },
        );
    }
    _cheatPath = '';
    _cheatJson = [];

    refresh(value) {
        this.emit('updated', value);
    }

    connectWidget(widget, callback) {
        this.connect(widget, callback, 'updated');
    }

    get todo_json() {
        return this._todoJson;
    }

    _save() {
        Utils.writeFile(JSON.stringify(this._cheatJson), this._cheatPath)
            .catch(print);
    }

    add(content) {
        this._cheatJson.push({ content, done: false });
        this._save();
        this.emit('updated');
    }

    check(index) {
        this._cheatJson[index].done = true;
        this._save();
        this.emit('updated');
    }

    uncheck(index) {
        this._cheatJson[index].done = false;
        this._save();
        this.emit('updated');
    }

    remove(index) {
        this._cheatJson.splice(index, 1);
        Utils.writeFile(JSON.stringify(this._cheatJson), this._cheatPath)
            .catch(print);
        this.emit('updated');
    }

    constructor() {
        super();
        this._cheatPath = `${GLib.get_user_state_dir()}/ags/user/cheat.json`;
        try {
            const fileContents = Utils.readFile(this._cheatPath);
            this._cheatJson = JSON.parse(fileContents);
        }
        catch {
            Utils.exec(`bash -c 'mkdir -p ${GLib.get_user_cache_dir()}/ags/user'`);
            Utils.exec(`touch ${this._cheatPath}`);
            Utils.writeFile("[]", this._cheatPath).then(() => {
                this._cheatJson = JSON.parse(Utils.readFile(this._cheatPath))
            }).catch(print);
        }
    }
}

// Singleton instance
const service = new CheatService();

// make it global for easy use with cli
globalThis.cheatService = service;

export default service;