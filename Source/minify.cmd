@echo off
echo Will create a temporary script called jquery.griffin.tools.js, minify it using jsmin.exe and then delete the temp script.
copy /y jquery.griffin.ajaxdialog.js+jquery.griffin.elementoverlay.js+jquery.griffin.mandatory.js+jquery.griffin.model.js+jquery.griffin.tour.js+jquery.griffin.ui.js jquery.griffin.tools.js
jsmin < jquery.griffin.tools.js "// griffin.tools - Copyright 2012 Jonas Gauffin (jgauffin) - License: LGPL" > jquery.griffin.tools.min.js
del /q jquery.griffin.tools.js
echo Done!
