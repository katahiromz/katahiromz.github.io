function shuffle(array){
	for(let i = array.length - 1; i > 0; i--){
		let r = Math.floor(Math.random() * (i + 1));
		let tmp = array[i];
		array[i] = array[r];
		array[r] = tmp;
	}
}
function mid(text, i, ch){
	let ret = text.substr(0, i);
	ret += ch;
	ret += text.substr(i + 1);
	return ret;
}
function set_cell(data, cx, cy, x, y, ch){
	let text = data[y];
	data[y] = mid(text, x, ch);
	return data;
}
function corner_black(data, cx, cy){
	return data[0][0] == '■' || data[cy - 1][0] == '■' ||
	       data[cy - 1][cx - 1] == '■' || data[0][cx - 1] == '■';
}
function double_black(data, cx, cy){
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx - 1; ++x){
			if (data[y][x] == '■' && data[y][x + 1] == '■')
				return true;
		}
	}
	for (let x = 0; x < cx; ++x){
		for (let y = 0; y < cy - 1; ++y){
			if (data[y][x] == '■' && data[y + 1][x] == '■')
				return true;
		}
	}
	return false;
}
function tri_black_around(data, cx, cy){
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx; ++x){
			let count = 0;
			if (0 < x && data[y][x - 1] == '■')
				count += 1;
			if (x + 1 < cx && data[y][x + 1] == '■')
				count += 1;
			if (0 < y && data[y - 1][x] == '■')
				count += 1;
			if (y + 1 < cy && data[y + 1][x] == '■')
				count += 1;
			if (count >= 3)
				return true;
		}
	}
	return false;
}
function divided_by_black(data, cx, cy){
	let ary = [];
	ary.length = cx * cy;
	let positions = [];
	positions.push([0, 0]);
	while (positions.length > 0){
		let pos = positions.shift();
		let x = pos[0], y = pos[1];
		if (!ary[y * cx + x]){
			ary[y * cx + x] = true;
			if (0 < x && data[y][x - 1] != '■'){
				positions.push([x - 1, y]);
			}
			if (0 < y && data[y - 1][x] != '■'){
				positions.push([x, y - 1]);
			}
			if (x + 1 < cx && data[y][x + 1] != '■'){
				positions.push([x + 1, y]);
			}
			if (y + 1 < cy && data[y + 1][x] != '■'){
				positions.push([x, y + 1]);
			}
		}
	}
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx; ++x){
			let i = y * cx + x;
			if (!ary[i] && data[y][x] != '■')
				return true;
		}
	}
	return false;
}
function copy_board(data, cx, cy){
	let ary = [];
	for (let y = 0; y < cy; ++y){
		ary.push(data[y] + '');
	}
	return ary;
}
function generate_empty_board(cx, cy){
	let ary = [];
	for (let y = 0; y < cy; ++y){
		let text = '';
		for (let x = 0; x < cx; ++x){
			text += '　';
		}
		ary.push(text);
	}
	return ary;
}
function generate_blacks(data, cx, cy){
	if (corner_black(data, cx, cy))
		return null;
	if (double_black(data, cx, cy))
		return null;
	if (tri_black_around(data, cx, cy))
		return null;
	if (divided_by_black(data, cx, cy))
		return null;
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx; ++x){
			if (data[y][x] != '　')
				continue;
			let lo = x;
			while (lo > 0){
				if (data[y][lo - 1] != '　')
					break;
				lo--;
			}
			while (x + 1 < cx){
				if (data[y][x + 1] != '　')
					break;
				x++;
			}
			let hi = x;
			++x;
			if (lo + 4 <= hi){
				let a = [0, 1, 2, 3];
				shuffle(a);
				for (let k = 0; k < 4; ++k){
					let copy = copy_board(data, cx, cy);
					copy = set_cell(copy, cx, cy, lo + a[k], y, '■');
					let ret = generate_blacks(copy, cx, cy);
					if (ret){
						return ret;
					}
				}
				return null;
			}
		}
	}
	for (let x = 0; x < cx; ++x){
		for (let y = 0; y < cy; ++y){
			if (data[y][x] != '　')
				continue;
			let lo = y;
			while (lo > 0){
				if (data[lo - 1][x] != '　')
					break;
				lo--;
			}
			while (y + 1 < cy){
				if (data[y + 1][x] != '　')
					break;
				y++;
			}
			let hi = y;
			++y;
			if (lo + 4 <= hi){
				let a = [0, 1, 2, 3];
				shuffle(a);
				for (let k = 0; k < 4; ++k){
					let copy = copy_board(data, cx, cy);
					copy = set_cell(copy, cx, cy, x, lo + a[k], '■');
					let ret = generate_blacks(copy, cx, cy);
					if (ret){
						return ret;
					}
				}
				return null;
			}
		}
	}
	return data;
}
function get_candidates(dict, pattern, data, cx, cy){
	let patlen = pattern.length;
	let cands = [];
	for (let i = 0; i < dict.length; ++i){
		let word = dict[i][0];
		let wordlen = word.length;
		if (wordlen != patlen)
			continue;
		let matched = true;
		for (let k = 0; k < wordlen; ++k){
			if (pattern[k] != '　' && pattern[k] != word[k]){
				matched = false;
				break;
			}
		}
		if (!matched)
			continue;
		cands.push(word);
	}
	return cands;
}
function any_candidate(dict, pattern){
	let patlen = pattern.length;
	for (let i = 0; i < dict.length; ++i){
		let word = dict[i][0];
		let wordlen = word.length;
		if (wordlen != patlen)
			continue;
		let k;
		for (k = 0; k < wordlen; ++k){
			if (pattern[k] != '　' && pattern[k] != word[k]) {
				k = wordlen + 1;
				break;
			}
		}
		if (k == wordlen){
			return true;
		}
	}
	return false;
}
function detect_no_candidates(dict, data, cx, cy){
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx - 1; ++x){
			let ch1 = data[y][x], ch2 = data[y][x + 1];
			if ((ch1 == '　' && ch2 != '■' && ch2 != '　') ||
			    (ch1 != '　' && ch1 != '■' && ch2 == '　'))
			{
				let lo, hi;
				lo = hi = x;
				while (lo > 0){
					if (data[y][lo - 1] == '■')
						break;
					lo--;
				}
				while (hi + 1 < cx){
					if (data[y][hi + 1] == '■')
						break;
					hi++;
				}
				let pattern = '';
				for (let k = lo; k <= hi; ++k){
					pattern += data[y][k];
				}
				if (!any_candidate(dict, pattern))
					return true;
			}
		}
	}
	for (let x = 0; x < cx; ++x){
		for (let y = 0; y < cy - 1; ++y){
			let ch1 = data[y][x], ch2 = data[y + 1][x];
			if ((ch1 == '　' && ch2 != '■' && ch2 != '　') ||
			    (ch1 != '　' && ch1 != '■' && ch2 == '　'))
			{
				let lo, hi;
				lo = hi = y;
				while (lo > 0){
					if (data[lo - 1][x] == '■')
						break;
					lo--;
				}
				while (hi + 1 < cy){
					if (data[hi + 1][x] == '■')
						break;
					hi++;
				}
				let pattern = '';
				for (let k = lo; k <= hi; ++k){
					pattern += data[k][x];
				}
				if (!any_candidate(dict, pattern))
					return true;
			}
		}
	}
	return false;
}
function is_solution(data, cx, cy){
	if (corner_black(data, cx, cy))
		return false;
	if (double_black(data, cx, cy))
		return false;
	if (tri_black_around(data, cx, cy))
		return false;
	if (divided_by_black(data, cx, cy))
		return false;
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx; ++x){
			if (data[y][x] == '　')
				return false;
		}
	}
	return true;
}
function solve_board_recurse(dict, data, cx, cy){
	if (corner_black(data, cx, cy)){
		return null;
	}
	if (double_black(data, cx, cy)){
		return null;
	}
	if (tri_black_around(data, cx, cy)){
		return null;
	}
	if (divided_by_black(data, cx, cy)){
		return null;
	}
	if (detect_no_candidates(dict, data, cx, cy)){
		return null;
	}
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx - 1; ++x){
			let ch1 = data[y][x], ch2 = data[y][x + 1];
			if ((ch1 == '　' && ch2 != '■' && ch2 != '　') ||
			    (ch1 != '　' && ch1 != '■' && ch2 == '　'))
			{
				let lo, hi;
				lo = hi = x;
				while (lo > 0){
					if (data[y][lo - 1] == '■')
						break;
					lo--;
				}
				while (hi + 1 < cx){
					if (data[y][hi + 1] == '■')
						break;
					hi++;
				}
				let pattern = '';
				for (let k = lo; k <= hi; ++k){
					pattern += data[y][k];
				}
				let cands = get_candidates(dict, pattern, data, cx, cy);
				if (cands){
					shuffle(cands);
					for (let icand = 0; icand < cands.length; ++icand){
						let cand = cands[icand];
						let copy = copy_board(data, cx, cy);
						for (let k = lo; k <= hi; ++k){
							copy = set_cell(copy, cx, cy, k, y, cand[k - lo]);
						}
						let ret = solve_board_recurse(dict, copy, cx, cy);
						if (ret){
							return ret;
						}
					}
				}
				return null;
			}
		}
	}
	for (let x = 0; x < cx; ++x){
		for (let y = 0; y < cy - 1; ++y){
			let ch1 = data[y][x], ch2 = data[y + 1][x];
			if ((ch1 == '　' && ch2 != '■' && ch2 != '　') ||
			    (ch1 != '　' && ch1 != '■' && ch2 == '　'))
			{
				let lo, hi;
				lo = hi = y;
				while (lo > 0){
					if (data[lo - 1][x] == '■')
						break;
					lo--;
				}
				while (hi + 1 < cy){
					if (data[hi + 1][x] == '■')
						break;
					hi++;
				}
				let pattern = '';
				for (let k = lo; k <= hi; ++k){
					pattern += data[k][x];
				}
				let cands = get_candidates(dict, pattern, data, cx, cy);
				if (cands){
					shuffle(cands);
					for (let icand = 0; icand < cands.length; ++icand){
						let cand = cands[icand];
						let copy = copy_board(data, cx, cy);
						for (let k = lo; k <= hi; ++k){
							copy = set_cell(copy, cx, cy, x, k, cand[k - lo]);
						}
						let ret = solve_board_recurse(dict, copy, cx, cy);
						if (ret){
							return ret;
						}
					}
				}
				return null;
			}
		}
	}
	if (is_solution(data, cx, cy)){
		return data;
	}
	return null;
}
function solve_board(dict, data, cx, cy){
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx; ++x){
			let ch = data[y][x];
			if (ch != '　' && ch != '■'){
				return solve_board_recurse(dict, data, cx, cy);
			}
		}
	}
	for (let y = 0; y < cy; ++y){
		for (let x = 0; x < cx - 1; ++x){
			let ch1 = data[y][x], ch2 = data[y][x + 1];
			if (ch1 == '　' && ch2 == '　'){
				let lo, hi;
				lo = hi = x;
				while (lo > 0){
					if (data[y][lo - 1] == '■')
						break;
					lo--;
				}
				while (hi + 1 < cx){
					if (data[y][hi + 1] == '■')
						break;
					hi++;
				}
				let patlen = hi - lo + 1;
				for (let iword = 0; iword < dict.length; ++iword){
					let word = dict[iword][0];
					let wordlen = word.length;
					if (wordlen != patlen)
						continue;
					let copy = copy_board(data, cx, cy);
					for (let k = lo; k <= hi; ++k){
						copy = set_cell(copy, cx, cy, k, y, word[k - lo]);
					}
					return solve_board_recurse(dict, copy, cx, cy);
				}
			}
		}
	}
	return null;
}
function main(dict, data, cx, cy){
	shuffle(dict);
	if (0){
		return solve_board(dict, data, cx, cy);
	} else if (0){
		data = generate_empty_board(cx, cy);
		data = generate_blacks(data, cx, cy);
		return data;
	} else {
		do {
			data = generate_empty_board(cx, cy);
			let copy = copy_board(data, cx, cy);
			data = generate_blacks(copy, cx, cy);
			data = solve_board(dict, data, cx, cy);
		} while (!data);
		return data;
	}
}
self.addEventListener('message', function(e){
	let dict = e.data.dict;
	let data = e.data.data;
	let cx = e.data.cx;
	let cy = e.data.cy;
	data = main(dict, data, cx, cy);
	self.postMessage(data);
	self.close();
});
