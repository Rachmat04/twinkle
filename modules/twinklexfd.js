//<nowiki>


(function($){


/*
 ****************************************
 *** twinklexfd.js: XFD module
 ****************************************
 * Mode of invocation:     Tab ("XFD")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.xfd = function twinklexfd() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
	// * file pages without actual files (these are eligible for CSD G8)
	if ( mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && (document.getElementById('mw-sharedupload') || (!document.getElementById('mw-imagepage-section-filehistory') && !Morebits.wiki.isPageRedirect()))) ) {
		return;
	}
	Twinkle.addPortletLink( Twinkle.xfd.callback, "XFD", "tw-xfd", "Usulkan penghapusan" );
};

Twinkle.xfd.num2order = function twinklexfdNum2order( num ) {
	switch( num ) {
	case 1: return '';
	case 2: return '2nd';
	case 3: return '3rd';
	default: return num + 'th';
	}
};

Twinkle.xfd.currentRationale = null;

// error callback on Morebits.status.object
Twinkle.xfd.printRationale = function twinklexfdPrintRationale() {
	if (Twinkle.xfd.currentRationale) {
		Morebits.status.printUserText(Twinkle.xfd.currentRationale, "Alasan penghapusan Anda disediakan di bawah ini, di mana Anda dapat menyalin-tempel ke kotak dialog Usulan Penghapusan jika Anda ingin mengulanginya:");
		// only need to print the rationale once
		Twinkle.xfd.currentRationale = null;
	}
};

Twinkle.xfd.callback = function twinklexfdCallback() {
	var Window = new Morebits.simpleWindow( 600, 350 );
	Window.setTitle( "Usulkan untuk penghapusan (UP)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Mengenai diskusi penghapusan", "WP:UP" );
	Window.addFooterLink( "Bantuan Twinkle", "WP:TW/DOC#up" );

	var form = new Morebits.quickForm( Twinkle.xfd.callback.evaluate );
	var categories = form.append( {
			type: 'select',
			name: 'category',
			label: 'Tempat diskusi penghapusan:',
			tooltip: 'Ketika diaktifkan, pilihan baku akan dibuat, berdasarkan ruangnama Anda berapa. Pengaturan baku ini seharusnya paling cocok',
			event: Twinkle.xfd.callback.change_category
		} );
	categories.append( {
			type: 'option',
			label: 'Artikel untuk dihapus',
			selected: mw.config.get('wgNamespaceNumber') === 0,  // Main namespace
			value: 'afd'
		} );
	categories.append( {
			type: 'option',
			label: 'Templat untuk dihapus',
			selected: mw.config.get('wgNamespaceNumber') === 10,  // Template namespace
			value: 'tfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Berkas untuk dihapus/Berkas yang diduga tidak bebas',
			selected: mw.config.get('wgNamespaceNumber') === 6,  // File namespace
			value: 'ffd'
		} );
	categories.append( {
			type: 'option',
			label: 'Kategori untuk dihapus',
			selected: mw.config.get('wgNamespaceNumber') === 14,  // Category namespace
			value: 'cfd'
		} );
	categories.append( {
			type: 'option',
			label: 'CfD/S (Categories for speedy renaming)',
			value: 'cfds'
		} );
	categories.append( {
			type: 'option',
			label: 'MfD (Miscellany for deletion)',
			selected: [ 0, 6, 10, 14 ].indexOf( mw.config.get('wgNamespaceNumber') ) === -1,
			value: 'mfd'
		} );
	categories.append( {
			type: 'option',
			label: 'Pengalihan untuk dihapus',
			selected: Morebits.wiki.isPageRedirect(),
			value: 'rfd'
		} );
	form.append( {
			type: 'checkbox',
			list: [
				{
					label: 'Beritahukan kepada pembuat jika memungkinkan',
					value: 'notify',
					name: 'notify',
					tooltip: "Sebuah templat notifikasi akan diletakkan di halaman pembicaraannya jika opsi ini dipilih.",
					checked: true
				}
			]
		}
	);
	form.append( {
			type: 'field',
			label:'Area kerja',
			name: 'work_area'
		} );

	var previewlink = document.createElement( 'a' );
	$(previewlink).click(function(){
		Twinkle.xfd.callbacks.preview(result);  // |result| is defined below
	});
	previewlink.style.cursor = "pointer";
	previewlink.textContent = 'Pratayang';
	form.append( { type: 'div', id: 'xfdpreview', label: [ previewlink ] } );
	form.append( { type: 'div', id: 'twinklexfd-previewbox', style: 'display: none' } );

	form.append( { type:'submit' } );

	var result = form.render();
	Window.setContent( result );
	Window.display();
	result.previewer = new Morebits.wiki.preview($(result).find('div#twinklexfd-previewbox').last()[0]);

	// We must init the controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.category.dispatchEvent( evt );
};

Twinkle.xfd.previousNotify = true;

Twinkle.xfd.callback.change_category = function twinklexfdCallbackChangeCategory(e) {
	var value = e.target.value;
	var form = e.target.form;
	var old_area = Morebits.quickForm.getElements(e.target.form, "work_area")[0];
	var work_area = null;

	var oldreasontextbox = form.getElementsByTagName('textarea')[0];
	var oldreason = (oldreasontextbox ? oldreasontextbox.value : '');

	var appendReasonBox = function twinklexfdAppendReasonBox() {
		work_area.append( {
			type: 'textarea',
			name: 'xfdreason',
			label: 'Alasan: ',
			value: oldreason,
			tooltip: 'Anda dapat menggunakan kode wiki dalam menulis alasan. Twinkle secara otomatis akan memberikan tanda tangan Anda.'
		} );
		// TODO possible future "preview" link here
	};

	form.previewer.closePreview();

	switch( value ) {
	case 'afd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Artikel untuk dihapus',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Sembunyikan tag penghapusan dengan <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Akan menyembunyikan tag hapus dalam tag &lt;noinclude&gt;, sehingga ia tidak akan ditransklusi. Opsi ini umumnya tidak diperlukan.'
						}
					]
		} );
		var afd_category = work_area.append( {
				type:'select',
				name:'xfdcat',
				label:'Pilih kategori di mana nominasi ini termasuk:'
			} );

		afd_category.append( { type:'option', label:'Tak dikenal', value:'?', selected:true } );
		afd_category.append( { type:'option', label:'Media dan musik', value:'M' } );
		afd_category.append( { type:'option', label:'Organisasi, perusahaan, atau produk', value:'O' } );
		afd_category.append( { type:'option', label:'Biogradi', value:'B' } );
		afd_category.append( { type:'option', label:'Topik sosial', value:'S' } );
		afd_category.append( { type:'option', label:'Situs web atau internet', value:'W' } );
		afd_category.append( { type:'option', label:'Permainan atau olahraga', value:'G' } );
		afd_category.append( { type:'option', label:'Teknologi dan ilmu sains', value:'T' } );
		afd_category.append( { type:'option', label:'Fiksi dan seni', value:'F' } );
		afd_category.append( { type:'option', label:'Lokasi dan transportasi', value:'P' } );
		afd_category.append( { type:'option', label:'Topik lain-lain', value:'I' } );
		afd_category.append( { type:'option', label:'Topik yang belum disortir', value:'U' } );

		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'tfd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Templat untuk didiskusikan',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'div',
				label: 'Jenis rintisan dan kotak pengguna tidak sesuai dengan usulan ini. Templat rintisan termasuk ke dalam TuD, dan kotak pengguna masuk ke dalam MuD.'
			} );
		var tfd_category = work_area.append( {
				type: 'select',
				label: 'Pilihlah jenis tindakan yang diinginkan: ',
				name: 'xfdcat',
				event: function(e) {
					var target = e.target;
					// add/remove extra input box
					if( target.value === 'tfm' && !target.form.xfdtarget ) { //$(target.parentNode).find("input[name='xfdtarget']").length === 0 ) {
						var xfdtarget = new Morebits.quickForm.element( {
							name: 'xfdtarget',
							type: 'input',
							label: 'Templat lainnya yang ingin digabungkan: '
						} );
						target.parentNode.appendChild(xfdtarget.render());
					} else {
						$(Morebits.quickForm.getElementContainer(target.form.xfdtarget)).remove();
						target.form.xfdtarget = null;
						//$(target.parentNode).find("input[name='xfdtarget']").remove();
					}
				}
			} );
		tfd_category.append( { type: 'option', label: 'Penghapusan', value: 'tfd', selected: true } );
		tfd_category.append( { type: 'option', label: 'Penggabungan', value: 'tfm' } );

		var tfd_template_type = work_area.append( {
			type: 'select',
			name: 'templatetype',
			label: 'Gaya tampilan tag penghapusan: ',
			tooltip: 'Di mana parameter <code>type=</code> akan melewati templat tag TuD.'
		} );
		tfd_template_type.append( { type: 'option', value: 'standard', label: 'Standar', selected: true } );
		tfd_template_type.append( { type: 'option', value: 'sidebar', label: 'Bilah sisi/kotak info' } );
		tfd_template_type.append( { type: 'option', value: 'inline', label: 'Templat dalam-baris' } );
		tfd_template_type.append( { type: 'option', value: 'tiny', label: 'Dalam-baris kecil' } );

		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Sembunyikan tag penghapusan ke dalam <noinclude> (hanya untuk templat yang disubstitusikan)',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Akan menyembunyikan tag penghapusan dalam tag &lt;noinclude&gt;, sehingga ia tidak akan disubstitusikan bersama templatnya.'
						}
					]
			} );

		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'mfd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Lain-lain untuk penghapusan',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Sembunyikan tag penghapusan dengan <noinclude>',
							value: 'noinclude',
							name: 'noinclude',
							tooltip: 'Akan menyembunyikan tag penghapusan dalam tag &lt;noinclude&gt;, sehingga ia tidak akan ditransklusikan. Pilih opsi ini untuk kotak pengguna.'
						}
					]
		} );
		if (mw.config.get('wgNamespaceNumber') === 2 /* User: */ || mw.config.get('wgNamespaceNumber') === 3 /* User talk: */) {
			work_area.append( {
				type: 'checkbox',
				list: [
						{
							label: 'Juga beritahukan pemilik pengguna jika mereka bukan pembuat halaman',
							value: 'notifyuserspace',
							name: 'notifyuserspace',
							tooltip: 'If the user in whose userspace this page is located, is not the page creator (for example, the page is a rescued article stored as a userspace draft), notify the userspace owner as well.',
							checked: true
						}
					]
			} );
		}
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'ffd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Tempat diskusi untuk berkas',
				name: 'work_area'
			} );
		work_area.append( {
				type: 'radio',
				name: 'ffdvenue',
				list: [
					{
						label: 'Berkas untuk diskusi',
						value: 'ffd',
						tooltip: 'Berkas mungkin akan dihapus, atau bertentangan dengan kriterian konten tidak bebas.',
						checked: true
					},
					{
						label: 'Berkas yang dianggap tidak bebas',
						value: 'puf',
						tooltip: 'Berkas memiliki informasi sumber atau lisensi yang tidak memadai'
					}
				]
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'cfd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Kategori untuk didiskusikan',
				name: 'work_area'
			} );
		var cfd_category = work_area.append( {
				type: 'select',
				label: 'Pilih jenis tindakan yang diinginkan: ',
				name: 'xfdcat',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					// update enabled status
					if( value === 'cfd' ) {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
					// update label
					if( value === 'cfs' ) {
						target.previousSibling.textContent = "Kategori sasaran: ";
					} else if( value === 'cfc' ) {
						target.previousSibling.textContent = "Artikel sasaran: ";
					} else {
						target.previousSibling.textContent = "Kategori sasaran: ";
					}
					// add/remove extra input box
					if( value === 'cfs' && $(target.parentNode).find("input[name='xfdtarget2']").length === 0 ) {
						var xfdtarget2 = document.createElement("input");
						xfdtarget2.setAttribute("name", "xfdtarget2");
						xfdtarget2.setAttribute("type", "text");
						target.parentNode.appendChild(xfdtarget2);
					} else {
						$(target.parentNode).find("input[name='xfdtarget2']").remove();
					}
				}
			} );
		cfd_category.append( { type: 'option', label: 'Penghapusan', value: 'cfd', selected: true } );
		cfd_category.append( { type: 'option', label: 'Penggabungan', value: 'cfm' } );
		cfd_category.append( { type: 'option', label: 'Penggantian nama', value: 'cfr' } );
		cfd_category.append( { type: 'option', label: 'Pemisahan', value: 'cfs' } );
		cfd_category.append( { type: 'option', label: 'Ganti menjadi artikel', value: 'cfc' } );

		work_area.append( {
				type: 'input',
				name: 'xfdtarget',
				label: 'Halaman sasaran: ',
				disabled: true,
				value: ''
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'cfds':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Nama kategori yang akan diganti',
				name: 'work_area'
			} );
		var cfds_category = work_area.append( {
				type: 'select',
				label: 'Subkriteria K2: ',
				name: 'xfdcat',
				tooltip: 'Lihat WP:CFDS untuk penjelasan lebih lanjut.',
				event: function(e) {
					var value = e.target.value;
					var target = e.target.form.xfdtarget;
					if( value === 'cfd' ) {
						target.disabled = true;
					} else {
						target.disabled = false;
					}
				}
			} );
		cfds_category.append( { type: 'option', label: 'K2A: Perbaikan tipografi dan ejaan', value: 'K2A', selected: true } );
		cfds_category.append( { type: 'option', label: 'K2B: Pedoman penamaan dan disambiguasi', value: 'K2B' } );
		cfds_category.append( { type: 'option', label: 'K2C: Konsistensi dengan nama dari kategori yang serupa', value: 'K2C' } );
		cfds_category.append( { type: 'option', label: 'K2D: Penggantian nama untuk menyesuaikan dengan nama artikel', value: 'K2D' } );
		cfds_category.append( { type: 'option', label: 'K2E: Permintaan pembuat', value: 'K2E' } );

		work_area.append( {
				type: 'input',
				name: 'xfdtarget',
				label: 'Nama baru: ',
				value: ''
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	case 'rfd':
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Pengalihan untuk diskusi',
				name: 'work_area'
			} );
		appendReasonBox();
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	default:
		work_area = new Morebits.quickForm.element( {
				type: 'field',
				label: 'Tidak ada untuk semuanya',
				name: 'work_area'
			} );
		work_area = work_area.render();
		old_area.parentNode.replaceChild( work_area, old_area );
		break;
	}

	// No creator notification for CFDS
	if (value === "cfds") {
		Twinkle.xfd.previousNotify = form.notify.checked;
		form.notify.checked = false;
		form.notify.disabled = true;
	} else {
		form.notify.checked = Twinkle.xfd.previousNotify;
		form.notify.disabled = false;
	}
};

Twinkle.xfd.callbacks = {
	// Currently supports afd, mfd, tfd/tfm, ffd
	getDiscussionWikitext: function(venue, params) {
		var text = "{{subst:" + venue + "2",
			reasonKey = venue === "ffd" ? "Reason" : "text";

		if (params.xfdcat) {
			text += "|cat=" + params.xfdcat;
		}

		// Add a reason unconditionally, so that at least a signature is added
		if (params.reason) {
			text += "|" + reasonKey + "=" + Morebits.string.formatReasonText(params.reason) + " ~~~~";
		} else {
			text += "|" + reasonKey + "=~~~~";
		}

		if (venue === "tfd" || venue === "tfm" || venue === "ffd") {
			text += "|1=" + mw.config.get('wgTitle');
		} else {
			text += "|pg=" + Morebits.pageNameNorm;
		}

		if (params.target) {
			text += "|2=" + params.target;
		}

		if (params.uploader) {
			text += "|Uploader=" + params.uploader;
		}

		text += "}}";
		return text;
	},
	showPreview: function(form, venue, params) {
		templatetext = Twinkle.xfd.callbacks.getDiscussionWikitext(venue, params);
		form.previewer.beginRender(templatetext, "Wikipedia:Null");
	},
	preview: function(form) {
		var templatetext;
		var venue = form.category.value;

		if (venue !== "afd" && venue !== "mfd" && venue !== "tfd" && venue !== "tfm" && venue !== "ffd") {
			alert("Pratayang belum didukung untuk tempat diskusi ini! :(");
			return;
		}
		var params = {
			reason: form.xfdreason.value,
		};
		if (form.xfdcat) {
			params.xfdcat = form.xfdcat.value;
		}
		if (form.xfdtarget) {
			params.target = form.xfdtarget.value;
		}
		if (venue === "ffd") {
			// Fetch the uploader
			var page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			page.lookupCreator(function() {
				params.uploader = page.getCreator();
				Twinkle.xfd.callbacks.showPreview(form, venue, params);
			});
		} else {
			Twinkle.xfd.callbacks.showPreview(form, venue, params);
		}
	},
	afd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if( titles.length <= 0 ) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.length; ++i ) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if( title === 'Wikipedia:Usulan penghapusan/' + Morebits.pageNameNorm ) {
						number = Math.max( number, 1 );
						continue;
					}

					var order_re = new RegExp( '^' +
						RegExp.escape( 'Wikipedia:Usulan penghapusan/' + Morebits.pageNameNorm, true ) +
						'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$');
					var match = order_re.exec( title );

					// No match; A non-good value
					if( !match ) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max( number, Number(match[1]) );
				}
				apiobj.params.number = Twinkle.xfd.num2order( parseInt( number, 10 ) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = 'Wikipedia:Usulan penghapusan/' + Morebits.pageNameNorm + apiobj.params.numbering;

			Morebits.status.info( "Halaman diskusi selanjutnya", "[[" + apiobj.params.discussionpage + "]]" );

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = "Nominasi selesai, mengalihkan ke halaman pembicaraan halaman";

			// Tagging article
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Menambahkan tag penghapusan ke artikel");
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the article is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.taggingArticle);
		},
		// Tagging needs to happen before everything else: this means we can check if there is an AfD tag already on the page
		taggingArticle: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			if (!pageobj.exists()) {
				statelem.error("Kelihatannya halaman ini tidak ada; mungkin halamannya telah dihapus oleh pengurus lain");
				return;
			}

			// Check for existing AfD tag, for the benefit of new page patrollers
			var textNoAfd = text.replace(/\{\{\s*(Article for deletion\/dated|AfDM)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, "");
			if (text !== textNoAfd) {
				if (confirm("Tag usulan penghapusan sudah ada di artikel ini. Mungkin ada pengguna yang lebih cepat dari Anda.  \nKlik OK untuk mengganti tag yang telah ada tersebut (tak disarankan), atau Cancel untuk membatalkan nominasi Anda.")) {
					text = textNoAfd;
				} else {
					statelem.error("Artikel telah memiliki tag penghapusan, dan Anda telah memilih untuk membatalkannya");
					window.location.reload();
					return;
				}
			}

			// Now we know we want to go ahead with it, trigger the other AJAX requests

			// Mark the page as patrolled, if wanted
			if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
				pageobj.patrol();
			}

			// Starting discussion page
			var wikipedia_page = new Morebits.wiki.page(params.discussionpage, "Membuat halaman diskusi penghapusan halaman");
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.discussionPage);

			// Today's list
			var date = new Date();
			wikipedia_page = new Morebits.wiki.page('Wikipedia:Usulan penghapusan/Catatan/' + date.getUTCFullYear() + ' ' +
				date.getUTCMonthName() + ' ' + date.getUTCDate(), "Menambahkan diskusi ini ke daftar harian");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.afd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.xfd.callbacks.afd.userNotification);
			}

			// Remove some tags that should always be removed on AfD.
			text = text.replace(/\{\{\s*(dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated|prod2|Proposed deletion endorsed|New unreviewed article|Unreviewed|Userspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			// Then, test if there are speedy deletion-related templates on the article.
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|delete|(?:hang|hold)[\- ]?on)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, "");
			if (text !== textNoSd && confirm("Sebuah tag penghapusan cepat telah ada di halaman ini. Ingin menghapusnya?")) {
				text = textNoSd;
			}

			pageobj.setPageText((params.noinclude ? "<noinclude>{{" : "{{") + (params.number === '' ? "subst:afd|help=off" : ('subst:afdx|' +
				params.number + "|help=off")) + (params.noinclude ? "}}</noinclude>\n" : "}}\n") + text);
			pageobj.setEditSummary("Dinominasikan untuk dihapus; lihat [[" + params.discussionpage + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext("afd", params));
			pageobj.setEditSummary("Membuat halaman diskusi penghapusan untuk [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText() + "\n";  // MW strips trailing blanks, but we like them, so we add a fake one
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace( /(<\!-- Add new entries to the TOP of the following list -->\n+)/, "$1{{subst:afd3|pg=" + Morebits.pageNameNorm + params.numbering + "}}\n");
			if( text === old_text ) {
				var linknode = document.createElement('a');
				linknode.setAttribute("href", mw.util.getUrl("Wikipedia:Twinkle/Fixing AFD") + "?action=purge" );
				linknode.appendChild(document.createTextNode('How to fix AFD'));
				statelem.error( [ 'Could not find the target spot for the discussion. To fix this problem, please see ', linknode, '.' ] );
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary("Menambahkan [[" + params.discussionpage + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchList')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("Anda (" + initialContrib + ") adalah pembuat halaman ini; notifikasi pengguna dibatalkan");
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan kontributor awal (" + initialContrib + ")");
			var notifytext = "\n{{subst:AFDWarning|1=" + Morebits.pageNameNorm + ( params.numbering !== '' ? '|order=&#32;' + params.numbering : '' ) + "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Pemberitahuan: mendaftarkan di [[WP:AFD|usulan penghapusan]] dari artikel [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	tfd: {
		taggingTemplate: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? "<noinclude>" : "") + "{{subst:template for discussion|help=off|" +
				(params.tfdtype !== "standard" ? "type=" + params.tfdtype + "|" : "") + mw.config.get('wgTitle') + (params.noinclude ? "}}</noinclude>" : "}}") + text);
			pageobj.setEditSummary("Dinominasikan untuk dihapus; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		taggingTemplateForMerge: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? "<noinclude>" : "") + "{{subst:tfm|help=off|" +
				(params.tfdtype !== "standard" ? "type=" + params.tfdtype + "|" : "") + "1=" + params.otherTemplateName.replace(/^Template:/, "") +
				(params.noinclude ? "}}</noinclude>" : "}}\n") + text);
			pageobj.setEditSummary("Dinominasikan untuk digabungkan dengan [[" + params.otherTemplateName + "]]; lihat [[" +
				params.logpage + "#" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = Twinkle.xfd.callbacks.getDiscussionWikitext(params.xfdcat, params);

			var text = old_text.replace( '-->', "-->\n" + added_data );
			if( text === old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}
			pageobj.setPageText(text);
			pageobj.setEditSummary("Menambahkan [[Template:" + mw.config.get('wgTitle') + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("Anda (" + initialContrib + ") adalah pembuat artikel ini; lewatkan notifikasi pengguna");
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan kontributor awal (" + initialContrib + ")");
			var notifytext = "\n";
			switch (params.xfdcat) {
			case 'tfd':
				notifytext += "{{subst:tfdnotice|1=" + mw.config.get('wgTitle') + "}} ~~~~";
				break;
			case 'tfm':
				notifytext += "{{subst:tfmnotice|1=" + mw.config.get('wgTitle') + "|2=" + params.target + "}} ~~~~";
				break;
			default:
				alert("twinklexfd in userNotification: unknown TFD action");
				break;
			}

			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Pemberitahuan: menominasikan di [[WP:TFD|diskusi templat]] dari halaman [[" + pageobj.getPageName() + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	mfd: {
		main: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var titles = $(xmlDoc).find('allpages p');

			// There has been no earlier entries with this prefix, just go on.
			if( titles.length <= 0 ) {
				apiobj.params.numbering = apiobj.params.number = '';
			} else {
				var number = 0;
				for( var i = 0; i < titles.length; ++i ) {
					var title = titles[i].getAttribute('title');

					// First, simple test, is there an instance with this exact name?
					if( title === 'Wikipedia:Penghapusan lain-lain/' + Morebits.pageNameNorm ) {
						number = Math.max( number, 1 );
						continue;
					}

					var order_re = new RegExp( '^' +
							RegExp.escape( 'Wikipedia:Penghapusan lain-lain/' + Morebits.pageNameNorm, true ) +
							'\\s*\\(\\s*(\\d+)(?:(?:th|nd|rd|st) nom(?:ination)?)?\\s*\\)\\s*$' );
					var match = order_re.exec( title );

					// No match; A non-good value
					if( !match ) {
						continue;
					}

					// A match, set number to the max of current
					number = Math.max( number, Number(match[1]) );
				}
				apiobj.params.number = Twinkle.xfd.num2order( parseInt( number, 10 ) + 1);
				apiobj.params.numbering = number > 0 ? ' (' + apiobj.params.number + ' nomination)' : '';
			}
			apiobj.params.discussionpage = "Wikipedia:Penghapusan lain-lain/" + Morebits.pageNameNorm + apiobj.params.numbering;

			apiobj.statelem.info( "next in order is [[" + apiobj.params.discussionpage + ']]');

			// Tagging page
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Menandai halaman dengan tag penghapusan");
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.taggingPage);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = apiobj.params.discussionpage;
			Morebits.wiki.actionCompleted.notice = "Nominasi selesai, akan membuka halaman diskusi";

			// Discussion page
			wikipedia_page = new Morebits.wiki.page(apiobj.params.discussionpage, "Membuat halaman diskusi penghapusan");
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.discussionPage);

			// Today's list
			wikipedia_page = new Morebits.wiki.page("Wikipedia:Penghapusan lain-lain", "Menambahkan diskusi ke daftar harian");
			//wikipedia_page.setPageSection(2);
				// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
				// it can be turned on again once the problem is fixed, to save bandwidth
			//wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(apiobj.params);
			wikipedia_page.load(Twinkle.xfd.callbacks.mfd.todaysList);

			// Notification to first contributor, and notification to owner of userspace (if applicable and required)
			if (apiobj.params.usertalk) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(apiobj.params);
				thispage.lookupCreator(Twinkle.xfd.callbacks.mfd.userNotification);
			}
		},
		taggingPage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText((params.noinclude ? "<noinclude>" : "") + "{{" + ((params.number === '') ? "mfd}}\n" : ('mfdx|' + params.number + "}}\n")) +
				(params.noinclude ? "</noinclude>" : "") + text);
			pageobj.setEditSummary("Dinominasikan untuk dihapus; lihat [[" + params.discussionpage + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		discussionPage: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext("mfd", params));
			pageobj.setEditSummary("Membuat halaman diskusi penghapusan untuk halaman [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('createonly');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var date = new Date();
			var date_header = "===" + date.getUTCMonthName() + ' ' + date.getUTCDate() + ', ' + date.getUTCFullYear() + "===\n";
			var date_header_regex = new RegExp( "(===\\s*" + date.getUTCMonthName() + '\\s+' + date.getUTCDate() + ',\\s+' + date.getUTCFullYear() + "\\s*===)" );
			var new_data = "{{subst:mfd3|pg=" + Morebits.pageNameNorm + params.numbering + "}}";

			if( date_header_regex.test( text ) ) { // we have a section already
				statelem.info( 'Ditemukan bagian hari ini, lanjutkan penambahan entri baru' );
				text = text.replace( date_header_regex, "$1\n" + new_data );
			} else { // we need to create a new section
				statelem.info( 'Belum ada bagian untuk hari ini, lanjutkan pembuatan subbagian baru' );
				text = text.replace("===", date_header + new_data + "\n\n===");
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary("Menambahkan [[" + params.discussionpage + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchList')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("Anda (" + initialContrib + ") membuat halaman ini; lewati notifikasi pengguna");
			} else {
				// Really notify the creator
				Twinkle.xfd.callbacks.mfd.userNotificationMain(params, initialContrib, "Beritahukan penyunting awal");
			}

			// Also notify the user who owns the subpage if they are not the creator
			if (params.notifyuserspace) {
				var userspaceOwner = ((mw.config.get('wgTitle').indexOf('/') === -1) ? mw.config.get('wgTitle') : mw.config.get('wgTitle').substring(0, mw.config.get('wgTitle').indexOf('/')));
				if (userspaceOwner !== initialContrib) {
					Twinkle.xfd.callbacks.mfd.userNotificationMain(params, userspaceOwner, "Memberitahukan pemilih ruang pengguna ini");
				}
			}
		},
		userNotificationMain: function(params, initialContrib, actionName)
		{
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, actionName + " (" + initialContrib + ")");
			var notifytext = "\n{{subst:MFDWarning|1=" + Morebits.pageNameNorm + ( params.numbering !== '' ? '|order=&#32;' + params.numbering : '' ) + "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Pemberitahuan: mendaftarkan di [[WP:MFD|penghapusan lain-lain]] dari halaman [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	ffd: {
		main: function(pageobj) {
			// this is coming in from lookupCreator...!
			var params = pageobj.getCallbackParameters();
			var initialContrib = pageobj.getCreator();
			params.uploader = initialContrib;

			// Adding discussion
			var wikipedia_page = new Morebits.wiki.page(params.logpage, "Menambahkan diskusi ke daftar harian");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.ffd.todaysList);

			// Notification to first contributor
			if (params.usertalk) {
				// Disallow warning yourself
				if (initialContrib === mw.config.get('wgUserName')) {
					pageobj.getStatusElement().warn("Anda (" + initialContrib + ") adalah pembuat halaman ini; lewati notifikasi pengguna");
				} else {
					var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan penyunting awal (" + initialContrib + ")");
					var notifytext = "\n{{subst:fdw|1=" + mw.config.get('wgTitle') + "}}";
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary("Pemberitahuan: mendaftarkan di [[WP:FFD|penghapusan berkas]] dari halaman [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
					usertalkpage.setCreateOption('recreate');
					switch (Twinkle.getPref('xfdWatchUser')) {
						case 'yes':
							usertalkpage.setWatchlist(true);
							break;
						case 'no':
							usertalkpage.setWatchlistFromPreferences(false);
							break;
						default:
							usertalkpage.setWatchlistFromPreferences(true);
							break;
					}
					usertalkpage.setFollowRedirect(true);
					usertalkpage.append();
				}
			}
		},
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");

			pageobj.setPageText("{{ffd|log=" + params.date + "}}\n" + text);
			pageobj.setEditSummary("Didaftarkan untuk didiskusikan di [[" + params.logpage + "#" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			// add date header if the log is found to be empty (a bot should do this automatically, but it sometimes breaks down)
			if (!pageobj.exists()) {
				text = "{{subst:Ffd log}}";
			}

			pageobj.setPageText(Twinkle.xfd.callbacks.getDiscussionWikitext("ffd", params));
			pageobj.setEditSummary("Menambahkan [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	puf: {
		taggingImage: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, "");

			pageobj.setPageText("{{puf|help=off|log=" + params.date + "}}\n" + text);
			pageobj.setEditSummary("Didaftarkan di [[WP:PUF|possibly unfree files]]: [[" + params.logpage + "#" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // it might be possible for a file to exist without a description page
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText(text + "\n{{subst:puf2|reason=" + Morebits.string.formatReasonText(params.reason) +
				"|image=" + mw.config.get('wgTitle') + "}} ~~~~");
			pageobj.setEditSummary("Menambahkan [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("Anda (" + initialContrib + ") pembuat halaman ini; lewati notifikasi pengguna");
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Memberitahukan penyunting awal (" + initialContrib + ")");
			var notifytext = "\n{{subst:fdw-puf|1=" + mw.config.get('wgTitle') + "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Pemberitahuan: mendaftarkan di [[WP:PUF|berkas diduga tidak bebas]] untuk halaman [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	// NOTE: NFCR doesn't have any callbacks here, everything happens in callback.evaluate


	cfd: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			var added_data = "";
			var editsummary = "";
			switch( params.xfdcat ) {
			case 'cfd':
				added_data = "{{subst:cfd}}";
				editsummary = "Kategori yang diusulkan untuk dihapus; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfm':
				added_data = "{{subst:cfm|" + params.target + "}}";
				editsummary = "Kategori yang diusulkan untuk digabungkan; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfr':
				added_data = "{{subst:cfr|" + params.target + "}}";
				editsummary = "Kategori yang diusulkan untuk diganti namanya; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfs':
				added_data = "{{subst:cfs|" + params.target + "|" + params.target2 + "}}";
				editsummary = "Kategori yang diusulkan untuk dipisahkan; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfc':
				added_data = "{{subst:cfc|" + params.target + "}}";
				editsummary = "Kategori yang diusulkan untuk dibuat menjadi artikel; lihat [[" + params.logpage + "#" + Morebits.pageNameNorm + "]].";
				break;
			default:
				alert("twinklexfd in taggingCategory(): unknown CFD action");
				break;
			}

			pageobj.setPageText(added_data + "\n" + text);
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var added_data = "";
			var editsummary = "";
			switch( params.xfdcat ) {
			case 'cfd':
				added_data = "{{subst:cfd2|text=" + Morebits.string.formatReasonText(params.reason) +
					" ~~~~|1=" + mw.config.get('wgTitle') + "}}";
				editsummary = "Added delete nomination of [[:" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfm':
				added_data = "{{subst:cfm2|text=" + Morebits.string.formatReasonText(params.reason) +
					" ~~~~|1=" + mw.config.get('wgTitle') + "|2=" + params.target + "}}";
				editsummary = "Added merge nomination of [[:" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfr':
				added_data = "{{subst:cfr2|text=" + Morebits.string.formatReasonText(params.reason) +
					" ~~~~|1=" + mw.config.get('wgTitle') + "|2=" + params.target + "}}";
				editsummary = "Added rename nomination of [[:" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfs':
				added_data = "{{subst:cfs2|text=" + Morebits.string.formatReasonText(params.reason) +
					" ~~~~|1=" + mw.config.get('wgTitle') + "|2=" + params.target + "|3=" + params.target2 + "}}";
				editsummary = "Added split nomination of [[:" + Morebits.pageNameNorm + "]].";
				break;
			case 'cfc':
				added_data = "{{subst:cfc2|text=" + Morebits.string.formatReasonText(params.reason) +
					" ~~~~|1=" + mw.config.get('wgTitle') + "|2=" + params.target + "}}";
				editsummary = "Added convert nomination of [[:" + Morebits.pageNameNorm + "]].";
				break;
			default:
				alert("twinklexfd in todaysList: unknown CFD action");
				break;
			}

			var text = old_text.replace( 'below this line -->', "below this line -->\n" + added_data );
			if( text === old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n{{subst:cfd-notify|1=" + Morebits.pageNameNorm + "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:CFD|categories for discussion]] of [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	},


	cfds: {
		taggingCategory: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("{{subst:cfr-speedy|1=" + params.target + "}}\n" + text);
			pageobj.setEditSummary("Nominated for speedy renaming; see [[WP:CFDS|Categories for discussion/Speedy]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');  // since categories can be populated without an actual page at that title
			pageobj.save();
		},
		addToList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var newcatname = (/^Category:/.test(params.target) ? params.target : ("Category:" + params.target));
			var text = old_text.replace( 'BELOW THIS LINE -->', "BELOW THIS LINE -->\n* [[:" + Morebits.pageNameNorm + "]] to [[:" +
				newcatname + "]]\u00A0\u2013 " + params.xfdcat + (params.reason ? (": " + Morebits.string.formatReasonText(params.reason)) : ".") +
				" ~~~~" );
				// U+00A0 NO-BREAK SPACE; U+2013 EN RULE
			if( text === old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		}
	},


	rfd: {
		// This is a callback from an API request, which gets the target of the redirect
		findTargetCallback: function(apiobj) {
			var xmlDoc = apiobj.responseXML;
			var target = $(xmlDoc).find('redirects r').first().attr('to');
			if( !target ) {
				apiobj.statelem.error( "This page is currently not a redirect, aborting" );
				return;
			}
			apiobj.params.target = target;
			Twinkle.xfd.callbacks.rfd.main(apiobj.params);
		},
		main: function(params) {
			var date = new Date();
			params.logpage = 'Wikipedia:Redirects for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

			// Tagging redirect
			var wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Adding deletion tag to redirect");
			wikipedia_page.setFollowRedirect(false);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.rfd.taggingRedirect);

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = params.logpage;
			Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

			// Adding discussion
			wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's log");
			wikipedia_page.setFollowRedirect(true);
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.rfd.todaysList);

			// Notifying initial contributor
			if (params.usertalk) {
				var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.xfd.callbacks.rfd.userNotification);
			}
		},
		taggingRedirect: function(pageobj) {
			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			pageobj.setPageText("{{subst:rfd|content=\n" + text + "\n}}");
			pageobj.setEditSummary("Listed for discussion at [[" + params.logpage + "#" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchPage')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		todaysList: function(pageobj) {
			var old_text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();
			var statelem = pageobj.getStatusElement();

			var text = old_text.replace( /(<\!-- Add new entries directly below this line\.? -->)/, "$1\n{{subst:rfd2|text=" +
				Morebits.string.formatReasonText(params.reason) + "|redirect="+ Morebits.pageNameNorm + "|target=" +
				params.target + "}} ~~~~\n" );
			if( text === old_text ) {
				statelem.error( 'failed to find target spot for the discussion' );
				return;
			}

			pageobj.setPageText(text);
			pageobj.setEditSummary("Adding [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			switch (Twinkle.getPref('xfdWatchDiscussion')) {
				case 'yes':
					pageobj.setWatchlist(true);
					break;
				case 'no':
					pageobj.setWatchlistFromPreferences(false);
					break;
				default:
					pageobj.setWatchlistFromPreferences(true);
					break;
			}
			pageobj.setCreateOption('recreate');
			pageobj.save(function() {
				Twinkle.xfd.currentRationale = null;  // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			});
		},
		userNotification: function(pageobj) {
			var initialContrib = pageobj.getCreator();

			// Disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn("You (" + initialContrib + ") created this page; skipping user notification");
				return;
			}

			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
			var notifytext = "\n{{subst:RFDNote|1=" + Morebits.pageNameNorm + "}} ~~~~";
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary("Notification: listing at [[WP:RFD|redirects for discussion]] of [[" + Morebits.pageNameNorm + "]]." + Twinkle.getPref('summaryAd'));
			usertalkpage.setCreateOption('recreate');
			switch (Twinkle.getPref('xfdWatchUser')) {
				case 'yes':
					usertalkpage.setWatchlist(true);
					break;
				case 'no':
					usertalkpage.setWatchlistFromPreferences(false);
					break;
				default:
					usertalkpage.setWatchlistFromPreferences(true);
					break;
			}
			usertalkpage.setFollowRedirect(true);
			usertalkpage.append();
		}
	}
};



Twinkle.xfd.callback.evaluate = function(e) {
	var type = e.target.category.value;
	var usertalk = e.target.notify.checked;
	var reason = e.target.xfdreason.value;
	var xfdcat, xfdtarget, xfdtarget2, ffdvenue, noinclude, tfdtype, notifyuserspace;
	if( type === "afd" || type === "cfd" || type === "cfds" || type === "tfd" ) {
		xfdcat = e.target.xfdcat.value;
	}
	if( type === "cfd" || type === "cfds" ) {
		xfdtarget = e.target.xfdtarget.value;
		if (e.target.xfdtarget2) {
			xfdtarget2 = e.target.xfdtarget2.value;
		}
	}
	if( type === 'ffd' ) {
		var ffdvenues = e.target.ffdvenue;
		for( var i = 0; i < ffdvenues.length; i++ )
		{
			if( !ffdvenues[i].checked ) {
				continue;
			}
			ffdvenue = ffdvenues[i].values;
			break;
		}
	}
	if( type === "afd" || type === "mfd" || type === "tfd" ) {
		noinclude = e.target.noinclude.checked;
	}
	if( type === 'tfd' ) {
		if (e.target.xfdtarget) {
			xfdtarget = e.target.xfdtarget.value;
		}
		tfdtype = e.target.templatetype.value;
	}
	if( type === 'mfd' ) {
		notifyuserspace = e.target.notifyuserspace && e.target.notifyuserspace.checked;
	}

	Morebits.simpleWindow.setButtonsEnabled( false );
	Morebits.status.init( e.target );

	Twinkle.xfd.currentRationale = reason;
	Morebits.status.onError(Twinkle.xfd.printRationale);

	if( !type ) {
		Morebits.status.error( 'Error', 'no action given' );
		return;
	}

	var query, wikipedia_page, wikipedia_api, logpage, params;
	var date = new Date();
	switch( type ) {

	case 'afd': // AFD
		query = {
			'action': 'query',
			'list': 'allpages',
			'apprefix': 'Articles for deletion/' + Morebits.pageNameNorm,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500
		};
		wikipedia_api = new Morebits.wiki.api( 'Tagging article with deletion tag', query, Twinkle.xfd.callbacks.afd.main );
		wikipedia_api.params = { usertalk:usertalk, reason:reason, noinclude:noinclude, xfdcat:xfdcat };
		wikipedia_api.post();
		break;

	case 'tfd': // TFD
		Morebits.wiki.addCheckpoint();

		if (xfdtarget) {
			xfdtarget = Morebits.string.toUpperCaseFirstChar(xfdtarget.replace(/^\:?Template\:/i, ''));
		} else {
			xfdtarget = '';
		}

		logpage = 'Wikipedia:Templates for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

		params = { tfdtype: tfdtype, logpage: logpage, noinclude: noinclude, xfdcat: xfdcat, target: xfdtarget, reason: reason };

		// Tagging template(s)
		if (xfdcat === "tfm") {
			// Tag this template
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging this template with merge tag");
			wikipedia_page.setFollowRedirect(true);
			params.otherTemplateName = "Template:" + xfdtarget;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge);

			// Tag other template
			wikipedia_page = new Morebits.wiki.page("Template:" + xfdtarget, "Tagging other template with merge tag");
			wikipedia_page.setFollowRedirect(true);
			params = $.extend(params);
			params.otherTemplateName = Morebits.pageNameNorm;
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplateForMerge);
		} else {
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging template with deletion tag");
			wikipedia_page.setFollowRedirect(true);  // should never be needed, but if the page is moved, we would want to follow the redirect
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.load(Twinkle.xfd.callbacks.tfd.taggingTemplate);
		}

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = logpage;
		Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

		// Adding discussion
		wikipedia_page = new Morebits.wiki.page(logpage, "Adding discussion to today's log");
		wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.tfd.todaysList);

		// Notification to first contributor
		if (usertalk) {
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			thispage.setCallbackParameters(params);
			thispage.lookupCreator(Twinkle.xfd.callbacks.tfd.userNotification);

			// Nice try, but what if the two page creators are the same user?
			// Also, other XFD types don't do this... yet!
			//if (xfdcat === "tfm") {
			//	thispage = new Morebits.wiki.page("Template:" + xfdtarget);
			//	thispage.setCallbackParameters(params);
			//	thispage.lookupCreator(Twinkle.xfd.callbacks.tfd.userNotification);
			//}
		}

		Morebits.wiki.removeCheckpoint();
		break;

	case 'mfd': // MFD
		query = {
			'action': 'query',
			'list': 'allpages',
			'apprefix': 'Miscellany for deletion/' + Morebits.pageNameNorm,
			'apnamespace': 4,
			'apfilterredir': 'nonredirects',
			'aplimit': Morebits.userIsInGroup( 'sysop' ) ? 5000 : 500
		};
		wikipedia_api = new Morebits.wiki.api( "Looking for prior nominations of this page", query, Twinkle.xfd.callbacks.mfd.main );
		wikipedia_api.params = { usertalk: usertalk, notifyuserspace: notifyuserspace, reason: reason, noinclude: noinclude, xfdcat: xfdcat };
		wikipedia_api.post();
		break;

	case 'ffd': // FFD/PUF
		var dateString = date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();
		logpage = 'Wikipedia:Files for discussion/' + dateString;
		params = { usertalk: usertalk, reason: reason, date: dateString, logpage: logpage };

		Morebits.wiki.addCheckpoint();
		switch( ffdvenue ) {
			case 'puf':
				params.logpage = logpage = 'Wikipedia:Possibly unfree files/' + dateString;

				// Updating data for the action completed event
				Morebits.wiki.actionCompleted.redirect = logpage;
				Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's list";

				// Tagging file
				wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging file with PUF tag");
				wikipedia_page.setFollowRedirect(true);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(Twinkle.xfd.callbacks.puf.taggingImage);

				// Adding discussion
				wikipedia_page = new Morebits.wiki.page(params.logpage, "Adding discussion to today's list");
				wikipedia_page.setFollowRedirect(true);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(Twinkle.xfd.callbacks.puf.todaysList);

				// Notification to first contributor
				if (usertalk) {
					wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
					wikipedia_page.setCallbackParameters(params);
					wikipedia_page.lookupCreator(Twinkle.xfd.callbacks.puf.userNotification);
				}

				Morebits.wiki.removeCheckpoint();
				break;

			default:
				// Updating data for the action completed event
				Morebits.wiki.actionCompleted.redirect = logpage;
				Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

				// Tagging file
				wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Adding deletion tag to file page");
				wikipedia_page.setFollowRedirect(true);
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.load(Twinkle.xfd.callbacks.ffd.taggingImage);

				// Contributor specific edits
				wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
				wikipedia_page.setCallbackParameters(params);
				wikipedia_page.lookupCreator(Twinkle.xfd.callbacks.ffd.main);
				break;
		}
		Morebits.wiki.removeCheckpoint();
		break;

	case 'cfd':
		Morebits.wiki.addCheckpoint();

		if( xfdtarget ) {
			xfdtarget = xfdtarget.replace( /^\:?Category\:/i, '' );
		} else {
			xfdtarget = '';
		}

		if( xfdtarget2 ) {
			xfdtarget2 = xfdtarget2.replace( /^\:?Category\:/i, '' );
		}

		logpage = 'Wikipedia:Categories for discussion/Log/' + date.getUTCFullYear() + ' ' + date.getUTCMonthName() + ' ' + date.getUTCDate();

		params = { reason: reason, xfdcat: xfdcat, target: xfdtarget, target2: xfdtarget2, logpage: logpage };

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = logpage;
		Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to today's log";

		// Tagging category
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging category with deletion tag");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.cfd.taggingCategory);

		// Adding discussion to list
		wikipedia_page = new Morebits.wiki.page(logpage, "Adding discussion to today's list");
		//wikipedia_page.setPageSection(2);
			// pageSection has been disabled - the API seems to throw up with nonexistent edit conflicts
			// it can be turned on again once the problem is fixed, to save bandwidth
		//wikipedia_page.setFollowRedirect(true);
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.cfd.todaysList);

		// Notification to first contributor
		if (usertalk) {
			wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			wikipedia_page.setCallbackParameters(params);
			wikipedia_page.lookupCreator(Twinkle.xfd.callbacks.cfd.userNotification);
		}

		Morebits.wiki.removeCheckpoint();
		break;

	case 'cfds':
		xfdtarget = xfdtarget.replace( /^\:?Category\:/, '' );

		logpage = "Wikipedia:Categories for discussion/Speedy";
		params = { reason: reason, xfdcat: xfdcat, target: xfdtarget };

		// Updating data for the action completed event
		Morebits.wiki.actionCompleted.redirect = logpage;
		Morebits.wiki.actionCompleted.notice = "Nomination completed, now redirecting to the discussion page";

		// Tagging category
		wikipedia_page = new Morebits.wiki.page(mw.config.get('wgPageName'), "Tagging category with rename tag");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.cfds.taggingCategory);

		// Adding discussion to list
		wikipedia_page = new Morebits.wiki.page(logpage, "Adding discussion to the list");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.xfd.callbacks.cfds.addToList);

		break;

	case 'rfd':
		params = { usertalk: usertalk, reason: reason };
		if (document.getElementById("softredirect")) {
			// For soft redirects, skip straight to the callback
			params.target = document.getElementById("softredirect").textContent.replace(/^\:+/, "");
			Twinkle.xfd.callbacks.rfd.main(params);
		} else {
			// Find current target of redirect
			query = {
				'action': 'query',
				'titles': mw.config.get('wgPageName'),
				'redirects': true
			};
			wikipedia_api = new Morebits.wiki.api( "Finding target of redirect", query, Twinkle.xfd.callbacks.rfd.findTargetCallback );
			wikipedia_api.params = params;
			wikipedia_api.post();
		}
		break;
	default:
		alert("twinklexfd: unknown XFD discussion venue");
		break;
	}
};
})(jQuery);


//</nowiki>
