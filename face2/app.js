document.addEventListener('DOMContentLoaded', async () => {
	const video = document.getElementById('video');
	const canvas = document.getElementById('canvas');
	const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
	let isAudioEnabled = false;
	let isFrontCamera = false;
	let anime = null;

	// face-api.js の初期化
	await faceapi.loadSsdMobilenetv1Model('./models');
	await faceapi.loadFaceLandmarkModel('./models');
	await faceapi.loadFaceRecognitionModel('./models');

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
		detectFaces();

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

	// 顔認識。
	const detectFaces = async () => {
		// face-api.js を使用して顔認識を行う
		const detections = await faceapi.detectAllFaces(canvas)
		const displaySize = { width: canvas.width, height: canvas.height };
		const resizedDetections = faceapi.resizeResults(detections, displaySize);
		faceapi.draw.drawDetections(canvas, resizedDetections);
	};

	// 前面・背面カメラの切り替えボタン。
	sai_id_button_side.addEventListener('click', () => {
		if (anime) {
			cancelAnimationFrame(anime);
			anime = null;
		}
		if(video.srcObject){
			video.srcObject.getVideoTracks().forEach(function(track){
				track.stop();
			});
			video.srcObject = null;
		}
		isFrontCamera = !isFrontCamera;
		initCamera();
	});

	// カメラの初期化
	initCamera();
});
