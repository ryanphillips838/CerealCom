$(document).ready(function () {
	'use strict';
	var i = 0,
	  conId = 0,
	  lf = false,
	  cr = false,
	  arrayLength = 80,
	  arrayHeight = 24,
	  dataArray = '',
	  echo = false,
	  charDelay = 0,
	  buf = new Uint8Array(200),
	  bufRead = 0,
	  bufWrite = 0,
	  lastNewLine = 0,
	  $binary = $('#binary'),
	  $binarynl = $('#binarynl'),
	  portsArray = new Array(),
	  writing = false,
	  fileWriter = "",
	  dataToWrite = "",
	  dataWindow = $('#dataWindow'),
	  cursor = $('#cursor'),
	  cursorPos = cursor.position(),
	  cursorX = 0,
	  cursorY = 0,
	  opening = false,
		onGetDevices = function (ports) {
		  if (ports.length === 0) {
		    $('#ports').append('<option value="none">No Ports!</option>');
		  }
			for (i = 0; i < ports.length; i += 1) {
			  portsArray[i] = ports[i].path;
				//$('#ports ').html() + ports[i].path + "<br>");
			}
			portsArray.sort();
			for (i = 0; i < portsArray.length; i += 1){
				$('#ports').append('<option value="' + portsArray[i] + '">' + portsArray[i] + '</option>');
			}
		},
    onDisconnect = function(result) {
      if (result) {
        console.log("Disconnected from the serial port");
      } else {
        console.log("Disconnect failed");
      }
    },
    closeSerialPort = function (connectionId) {
      chrome.serial.disconnect(connectionId, onDisconnect);
    },
    openFile = function (readFile) {
      var error = "";
      if (readFile === undefined){
        error = chrome.runtime.lastError.message;
	      dataWindow.text("There was an error reading the file: " + error);
        return;
      }
      var textFromFile = "",
        i = 0;
	    readFile.file(function(file) {
      var reader = new FileReader();

      reader.onloadend = function(e) {
        textFromFile = this.result;
        textFromFile = textFromFile.replace("\r", "\r\n");
        textFromFile = textFromFile.split("");
        var interval = setInterval(function () {
          writeSerial(textFromFile[i]);
          dataWindow.append(textFromFile[i]);
          i += 1;
			    dataWindow.scrollTop = dataWindow.scrollHeight;
			    if(i >= textFromFile.length){
			      clearInterval(interval);
			    }
        },charDelay);
      }
      console.log("File read! " + reader.readAsText(file));
    }, errorHandler);
	  },
	  saveFile = function (writeableFileEntry) {
	    var error = "";
	    if (writeableFileEntry === undefined){
	      error = chrome.runtime.lastError.message;
	      dataWindow.text("There was an error writing the file: " + error);
        return;
	    }
	    writeableFileEntry.createWriter(function(writer) {
	      writer.seek(writer.length);
        console.log(writer.length);
        writer.onwriteend = function(e) {
          console.log('write complete');
        };
        fileWriter = writer;
        writing = true;
      }, errorHandler);
	  },
	  errorHandler = function (test) {
	    dataWindow.append("\r\n\r\nThere was an error.\r\n\r\n");
	  },
	  writeToFile = function (writer, data) {
	    var str = data.replace("\r", "\r\n");
	    var blob = new Blob([str], {type: 'text/plain'});
        writer.write(blob);
	  },
	  openSerialPort = function () {
	    chrome.serial.connect($('#ports option:selected').val(), {
    	  bitrate: parseInt($('#baud option:selected').val()),
    	  dataBits: $('#dataBits option:selected').val(),
    	  parityBit: $('#parity option:selected').val(),
    	  stopBits: $('#stopBits option:selected').val(),
    	  ctsFlowControl: Boolean($('#flowControl option:selected').val())
  	  }, function (info) {
  	    if(info.connectionId !== undefined){
    		  conId = info.connectionId;
  	    }
    		charDelay = $('#charDelay').val();
      	if(conId > 0){
        	$('#buttonClose').attr('disabled', false).removeClass('ui-state-disabled');
        	$('#buttonSettings').attr('disabled', true).addClass('ui-state-disabled');
        	$('#buttonSaveFile').attr('disabled', false).removeClass('ui-state-disabled');
        	$('#buttonSendFile').attr('disabled', false).removeClass('ui-state-disabled');
      		saveStorage();
      	}
    	});
    	setTimeout(function () {
    	  if(conId === 0){
    	    $('#buttonOpen').attr('disabled', false).removeClass('ui-state-disabled');
      	  dataWindow.append("Could not open serial port\r\n");
    	  };
    	},300)
	  },
	  saveStorage = function() {
      var baudRate = $('#baud').val(),
        comPort = $('#ports').val(),
        parity = $('#parity').val(),
        stopBits = $('#stopBits').val(),
        flow = $('#flowControl').val(),
        cr = $('#cr').prop('checked'),
        lf = $('#lf').prop('checked'),
        echo = $('#echo').prop('checked'),
        charDelay = $('#charDelay').val(),
        binary = $('#binary').prop('checked'),
        binarynl = $('#binarynl').val();
      if (!baudRate || !comPort) {
        return;
      }
      chrome.storage.sync.set({'baud': baudRate,
                              'comPort': comPort,
                              'parity': parity,
                              'stopBits': stopBits,
                              'flow': flow,
                              'cr': cr,
                              'lf': lf,
                              'echo': echo,
                              'charDelay': charDelay,
                              'binary': binary,
                              'binarynl': binarynl
      }, function() {});
	  },
    loadStorage = function () {
      chrome.storage.sync.get(null, function (settings) {
        if(settings.baudRate !== null){
          if($('#baud option[value="' + settings.baud + '"]').length > 0){
            $('#baud option[value="' + settings.baud + '"]').prop('selected', true);
          }
          if($('#ports option[value="' + settings.comPort + '"]').length > 0){
            $('#ports option[value="' + settings.comPort + '"]').prop('selected', true);
          }
          $('#parity option[value="' + settings.parity + '"]').prop('selected', true);
          $('#stopBits option[value="' + settings.stopBits + '"]').prop('selected', true);
          $('#flowControl option[value="' + settings.flow + '"]').prop('selected', true);
          $('#cr').prop('checked', settings.cr);
          cr = $('#cr').prop('checked');
          $('#lf').prop('checked', settings.lf);
          lf = $('#lf').prop('checked');
          $('#echo').prop('checked', settings.echo);
          $('#charDelay').val(settings.charDelay);
          $('#binary').prop('checked', settings.binary);
          $('#binarynl').val(settings.binarynl);
        }
      });
    },
    arrow = function (direction) {
      cursorPos = cursor.position();
      switch (String.fromCharCode(direction)){
        case 'A':
          if (cursorY > 0) {
            cursorY++;
            cursor.css('top', cursorPos.top - 20);
          }
          break;
        case 'B':
          if (cursorY < arrayHeight) {
            cursorY++;
            cursor.css('top', cursorPos.top + 20);
          }
          break;
        case 'C':
          if (cursorX < arrayLength) {
            cursorX++;
            cursor.css('left', cursorPos.left + 12);
          }
          break;
        case 'D':
          if(cursorX > 0) {
            cursorX++;
            cursor.css('left', cursorPos.left - 12);
          }
          break;
        default:
          break;
      }
    },
    backspace = function () {
      if (cursorX > 0) {
        cursorX--;
        //cursor.css('left', cursorPos.left - 12);
        dataArray = dataArray.substring(cursorY * arrayLength, cursorX - 1) + ' ' + dataArray.substring(cursorY * arrayLength + cursorX);
        update();
      }
    },
    insertTextAtCursor = function (text) {
      for (var i = 0; i < text.length; i += 1) {
        dataArray = dataArray.substring(0, cursorY * arrayLength + cursorX) + text + dataArray.substring(cursorY * arrayLength + cursorX + 1, arrayHeight * arrayLength);
        if (cursorX < arrayLength) {
          cursorX += 1;
        } else {
          newLine();
          carriageReturn();
        }
      }
      update();
    },
    update = function () {
      dataWindow.text(dataArray);
    },
    shiftUp = function () {
      dataArray = dataArray.substring(arrayLength);
      for (var z = 0; z < arrayLength; z += 1) {
          dataArray += ' ';
      }
      update();
    },
    newLine = function () {
      if (cursorY < arrayHeight - 1) {
        cursorY++;
        //cursor.css('top', cursorPos.top + 20);
      } else {
        shiftUp();
      }
    },
    carriageReturn = function () {
      cursorX = 0;
    },
    clearDataArray = function () {
      dataArray = '';
      for (var z = 0; z < arrayLength * arrayHeight; z++) {
        dataArray += ' ';
      }
      cursorX = cursorY = 0;
    };//end variable list


	chrome.serial.getDevices(onGetDevices); // Get all serial devices and load them into a drop down

  loadStorage(); //sync user settings
  clearDataArray();
  //This event is fired every time serial data is sent to the serial port
	chrome.serial.onReceive.addListener(function (info) {
		var i = 0,
		  bytes = 0,
			view = new Uint8Array(info.data),
			str = "",
			binary = $binary.is(':checked');

  	if(info.connectionId === conId){
  	  for(var j = 0; j < view.length; j++) {
  		    buf[bufWrite] = view[j];
  		    bufWrite++;
  		    if (bufWrite >= 200) {
  		      bufWrite = 0;
  		    }
  		    //console.log('Char: "' + view[j] + '"');
  		}
  		//if(binary === true) {
        // Convert Binary to Hex
        //var arr16 = new Uint16Array(arr8A.length);
        if (bufRead < bufWrite || bufRead - 100 > bufWrite){
          if (bufWrite > bufRead - 100) {
            bytes = bufWrite - bufRead;
          } else {
            bytes = bufWrite + 200 - bufRead;
          }
          while (i < bytes){
            str = String.fromCharCode(buf[bufRead]);
            //arr16[i] = (view[i] << 4) + view[i];
            if (buf[bufRead] === 0x1B && buf[bufRead + 1] === 0x5B) {
              arrow(buf[bufRead + 2]);
              bufRead += 3;
              i += 3;
              continue;
            }
            if (buf[bufRead] === 0x8 || buf[bufRead] === 0x7F) {
              backspace();
              i++;
              bufRead++;
              continue;
            }
            if (str === '\r') {
              carriageReturn();
              if (lf === true) {
                newLine();
              }
              i++;
              bufRead += 1;
              continue;
            }
            if (str === '\n') {
              newLine();
              if (cr === true) {
                carriageReturn();
              }
              i++;
              bufRead += 1;
              continue;
            }
            if (binary === true){
              insertTextAtCursor(String('0' + buf[bufRead].toString(16).toUpperCase()).slice(-2));
              lastNewLine += 1;
              if (lastNewLine >= $binarynl.val()) {
                newLine();
                lastNewLine = 0;
              }
            } else {
              //arr16[i] = (view[i] << 4) + view[i];
              insertTextAtCursor(str);
            }
            bufRead += 1;
            if (bufRead >= 200) {
              bufRead = 0;
            }
            i++;
          }
        }
  		/*} else {
  		  if (bufRead < bufWrite - 1 || bufRead - 100 > bufWrite){
          if (bufWrite > bufRead - 100) {
            bytes = bufWrite - bufRead;
          } else {
            bytes = bufWrite + 200 - bufRead;
          }
          for (i = 0; i < bytes; i++){
              //arr16[i] = (view[i] << 4) + view[i];
              dataWindow.value += String.fromCharCode(buf[bufRead]);
              bufRead += 1;
              if (bufRead >= 200) {
                bufRead = 0;
              }
          }
  		  }

  			str = String.fromCharCode.apply(null, view);
  			str = str.replace("\r", cr + lf);
  			str = str.replace("\n", cr + lf);
  			dataWindow.value += str;

  		}*/
/*
			if(dataWindow.value.length > 20000){
			  str = dataWindow.value.substring(100);
			  dataWindow.value = str;
			}
			dataWindow.scrollTop = dataWindow.scrollHeight;
			if (writing === true) {
			  writeToFile(fileWriter, str);
			}*/
			//dataWindow.setSelectionRange(0,0);
  	}
	});

	$('#buttonOpen').on('click', function () {
    $('#buttonOpen').attr('disabled', true).addClass('ui-state-disabled');
  	openSerialPort();
  	document.designMode = 'on';
	});

	$('#buttonClose').on('click', function () {
	  writing = false;
	  closeSerialPort(conId);
	  $(this).attr('disabled', true).addClass('ui-state-disabled');
	  $('#buttonOpen').attr('disabled', false).removeClass('ui-state-disabled');
	  $('#buttonSettings').attr('disabled', false).removeClass('ui-state-disabled');
	  $('#buttonSaveFile').attr('disabled', true).addClass('ui-state-disabled');
	  $('#buttonSendFile').attr('disabled', true).addClass('ui-state-disabled');
	  conId = 0;
  	document.designMode = 'off';
	});

	$('#buttonSaveFile').on('click', function () {
	  try {
	    chrome.fileSystem.chooseEntry({type:"saveFile"}, saveFile);
	  } catch (error) {
	    dataWindow.text("There was an error trying to save the file.");
	  }
	});

	$('#buttonSendFile').on('click', function () {
	  try {
	    chrome.fileSystem.chooseEntry({type:"openFile"}, openFile);
	  } catch (error) {
	    dataWindow.text("There was an error trying to read the file.");
	  }
	});

	$('#lf').on('click', function () {
	  if($('#lf').is(':checked')){
	    lf = true;
	  } else {
	    lf = false;
	  }
	});

	$('#cr').on('click', function () {
	  if($('#cr').is(':checked')){
	    cr = true;
	  } else {
	    cr = false;
	  }
	});

	$('#echo').on('click', function () {
	  if($(this).is(':checked')){
	    echo = true;
	  } else {
	    echo = false;
	  }
	});

	$( "#dialog" ).dialog({
	autoOpen: true,
	width: 350,
	buttons: [
		{
			text: "Open",
			click: function() {
			  opening = true;
				$( this ).dialog( "close" );
				openSerialPort();
				opening = false;
			}
		}
	],
	close: function(event, ui) {
	  if(opening === false){
	    $('#buttonOpen').prop('disabled', false).removeClass('ui-state-disabled');
	  }
	}
});

$('#buttonClear').on('click', function () {
  clearDataArray();
  update();
});

// Link to open the dialog
$( "#buttonSettings" ).click(function( event ) {
	$( "#dialog" ).dialog( "open" );
	$('#dialog').dialog('moveToTop');
	event.preventDefault();
	$('#buttonOpen').attr('disabled', true).addClass('ui-state-disabled');
});

$('#buttonHelp').on('click', function () {
  chrome.app.window.create('help.html', {
    'id': 'help',
    'outerBounds': {
      'width': 400,
      'height': 400
    }
  });
});

$('#buttonTest').on('click', function () {
  insertTextAtCursor("test");
});

var writeSerial=function(str) {
  chrome.serial.send(conId, convertStringToArrayBuffer(str), onSend);
};

// Convert string to ArrayBuffer
var convertStringToArrayBuffer=function(str) {
  var buf=new ArrayBuffer(str.length);
  var bufView=new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i]=str.charCodeAt(i);
  }
  return buf;
};

var onSend = function () {
  //console.log("sent a key");
}

$( document ).keypress(function( event ) {
    event.preventDefault();
    writeSerial(String.fromCharCode(event.keyCode));
    if(echo === true){
      insertTextAtCursor(String.fromCharCode(event.keyCode));
    }
});
//handle special characters
$( document ).keydown(function(event) {
  var str = event.keyCode,
    buf = new ArrayBuffer(3),
    bufView = new Uint8Array(buf);
  switch (event.keyCode) {
    case 8:
      event.preventDefault();
      bufView[0] = 0x8;
      bufView[1] = 0x20;
      bufView[2] = 0x8;
      break;
    case 27:
      event.preventDefault();
      writeSerial(String.fromCharCode(event.keyCode));
      return;
    case 37:
      event.preventDefault();
      bufView[0] = 0x1B;
      bufView[1] = 0x5B;
      bufView[2] = 0x44;
      break;
    case 38:
      event.preventDefault();
      bufView[0] = 0x1B;
      bufView[1] = 0x5B;
      bufView[2] = 0x41;
      break;
    case 39:
      event.preventDefault();
      bufView[0] = 0x1B;
      bufView[1] = 0x5B;
      bufView[2] = 0x43;
      break;
    case 40:
      event.preventDefault();
      bufView[0] = 0x1B;
      bufView[1] = 0x5B;
      bufView[2] = 0x42;
      break;
    default:
      return;
  }
  chrome.serial.send(conId, buf, onSend);
});
$('#tabs').tabs();
});