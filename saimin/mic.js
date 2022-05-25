var audioCtx = null;
var distortion = null;
var gainNode = null;
var biquadFilter = null;
var convolver = null;

// distortion curve for the waveshaper, thanks to Kevin Ennis
// http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
function makeDistortionCurve(amount) {
  var k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ) {
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
};

function micSetup() {
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var source;
  var stream;

  var analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  distortion = audioCtx.createWaveShaper();
  gainNode = audioCtx.createGain();
  biquadFilter = audioCtx.createBiquadFilter();
  convolver = audioCtx.createConvolver();

  // grab audio track via XHR for convolver node

  var soundSource;

  ajaxRequest = new XMLHttpRequest();

  ajaxRequest.open('GET', 'https://mdn.github.io/voice-change-o-matic/audio/concert-crowd.ogg', true);

  ajaxRequest.responseType = 'arraybuffer';


  ajaxRequest.onload = function() {
    var audioData = ajaxRequest.response;

    audioCtx.decodeAudioData(audioData, function(buffer) {
        soundSource = audioCtx.createBufferSource();
        convolver.buffer = buffer;
      }, function(e){ console.log("Error with decoding audio data" + e.err);});

    //soundSource.connect(audioCtx.destination);
    //soundSource.loop = true;
    //soundSource.start();
  };

  ajaxRequest.send();

  //main block for doing the audio recording

  if (navigator.mediaDevices.getUserMedia) {
     console.log('getUserMedia supported.');
     var constraints = {audio: true}
     navigator.mediaDevices.getUserMedia (constraints)
        .then(
          function(stream) {
             source = audioCtx.createMediaStreamSource(stream);
             source.connect(distortion);
             distortion.connect(biquadFilter);
             biquadFilter.connect(gainNode);
             convolver.connect(gainNode);
             gainNode.connect(analyser);
             analyser.connect(audioCtx.destination);
             voiceChange();
        })
        .catch( function(err) { console.log('The following gUM error occured: ' + err);})
  } else {
     console.log('getUserMedia not supported on your browser!');
  }
}

function voiceChange(voiceSetting = 'distortion') {
  distortion.oversample = '4x';
  biquadFilter.gain.setTargetAtTime(0, audioCtx.currentTime, 0)

  //when convolver is selected it is connected back into the audio path
  if(voiceSetting == "convolver") {
    biquadFilter.disconnect(0);
    biquadFilter.connect(convolver);
  } else {
    biquadFilter.disconnect(0);
    biquadFilter.connect(gainNode);

    if(voiceSetting == "distortion") {
      distortion.curve = makeDistortionCurve(400);
    } else if(voiceSetting == "biquad") {
      biquadFilter.type = "lowshelf";
      biquadFilter.frequency.setTargetAtTime(1000, audioCtx.currentTime, 0)
      biquadFilter.gain.setTargetAtTime(25, audioCtx.currentTime, 0)
    } else if(voiceSetting == "off") {
      console.log("Voice settings turned off");
    }
  }
}
