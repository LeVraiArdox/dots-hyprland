const { Gtk, GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
const { execAsync, exec } = Utils;
import WindowTitle from "./normal/spaceleft.js";
import Indicators from "./normal/spaceright.js";
import Monitor from "./normal/monitor.js";
import System from "./normal/system.js";
import Music from "./normal/music.js";
import { currentShellMode } from '../../variables.js';

const ShowWorkspaces = () => {
    const WORKSPACE_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_workspaces.txt`;
    const actual_show_workspaces = exec(`bash -c "cat ${WORKSPACE_FILE_LOCATION}"`);
    return actual_show_workspaces == 'true' ? true : false;
}


const NormalOptionalWorkspaces = async () => {
    try {
        if (!ShowWorkspaces()) return null;
        return (await import('./normal/workspaces_hyprland.js')).default();
    } catch {
        try {
            if (!ShowWorkspaces()) return null;
            return (await import('./normal/workspaces_sway.js')).default();
        } catch {
            return null;
        }
    }
};

const FocusOptionalWorkspaces = async () => {
    try {
        return (await import('./focus/workspaces_hyprland.js')).default();
    } catch {
        try {
            return (await import('./focus/workspaces_sway.js')).default();
        } catch {
            return null;
        }
    }
};

export const Bar = async (monitor = 0) => {
    const SideModule = (children) => Widget.Box({
        className: 'bar-side',
        children: children,
    });
    const normalBarContent = Widget.CenterBox({
        // className: 'bar-bg',
        startWidget: (await WindowTitle(monitor)),
        centerWidget: Widget.Box({
            className: 'bar-center', // Center bar
            children: [
                SideModule([Monitor()]),
                SideModule([Music()]),
                SideModule([await NormalOptionalWorkspaces()]),
                SideModule([System()]),
            ]
        }),
        endWidget: Indicators(monitor),
    });
    const focusedBarContent = Widget.CenterBox({
        className: 'bar-bg-focus',
        startWidget: Widget.Box({}),
        centerWidget: Widget.Box({
            className: 'spacing-h-4',
            children: [
                SideModule([]),
                Widget.Box({
                    homogeneous: true,
                    children: [await FocusOptionalWorkspaces()],
                }),
                SideModule([]),
            ]
        }),
        endWidget: Widget.Box({}),
        setup: (self) => {
            self.hook(Battery, (self) => {
                if (!Battery.available) return;
                self.toggleClassName('bar-bg-focus-batterylow', Battery.percent <= userOptions.battery.low);
            })
        }
    });
    const nothingContent = Widget.Box({
        className: 'bar-bg-nothing',
    })
    const getBarPosition = () => {
        const BARPOS_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/bar_position.txt`;
        let actual_bar_position = exec(`bash -c "cat ${BARPOS_FILE_LOCATION}"`);
        const currentanchor = actual_bar_position == 'top' ? 'top' : 'bottom';
        return currentanchor;
    }
    return Widget.Window({
        monitor,
        className: 'bar-bg', // Full bar
        name: `bar${monitor}`,
        anchor: [`${getBarPosition()}`, 'left', 'right'],
        exclusivity: 'exclusive',
        visible: true,
        child: Widget.Stack({
            homogeneous: false,
            transition: getBarPosition() == 'top' ? 'slide_down_up' : 'slide_up_down',
            transitionDuration: userOptions.animations.durationLarge,
            children: {
                'normal': normalBarContent,
                'focus': focusedBarContent,
                'nothing': nothingContent,
            },
            setup: (self) => self.hook(currentShellMode, (self) => {
                self.shown = currentShellMode.value[monitor];
            })
        }),
    });
}
