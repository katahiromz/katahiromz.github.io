var mic_audioCtx = null;
var mic_distortion = null;
var mic_gainNode = null;
var mic_biquadFilter = null;
var mic_source = null;
var mic_analyser = null;

// distortion curve for the waveshaper, thanks to Kevin Ennis
// http://stackoverflow.com/questions/22312841/waveshaper-node-in-webaudio-how-to-emulate-distortion
function makeDistortionCurve(amount){
  let k = typeof amount === 'number' ? amount : 50,
    n_samples = 44100,
    curve = new Float32Array(n_samples),
    deg = Math.PI / 180,
    i = 0,
    x;
  for ( ; i < n_samples; ++i ){
    x = i * 2 / n_samples - 1;
    curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
  }
  return curve;
}

function mic_Setup(){
  if (navigator.mediaDevices === undefined){
    navigator.mediaDevices = {};
  }

  if (navigator.mediaDevices.getUserMedia === undefined){
    navigator.mediaDevices.getUserMedia = function(constraints){
      let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
      if (!getUserMedia){
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }
      return new Promise(function(resolve, reject){
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }
}

function mic_connect(){
  mic_audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  mic_analyser = mic_audioCtx.createAnalyser();
  mic_analyser.minDecibels = -90;
  mic_analyser.maxDecibels = -10;
  mic_analyser.smoothingTimeConstant = 0.85;

  mic_distortion = mic_audioCtx.createWaveShaper();
  mic_gainNode = mic_audioCtx.createGain();
  mic_biquadFilter = mic_audioCtx.createBiquadFilter();

  if (navigator.mediaDevices.getUserMedia){
    let constraints = {audio: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(
      function(stream){
        mic_source = mic_audioCtx.createMediaStreamSource(stream);
        mic_source.connect(mic_distortion);
        mic_distortion.connect(mic_biquadFilter);
        mic_biquadFilter.connect(mic_gainNode);
        mic_gainNode.connect(mic_analyser);
        mic_analyser.connect(mic_audioCtx.destination);
        mic_voiceChange();
    })
    .catch(function(err){
      console.log('The following gUM error occured: ' + err);
    })
  } else {
     console.log('getUserMedia not supported on your browser!');
  }
}

function mic_disconnect(){
  let constraints = {audio: false};
  navigator.mediaDevices.getUserMedia(constraints)
  mic_biquadFilter.disconnect(0);
  mic_source.disconnect(0);
  mic_distortion.disconnect(0);
  mic_biquadFilter.disconnect(0);
  mic_gainNode.disconnect(0);
  mic_analyser.disconnect(0);
  mic_audioCtx = null;
  mic_distortion = null;
  mic_gainNode = null;
  mic_biquadFilter = null;
  mic_source = null;
  mic_analyser = null;
}

function mic_voiceChange(voiceSetting){
  mic_distortion.oversample = '4x';
  mic_biquadFilter.gain.setTargetAtTime(0, mic_audioCtx.currentTime, 0)

  switch (voiceSetting){
  case 'distortion':
    mic_biquadFilter.disconnect(0);
    mic_biquadFilter.connect(mic_gainNode);
    mic_distortion.curve = makeDistortionCurve(400);
    break;
  case 'biquad':
    mic_biquadFilter.disconnect(0);
    mic_biquadFilter.connect(mic_gainNode);
    mic_biquadFilter.type = "lowshelf";
    mic_biquadFilter.frequency.setTargetAtTime(1000, mic_audioCtx.currentTime, 0)
    mic_biquadFilter.gain.setTargetAtTime(25, mic_audioCtx.currentTime, 0)
    break;
  case 'off':
    mic_biquadFilter.disconnect(0);
    mic_biquadFilter.connect(mic_gainNode);
    break;
  }
}
