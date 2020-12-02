class NetisClassifyElement extends HTMLElement {
	static observedAttributes = ['level1', 'level2', 'level3', 'level4'];

	constructor() {
		const self = super();
		this.dict = null;
		this.shadow = this.attachShadow({mode: 'open'});
		this.clear();
		this.rendered = false;

		let html = `
<style>
	.category {
		display: inline-block;
		border-left: 2px lightgray solid;
		border-top: 2px lightgray solid;
		border-right: 2px darkgray solid;
		border-bottom: 2px darkgray solid;
		margin: 0;
		padding: 8px;
	}
	.category_level {
		display: inline-block;
		width: 200px;
	}
	.category_select {
		width: 190px;
	}
	.level_label {
		font-size: 75%;
	}
</style>
<ul class="category" part="category">
	<li class="category_level l1" part="l1">
		<span class="level_label">レベル1</span><br />
		<select id="level1" part="level1" class="category_select level1">
			<option value="" selected></option>
		</select>
	</li>
	<li class="category_level l2" part="l2">
		<span class="level_label">レベル2</span><br />
		<select id="level2" part="level2" class="category_select level2">
			<option value="" selected></option>
		</select>
	</li>
	<li class="category_level l3" part="l3">
		<span class="level_label">レベル3</span><br />
		<select id="level3" part="level3" class="category_select level3">
			<option value="" selected></option>
		</select>
	</li>
	<li class="category_level l4" part="l4">
		<span class="level_label">レベル4</span><br />
		<select id="level4" part="level4" class="category_select level4">
			<option value="" selected></option>
		</select>
	</li>
</ul>
`;
		this.shadow.innerHTML = html;
		this.setLevel0();
		this.rendered = true;

		let this_is_it = this;
		let level1 = this.shadow.querySelector('#level1')
		if (level1) {
			level1.addEventListener("change", function() {
				this_is_it.setLevel1(level1.value);
				this_is_it.setLevel2("");
				this_is_it.setLevel3("");
				this_is_it.setLevel4("");
				this_is_it.fireCustomEvent();
			});
		}
		let level2 = this.shadow.querySelector('#level2');
		if (level2) {
			level2.addEventListener("change", function() {
				this_is_it.setLevel2(level2.value);
				this_is_it.setLevel3("");
				this_is_it.setLevel4("");
				this_is_it.fireCustomEvent();
			});
			level2.disabled = true;
		}
		let level3 = this.shadow.querySelector('#level3');
		if (level3) {
			level3.addEventListener("change", function() {
				this_is_it.setLevel3(level3.value);
				this_is_it.setLevel4("");
				this_is_it.fireCustomEvent();
			});
			level3.disabled = true;
		}
		let level4 = this.shadow.querySelector('#level4');
		if (level4) {
			level4.addEventListener("change", function() {
				this_is_it.setLevel4(level4.value);
				this_is_it.fireCustomEvent();
			});
			level4.disabled = true;
		}
	}

	fireCustomEvent() {
		const event = new CustomEvent('my-custom-event', {
			bubbles: true,
			composed: true,
		})
		this.dispatchEvent(event);
	}

	clear() {
		this.levels = ["", "", "", ""];
	}

	createOption(value, text, selected = false) {
		let opt = document.createElement("option");
		opt.setAttribute("value", value);
		opt.innerText = text;
		opt.selected = selected;
		return opt;
	}

	setLevel0(newValue = null) {
		if (!this.rendered)
			return;
		let level1 = this.shadow.querySelector('#level1');
		while (level1.firstChild) {
			level1.removeChild(level1.firstChild);
		}
		level1.appendChild(this.createOption("", "", true));
		for (let i in this.dict) {
			level1.appendChild(this.createOption(i, i));
		}
	}

	setLevel1(newValue) {
		if (!this.rendered)
			return;
		newValue = newValue ? newValue : "";
		this.levels[0] = newValue;
		let level1 = this.shadow.querySelector('#level1');
		if (level1.value != newValue) {
			level1.value = newValue;
		}
		let level2 = this.shadow.querySelector('#level2');
		if (level2) {
			level2.disabled = true;
			while (level2.firstChild) {
				level2.removeChild(level2.firstChild);
			}
			level2.appendChild(this.createOption("", "", true));
			if (this.dict &&
				this.dict[this.levels[0]])
			{
				for (let i in this.dict[this.levels[0]]) {
					level2.appendChild(this.createOption(i, i));
					level2.disabled = false;
				}
			}
		}
	}

	setLevel2(newValue) {
		if (!this.rendered)
			return;
		newValue = newValue ? newValue : "";
		this.levels[1] = newValue;
		let level2 = this.shadow.querySelector('#level2');
		if (level2.value != newValue) {
			level2.value = newValue;
		}
		let level3 = this.shadow.querySelector('#level3');
		if (level3) {
			level3.disabled = true;
			while (level3.firstChild) {
				level3.removeChild(level3.firstChild);
			}
			level3.appendChild(this.createOption("", "", true));
			if (this.dict &&
				this.dict[this.levels[0]] &&
				this.dict[this.levels[0]][this.levels[1]])
			{
				let obj = this.dict[this.levels[0]][this.levels[1]];
				for (let i in obj) {
					level3.appendChild(this.createOption(i, i));
					level3.disabled = false;
				}
			}
		}
	}

	setLevel3(newValue) {
		if (!this.rendered)
			return;
		newValue = newValue ? newValue : "";
		this.levels[2] = newValue;
		let level3 = this.shadow.querySelector('#level3');
		if (level3.value != newValue) {
			level3.value = newValue;
		}
		let level4 = this.shadow.querySelector('#level4');
		if (level4) {
			level4.disabled = true;
			while (level4.firstChild) {
				level4.removeChild(level4.firstChild);
			}
			level4.appendChild(this.createOption("", "", true));
			if (this.dict &&
				this.dict[this.levels[0]] &&
				this.dict[this.levels[0]][this.levels[1]] &&
				this.dict[this.levels[0]][this.levels[1]][this.levels[2]])
			{
				let obj = this.dict[this.levels[0]][this.levels[1]][this.levels[2]];
				for (let i in obj) {
					level4.appendChild(this.createOption(i, i, false));
					level4.disabled = false;
				}
			}
		}
	}

	setLevel4(newValue) {
		if (!this.rendered)
			return;
		newValue = newValue ? newValue : "";
		let level4 = this.shadow.querySelector('#level4');
		if (level4.value != newValue) {
			level4.value = newValue;
		}
		this.levels[3] = newValue;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
		case 'level1':
			this.level1(newValue);
			break;
		case 'level2':
			this.level2(newValue);
			break;
		case 'level3':
			this.level3(newValue);
			break;
		case 'level4':
			this.level4(newValue);
			break;
		}
	}

	get level1() {
		if (this.levels && this.levels.length == 4) {
			return this.levels[0];
		}
		return "";
	}
	get level2() {
		if (this.levels && this.levels.length == 4) {
			return this.levels[1];
		}
		return "";
	}
	get level3() {
		if (this.levels && this.levels.length == 4) {
			return this.levels[2];
		}
		return "";
	}
	get level4() {
		if (this.levels && this.levels.length == 4) {
			return this.levels[3];
		}
		return "";
	}
	get value() {
		if (this.levels && this.levels.length == 4) {
			return this.levels.join("\t");
		}
		return ["", "", "", ""];
	}

	set data(newValue) {
		if (this.dict)
			return;
		this.dict = JSON.parse(newValue);
		if (this.levels && this.levels.length == 4) {
			const l1 = this.levels[0];
			const l2 = this.levels[1];
			const l3 = this.levels[2];
			const l4 = this.levels[3];
			this.setLevel0();
			this.setLevel1(l1);
			this.setLevel2(l2);
			this.setLevel3(l3);
			this.setLevel4(l4);
		}
	}
	set level1(newValue) {
		if (this.levels && this.levels.length == 4) {
			this.setLevel1(newValue);
		}
	}
	set level2(newValue) {
		if (this.levels && this.levels.length == 4) {
			this.setLevel2(newValue);
		}
	}
	set level3(newValue) {
		if (this.levels && this.levels.length == 4) {
			this.setLevel3(newValue);
		}
	}
	set level4(newValue) {
		if (this.levels && this.levels.length == 4) {
			this.setLevel4(newValue);
		}
	}
	set value(newValue) {
		let levels = newValue.split("\t");
		if (levels && levels.length == 4) {
			this.levels = levels;
			this.setLevel1(levels[0]);
			this.setLevel2(levels[1]);
			this.setLevel3(levels[2]);
			this.setLevel4(levels[3]);
		}
	}

	connectedCallback() {
		;
	}
}

customElements.define('netis-classify', NetisClassifyElement);
