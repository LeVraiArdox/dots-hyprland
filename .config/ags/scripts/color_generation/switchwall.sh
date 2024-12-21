#!/usr/bin/env bash

XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-$HOME/.config}"
CONFIG_DIR="$XDG_CONFIG_HOME/ags"

switch() {
	imgpath=$1
	read scale screenx screeny screensizey < <(hyprctl monitors -j | jq '.[] | select(.focused) | .scale, .x, .y, .height' | xargs)
	cursorposx=$(hyprctl cursorpos -j | jq '.x' 2>/dev/null) || cursorposx=960
	cursorposx=$(bc <<< "scale=0; ($cursorposx - $screenx) * $scale / 1")
	cursorposy=$(hyprctl cursorpos -j | jq '.y' 2>/dev/null) || cursorposy=540
	cursorposy=$(bc <<< "scale=0; ($cursorposy - $screeny) * $scale / 1")
	cursorposy_inverted=$((screensizey - cursorposy))

	if [ "$imgpath" == '' ]; then
		echo 'Aborted'
		exit 0
	fi

	# ags run-js "wallpaper.set('')"
	# sleep 0.1 && ags run-js "wallpaper.set('${imgpath}')" &
	swww img "$imgpath" --transition-step 100 --transition-fps 120 \
		--transition-type grow --transition-angle 30 --transition-duration 1 \
		--transition-pos "$cursorposx, $cursorposy_inverted"
}

imgpath=""

while [[ "$#" -gt 0 ]]; do
	case $1 in
		--noswitch) noswitch=true ;;
		--path) imgpath="$2"; shift ;;
		*) imgpath="$1" ;;
	esac
	shift
done

if [ "$noswitch" == true ]; then
	imgpath=$(swww query | awk -F 'image: ' '{print $2}')
	# imgpath=$(ags run-js 'wallpaper.get(0)')
elif [[ "$imgpath" ]]; then
	switch "$imgpath"
else
	# Select and set image (hyprland)
	cd "$(xdg-user-dir PICTURES)" || return 1
	switch "$(yad --width 1200 --height 800 --file --add-preview --large-preview --title='Choose wallpaper')"
fi

# Generate colors for ags n stuff
"$CONFIG_DIR"/scripts/color_generation/colorgen.sh "${imgpath}" --apply --smart
