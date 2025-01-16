const { GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
const { Box, Label, Scrollable, Button } = Widget;
const { execAsync, exec } = Utils;
import { ConfigGap, ConfigSpinButton, ConfigToggle } from '../../.commonwidgets/configwidgets.js';
import { setupCursorHover } from '../../.widgetutils/cursorhover.js';
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';


const BARPOS_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/bar_position.txt`;
const actual_bar_position = exec(`bash -c "cat ${BARPOS_FILE_LOCATION}"`);
if (actual_bar_position == null) {
    execAsync(['bash', '-c', `echo "top" > ${BARPOS_FILE_LOCATION}`]).catch(print);
    actual_bar_position = exec(`bash -c "cat ${BARPOS_FILE_LOCATION}"`);
}

const SHOWMON_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_monitor.txt`;
const actual_show_monitor = exec(`bash -c "cat ${SHOWMON_FILE_LOCATION}"`);
if (actual_show_monitor == null) {
    execAsync(['bash', '-c', `echo "true" > ${SHOWMON_FILE_LOCATION}`]).catch(print);
    actual_show_monitor = exec(`bash -c "cat ${SHOWMON_FILE_LOCATION}"`);
}

const TIMEDATE_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_timedate.txt`;
const actual_show_timedate = exec(`bash -c "cat ${TIMEDATE_FILE_LOCATION}"`);
if (actual_show_timedate == null) {
    execAsync(['bash', '-c', `echo "true" > ${TIMEDATE_FILE_LOCATION}`]).catch(print);
    actual_show_timedate = exec(`bash -c "cat ${TIMEDATE_FILE_LOCATION}"`);
}

const WINTITLE_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_wintitle.txt`;
const actual_show_wintitle = exec(`bash -c "cat ${WINTITLE_FILE_LOCATION}"`);
if (actual_show_wintitle == null) {
    execAsync(['bash', '-c', `echo "true" > ${WINTITLE_FILE_LOCATION}`]).catch(print);
    actual_show_wintitle = exec(`bash -c "cat ${WINTITLE_FILE_LOCATION}"`);
}

const WORKSPACE_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_workspaces.txt`;
const actual_show_workspaces = exec(`bash -c "cat ${WORKSPACE_FILE_LOCATION}"`);
if (actual_show_workspaces == null) {
    execAsync(['bash', '-c', `echo "true" > ${WORKSPACE_FILE_LOCATION}`]).catch(print);
    actual_show_workspaces = exec(`bash -c "cat ${WORKSPACE_FILE_LOCATION}"`);
}

const SYSTRAY_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_systray.txt`;
const actual_show_systray = exec(`bash -c "cat ${SYSTRAY_FILE_LOCATION}"`);
if (actual_show_systray == null) {
    execAsync(['bash', '-c', `echo "true" > ${SYSTRAY_FILE_LOCATION}`]).catch(print);
    actual_show_systray = exec(`bash -c "cat ${SYSTRAY_FILE_LOCATION}"`);
}

const SYSICON_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_sysicon.txt`;
const actual_show_sysicon = exec(`bash -c "cat ${SYSICON_FILE_LOCATION}"`);
if (actual_show_sysicon == null) {
    execAsync(['bash', '-c', `echo "true" > ${SYSICON_FILE_LOCATION}`]).catch(print);
    actual_show_sysicon = exec(`bash -c "cat ${SYSICON_FILE_LOCATION}"`);
}

const WEATHER_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_weather.txt`;
const actual_show_weather = exec(`bash -c "cat ${WEATHER_FILE_LOCATION}"`);
if (actual_show_weather == null) {
    execAsync(['bash', '-c', `echo "true" > ${WEATHER_FILE_LOCATION}`]).catch(print);
    actual_show_weather = exec(`bash -c "cat ${WEATHER_FILE_LOCATION}"`);
}

const MUSIC_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_music.txt`;
const actual_show_music = exec(`bash -c "cat ${MUSIC_FILE_LOCATION}"`);
if (actual_show_music == null) {
    execAsync(['bash', '-c', `echo "true" > ${MUSIC_FILE_LOCATION}`]).catch(print);
    actual_show_music = exec(`bash -c "cat ${MUSIC_FILE_LOCATION}"`);
}

const HyprlandToggle = ({ icon, name, desc = null, option, enableValue = 1, disableValue = 0, extraOnChange = () => { } }) => ConfigToggle({
    icon: icon,
    name: name,
    desc: desc,
    initValue: JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"] != 0,
    onChange: (self, newValue) => {
        execAsync(['hyprctl', 'keyword', option, `${newValue ? enableValue : disableValue}`]).catch(print);
        extraOnChange(self, newValue);
    }
});

const createToggle = (fileLocation, actualValue, execCommand, icon, name, desc, extraOnChange = () => { }) => ConfigToggle({
    icon: icon,
    name: name,
    desc: desc,
    initValue: actualValue === 'true',
    onChange: (self, newValue) => {
        const newValueStr = actualValue === 'true' ? 'false' : 'true';
        execAsync(['bash', '-c', `echo "${newValueStr}" > ${fileLocation}`]).catch(print);
        extraOnChange(self, newValue);
    }
});

const CustomBarToggle = ({ icon, name, desc = null, extraOnChange = () => { } }) => ConfigToggle({
    icon: icon,
    name: name,
    desc: desc,
    initValue: userOptions.appearance.barPosition,
    onChange: (self, newValue) => {
        const newPos = actual_bar_position === 'top' ? 'bottom' : 'top';
        execAsync(['bash', '-c', `echo "${newPos}" > ${BARPOS_FILE_LOCATION}`]).catch(print);
        extraOnChange(self, newValue);
    }
});

const ShowMonitorToggle = (props) => createToggle(SHOWMON_FILE_LOCATION, actual_show_monitor, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowTimeDate = (props) => createToggle(TIMEDATE_FILE_LOCATION, actual_show_timedate, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowWinTitle = (props) => createToggle(WINTITLE_FILE_LOCATION, actual_show_wintitle, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowWorkspaces = (props) => createToggle(WORKSPACE_FILE_LOCATION, actual_show_workspaces, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowSystray = (props) => createToggle(SYSTRAY_FILE_LOCATION, actual_show_systray, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowSysicon = (props) => createToggle(SYSICON_FILE_LOCATION, actual_show_sysicon, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowWeather = (props) => createToggle(WEATHER_FILE_LOCATION, actual_show_weather, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);
const ShowMusic = (props) => createToggle(MUSIC_FILE_LOCATION, actual_show_music, 'pkill ags && ags', props.icon, props.name, props.desc, props.extraOnChange);

const HyprlandSpinButton = ({ icon, name, desc = null, option, ...rest }) => ConfigSpinButton({
    icon: icon,
    name: name,
    desc: desc,
    initValue: Number(JSON.parse(exec(`hyprctl getoption -j ${option}`))["int"]),
    onChange: (self, newValue) => {
        execAsync(['hyprctl', 'keyword', option, `${newValue}`]).catch(print);
    },
    ...rest,
});

const saveButton = Button({
        vpack: 'center',
        className: 'config-center-save-button',
        child: MaterialIcon('save', 'norm'),
        label: 'Save',
        tooltipText: 'Save',
        setup: setupCursorHover,
        onClicked: () => execAsync(['bash', '-c', 'pkill ags && ags']).catch(print),
});

const Subcategory = (children) => Box({
    className: 'margin-left-20',
    vertical: true,
    children: children,
})

export default (props) => {
    const ConfigSection = ({ name, children }) => Box({
        vertical: true,
        className: 'spacing-v-5',
        children: [
            Label({
                hpack: 'center',
                className: 'txt txt-large margin-left-10',
                label: name,
            }),
            Box({
                className: 'margin-left-10 margin-right-10',
                vertical: true,
                children: children,
            })
        ]
    })
    const mainContent = Scrollable({
        vexpand: true,
        child: Box({
            vertical: true,
            className: 'spacing-v-10',
            children: [
                ConfigSection({
                    name: 'Effects', children: [
                        ConfigToggle({
                            icon: 'border_clear',
                            name: 'Transparency',
                            desc: '[AGS]\nMake shell elements transparent\nBlur is also recommended if you enable this',
                            initValue: exec(`bash -c "sed -n \'2p\' ${GLib.get_user_state_dir()}/ags/user/colormode.txt"`) == "transparent",
                            onChange: (self, newValue) => {
                                const transparency = newValue == 0 ? "opaque" : "transparent";
                                console.log(transparency);
                                execAsync([`bash`, `-c`, `mkdir -p ${GLib.get_user_state_dir()}/ags/user && sed -i "2s/.*/${transparency}/"  ${GLib.get_user_state_dir()}/ags/user/colormode.txt`])
                                    .then(execAsync(['bash', '-c', `${App.configDir}/scripts/color_generation/switchcolor.sh`]))
                                    .catch(print);
                            },
                        }),
                        HyprlandToggle({ icon: 'blur_on', name: 'Blur', desc: "[Hyprland]\nEnable blur on transparent elements\nDoesn't affect performance/power consumption unless you have transparent windows.", option: "decoration:blur:enabled" }),
                        Subcategory([
                            HyprlandToggle({ icon: 'stack_off', name: 'X-ray', desc: "[Hyprland]\nMake everything behind a window/layer except the wallpaper not rendered on its blurred surface\nRecommended to improve performance (if you don't abuse transparency/blur) ", option: "decoration:blur:xray" }),
                            HyprlandSpinButton({ icon: 'target', name: 'Size', desc: '[Hyprland]\nAdjust the blur radius. Generally doesn\'t affect performance\nHigher = more color spread', option: 'decoration:blur:size', minValue: 1, maxValue: 1000 }),
                            HyprlandSpinButton({ icon: 'repeat', name: 'Passes', desc: '[Hyprland] Adjust the number of runs of the blur algorithm\nMore passes = more spread and power consumption\n4 is recommended\n2- would look weird and 6+ would look lame.', option: 'decoration:blur:passes', minValue: 1, maxValue: 10 }),
                        ]),
                        ConfigGap({}),
                        HyprlandToggle({
                            icon: 'animation', name: 'Animations', desc: '[Hyprland] [GTK]\nEnable animations', option: 'animations:enabled',
                            extraOnChange: (self, newValue) => execAsync(['gsettings', 'set', 'org.gnome.desktop.interface', 'enable-animations', `${newValue}`])
                        }),
                        Subcategory([
                            ConfigSpinButton({
                                icon: 'clear_all',
                                name: 'Choreography delay',
                                desc: 'In milliseconds, the delay between animations of a series',
                                initValue: userOptions.animations.choreographyDelay,
                                step: 10, minValue: 0, maxValue: 1000,
                                onChange: (self, newValue) => {
                                    userOptions.animations.choreographyDelay = newValue
                                },
                            })
                        ]),
                    ]
                }),
                ConfigSection({
                    name: 'Developer', children: [
                        HyprlandToggle({ icon: 'speed', name: 'Show FPS', desc: "[Hyprland]\nShow FPS overlay on top-left corner", option: "debug:overlay" }),
                        HyprlandToggle({ icon: 'sort', name: 'Log to stdout', desc: "[Hyprland]\nPrint LOG, ERR, WARN, etc. messages to the console", option: "debug:enable_stdout_logs" }),
                        HyprlandToggle({ icon: 'motion_sensor_active', name: 'Damage tracking', desc: "[Hyprland]\nEnable damage tracking\nGenerally, leave it on.\nTurn off only when a shader doesn't work", option: "debug:damage_tracking", enableValue: 2 }),
                        HyprlandToggle({ icon: 'destruction', name: 'Damage blink', desc: "[Hyprland] [Epilepsy warning!]\nShow screen damage flashes", option: "debug:damage_blink" }),
                    ]
                }),
                ConfigSection({
                    name: 'Customization', children: [
                        CustomBarToggle({ icon: 'palette', name: 'Bar position', desc: 'Change the bar position'}),
                        ShowMonitorToggle({ icon: 'memory_alt', name: 'Show system ressource indicators', desc: 'Show the system ressource indicators on the bar'}),
                        ShowTimeDate({ icon: 'schedule', name: 'Show time and date', desc: 'Show the time and date on the bar'}),
                        ShowWinTitle({ icon: 'title', name: 'Show window title', desc: 'Show the window title on the bar'}),
                        ShowWorkspaces({ icon: 'view_module', name: 'Show workspaces', desc: 'Show the workspaces on the bar'}),
                        ShowSystray({ icon: 'settings_input_hdmi', name: 'Show system tray', desc: 'Show the app trays on the bar'}),
                        ShowSysicon({ icon: 'settings', name: 'Show system icons', desc: 'Show the system icons on the bar'}),
                        ShowWeather({ icon: 'cloud', name: 'Show weather', desc: 'Show the weather on the bar'}),
                        ShowMusic({ icon: 'music_note', name: 'Show music', desc: 'Show the music on the bar'}),
                        saveButton,
                    ]
                }),
            ]
        })
    });
    const footNote = Box({
        homogeneous: true,
        children: [Label({
            hpack: 'center',
            className: 'txt txt-italic txt-subtext margin-5',
            label: 'Not all changes are saved',
        })]
    })
    return Box({
        ...props,
        className: 'spacing-v-5',
        vertical: true,
        children: [
            mainContent,
            footNote,
        ]
    });
}
