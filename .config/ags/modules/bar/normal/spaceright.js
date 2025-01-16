const { GLib } = imports.gi;
import App from 'resource:///com/github/Aylur/ags/app.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

import Audio from 'resource:///com/github/Aylur/ags/service/audio.js';
import SystemTray from 'resource:///com/github/Aylur/ags/service/systemtray.js';
const { execAsync, exec } = Utils;
import Indicator from '../../../services/indicator.js';
import { StatusIcons } from '../../.commonwidgets/statusicons.js';
import { Tray } from "./tray.js";
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
import Battery from 'resource:///com/github/Aylur/ags/service/battery.js';
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
const { Box, Label, Overlay, Revealer } = Widget;


const BarBatteryProgress = () => {
    const _updateProgress = (circprog) => { // Set circular progress value
        circprog.css = `font-size: ${Math.abs(Battery.percent)}px;`

        circprog.toggleClassName('bar-batt-circprog-low', Battery.percent <= userOptions.battery.low);
        circprog.toggleClassName('bar-batt-circprog-full', Battery.charged);
    }
    return AnimatedCircProg({
        className: 'bar-batt-circprog',
        vpack: 'center', hpack: 'center',
        extraSetup: (self) => self
            .hook(Battery, _updateProgress)
        ,
    })
}

const BarBattery = () => Box({
    className: 'spacing-h-4 bar-batt-txt',
    children: [
        Revealer({
            transitionDuration: userOptions.animations.durationSmall,
            revealChild: false,
            transition: 'slide_right',
            child: MaterialIcon('bolt', 'norm', { tooltipText: "Charging" }),
            setup: (self) => self.hook(Battery, revealer => {
                self.revealChild = Battery.charging;
            }),
        }),
        Label({
            className: 'txt-smallie',
            setup: (self) => self.hook(Battery, label => {
                label.label = `${Number.parseFloat(Battery.percent.toFixed(1))}%`;
            }),
        }),
        Overlay({
            child: Widget.Box({
                vpack: 'center',
                className: 'bar-batt',
                homogeneous: true,
                children: [
                    MaterialIcon('battery_full', 'small'),
                ],
                setup: (self) => self.hook(Battery, box => {
                    box.toggleClassName('bar-batt-low', Battery.percent <= userOptions.battery.low);
                    box.toggleClassName('bar-batt-full', Battery.charged);
                }),
            }),
            overlays: [
                BarBatteryProgress(),
            ]
        }),
    ]
});

const SeparatorDot = () => {
    if (!ShowTray()) return;
    else return Widget.Revealer({
        transition: 'slide_left',
        revealChild: false,
        attribute: {
            'count': SystemTray.items.length,
            'update': (self, diff) => {
                self.attribute.count += diff;
                self.revealChild = (self.attribute.count > 0);
            }
        },
        child: Widget.Box({
            vpack: 'center',
            className: 'separator-circle',
        }),
        setup: (self) => self
            .hook(SystemTray, (self) => self.attribute.update(self, 1), 'added')
            .hook(SystemTray, (self) => self.attribute.update(self, -1), 'removed')
        ,
    });
}

const ShowTray = () => {
    const SYSTRAY_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_systray.txt`;
    const actual_show_systray = exec(`bash -c "cat ${SYSTRAY_FILE_LOCATION}"`);
    return actual_show_systray == 'true' ? true : false;
}

const ShowSysIcons = () => {
    const SYSICONS_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_sysicon.txt`;
    const actual_show_sysicons = exec(`bash -c "cat ${SYSICONS_FILE_LOCATION}"`);
    return actual_show_sysicons == 'true' ? true : false;
}


export default (monitor = 0) => {
    let barTray = Tray();
    if (!ShowTray()) barTray = Widget.Box({ hexpand: true, });
    const barStatusIcons = StatusIcons({
        className: 'bar-statusicons',
        setup: (self) => self.hook(App, (self, currentName, visible) => {
            if (currentName === 'sideright') {
                self.toggleClassName('bar-statusicons-active', visible);
            }
        }),
    }, monitor);
    const SpaceRightDefaultClicks = (child) => Widget.EventBox({
        onHover: () => { barStatusIcons.toggleClassName('bar-statusicons-hover', true) },
        onHoverLost: () => { barStatusIcons.toggleClassName('bar-statusicons-hover', false) },
        onPrimaryClick: () => App.toggleWindow('sideright'),
        onSecondaryClick: () => execAsync(['bash', '-c', 'playerctl next || playerctl position `bc <<< "100 * $(playerctl metadata mpris:length) / 1000000 / 100"` &']).catch(print),
        onMiddleClick: () => execAsync('playerctl play-pause').catch(print),
        setup: (self) => self.on('button-press-event', (self, event) => {
            if (event.get_button()[1] === 8)
                execAsync('playerctl previous').catch(print)
        }),
        child: child,
    });
    const emptyArea = SpaceRightDefaultClicks(Widget.Box({ hexpand: true, }));
    let indicatorArea = SpaceRightDefaultClicks(Widget.Box({
        children: [
            SeparatorDot(),
            Revealer({
                transitionDuration: userOptions.animations.durationSmall,
                revealChild: false,
                transition: 'slide_right',
                child: BarBattery(),
                setup: (self) => self.hook(Battery, revealer => {
                    self.revealChild = Battery.available;
                }),
            }),
            barStatusIcons
        ],
    }));
    if (!ShowSysIcons()) indicatorArea = null;
    const actualContent = Widget.Box({
        hexpand: true,
        className: 'spacing-h-5 bar-spaceright',
        children: [
            emptyArea,
            barTray,
            indicatorArea
        ],
    });

    return Widget.EventBox({
        onScrollUp: () => {
            if (!Audio.speaker) return;
            if (Audio.speaker.volume <= 0.09) Audio.speaker.volume += 0.01;
            else Audio.speaker.volume += 0.03;
            Indicator.popup(1);
        },
        onScrollDown: () => {
            if (!Audio.speaker) return;
            if (Audio.speaker.volume <= 0.09) Audio.speaker.volume -= 0.01;
            else Audio.speaker.volume -= 0.03;
            Indicator.popup(1);
        },
        child: Widget.Box({
            children: [
                actualContent,
                SpaceRightDefaultClicks(Widget.Box({ className: 'bar-corner-spacing' })),
            ]
        })
    });
}