//<nowiki>


(function($){


/*
 ****************************************
 *** friendlytag.js: Tag module
 ****************************************
 * Mode of invocation:     Tab ("Tag")
 * Active on:              Existing articles; file pages with a corresponding file
 *                         which is local (not on Commons); existing subpages of
 *                         {Wikipedia|Wikipedia talk}:Articles for creation;
 *                         all redirects
 * Config directives in:   FriendlyConfig
 */

Twinkle.tag = function friendlytag() {
	// redirect tagging
	if( Morebits.wiki.isPageRedirect() ) {
		Twinkle.tag.mode = 'redirect';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Tag pengalihan" );
	}
	// file tagging
	else if( mw.config.get('wgNamespaceNumber') === 6 && !document.getElementById("mw-sharedupload") && document.getElementById("mw-imagepage-section-filehistory") ) {
		Twinkle.tag.mode = 'file';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Berikan tag pemeliharaan ke dalam berkas" );
	}
	// article/draft article tagging
	else if( ( mw.config.get('wgNamespaceNumber') === 0 || mw.config.get('wgNamespaceNumber') === 118 || /^Wikipedia( talk)?\:Articles for creation\//.exec(Morebits.pageNameNorm) ) && mw.config.get('wgCurRevisionId') ) {
		Twinkle.tag.mode = 'article';
		Twinkle.addPortletLink( Twinkle.tag.callback, "Tag", "friendly-tag", "Berikan tag pemeliharaan ke dalam artikel" );
	}
};

Twinkle.tag.callback = function friendlytagCallback() {
	var Window = new Morebits.simpleWindow( 630, (Twinkle.tag.mode === "article") ? 500 : 400 );
	Window.setScriptName( "Twinkle" );
	// anyone got a good policy/guideline/info page/instructional page link??
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#tag" );

	var form = new Morebits.quickForm( Twinkle.tag.callback.evaluate );

	if (document.getElementsByClassName("patrollink").length) {
		form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Tandai halaman ini telah dipatroli',
					value: 'patrolPage',
					name: 'patrolPage',
					checked: Twinkle.getFriendlyPref('markTaggedPagesAsPatrolled')
				}
			]
		} );
	}

	switch( Twinkle.tag.mode ) {
		case 'article':
			Window.setTitle( "Penandaan pemeliharaan artikel" );

			form.append({
				type: 'select',
				name: 'sortorder',
				label: 'Lihat daftar ini:',
				tooltip: 'Anda dapat mengubah susunan tampilan baku di preferensi Twinkle Anda (WP:TWPREFS).',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{ type: 'option', value: 'cat', label: 'Menurut kategori', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'cat' },
					{ type: 'option', value: 'alpha', label: 'Menurut susunan abjad', selected: Twinkle.getFriendlyPref('tagArticleSortOrder') === 'alpha' }
				]
			});

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Kelompokkan dalam {{multiple issues}} jika dibutuhkan',
							value: 'group',
							name: 'group',
							tooltip: 'Jika menerapkan tiga templat atau lebih yang didukung oleh {{multiple issues}} dan kotak ini dicentang, semua templat yang didukung akan dikelompokkan dalam templat {{multiple issues}}.',
							checked: Twinkle.getFriendlyPref('groupByDefault')
						}
					]
				}
			);

			break;

		case 'file':
			Window.setTitle( "Pemberian tag pemeliharaan berkas" );

			// TODO: perhaps add custom tags TO list of checkboxes

			form.append({ type: 'header', label: 'Tag lisensi dan sumber bermasalah' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.licenseList } );

			form.append({ type: 'header', label: 'Tag terkait dengan Commons' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.commonsList } );

			form.append({ type: 'header', label: 'Tag perapian' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.cleanupList } );

			form.append({ type: 'header', label: 'Tag kualitas gambar' } );
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.qualityList } );

			form.append({ type: 'header', label: 'Tag penggantian' });
			form.append({ type: 'checkbox', name: 'imageTags', list: Twinkle.tag.file.replacementList } );
			break;

		case 'redirect':
			Window.setTitle( "Tag pengalihan" );

			form.append({ type: 'header', label:'Templat ejaan, salah ketik, gaya, dan kapitalisasi' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.spellingList });

			form.append({ type: 'header', label:'Templat nama pengganti' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.alternativeList });

			form.append({ type: 'header', label:'Templat administrasi dan pengalihan lain-lain' });
			form.append({ type: 'checkbox', name: 'redirectTags', list: Twinkle.tag.administrativeList });
			break;

		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();

	if (Twinkle.tag.mode === "article") {
		// fake a change event on the sort dropdown, to initialize the tag list
		var evt = document.createEvent("Event");
		evt.initEvent("change", true, true);
		result.sortorder.dispatchEvent(evt);
	}
};

Twinkle.tag.checkedTags = [];

Twinkle.tag.updateSortOrder = function(e) {
	var sortorder = e.target.value;

	Twinkle.tag.checkedTags = e.target.form.getChecked("articleTags");
	if (!Twinkle.tag.checkedTags) {
		Twinkle.tag.checkedTags = [];
	}

	var container = new Morebits.quickForm.element({ type: "fragment" });

	// function to generate a checkbox, with appropriate subgroup if needed
	var makeCheckbox = function(tag, description) {
		var checkbox = { value: tag, label: "{{" + tag + "}}: " + description };
		if (Twinkle.tag.checkedTags.indexOf(tag) !== -1) {
			checkbox.checked = true;
		}
		switch (tag) {
			case "cleanup":
				checkbox.subgroup = {
					name: 'cleanup',
					type: 'input',
					label: 'Berikan alasan perapian: ',
					tooltip: 'Wajib diisi.',
					size: 35
				};
				break;
			case "copy edit":
				checkbox.subgroup = {
					name: 'copyEdit',
					type: 'input',
					label: '"Artikel ini perlu disunting lebih lanjut untuk..." ',
					tooltip: 'seperti "ejaan yang salah". Opsional.',
					size: 35
				};
				break;
			case "copypaste":
				checkbox.subgroup = {
					name: 'copypaste',
					type: 'input',
					label: 'URL sumber: ',
					tooltip: 'Jika diketahui.',
					size: 50
				};
				break;
			case "expert-subject":
				checkbox.subgroup = {
					name: 'expertSubject',
					type: 'input',
					label: 'Nama ProyekWiki terkait: ',
					tooltip: 'Opsional. Berikan nama ProyekWiki yang dapat membantu merekrut pengguna ahli. Jangan berikan awalan "ProyekWiki".'
				};
				break;
			case "globalize":
				checkbox.subgroup = {
					name: 'globalize',
					type: 'select',
					list: [
						{ label: "{{globalize}}: artikel ini mungkin tidak mewakili keseluruhan subjek yang dibahas", value: "globalize" },
						{
							label: "Subtemplat {{globalize}} terkait dengan wilayah yang spesifik",
							list: [
								{ label: "{{globalize/Australia}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Australia", value: "globalize/Australia" },
								{ label: "{{globalize/Canada}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Kanada", value: "globalize/Canada" },
								{ label: "{{globalize/China}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Tiongkok", value: "globalize/China" },
								{ label: "{{globalize/Common law}}: artikel berisi konten yang dibuat terutama dalam sudut pandang hukum secara umum", value: "globalize/Common law" },
								{ label: "{{globalize/Eng}}: artikel berisi konten yang dibuat terutama dalam sudut pandang pengguna bahasa Inggris", value: "globalize/Eng" },
								{ label: "{{globalize/Europe}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Eropa", value: "globalize/Europe" },
								{ label: "{{globalize/France}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Perancis", value: "globalize/France" },
								{ label: "{{globalize/Germany}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Jerman", value: "globalize/Germany" },
								{ label: "{{globalize/India}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat India", value: "globalize/India" },
								{ label: "{{globalize/Middle East}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Timur Tengah", value: "globalize/Middle East" },
								{ label: "{{globalize/North America}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Amerika Utara", value: "globalize/North America" },
								{ label: "{{globalize/Northern}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat belahan bumi utara", value: "globalize/Northern" },
								{ label: "{{globalize/Southern}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat belahan bumi selatan", value: "globalize/Southern" },
								{ label: "{{globalize/South Africa}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Afrika Selatan", value: "globalize/South Africa" },
								{ label: "{{globalize/UK}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Inggris", value: "globalize/UK" },
								{ label: "{{globalize/UK and Canada}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Kanada", value: "globalize/UK and Canada" },
								{ label: "{{globalize/US}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat Amerika Serikat", value: "globalize/US" },
								{ label: "{{globalize/West}}: artikel berisi konten yang dibuat terutama dalam sudut pandang masyarakat negara-negara Barat", value: "globalize/West" }
							]
						}
					]
				};
				break;
			case "merge":
			case "merge from":
			case "merge to":
				var otherTagName = "merge";
				switch (tag)
				{
					case "merge from":
						otherTagName = "digabungkan ke";
						break;
					case "merge to":
						otherTagName = "digabungkan dari";
						break;
				}
				checkbox.subgroup = [
					{
						name: 'mergeTarget',
						type: 'input',
						label: 'Artikel lainnya: ',
						tooltip: 'Jika beberapa artikel ditulis, pisahkan dengan karakter pipa: Artikel pertama|Artikel kedua'
					},
					{
						name: 'mergeTagOther',
						type: 'checkbox',
						list: [
							{
								label: 'Tandai artikel lain dengan tag {{' + otherTagName + '}}',
								checked: true,
								tooltip: 'Hanya ada jika sebuah judul artikel diberikan.'
							}
						]
					}
				];
				if (mw.config.get('wgNamespaceNumber') === 0) {
					checkbox.subgroup.push({
						name: 'mergeReason',
						type: 'textarea',
						label: 'Alasan penggabungan (akan dikirim ke halaman pembicaraan ' +
							(tag === "merge to" ? 'the other article\'s' : 'this article\'s') + ' talk page):',
						tooltip: 'Optional, but strongly recommended. Leave blank if not wanted. Only available if a single article name is entered.'
					});
				}
				break;
			case "not English":
			case "rough translation":
				checkbox.subgroup = [
					{
						name: 'translationLanguage',
						type: 'input',
						label: 'Language of article (if known): ',
						tooltip: 'Consider looking at [[WP:LRC]] for help. If listing the article at PNT, please try to avoid leaving this box blank, unless you are completely unsure.'
					}
				];
				if (tag === "not English") {
					checkbox.subgroup.push({
						name: 'translationNotify',
						type: 'checkbox',
						list: [
							{
								label: 'Notify article creator',
								checked: true,
								tooltip: "Places {{uw-notenglish}} on the creator's talk page."
							}
						]
					});
				}
				checkbox.subgroup.push({
					name: 'translationPostAtPNT',
					type: 'checkbox',
					list: [
						{
							label: 'List this article at Wikipedia:Pages needing translation into English (PNT)',
							checked: true
						}
					]
				});
				checkbox.subgroup.push({
					name: 'translationComments',
					type: 'textarea',
					label: 'Additional comments to post at PNT',
					tooltip: 'Optional, and only relevant if "List this article ..." above is checked.'
				});
				break;
			case "notability":
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: "{{notability}}: subjek artikel mungkin tidak memenuhi kelayakan secara umum", value: "none" },
						{ label: "{{notability|Academics}}: pedoman kelayakan untuk akademik", value: "Academics" },
						{ label: "{{notability|Biographies}}: pedoman kelayakan untuk biografi", value: "Biographies" },
						{ label: "{{notability|Books}}: pedoman kelayakan untuk buku", value: "Books" },
						{ label: "{{notability|Companies}}: pedoman kelayakan untuk perusahaan dan organisasi", value: "Companies" },
						{ label: "{{notability|Events}}: pedoman kelayakan untuk acara/perhelatan", value: "Events" },
						{ label: "{{notability|Films}}: pedoman kelayakan untuk film", value: "Films" },
						{ label: "{{notability|Places}}: pedoman kelayakan untuk tempat atau lokasi", value: "Places" },
						{ label: "{{notability|Music}}: pedoman kelayakan untuk musik", value: "Music" },
						{ label: "{{notability|Products}}: pedoman kelayakan untuk produk dan layanan", value: "Products" },
						{ label: "{{notability|Sport}}: pedoman kelayakan untuk olahraga", value: "Sport" },
						{ label: "{{notability|Web}}: pedoman kelayakan untuk isi situs", value: "Web" }
					]
				};
				break;
			default:
				break;
		}
		return checkbox;
	};

	// categorical sort order
	if (sortorder === "cat") {
		// function to iterate through the tags and create a checkbox for each one
		var doCategoryCheckboxes = function(subdiv, array) {
			var checkboxes = [];
			$.each(array, function(k, tag) {
				var description = Twinkle.tag.article.tags[tag];
				checkboxes.push(makeCheckbox(tag, description));
			});
			subdiv.append({
				type: "checkbox",
				name: "articleTags",
				list: checkboxes
			});
		};

		var i = 0;
		// go through each category and sub-category and append lists of checkboxes
		$.each(Twinkle.tag.article.tagCategories, function(title, content) {
			container.append({ type: "header", id: "tagHeader" + i, label: title });
			var subdiv = container.append({ type: "div", id: "tagSubdiv" + i++ });
			if ($.isArray(content)) {
				doCategoryCheckboxes(subdiv, content);
			} else {
				$.each(content, function(subtitle, subcontent) {
					subdiv.append({ type: "div", label: [ Morebits.htmlNode("b", subtitle) ] });
					doCategoryCheckboxes(subdiv, subcontent);
				});
			}
		});
	}
	// alphabetical sort order
	else {
		var checkboxes = [];
		$.each(Twinkle.tag.article.tags, function(tag, description) {
			checkboxes.push(makeCheckbox(tag, description));
		});
		container.append({
			type: "checkbox",
			name: "articleTags",
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getFriendlyPref('customTagList').length) {
		container.append({ type: 'header', label: 'Custom tags' });
		container.append({ type: 'checkbox', name: 'articleTags', list: Twinkle.getFriendlyPref('customTagList') });
	}

	var $workarea = $(e.target.form).find("div#tagWorkArea");
	var rendered = container.render();
	$workarea.empty().append(rendered);

	// style adjustments
	$workarea.find("h5").css({ 'font-size': '110%' });
	$workarea.find("h5:not(:first-child)").css({ 'margin-top': '1em' });
	$workarea.find("div").filter(":has(span.quickformDescription)").css({ 'margin-top': '0.4em' });

	// add a link to each template's description page
	$.each(Morebits.quickForm.getElements(e.target.form, "articleTags"), function(index, checkbox) {
		var $checkbox = $(checkbox);
		var link = Morebits.htmlNode("a", ">");
		link.setAttribute("class", "tag-template-link");
		link.setAttribute("href", mw.util.getUrl("Template:" +
			Morebits.string.toUpperCaseFirstChar(checkbox.values)));
		link.setAttribute("target", "_blank");
		$checkbox.parent().append(["\u00A0", link]);
	});
};


// Tags for ARTICLES start here

Twinkle.tag.article = {};

// A list of all article tags, in alphabetical order
// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.

Twinkle.tag.article.tags = {
	"advert": "artikel ini ditulis seperti iklan",
	"all plot": "artikel ini hampir semuanya berisi ringkasan alur",
	"autobiography": "artikel ini adalah otobiografi yang tidak ditulis secara netral",
	"BLP sources": "artikel tokoh yang masih hidup ini perlu referensi yang lebih banyak untuk diperiksa",
	"BLP unsourced": "artikel tokoh yang masih hidup ini tidak punya referensi",
	"citation style": "artikel ini kutipannya tidak jelas atau tak konsisten",
	"cleanup": "artikel ini memerlukan perapian",
	"cleanup-reorganize": "artikel ini memerlukan pengubahan struktur kalimat/paragraf agar sesuai dengan pedoman Wikipedia",
	"close paraphrasing": "artikel ini mengandung parafrasa yang mirip dengan sumber tidak bebas berhak cipta",
	"COI": "pembuat artikel ini memiliki konflik kepentingan",
	"condense": "artikel ini mungkin punya banyak kepala bagian yang membagi-bagi isinya",
	"confusing": "artikel ini tidak memiliki isi yang jelas (membingungkan)",
	"context": "konteks isi artikel ini tidak memadai",
	"copy edit": "artikel ini butuh perbaikan pada tata bahasa, gaya, relasi antarparagraf, dan/atau ejaan",
	"copypaste": "artikel ini terkesan disalin dari sebuah sumber",
	"dead end": "artikel ini tidak punya hubungan dengan artikel lain",
	"disputed": "akurasi aktual isi artikel ini dipertanyakan",
	"essay-like": "artikel ini ditulis seperti esai atau opini",
	"expand language": "artikel ini mungkin dapat dikembangkan dengan materi dari Wikipedia bahasa lain",
	"expert-subject": "artikel ini perlu dilihat oleh pengguna yang ahli di bidang ini",
	"external links": "pranala luar artikel ini tidak mengikuti pedoman dan kebijakan",
	"fansite": "artikel ini mirip dengan isi situs penggemar",
	"fiction": "isi artikel ini tidak dapat dibedakan antara nyata atau fiksi",
	"globalize": "isi artikel ini tidak mewakili sudut pandang umum subjek tersebut",
	"hoax": "artikel ini berisi informasi palsu",
	"improve categories": "artikel ini butuh kategori tambahan",
	"incomprehensible": "artikel ini sulit untuk dipahami atau tidak komprehensif",
	"in-universe": "subjek artikel ini fiksi dan butuh gaya penulisan dari sudut pandang nonfiksi",
	"in use": "artikel ini sedang dalam pengembangan dalam waktu dekat",
	"lead missing": "artikel ini tidak memiliki bagian pengantar dan perlu ditulis",
	"lead rewrite": "pengantar artikel ini tidak sesuai pedoman",
	"lead too long": "pengantar artikel ini sangat panjang dan harus dibuat lebih ringkas",
	"lead too short": "pengantar artikel ini sangat pendek dan harus dikembangkan",
	"linkrot": "sumber referensi artikel ini sudah mati, dan penulisannya harus diperbaiki",
	"manual": "gaya artikel ini mirip dengan buku pedoman",
	"merge": "artikel ini perlu digabungkan ke artikel lain",
	"merge from": "artikel lain harus digabungkan ke artikel ini",
	"merge to": "artikel ini harus digabungkan ke artikel lain",
	"more footnotes": "artikel ini sudah punya referensi, namun hanya punya sedikit catatan kaki",
	"new unreviewed article": "tandai artikel ini untuk diperiksa nanti",
	"news release": "gaya artikel ini mirip seperti berita",
	"no footnotes": "artikel ini punya referensi, namun tidak punya catatan kaki",
	"non-free": "artikel ini mungkin mengandung materi yang berhak cipta yang tidak digunakan sebagaimana mestinya",
	"notability": "subjek artikel ini tidak memenuhi kelayakan",
	"not English": "artikel ini tidak ditulis dalam bahasa Indonesia dan perlu diterjemahkan",
	"one source": "artikel ini hanya merujuk pada sebuah sumber saja",
	"original research": "artikel ini memiliki penggunaan riset asli klaim yang tidak terperiksa",
	"orphan": "artikel ini tidak memiliki hubungan dengan artikel lain",
	"overcoverage": "artikel ini mengandung anggapan atau cakupan tidak sesuai terhadap satu bagian atau lebih",
	"overlinked": "artikel ini banyak mengandung pranala duplikat dan/atau tidak berhubungan",
	"overly detailed": "artikel ini mengandung jumlah detail yang terlalu banyak",
	"peacock": "artikel ini mengandung istilah hiperbola yang mempromosikan subjek tanpa informasi lengkap",
	"plot": "ringkasan alur di artikel ini terlalu panjang",
	"POV": "sudut pandang penulisan artikel ini tidak netral",
	"primary sources": "artikel ini terlalu mengandalkan sumber primer, dan butuh sumber tambahan",
	"prose": "artikel ini mengandung isi yang lebih sesuai ditulis dalam bentuk prosa",
	"recentism": "artikel ini terlalu condong dengan peristiwa terkini",
	"refimprove": "artikel ini memerlukan sumber tambahan untuk diperiksa",
	"rough translation": "artikel ini sangat jelek penerjemahannya dan memerlukan perbaikan",
	"sections": "artikel ini perlu dibagi dalam subbagian",
	"self-published": "artikel ini mengandung sumber yang diterbitkan oleh diri sendiri",
	"technical": "artikel ini mengandung banyak istilah yang rumit",
	"tense": "artikel ini ditulis dalam gaya tidak sesuai",
	"third-party": "artikel ini terlalu mengandalkan sumber kedua, dan butuh sumber ketiga",
	"tone": "gaya penulisan artikel ini tak sesuai",
	"too few opinions": "artikel ini tidak mengandung keseluruhan sudut pandang yang penting",
	"tugas sekolah": "artikel ini sedang digunakan untuk penilaian di sekolah/universitas",
	"uncategorized": "artikel ini tidak ada kategori sama sekali",
	"under construction": "artikel ini sedang dalam tahap pengembangan",
	"underlinked": "artikel ini perlu lebih banyak pranala wiki",
	"unfocused": "artikel ini kurang memfokuskan subjek atau punya topik yang lebih dari satu",
	"unreferenced": "artikel ini tidak punya referensi sama sekali",
	"unreliable sources": "sumber artikel ini mungkin tidak dapat dipercaya",
	"update": "artikel ini memerlukan informasi yang lebih aktual",
	"very long": "artikel ini sangaaat panjang",
	"weasel": "kenetralan artikel ini diganggu oleh penggunaan kata bersayap"
};

// A list of tags in order of category
// Tags should be in alphabetical order within the categories
// Add new categories with discretion - the list is long enough as is!

Twinkle.tag.article.tagCategories = {
	"Tag rapikan dan pemeliharaan": {
		"Perapian secara umum": [
			"cleanup",  // has a subgroup with text input
			"copy edit"  // has a subgroup with text input
		],
		"Mengandung konten yang tidak diinginkan": [
			"close paraphrasing",
			"copypaste",  // has a subgroup with text input
			"external links",
			"non-free"
		],
		"Struktur, format, dan pengantar": [
			"cleanup-reorganize",
			"condense",
			"lead missing",
			"lead rewrite",
			"lead too long",
			"lead too short",
			"sections",
			"very long"
		],
		"Perapian terkait isi fiksi": [
			"all plot",
			"fiction",
			"in-universe",
			"plot"
		]
	},
	"Masalah konten secara umum": {
		"Kepentingan dan kelayakan": [
			"notability"  // has a subgroup with subcategories
		],
		"Gaya penulisan": [
			"advert",
			"essay-like",
			"fansite",
			"manual",
			"news release",
			"prose",
			"technical",
			"tense",
			"tone"
		],
		"Makna": [
			"confusing",
			"incomprehensible",
			"unfocused"
		],
		"Detail dan informasi": [
			"context",
			"expert-subject",
			"metricate",
			"overly detailed"
		],
		"Keaktualan": [
			"update"
		],
		"Netralitas, kecondongan dan akurasi faktual": [
			"autobiography",
			"COI",
			"disputed",
			"hoax",
			"globalize",  // has a subgroup with subcategories
			"overcoverage",
			"peacock",
			"POV",
			"recentism",
			"too few opinions",
			"weasel"
		],
		"Pemeriksaan dan sumber": [
			"BLP sources",
			"BLP unsourced",
			"one source",
			"original research",
			"primary sources",
			"refimprove",
			"self-published",
			"third-party",
			"unreferenced",
			"unreliable sources"
		]
	},
	"Masalah tertentu terkait konten artikel": {
		"Bahasa": [
			"not English",  // has a subgroup with several options
			"rough translation",  // has a subgroup with several options
			"expand language"
		],
		"Pranala dan tautan": [
			"dead end",
			"orphan",
			"overlinked",
			"underlinked"
		],
		"Teknik pemberian referensi": [
			"citation style",
			"linkrot",
			"more footnotes",
			"no footnotes"
		],
		"Kategori": [
			"improve categories",
			"uncategorized"
		]
	},
	"Penggabungan": [  // these three have a subgroup with several options
		"merge",
		"merge from",
		"merge to"
	],
	"Informasi halaman": [
		"in use",
		"new unreviewed article",
		"tugas sekolah",
		"under construction"
	]
};

// Tags for REDIRECTS start here

Twinkle.tag.spellingList = [
	{
		label: '{{R from initialism}}: dialihkan dari penyingkatan (contoh ANB) ke bentuk panjangnya',
		value: 'R from initialism'
	},
	{
		label: '{{R from acronym}}: dialihkan dari akronim (contoh POTUS) ke bentuk panjangnya',
		value: 'R from acronym'
	},
	{
		label: '{{R to list entry}}: mengalihkan ke artikel berbentuk \"entitas kecil\" yang mengandung pemerian ringkas subjek yang tidak cukup layak untuk dipisahkan artikelnya',
		value: 'R to list entry'
	},
	{
		label: '{{R to section}}: mirip dengan {{R to list entry}}, tetapi ketika daftar disusun dalam bagian seperti daftar karakter fiksi',
		value: 'R to section'
	},
	{
		label: '{{R from misspelling}}: pengalihan dari kesalahan ejaan atau tipografi',
		value: 'R from misspelling'
	},
	{
		label: '{{R from alternative spelling}}: pengalihan dari judul dengan ejaan berbeda',
		value: 'R from alternative spelling'
	},
	{
		label: '{{R from plural}}: pengalihan dari kata yang menunjukkan jumlah banyak ke padanan jumlah tunggalnya',
		value: 'R from plural'
	},
	{
		label: '{{R from related word}}: pengalihan dari kata yang berkaitan',
		value: 'R from related word'
	},
	{
		label: '{{R with possibilities}}: pengalihan dari judul yang spesifik ke judul yang lebih umum',
		value: 'R with possibilities'
	},
	{
		label: '{{R from member}}: pengalihan dari anggota kelompok ke topik terkait seperti kelompok, organisasi, atau tim yang ia terlibat di dalamnya',
		value: 'R from member'
	},
	{
		label: '{{R from other capitalisation}}: pengalihan dari judul dengan metode kapitalisasi lainnya',
		value: 'R from other capitalisation'
	}
];

Twinkle.tag.alternativeList = [
	{
		label: '{{R from alternative name}}: pengalihan dari judul dari suatu judul lain, nama lain, atau sinonim',
		value: 'R from alternative name'
	},
	{
		label: '{{R from long name}}: pengalihan dari sebuah judul yang lebih lengkap',
		value: 'R from long name'
	},
	{
		label: '{{R from surname}}: pengalihan dari sebuah judul yang merupakan nama belakang',
		value: 'R from surname'
	},
	{
		label: '{{R from historic name}}: pengalihan dari nama lain dengan sejarah yang penting mengenai sebuah wilayah, provinsi, kota, atau lainnya, yang saat ini tidak lagi dikenal dengan nama tersebut',
		value: 'R from historic name'
	},
	{
		label: '{{R from phrase}}: pengalihan dari sebuah frasa ke artikel yang lebih umum yang mencakup semua topik',
		value: 'R from phrase'
	},
	{
		label: '{{R from scientific name}}: pengalihan dari nama ilmiah ke nama yang umum',
		value: 'R from scientific name'
	},
	{
		label: '{{R to scientific name}}: pengalihan dari nama yang umum ke nama ilmiah',
		value: 'R to scientific name'
	},
	{
		label: '{{R from name and country}}: pengalihan dari nama khusus ke nama yang lebih ringkas',
		value: 'R from name and country'
	},
	{
		label: '{{R from alternative language}}: pengalihan dari nama bahasa Inggris ke nama dalam bahasa lain, atau sebaliknya',
		value: 'R from alternative language'
	},
	{
		label: '{{R from ASCII}}: pengalihan dari sebuah judul dalam ASCII dasar ke judul artikel yang formal, dengan perbedaan yang bukan berupa tanda diakritik',
		value: 'R from ASCII'
	},
	{
		label: '{{R to diacritics}}: pengalihan ke judul dengan disertai tanda diakritik',
		value: 'R to diacritics'
	}
];

Twinkle.tag.administrativeList = [
	{
		label: '{{R from merge}}: pengalihan dari halaman yang digabung untuk menyimpan sejarah suntingannya',
		value: 'R from merge'
	},
	{
		label: '{{R to disambiguation page}}: pengalihan ke halaman disambiguasi',
		value: 'R to disambiguation page'
	},
	{
		label: '{{R from duplicated article}}: pengalihan ke artikel serupa untuk menyimpan sejarah suntingannya',
		value: 'R from duplicated article'
	},
	{
		label: '{{R to decade}}: pengalihan dari suatu tahun ke artikel dekade',
		value: 'R to decade'
	},
	{
		label: '{{R from shortcut}}: pengalihan dari pintasan Wikipedia',
		value: 'R from shortcut'
	},
	{
		label: '{{R from CamelCase}}: pengalihan dari judul CamelCase',
		value: 'R from CamelCase'
	},
	{
		label: '{{R from EXIF}}: pengalihan pranala wiki yang dibuat dari informasi EXIF JPEG',
		value: 'R from EXIF'
	},
	{
		label: '{{R from school}}: pengalihan dari artikel sekolah yang mengandung sedikit informasi',
		value: 'R from school'
	}
];

// maintenance tags for FILES start here

Twinkle.tag.file = {};

Twinkle.tag.file.licenseList = [
	{ label: '{{Bsr}}: source info consists of bare image URL/generic base URL only', value: 'Bsr' },
	{ label: '{{Non-free reduce}}: non-low-resolution fair use image (or too-long audio clip, etc)', value: 'Non-free reduce' },
	{ label: '{{Orphaned non-free revisions}}: fair use media with old revisions that need to be deleted', value: 'subst:orfurrev' }
];

Twinkle.tag.file.commonsList = [
	{ label: '{{Copy to Commons}}: free media that should be copied to Commons', value: 'Copy to Commons' },
	{ label: '{{Do not move to Commons}} (PD issue): file is PD in the US but not in country of origin', value: 'Do not move to Commons' },
	{ label: '{{Do not move to Commons}} (other reason)', value: 'Do not move to Commons_reason' },
	{ label: '{{Keep local}}: request to keep local copy of a Commons file', value: 'Keep local' },
	{ label: '{{Now Commons}}: file has been copied to Commons', value: 'subst:ncd' }
];

Twinkle.tag.file.cleanupList = [
	{ label: '{{Artifacts}}: PNG contains residual compression artifacts', value: 'Artifacts' },
	{ label: '{{Bad font}}: SVG uses fonts not available on the thumbnail server', value: 'Bad font' },
	{ label: '{{Bad format}}: PDF/DOC/... file should be converted to a more useful format', value: 'Bad format' },
	{ label: '{{Bad GIF}}: GIF that should be PNG, JPEG, or SVG', value: 'Bad GIF' },
	{ label: '{{Bad JPEG}}: JPEG that should be PNG or SVG', value: 'Bad JPEG' },
	{ label: '{{Bad trace}}: auto-traced SVG requiring cleanup', value: 'Bad trace' },
	{ label: '{{Cleanup image}}: general cleanup', value: 'Cleanup image' },
	{ label: '{{Cleanup SVG}}: SVG needing code and/or appearance cleanup', value: 'Cleanup SVG' },
	{ label: '{{ClearType}}: image (not screenshot) with ClearType anti-aliasing', value: 'ClearType' },
	{ label: '{{Imagewatermark}}: image contains visible or invisible watermarking', value: 'Imagewatermark' },
	{ label: '{{NoCoins}}: image using coins to indicate scale', value: 'NoCoins' },
	{ label: '{{Overcompressed JPEG}}: JPEG with high levels of artifacts', value: 'Overcompressed JPEG' },
	{ label: '{{Opaque}}: opaque background should be transparent', value: 'Opaque' },
	{ label: '{{Remove border}}: unneeded border, white space, etc.', value: 'Remove border' },
	{ label: '{{Rename media}}: file should be renamed according to the criteria at [[WP:FMV]]', value: 'Rename media' },
	{ label: '{{Should be PNG}}: GIF or JPEG should be lossless', value: 'Should be PNG' },
	{
		label: '{{Should be SVG}}: PNG, GIF or JPEG should be vector graphics', value: 'Should be SVG',
		subgroup: {
			name: 'svgCategory',
			type: 'select',
			list: [
				{ label: '{{Should be SVG|other}}', value: 'other' },
				{ label: '{{Should be SVG|alphabet}}: character images, font examples, etc.', value: 'alphabet' },
				{ label: '{{Should be SVG|chemical}}: chemical diagrams, etc.', value: 'chemical' },
				{ label: '{{Should be SVG|circuit}}: electronic circuit diagrams, etc.', value: 'circuit' },
				{ label: '{{Should be SVG|coat of arms}}: coats of arms', value: 'coat of arms' },
				{ label: '{{Should be SVG|diagram}}: diagrams that do not fit any other subcategory', value: 'diagram' },
				{ label: '{{Should be SVG|emblem}}: emblems, free/libre logos, insignias, etc.', value: 'emblem' },
				{ label: '{{Should be SVG|fair use}}: fair-use images, fair-use logos', value: 'fair use' },
				{ label: '{{Should be SVG|flag}}: flags', value: 'flag' },
				{ label: '{{Should be SVG|graph}}: visual plots of data', value: 'graph' },
				{ label: '{{Should be SVG|logo}}: logos', value: 'logo' },
				{ label: '{{Should be SVG|map}}: maps', value: 'map' },
				{ label: '{{Should be SVG|music}}: musical scales, notes, etc.', value: 'music' },
				{ label: '{{Should be SVG|physical}}: "realistic" images of physical objects, people, etc.', value: 'physical' },
				{ label: '{{Should be SVG|symbol}}: miscellaneous symbols, icons, etc.', value: 'symbol' }
			]
		}
	},
	{ label: '{{Should be text}}: image should be represented as text, tables, or math markup', value: 'Should be text' },
	{ label: '{{Split media}}: there are two different images in the upload log which need to be split', value: 'Split media' }
];

Twinkle.tag.file.qualityList = [
	{ label: '{{Image-blownout}}', value: 'Image-blownout' },
	{ label: '{{Image-out-of-focus}}', value: 'Image-out-of-focus' },
	{ label: '{{Image-Poor-Quality}}', value: 'Image-Poor-Quality' },
	{ label: '{{Image-underexposure}}', value: 'Image-underexposure' },
	{ label: '{{Low quality chem}}: disputed chemical structures', value: 'Low quality chem' }
];

Twinkle.tag.file.replacementList = [
	{ label: '{{Duplicate}}: exact duplicate of another file, but not yet orphaned', value: 'Duplicate' },
	{ label: '{{Obsolete}}: improved version available', value: 'Obsolete' },
	{ label: '{{PNG version available}}', value: 'PNG version available' },
	{ label: '{{Vector version available}}', value: 'Vector version available' }
];


// Contains those article tags that *do not* work inside {{multiple issues}}.
Twinkle.tag.multipleIssuesExceptions = [
	'copypaste',
	'expand language',
	'GOCEinuse',
	'improve categories',
	'in use',
	'merge',
	'merge from',
	'merge to',
	'new unreviewed article',
	'not English',
	'rough translation',
	'uncategorized',
	'under construction'
];


Twinkle.tag.callbacks = {
	main: function( pageobj ) {
		var params = pageobj.getCallbackParameters(),
		    tagRe, tagText = '', summaryText = 'Added',
		    tags = [], groupableTags = [], i, totalTags;

		// Remove tags that become superfluous with this action
		var pageText = pageobj.getPageText().replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");

		var addTag = function friendlytagAddTag( tagIndex, tagName ) {
			var currentTag = "";
			if( tagName === 'uncategorized' || tagName === 'improve categories' ) {
				pageText += '\n\n{{' + tagName +
					'|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}';
			} else {
				if( tagName === 'globalize' ) {
					currentTag += '{{' + params.tagParameters.globalize;
				} else {
					currentTag += ( Twinkle.tag.mode === 'redirect' ? '\n' : '' ) + '{{' + tagName;
				}

				if( tagName === 'notability' && params.tagParameters.notability !== 'none' ) {
					currentTag += '|' + params.tagParameters.notability;
				}

				// prompt for other parameters, based on the tag
				switch( tagName ) {
					case 'cleanup':
						if (params.tagParameters.cleanup) {
							currentTag += '|reason=' + params.tagParameters.cleanup;
						}
						break;
					case 'copy edit':
						if (params.tagParameters.copyEdit) {
							currentTag += '|for=' + params.tagParameters.copyEdit;
						}
						break;
					case 'copypaste':
						if (params.tagParameters.copypaste) {
							currentTag += '|url=' + params.tagParameters.copypaste;
						}
						break;
					case 'expand language':
						currentTag += '|topic=';
						var langcode = prompt('Please enter the language code of the other wiki (e.g. "fr", "roa-rup").  \n' +
							"This information is required.  To skip the {{expand language}} tag, click Cancel.", "");
						if (langcode === null || langcode === "") {
							Morebits.status.warn("Notice", "{{expand language}} tag skipped by user");
							return true;  // continue to next tag
						} else {
							currentTag += '|langcode=' + langcode;
						}
						var otherart = prompt('Please enter the name of the article in the other wiki (without interwiki prefix).  \n' +
							"This information is optional.  To skip the {{expand language}} tag, click Cancel.", "");
						if (otherart === null) {
							Morebits.status.warn("Notice", "{{expand language}} tag skipped by user");
							return true;  // continue to next tag
						} else {
							currentTag += '|otherarticle=' + otherart;
						}
						break;
					case 'expert-subject':
						if (params.tagParameters.expertSubject) {
							currentTag += '|1=' + params.tagParameters.expertSubject;
						}
						break;
					case 'news release':
						currentTag += '|1=article';
						break;
					case 'not English':
					case 'rough translation':
						if (params.translationLanguage) {
							currentTag += '|1=' + params.translationLanguage;
						}
						if (params.translationPostAtPNT) {
							currentTag += '|listed=yes';
						}
						break;
					case 'merge':
					case 'merge to':
					case 'merge from':
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(params.mergeTarget.replace(/_/g, ' '));

							currentTag += '|' + params.mergeTarget;

							// link to the correct section on the talk page, for article space only
							if (mw.config.get('wgNamespaceNumber') === 0 && (params.mergeReason || params.discussArticle)) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle = (tagName === "merge to" ? params.mergeTarget : mw.config.get('wgTitle'));
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle = (tagName === "merge to" ? mw.config.get('wgTitle') : params.mergeTarget);
									params.talkDiscussionTitle = 'Proposed merge with ' + params.nonDiscussArticle;
								}
								currentTag += '|discuss=Talk:' + params.discussArticle + '#' + params.talkDiscussionTitle;
							}
						}
						break;
					default:
						break;
				}

				currentTag += (Twinkle.tag.mode === 'redirect') ? '}}' : '|date={{subst:CURRENTMONTHNAME}} {{subst:CURRENTYEAR}}}}\n';
				tagText += currentTag;
			}

			if ( tagIndex > 0 ) {
				if( tagIndex === (totalTags - 1) ) {
					summaryText += ' and';
				} else if ( tagIndex < (totalTags - 1) ) {
					summaryText += ',';
				}
			}

			summaryText += ' {{[[';
			if( tagName === 'globalize' ) {
				summaryText += "Template:" + params.tagParameters.globalize + '|' + params.tagParameters.globalize;
			} else {
				summaryText += (tagName.indexOf(":") !== -1 ? tagName : ("Template:" + tagName + "|" + tagName));
			}
			summaryText += ']]}}';
		};

		if( Twinkle.tag.mode !== 'redirect' ) {
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\})|\\|\\s*' + params.tags[i] + '\\s*=[a-z ]+\\d+)', 'im' );
				if( !tagRe.exec( pageText ) ) {
					if( Twinkle.tag.multipleIssuesExceptions.indexOf(params.tags[i]) === -1 ) {
						groupableTags = groupableTags.concat( params.tags[i] );
					} else {
						tags = tags.concat( params.tags[i] );
					}
				} else {
					Morebits.status.warn( 'Info', 'Found {{' + params.tags[i] +
						'}} on the article already...excluding' );
					// don't do anything else with merge tags
					if (params.tags[i] === "merge" || params.tags[i] === "merge from" ||
						params.tags[i] === "merge to") {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = false;
					}
				}
			}

			var miTest = /\{\{(multiple ?issues|article ?issues|mi)[^}]+\{/im.exec(pageText);
			var miOldStyleRegex = /\{\{(multiple ?issues|article ?issues|mi)\s*\|([^{]+)\}\}/im;
			var miOldStyleTest = miOldStyleRegex.exec(pageText);

			if( ( miTest || miOldStyleTest ) && groupableTags.length > 0 ) {
				Morebits.status.info( 'Info', 'Adding supported tags inside existing {{multiple issues}} tag' );

				groupableTags.sort();
				tagText = "";

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tag' + ( groupableTags.length > 1 ? 's' : '' ) + ' (within {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', and';
				}

				if( miOldStyleTest ) {
					// convert tags from old-style to new-style
					var split = miOldStyleTest[2].split("|");
					$.each(split, function(index, val) {
						split[index] = val.replace("=", "|date=").trim();
					});
					pageText = pageText.replace(miOldStyleRegex, "{{$1|\n{{" + split.join("}}\n{{") + "}}\n" + tagText + "}}\n");
				} else {
					var miRegex = new RegExp("(\\{\\{\\s*" + miTest[1] + "\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*", "im");
					pageText = pageText.replace(miRegex, "$1" + tagText + "}}\n");
				}
				tagText = "";
			} else if( params.group && groupableTags.length >= 3 ) {
				Morebits.status.info( 'Info', 'Grouping supported tags inside {{multiple issues}}' );

				groupableTags.sort();
				tagText += '{{multiple issues|\n';

				totalTags = groupableTags.length;
				$.each(groupableTags, addTag);

				summaryText += ' tags (within {{[[Template:multiple issues|multiple issues]]}})';
				if( tags.length > 0 ) {
					summaryText += ', and';
				}
				tagText += '}}\n';
			} else {
				tags = tags.concat( groupableTags );
			}
		} else {
			// Redirect tagging: Check for pre-existing tags
			for( i = 0; i < params.tags.length; i++ ) {
				tagRe = new RegExp( '(\\{\\{' + params.tags[i] + '(\\||\\}\\}))', 'im' );
				if( !tagRe.exec( pageText ) ) {
					tags = tags.concat( params.tags[i] );
				} else {
					Morebits.status.warn( 'Info', 'Found {{' + params.tags[i] +
						'}} on the redirect already...excluding' );
				}
			}
		}

		tags.sort();
		totalTags = tags.length;
		$.each(tags, addTag);

		if( Twinkle.tag.mode === 'redirect' ) {
			pageText += tagText;
		} else {
			// smartly insert the new tags after any hatnotes. Regex is a bit more
			// complicated than it'd need to be, to allow templates as parameters,
			// and to handle whitespace properly.
			pageText = pageText.replace(/^\s*(?:((?:\s*\{\{\s*(?:about|correct title|dablink|distinguish|for|other\s?(?:hurricaneuses|people|persons|places|uses(?:of)?)|redirect(?:-acronym)?|see\s?(?:also|wiktionary)|selfref|the)\d*\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\})+(?:\s*\n)?)\s*)?/i,
				"$1" + tagText);
		}
		summaryText += ( tags.length > 0 ? ' tag' + ( tags.length > 1 ? 's' : '' ) : '' ) +
			' to ' + Twinkle.tag.mode;

		// avoid truncated summaries
		if (summaryText.length > (254 - Twinkle.getPref('summaryAd').length)) {
			summaryText = summaryText.replace(/\[\[[^\|]+\|([^\]]+)\]\]/g, "$1");
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save(function() {
			// special functions for merge tags
			if (params.mergeReason) {
				// post the rationale on the talk page (only operates in main namespace)
				var talkpageText = "\n\n== Proposed merge with [[" + params.nonDiscussArticle + "]] ==\n\n";
				talkpageText += params.mergeReason.trim() + " ~~~~";

				var talkpage = new Morebits.wiki.page("Talk:" + params.discussArticle, "Posting rationale on talk page");
				talkpage.setAppendText(talkpageText);
				talkpage.setEditSummary('Proposing to merge [[' + params.nonDiscussArticle + ']] ' +
					(tags.indexOf("merge") !== -1 ? 'with' : 'into') + ' [[' + params.discussArticle + ']]' +
					Twinkle.getPref('summaryAd'));
				talkpage.setWatchlist(Twinkle.getFriendlyPref('watchMergeDiscussions'));
				talkpage.setCreateOption('recreate');
				talkpage.append();
			}
			if (params.mergeTagOther) {
				// tag the target page if requested
				var otherTagName = "merge";
				if (tags.indexOf("merge from") !== -1) {
					otherTagName = "merge to";
				} else if (tags.indexOf("merge to") !== -1) {
					otherTagName = "merge from";
				}
				var newParams = {
					tags: [otherTagName],
					mergeTarget: Morebits.pageNameNorm,
					discussArticle: params.discussArticle,
					talkDiscussionTitle: params.talkDiscussionTitle
				};
				var otherpage = new Morebits.wiki.page(params.mergeTarget, "Tagging other page (" +
					params.mergeTarget + ")");
				otherpage.setCallbackParameters(newParams);
				otherpage.load(Twinkle.tag.callbacks.main);
			}

			// post at WP:PNT for {{not English}} and {{rough translation}} tag
			if (params.translationPostAtPNT) {
				var pntPage = new Morebits.wiki.page('Wikipedia:Pages needing translation into English',
					"Listing article at Wikipedia:Pages needing translation into English");
				pntPage.setFollowRedirect(true);
				pntPage.setCallbackParameters({
					template: params.tags.indexOf("rough translation") !== -1 ? "duflu" : "needtrans",
					lang: params.translationLanguage,
					reason: params.translationComments
				});
				pntPage.load(Twinkle.tag.callbacks.translationListPage);
			}
			if (params.translationNotify) {
				pageobj.lookupCreator(function(innerPageobj) {
					var initialContrib = innerPageobj.getCreator();

					// Disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						innerPageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
						return;
					}

					var userTalkPage = new Morebits.wiki.page('User talk:' + initialContrib,
						'Notifying initial contributor (' + initialContrib + ')');
					var notifytext = "\n\n== Your article [[" + Morebits.pageNameNorm + "]]==\n" +
						"{{subst:uw-notenglish|1=" + Morebits.pageNameNorm +
						(params.translationPostAtPNT ? "" : "|nopnt=yes") + "}} ~~~~";
					userTalkPage.setAppendText(notifytext);
					userTalkPage.setEditSummary("Notice: Please use English when contributing to the English Wikipedia." +
						Twinkle.getPref('summaryAd'));
					userTalkPage.setCreateOption('recreate');
					userTalkPage.setFollowRedirect(true);
					userTalkPage.append();
				});
			}
		});

		if( params.patrol ) {
			pageobj.patrol();
		}
	},

	translationListPage: function friendlytagCallbacksTranslationListPage(pageobj) {
		var old_text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var statelem = pageobj.getStatusElement();

		var templateText = "{{subst:" + params.template + "|pg=" + Morebits.pageNameNorm + "|Language=" +
			(params.lang || "uncertain") + "|Comments=" + params.reason.trim() + "}} ~~~~";

		var text, summary;
		if (params.template === "duflu") {
			text = old_text + "\n\n" + templateText;
			summary = "Translation cleanup requested on ";
		} else {
			text = old_text.replace(/\n+(==\s?Translated pages that could still use some cleanup\s?==)/,
				"\n\n" + templateText + "\n\n$1");
			summary = "Translation" + (params.lang ? (" from " + params.lang) : "") + " requested on ";
		}

		if (text === old_text) {
			statelem.error('failed to find target spot for the discussion');
			return;
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary(summary + " [[" + Morebits.pageNameNorm + "]]" + Twinkle.getPref('summaryAd'));
		pageobj.setCreateOption('recreate');
		pageobj.save();
	},

	file: function friendlytagCallbacksFile(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var summary = "Adding ";

		// Add maintenance tags
		if (params.tags.length) {

			var tagtext = "", currentTag;
			$.each(params.tags, function(k, tag) {
				// when other commons-related tags are placed, remove "move to Commons" tag
				if (["Keep local", "subst:ncd", "Do not move to Commons_reason", "Do not move to Commons",
					"Now Commons"].indexOf(tag) !== -1) {
					text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");
				}
				if (tag === "Vector version available") {
					text = text.replace(/\{\{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*\}\}/gi, "");
				}

				currentTag = "{{" + (tag === "Do not move to Commons_reason" ? "Do not move to Commons" : tag);

				var input;
				switch (tag) {
					case "subst:ncd":
						/* falls through */
					case "Keep local":
						input = prompt( "{{" + (tag === "subst:ncd" ? "Now Commons" : tag) +
							"}} - Enter the name of the image on Commons (if different from local name), excluding the File: prefix:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += '|1=' + input;
						}
						break;
					case "Rename media":
						input = prompt( "{{Rename media}} - Enter the new name for the image (optional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						input = prompt( "{{Rename media}} - Enter the reason for the rename (optional):", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|2=" + input;
						}
						break;
					case "Cleanup image":
						/* falls through */
					case "Cleanup SVG":
						input = prompt( "{{" + tag + "}} - Enter the reason for cleanup (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Image-Poor-Quality":
						input = prompt( "{{Image-Poor-Quality}} - Enter the reason why this image is so bad (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Low quality chem":
						input = prompt( "{{Low quality chem}} - Enter the reason why the diagram is disputed (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "PNG version available":
						/* falls through */
					case "Vector version available":
						/* falls through */
					case "Obsolete":
						/* falls through */
					case "Duplicate":
						input = prompt( "{{" + tag + "}} - Enter the name of the file which replaces this one (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|1=" + input;
						}
						break;
					case "Do not move to Commons_reason":
						input = prompt( "{{Do not move to Commons}} - Enter the reason why this image should not be moved to Commons (required). To skip the tag, click Cancel:", "" );
						if (input === null) {
							return true;  // continue
						} else if (input !== "") {
							currentTag += "|reason=" + input;
						}
						break;
					case "subst:orfurrev":
						//remove {{non-free reduce}} and redirects
						text = text.replace(/\{\{\s*(Template\s*:\s*)?(Non-free reduce|FairUseReduce|Fairusereduce|Fair Use Reduce|Fair use reduce|Reduce size|Reduce|Fair-use reduce|Image-toobig|Comic-ovrsize-img|Non-free-reduce|Nfr|Smaller image|Nonfree reduce)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
						currentTag += "|date={{subst:date}}";
						break;
					case "Copy to Commons":
						currentTag += "|human=" + mw.config.get("wgUserName");
						break;
					default:
						break;  // don't care
				}

				if (tag === "Should be SVG") {
					currentTag += "|" + params.svgSubcategory;
				}

				currentTag += "}}\n";

				tagtext += currentTag;
				summary += "{{" + tag + "}}, ";

				return true;  // continue
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn("User canceled operation; nothing to do");
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 2) + Twinkle.getPref('summaryAd'));
		pageobj.setWatchlist(Twinkle.getFriendlyPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getFriendlyPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if( params.patrol ) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = function friendlytagCallbackEvaluate(e) {
	var form = e.target;
	var params = {};
	if (form.patrolPage) {
		params.patrol = form.patrolPage.checked;
	}

	switch (Twinkle.tag.mode) {
		case 'article':
			params.tags = form.getChecked( 'articleTags' );
			params.group = form.group.checked;
			params.tagParameters = {
				cleanup: form["articleTags.cleanup"] ? form["articleTags.cleanup"].value : null,
				copyEdit: form["articleTags.copyEdit"] ? form["articleTags.copyEdit"].value : null,
				copypaste: form["articleTags.copypaste"] ? form["articleTags.copypaste"].value : null,
				expertSubject: form["articleTags.expertSubject"] ? form["articleTags.expertSubject"].value : null,
				globalize: form["articleTags.globalize"] ? form["articleTags.globalize"].value : null,
				notability: form["articleTags.notability"] ? form["articleTags.notability"].value : null
			};
			// common to {{merge}}, {{merge from}}, {{merge to}}
			params.mergeTarget = form["articleTags.mergeTarget"] ? form["articleTags.mergeTarget"].value : null;
			params.mergeReason = form["articleTags.mergeReason"] ? form["articleTags.mergeReason"].value : null;
			params.mergeTagOther = form["articleTags.mergeTagOther"] ? form["articleTags.mergeTagOther"].checked : false;
			// common to {{not English}}, {{rough translation}}
			params.translationLanguage = form["articleTags.translationLanguage"] ? form["articleTags.translationLanguage"].value : null;
			params.translationNotify = form["articleTags.translationNotify"] ? form["articleTags.translationNotify"].checked : null;
			params.translationPostAtPNT = form["articleTags.translationPostAtPNT"] ? form["articleTags.translationPostAtPNT"].checked : null;
			params.translationComments = form["articleTags.translationComments"] ? form["articleTags.translationComments"].value : null;
			break;
		case 'file':
			params.svgSubcategory = form["imageTags.svgCategory"] ? form["imageTags.svgCategory"].value : null;
			params.tags = form.getChecked( 'imageTags' );
			break;
		case 'redirect':
			params.tags = form.getChecked( 'redirectTags' );
			break;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}

	// form validation
	if( !params.tags.length ) {
		alert( 'You must select at least one tag!' );
		return;
	}
	if( ((params.tags.indexOf("merge") !== -1) + (params.tags.indexOf("merge from") !== -1) +
		(params.tags.indexOf("merge to") !== -1)) > 1 ) {
		alert( 'Please select only one of {{merge}}, {{merge from}}, and {{merge to}}. If several merges are required, use {{merge}} and separate the article names with pipes (although in this case Twinkle cannot tag the other articles automatically).' );
		return;
	}
	if( (params.tags.indexOf("not English") !== -1) && (params.tags.indexOf("rough translation") !== -1) ) {
		alert( 'Please select only one of {{not English}} and {{rough translation}}.' );
		return;
	}
	if( (params.mergeTagOther || params.mergeReason) && params.mergeTarget.indexOf('|') !== -1 ) {
		alert( 'Tagging multiple articles in a merge, and starting a discussion for multiple articles, is not supported at the moment. Please turn off "tag other article", and/or clear out the "reason" box, and try again.' );
		return;
	}
	if( params.tags.indexOf('cleanup') !== -1 && params.tagParameters.cleanup.trim && params.tagParameters.cleanup.trim() === "") {
		alert( 'You must specify a reason for the {{cleanup}} tag.' );
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( form );

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = "Tagging complete, reloading article in a few seconds";
	if (Twinkle.tag.mode === 'redirect') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	var wikipedia_page = new Morebits.wiki.page(Morebits.pageNameNorm, "Tagging " + Twinkle.tag.mode);
	wikipedia_page.setCallbackParameters(params);
	switch (Twinkle.tag.mode) {
		case 'article':
			/* falls through */
		case 'redirect':
			wikipedia_page.load(Twinkle.tag.callbacks.main);
			return;
		case 'file':
			wikipedia_page.load(Twinkle.tag.callbacks.file);
			return;
		default:
			alert("Twinkle.tag: unknown mode " + Twinkle.tag.mode);
			break;
	}
};
})(jQuery);


//</nowiki>
