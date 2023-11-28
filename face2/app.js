document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('video');

  // カメラにアクセスするためのメソッド
  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
    } catch (error) {
      console.error('Error accessing the camera:', error);
    }
  };

  // カメラの初期化
  initCamera();
});
