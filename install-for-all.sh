#!/usr/bin/env bash
cd "$(dirname "$0")"
export base="$(pwd)"
source ./scriptdata/environment-variables
source ./scriptdata/functions
source ./scriptdata/installers
source ./scriptdata/options

#####################################################################################
if ! command -v pacman >/dev/null 2>&1; then 
  printf "\e[31m[$0]: pacman not found, it seems that the system is not ArchLinux or Arch-based distros. Aborting...\e[0m\n"
  exit 1
fi

startask () {
  printf "\e[34m[$0]: Hi there! Before we start:\n"
  printf 'This script 1. only works for ArchLinux and Arch-based distros.\n'
  printf '            2. does not handle system-level/hardware stuff like Nvidia drivers\n'
  printf "\e[31m"
  
  printf "Would you like to create a backup for \"$XDG_CONFIG_HOME\" and \"$HOME/.local/\" folders?\n[y/N]: "
  read -p " " backup_confirm
  case $backup_confirm in
    [yY][eE][sS]|[yY])
      backup_configs
      ;;
    *)
      echo "Skipping backup..."
      ;;
  esac
  

  printf '\n'
  printf 'Do you want to confirm every time before a command executes?\n'
  printf '  y = Yes, ask me before executing each of them. (DEFAULT)\n'
  printf '  n = No, just execute them automatically.\n'
  printf '  a = Abort.\n'
  read -p "====> " p
  case $p in
    n) ask=false ;;
    a) exit 1 ;;
    *) ask=true ;;
  esac
}

case $ask in
  false)sleep 0 ;;
  *)startask ;;
esac

set -e
#####################################################################################
printf "\e[36m[$0]: 1. Get packages and setup user groups/services\n\e[0m"

# Issue #363
case $SKIP_SYSUPDATE in
  true) sleep 0;;
  *) v sudo pacman -Syu;;
esac

remove_bashcomments_emptylines ${DEPLISTFILE} ./cache/dependencies_stripped.conf
readarray -t pkglist < ./cache/dependencies_stripped.conf

# Use yay. Because paru do not support cleanbuild.
# Also see https://wiki.hyprland.org/FAQ/#how-do-i-update
if ! command -v yay >/dev/null 2>&1;then
  echo -e "\e[33m[$0]: \"yay\" not found.\e[0m"
  showfun install-yay
  v install-yay
fi

# Install extra packages from dependencies.conf as declared by the user
if (( ${#pkglist[@]} != 0 )); then
	if $ask; then
		# execute per element of the array $pkglist
		for i in "${pkglist[@]}";do v yay -S --needed $i;done
	else
		# execute for all elements of the array $pkglist in one line
		v yay -S --needed --noconfirm ${pkglist[*]}
	fi
fi

# Convert old dependencies to non explicit dependencies so that they can be orphaned if not in meta packages
set-explicit-to-implicit() {
	remove_bashcomments_emptylines ./scriptdata/previous_dependencies.conf ./cache/old_deps_stripped.conf
	readarray -t old_deps_list < ./cache/old_deps_stripped.conf
	pacman -Qeq > ./cache/pacman_explicit_packages
	readarray -t explicitly_installed < ./cache/pacman_explicit_packages

	echo "Attempting to set previously explicitly installed deps as implicit..."
	for i in "${explicitly_installed[@]}"; do for j in "${old_deps_list[@]}"; do
		[ "$i" = "$j" ] && yay -D --asdeps "$i"
	done; done

	return 0
}

$ask && echo "Attempt to set previously explicitly installed deps as implicit? "
$ask && showfun set-explicit-to-implicit
v set-explicit-to-implicit

# https://github.com/end-4/dots-hyprland/issues/581
# yay -Bi is kinda hit or miss, instead cd into the relevant directory and manually source and install deps
install-local-pkgbuild() {
	local location=$1
	local installflags=$2

	x pushd $location

	source ./PKGBUILD
	x yay -S $installflags --asdeps "${depends[@]}"
	x makepkg -si --noconfirm

	x popd
}

# Install core dependencies from the meta-packages
metapkgs=(./arch-packages/illogical-impulse-{audio,backlight,basic,fonts-themes,gnome,gtk,portal,python,screencapture,widgets})
metapkgs+=(./arch-packages/illogical-impulse-ags)
metapkgs+=(./arch-packages/illogical-impulse-microtex-git)
metapkgs+=(./arch-packages/illogical-impulse-oneui4-icons-git)
[[ -f /usr/share/icons/Bibata-Modern-Classic/index.theme ]] || \
  metapkgs+=(./arch-packages/illogical-impulse-bibata-modern-classic-bin)
try sudo pacman -R illogical-impulse-microtex

for i in "${metapkgs[@]}"; do
	metainstallflags="--needed"
	$ask && showfun install-local-pkgbuild || metainstallflags="$metainstallflags --noconfirm"
	v install-local-pkgbuild "$i" "$metainstallflags"
done

# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081690658
# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081701482
# https://github.com/end-4/dots-hyprland/issues/428#issuecomment-2081707099
case $SKIP_PYMYC_AUR in
  true) sleep 0;;
  *)
	  pymycinstallflags=""
	  $ask && showfun install-local-pkgbuild || pymycinstallflags="$pymycinstallflags --noconfirm"
	  v install-local-pkgbuild "./arch-packages/illogical-impulse-pymyc-aur" "$pymycinstallflags"
    ;;
esac


# Why need cleanbuild? see https://github.com/end-4/dots-hyprland/issues/389#issuecomment-2040671585
# Why install deps by running a seperate command? see pinned comment of https://aur.archlinux.org/packages/hyprland-git
case $SKIP_HYPR_AUR in
  true) sleep 0;;
  *)
	  hyprland_installflags="-S"
	  $ask || hyprland_installflags="$hyprland_installflags --noconfirm"
    v yay $hyprland_installflags --asdeps hyprutils-git hyprlang-git hyprcursor-git hyprwayland-scanner-git
    v yay $hyprland_installflags --answerclean=a hyprland-git
    ;;
esac


## Optional dependencies
if pacman -Qs ^plasma-browser-integration$ ;then SKIP_PLASMAINTG=true;fi
case $SKIP_PLASMAINTG in
  true) sleep 0;;
  *)
    if $ask;then
      echo -e "\e[33m[$0]: NOTE: The size of \"plasma-browser-integration\" is about 250 MiB.\e[0m"
      echo -e "\e[33mIt is needed if you want playtime of media in Firefox to be shown on the music controls widget.\e[0m"
      echo -e "\e[33mInstall it? [y/N]\e[0m"
      read -p "====> " p
    else
      p=y
    fi
    case $p in
      y) x sudo pacman -S --needed --noconfirm plasma-browser-integration ;;
      *) echo "Ok, won't install"
    esac
    ;;
esac

v sudo usermod -aG video,i2c,input "$(whoami)"
v bash -c "echo i2c-dev | sudo tee /etc/modules-load.d/i2c-dev.conf"
v systemctl --user enable ydotool --now
v gsettings set org.gnome.desktop.interface font-name 'Rubik 11'

#####################################################################################
printf "\e[36m[$0]: 2. Installing parts from source repo\e[0m\n"
sleep 1

#####################################################################################
printf "\e[36m[$0]: 3. Copying + Configuring for all users\e[0m\n"

# Ensure folders exist in /etc/skel
v mkdir -p /etc/skel/.config /etc/skel/.local/bin /etc/skel/.local/share

# MISC (For .config/* but not AGS, not Fish, not Hyprland)
case $SKIP_MISCCONF in
  true) sleep 0;;
  *)
    for i in $(find .config/ -mindepth 1 -maxdepth 1 ! -name 'ags' ! -name 'fish' ! -name 'hypr' -exec basename {} \;); do
      echo "[$0]: Found target: .config/$i"
      if [ -d ".config/$i" ];then v rsync -av --delete ".config/$i/" "/etc/skel/.config/$i/"
      elif [ -f ".config/$i" ];then v rsync -av ".config/$i" "/etc/skel/.config/$i"
      fi
    done
    ;;
esac

# For Fish
case $SKIP_FISH in
  true) sleep 0;;
  *)
    v rsync -av --delete .config/fish/ "/etc/skel/.config/fish/"
    ;;
esac

# For AGS
case $SKIP_AGS in
  true) sleep 0;;
  *)
    v rsync -av --delete --exclude '/user_options.js' .config/ags/ "/etc/skel/.config/ags/"
    ;;
esac

# For Hyprland
case $SKIP_HYPRLAND in
  true) sleep 0;;
  *)
    v rsync -av --delete --exclude '/custom' --exclude '/hyprland.conf' .config/hypr/ "/etc/skel/.config/hypr/"
    ;;
esac

# Local bin files
v rsync -av ".local/bin/" "/etc/skel/.local/bin"

# Optionally, if you want to copy user-specific settings like `.bashrc` or `.zshrc`, you can also rsync those:
v rsync -av ".bashrc" "/etc/skel/.bashrc"
v rsync -av ".zshrc" "/etc/skel/.zshrc"

#####################################################################################
printf "\e[36m[$0]: Configurations successfully copied to /etc/skel. Future users will get them by default.\e[0m\n"

