chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('window.html', {
    'id': 'main',
    'outerBounds': {
      'width': 1000,
      'height': 610
    }
  });
  setTimeout(function () {
  var mainWindow = chrome.app.window.get('main'),
    i = 0,
    conId = 0;
  mainWindow.onClosed.addListener(function () {
    chrome.serial.getConnections(function (info) {
      for (i = 0; i < info.length; i += 1){
        conId = info[i].connectionId;
        chrome.serial.disconnect(conId, function () {
          console.log('Closed connection: ' + conId);
        })
      }
    });
    chrome.app.window.get('help').close();
  });
}, 500);
});