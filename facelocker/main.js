// ドキュメントの読み込みが完了（DOMContentLoaded）されたら無名関数が呼び出される。
document.addEventListener('DOMContentLoaded', function(){
	const main = function(){
		const argc = arguments.length, argv = arguments;
		let locker = new facelocker(sai_id_canvas_1, function(status){
			switch(status){
			case 0:
				sai_id_button_lock_on.innerText = "Lock on";
				sai_id_button_lock_on.disabled = true;
				break;
			case 1:
				sai_id_button_lock_on.innerText = "Lock on";
				sai_id_button_lock_on.disabled = false;
				break;
			case 2:
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

		sai_id_button_close.addEventListener('click', function(e){
			if(facelocker_camvas.animation)
				locker.stop();
			else
				locker.resume();
		});

		sai_id_button_side.addEventListener('click', function(){
			locker.set_side();
		});
	}
	main();
});
