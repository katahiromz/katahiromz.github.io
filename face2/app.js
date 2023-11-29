document.addEventListener('DOMContentLoaded', () => {
	const video = document.getElementById('video');
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
	let isAudioEnabled = false;
	let isFrontCamera = false;
	let anime = null;

	// カメラの制約を取得する関数。
	const getCameraConstraints = () => {
		if (isFrontCamera) {
			return {
				video: {
					facingMode: 'user',
				},
				audio: isAudioEnabled,
			};
		} else {
			return {
				video: {
					facingMode: { exact: 'environment' },
				},
				audio: isAudioEnabled,
			};
		}
	};

	// カメラストリームを取得するメソッド
	const getCameraStream = async () => {
		return navigator.mediaDevices.getUserMedia(getCameraConstraints());
	};

	// カメラ映像を加工するメソッド
	const processVideo = () => {
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

		// ここに加工処理を追加
		applyGrayscaleFilter();

		// 加工された映像を表示
		if (anime)
			anime = requestAnimationFrame(processVideo);
	};

	// カメラが取得できたときの処理。
	const gotCamera = (stream) => {
		video.srcObject = stream;
		video.addEventListener('loadedmetadata', () => {
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			anime = requestAnimationFrame(processVideo);
		});
	};

	const initCamera = async () => {
		try {
			const stream = await getCameraStream();
			gotCamera(stream);
		} catch (error) {
			console.log('Error accessing the camera:', error);
			try {
				isFrontCamera = !isFrontCamera;
				const stream = await getCameraStream();
				gotCamera(stream);
			} catch (error) {
				console.error('Error accessing the camera:', error);
			}
		}
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

	// 前面・背面カメラの切り替えボタン。
	sai_id_button_side.addEventListener('click', () => {
		if (anime)
			cancelAnimationFrame(anime);
		if(video.srcObject){
			video.srcObject.getVideoTracks().forEach(function(camera){
				camera.stop();
			});
			video.srcObject = null;
		}
		isFrontCamera = !isFrontCamera;
		initCamera();
	});

	// カメラの初期化
	initCamera();
});
