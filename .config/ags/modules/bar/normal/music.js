const { GLib } = imports.gi;
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Mpris from 'resource:///com/github/Aylur/ags/service/mpris.js';
const { Box, Button, EventBox, Label, Overlay } = Widget;
const { execAsync, exec } = Utils;
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { showMusicControls } from '../../../variables.js';

function trimTrackTitle(title) {
    if (!title) return '';
    const cleanPatterns = [
        /【[^】]*】/,        // Touhou n weeb stuff
        " [FREE DOWNLOAD]", // F-777
    ];
    cleanPatterns.forEach((expr) => title = title.replace(expr, ''));
    return title;
}

function adjustVolume(direction) {
    const step = 0.03; 
    execAsync(['playerctl', 'volume'])
        .then((output) => {
            let currentVolume = parseFloat(output.trim());
            let newVolume = direction === 'up' ? currentVolume + step : currentVolume - step;

            if (newVolume > 1.0) newVolume = 1.0;
            if (newVolume < 0.0) newVolume = 0.0;

            execAsync(['playerctl', 'volume', newVolume.toFixed(2)]).catch(print);
        })
        .catch(print);
}

const BarGroup = ({ child }) => Box({
    className: 'bar-group-margin bar-sides',
    children: [
        Box({
            className: 'bar-group bar-group-standalone bar-group-pad-system',
            children: [child],
        }),
    ]
});

const TrackProgress = () => {
    const _updateProgress = (circprog) => {
        const mpris = Mpris.getPlayer('');
        if (!mpris) return;
        circprog.css = `font-size: ${Math.max(mpris.position / mpris.length * 100, 0)}px;`
    }
    return AnimatedCircProg({
        className: 'bar-music-circprog',
        vpack: 'center', hpack: 'center',
        extraSetup: (self) => self
            .hook(Mpris, _updateProgress)
            .poll(3000, _updateProgress)
        ,
    });
}

export default () => {
    const playingState = Box({
        homogeneous: true,
        children: [Overlay({
            child: Box({
                vpack: 'center',
                className: 'bar-music-playstate',
                homogeneous: true,
                children: [Label({
                    vpack: 'center',
                    className: 'bar-music-playstate-txt',
                    justification: 'center',
                    setup: (self) => self.hook(Mpris, label => {
                        const mpris = Mpris.getPlayer('');
                        label.label = `${mpris !== null && mpris.playBackStatus == 'Playing' ? 'pause' : 'play_arrow'}`;
                    }),
                })],
                setup: (self) => self.hook(Mpris, label => {
                    const mpris = Mpris.getPlayer('');
                    if (!mpris) return;
                    label.toggleClassName('bar-music-playstate-playing', mpris !== null && mpris.playBackStatus == 'Playing');
                    label.toggleClassName('bar-music-playstate', mpris !== null || mpris.playBackStatus == 'Paused');
                }),
            }),
            overlays: [
                TrackProgress(),
            ]
        })]
    });

    const trackTitle = Label({
        hexpand: true,
        className: 'txt-smallie bar-music-txt',
        truncate: 'end',
        maxWidthChars: 1,
        setup: (self) => self.hook(Mpris, label => {
            const mpris = Mpris.getPlayer('');
            if (mpris)
                label.label = `${trimTrackTitle(mpris.trackTitle)} • ${mpris.trackArtists.join(', ')}`;
            else
                label.label = 'No media';
        }),
    });

    const musicStuff = Box({
        className: 'spacing-h-10',
        hexpand: true,
        children: [
            playingState,
            trackTitle,
        ]
    });

    const ShowMusicControls = () => {
        const MUSIC_FILE_LOCATION = `${GLib.get_user_state_dir()}/ags/user/show_music.txt`;
        const actual_show_music = exec(`bash -c "cat ${MUSIC_FILE_LOCATION}"`);
        return actual_show_music == 'true' ? true : false;
    }



    if (ShowMusicControls()) return EventBox({
        onScrollUp: () => adjustVolume('up'),
        onScrollDown: () => adjustVolume('down'),
        child: Box({
            className: 'spacing-h-4',
            children: [
                EventBox({
                    child: BarGroup({ child: musicStuff }),
                    onPrimaryClick: () => showMusicControls.setValue(!showMusicControls.value),
                    onSecondaryClick: () => execAsync(['bash', '-c', 'playerctl next || playerctl position `bc <<< "100 * $(playerctl metadata mpris:length) / 1000000 / 100"` &']).catch(print),
                    onMiddleClick: () => execAsync('playerctl play-pause').catch(print),
                    setup: (self) => self.on('button-press-event', (self, event) => {
                        if (event.get_button()[1] === 8) // Side button
                            execAsync('playerctl previous').catch(print)
                    }),
                })
            ]
        })
    });
    else return null;
}
