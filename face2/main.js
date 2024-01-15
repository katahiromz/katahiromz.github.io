document.addEventListener('DOMContentLoaded', () => {
	const main = function(){
		const argc = arguments.length, argv = arguments;

		let locker = new facelocker(sai_id_canvas_1, sai_id_video_1, function(status){
			switch(status){
			case 0: // Unlocked
				sai_id_button_lock_on.innerText = "Lock on";
				sai_id_button_lock_on.disabled = true;
				break;
			case 1: // Candidate
				sai_id_button_lock_on.innerText = "Lock on";
				sai_id_button_lock_on.disabled = false;
				break;
			case 2: // Locked
				sai_id_button_lock_on.innerText = "Unlock";
				sai_id_button_lock_on.disabled = false;
				break;
			}
		});

		sai_id_canvas_1.addEventListener('click', function(e){
			locker.on_click(e);
		});

		sai_id_button_lock_on.addEventListener('click', function(e){
			locker.lock_unlock();
		});

		sai_id_button_side.addEventListener('click', function(){
			locker.set_side();
		});
	};
	main();
});
