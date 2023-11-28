document.addEventListener('DOMContentLoaded', () => {
	'use strict';

	const main = () => {
		const myVideo = document.getElementById("srcVideo");
		const myCanvas = document.getElementById("destCanvas");
		const ctx = myCanvas.getContext('2d');
		let anime = null;
		let isCameraRunning = false;
		let isFrontCamera = false;

		let cameraWidth = myCanvas.width = window.innerWidth;
		let cameraHeight = myCanvas.height = window.innerHeight;

		const setCameraSize = (width, height) => {
			cameraWidth = myCanvas.width = window.innerWidth;
			cameraHeight = myCanvas.height = window.innerHeight;
			if(isCameraRunning)
				startCamera();
		};

		const stopAnime = () => {
			if(anime){
				cancelAnimationFrame(anime);
				anime = 0;
			}
		};

		const doAnime = () => {
			if(isFrontCamera){
				myCanvas.style.transform = 'scaleX(-1)';
			}else{
				myCanvas.style.transform = 'scaleX(1)';
			}
			ctx.drawImage(myVideo, 0, 0, cameraWidth, cameraHeight);
			if(anime)
				anime = requestAnimationFrame(doAnime);
		};

		const getCameraConstraints = () => {
			if (isFrontCamera){
				return {
					audio: false,
					video: {
						facingMode: "user",
						width: { ideal: cameraWidth },
						height: { ideal: cameraHeight },
					},
				};
			} else {
				return {
					audio: false,
					video: {
						facingMode: { exact: 'environment' },
						width: { ideal: cameraWidth },
						height: { ideal: cameraHeight },
					},
				};
			}
		};

		const stopCamera = () => {
			stopAnime();
			myVideo.srcObject = null;
			isCameraRunning = false;
		};

		const startCamera = () => {
			stopCamera();
			navigator.mediaDevices.getUserMedia(getCameraConstraints())
			.then(stream => {
				myVideo.srcObject = stream;
				anime = requestAnimationFrame(doAnime);
				isCameraRunning = true;
			})
			.catch(e => {
				isFrontCamera = !isFrontCamera;
				navigator.mediaDevices.getUserMedia(getCameraConstraints())
				.then(stream => {
					myVideo.srcObject = stream;
					anime = requestAnimationFrame(doAnime);
					isCameraRunning = true;
				})
				.catch(e => {
					alert(e.message);
				});
			});
		}

		window.addEventListener('click', (e) => {
			stopCamera();
		});

		window.addEventListener('resize', (e) => {
			setCameraSize(window.innerWidth, window.innerHeight);
		});

		startCamera();
	}

	main();
});
