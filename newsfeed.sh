#!/bin/sh

. ../scripts/envsetup.sh

$RUN_DEBUG$BIN_HOME/dmzAppQt -f config/render.xml config/runtime.xml config/resource.xml config/common.xml config/js.xml config/newsfeed_overlay.xml config/input.xml config/spectator.xml $*