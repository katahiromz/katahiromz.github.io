document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  let isAudioEnabled = false;
  let isFrontCamera = false;

  // カメラが取得できたときに呼び出される関数。
  const gotCamera = (stream) => {
    video.srcObject = stream;
  };

  // カメラの制約を取得する関数。
  const getCameraConstraints = () => {
    if (isFrontCamera) {
      return {
        video: {
          facingMode: 'user',
        },
        audio: isAudioEnabled,
      }
    } else {
      return {
        video: {
          facingMode: { exact: 'environment' },
        },
        audio: isAudioEnabled,
      }
    }
  };

  // カメラにアクセスするためのメソッド
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints());
      gotCamera(stream);
    } catch (error) {
      try {
        isFrontCamera = !isFrontCamera;
        const stream = await navigator.mediaDevices.getUserMedia(getCameraConstraints());
        gotCamera(stream);
      } catch (error) {
        console.error('Error accessing the camera:', error);
      }
    }
  };

  // カメラ映像を加工するメソッド
  const processVideo = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // ここに加工処理を追加
    applyGrayscaleFilter();

    // 加工された映像を表示
    requestAnimationFrame(processVideo);
  };

  // グレースケールフィルターを適用するメソッド
  const applyGrayscaleFilter = () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg;
      data[i + 1] = avg;
      data[i + 2] = avg;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  sai_id_button_side.addEventListener('click', () => {
    isFrontCamera = !isFrontCamera;
    initCamera();
  });

  video.addEventListener('loadedmetadata', () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    processVideo();
  });

  // カメラの初期化
  initCamera();
});
