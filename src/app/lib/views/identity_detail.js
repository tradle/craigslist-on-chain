(function (App) {
	'use strict';

	App.View.IdentityDetail = Backbone.Marionette.ItemView.extend({
		template: '#identity-detail-tpl',
		className: 'movie-detail',

		ui: {
			selected_lang: '.selected-lang',
			bookmarkIcon: '.favourites-toggle'
		},

		events: {
			'click #watch-now': 'startStreaming',
			'click #watch-trailer': 'playTrailer',
			'click .close-icon': 'closeDetails',
			'click #switch-hd-on': 'enableHD',
			'click #switch-hd-off': 'disableHD',
			'click .favourites-toggle': 'toggleFavourite',
			'click .sub-dropdown': 'toggleDropdown',
			'click .sub-flag-icon': 'closeDropdown',
			'click .rating-container': 'switchRating'
		},

		templateHelpers: {

			stars: function () {
				return [1, 2, 3, 4, 5];
			},

			// if_quality: function (needed, options) {
			//   if (this.torrents) {

			//     var torrents = this.torrents;
			//     var value;
			//     var q720 = torrents['720p'] !== undefined;
			//     var q1080 = torrents['1080p'] !== undefined;

			//     if (q720 && q1080) {
			//       value = '720p/1080p';
			//     } else if (q1080) {
			//       value = '1080p';
			//     } else if (q720) {
			//       value = '720p';
			//     } else {
			//       value = 'HDRip';
			//     }

			//     if (value === needed) {
			//       return options.fn(this);
			//     } else {
			//       return options.inverse(this);
			//     }

			//   } else {
			//     return options.inverse(this);
			//   }
			// },

			// image: function () {
			//   var image;
			//   switch (this.type) {
			//   case 'ticket':
			//     image = this.image;
			//     break;
			//   }

			//   return image;
			// }
			// ,

			// ratingStars: function () {
			//   if (typeof this.rating === 'object') {
			//     return this.rating / 10;
			//   } else {
			//     return [];
			//   }
			// },

			// rating: function () {
			//   if (typeof this.rating === 'object') {
			//     return this.model.get('rating')['percentage'] / 10;
			//   } else {
			//     return false;
			//   }
			// }
		},

		initialize: function () {

			var _this = this;
			if ((ScreenResolution.SD || ScreenResolution.HD) && !ScreenResolution.Retina) {
				// Screen Resolution of 720p or less is fine to have 300x450px image
				this.model.set('image', this.model.get('imageLowRes'));
			}

			//Handle keyboard shortcuts when other views are appended or removed

			//If a child was removed from above this view
			App.vent.on('viewstack:pop', function () {
				if (_.last(App.ViewStack) === _this.className) {
					_this.initKeyboardShortcuts();
				}
			});

			//If a child was added above this view
			App.vent.on('viewstack:push', function () {
				if (_.last(App.ViewStack) !== _this.className) {
					_this.unbindKeyboardShortcuts();
				}
			});

			// this.initKeyboardShortcuts();
			this.model.on('change:quality', this.renderHealth, this);
		},

		onShow: function () {
			win.info('Show identity detail (' + this.model.get('uid') + ')');

			// App.Device.ChooserView('#player-chooser').render();

			// App.MovieDetailView = this;

			var backgroundUrl = $('.backdrop').attr('data-bgr');

			var bgCache = new Image();
			bgCache.src = backgroundUrl;
			bgCache.onload = function () {
				$('.backdrop').css('background-image', 'url(' + backgroundUrl + ')').addClass('fadein');
				bgCache = null;
			};

			var coverUrl = $('.mcover-image').attr('data-cover');

			var coverCache = new Image();
			coverCache.src = coverUrl;
			coverCache.onload = function () {
				$('.mcover-image').attr('src', coverUrl).addClass('fadein');
				coverCache = null;
			};

			// // switch to default subtitle
			// this.switchSubtitle(App.Settings.get('subtitle_language'));

			if (this.model.get('bookmarked') === true) {
				this.ui.bookmarkIcon.addClass('selected').text(i18n.__('Remove from bookmarks'));
			}

			// if (App.Settings.get('ratingStars') === false) {
			//   $('.star-container').addClass('hidden');
			//   $('.number-container').removeClass('hidden');
			// }

			this.initKeyboardShortcuts();
		},

		onClose: function () {

			this.unbindKeyboardShortcuts();
		},

		initKeyboardShortcuts: function () {
			Mousetrap.bind(['esc', 'backspace'], this.closeDetails);
			Mousetrap.bind(['enter', 'space'], function (e) {
				win.log('Enter click!');
				$('#watch-now').click();
			});
			Mousetrap.bind('q', this.toggleQuality);
			Mousetrap.bind('f', function () {
				$('.favourites-toggle').click();
			});
		},

		unbindKeyboardShortcuts: function () { // There should be a better way to do this
			Mousetrap.unbind(['esc', 'backspace']);
			Mousetrap.unbind(['enter', 'space']);
			Mousetrap.unbind('q');
			Mousetrap.unbind('f');
		},

		switchRating: function () {
			if ($('.number-container').hasClass('hidden')) {
				$('.number-container').removeClass('hidden');
				$('.star-container').addClass('hidden');
				App.Settings.set('ratingStars', false);
			} else {
				$('.number-container').addClass('hidden');
				$('.star-container').removeClass('hidden');
				App.Settings.set('ratingStars', true);
			}
		},

		switchSubtitle: function (lang) {
			var subtitles = this.model.get('subtitle');

			if (subtitles === undefined || subtitles[lang] === undefined) {
				lang = 'none';
			}

			this.subtitle_selected = lang;
			this.ui.selected_lang.removeClass().addClass('flag toggle selected-lang').addClass(this.subtitle_selected);

			win.info('Subtitle: ' + this.subtitle_selected);
		},

		startStreaming: function () {
			var torrentStart = {
				imdb_id: this.model.get('imdb_id'),
				torrent: this.model.get('torrents')[this.model.get('quality')].url,
				backdrop: this.model.get('backdrop'),
				subtitle: this.model.get('subtitle'),
				defaultSubtitle: this.subtitle_selected,
				title: this.model.get('title'),
				quality: this.model.get('quality'),
				type: 'movie',
				videotype: 'video/mp4',
				device: App.Device.Collection.selected,
				cover: this.model.get('image')
			};
			App.vent.trigger('streamer:start', torrentStart);
		},

		toggleDropdown: function (e) {
			if ($('.sub-dropdown').is('.open')) {
				this.closeDropdown(e);
				return false;
			} else {
				$('.sub-dropdown').addClass('open');
				$('.sub-dropdown-arrow').addClass('down');
			}
			var self = this;
			$('.flag-container').fadeIn();
		},

		closeDropdown: function (e) {
			e.preventDefault();
			$('.flag-container').fadeOut();
			$('.sub-dropdown').removeClass('open');
			$('.sub-dropdown-arrow').removeClass('down');

			var value = $(e.currentTarget).attr('data-lang');
			if (value) {
				this.switchSubtitle(value);
			}
		},

		playTrailer: function () {

			var trailer = new Backbone.Model({
				trailerSrc: this.model.get('trailer'),
				type: 'trailer',
				videotype: 'video/youtube',
				subtitle: null,
				quality: false,
				title: this.model.get('title')
			});
			App.vent.trigger('stream:ready', trailer);
		},

		closeDetails: function () {
			App.vent.trigger('movie:closeDetail');
		},

		enableHD: function () {
			var torrents = this.model.get('torrents');
			win.info('HD Enabled');

			if (torrents['1080p'] !== undefined) {
				torrents = this.model.get('torrents');
				this.model.set('quality', '1080p');
				win.debug(this.model.get('quality'));
			}
		},

		disableHD: function () {
			var torrents = this.model.get('torrents');
			win.info('HD Disabled');

			if (torrents['720p'] !== undefined) {
				torrents = this.model.get('torrents');
				this.model.set('quality', '720p');
				win.debug(this.model.get('quality'));
			}
		},

		renderHealth: function () {
			var torrent = this.model.get('torrents')[this.model.get('quality')];
			var health = torrent.health.capitalize();
			var ratio = torrent.peer > 0 ? torrent.seed / torrent.peer : +torrent.seed;

			$('.health-icon').tooltip({
					html: true
				})
				.removeClass('Bad Medium Good Excellent')
				.addClass(health)
				.attr('data-original-title', i18n.__('Health ' + health) + ' - ' + i18n.__('Ratio:') + ' ' + ratio.toFixed(2) + ' <br> ' + i18n.__('Seeds:') + ' ' + torrent.seed + ' - ' + i18n.__('Peers:') + ' ' + torrent.peer)
				.tooltip('fixTitle');
		},


		toggleFavourite: function (e) {
			if (e.type) {
				e.stopPropagation();
				e.preventDefault();
			}
			var that = this;
			if (this.model.get('bookmarked') === true) {
				App.Database.delete('bookmarks', {
						imdb_id: this.model.get('imdb_id')
					})
					.then(function () {
						win.info('Bookmark deleted (' + that.model.get('imdb_id') + ')');
						App.userBookmarks.splice(App.userBookmarks.indexOf(that.model.get('imdb_id')), 1);
						that.ui.bookmarkIcon.removeClass('selected').text(i18n.__('Add to bookmarks'));
					})
					.then(function () {
						return App.Database.delete('movies', {
							imdb_id: that.model.get('imdb_id')
						});
					})
					.then(function () {
						that.model.set('bookmarked', false);
						var bookmark = $('.bookmark-item .' + that.model.get('imdb_id'));
						if (bookmark.length > 0) {
							bookmark.parents('.bookmark-item').remove();
						}
					});
			} else {

				// we need to have this movie cached
				// for bookmarking
				var movie = {
					imdb_id: this.model.get('imdb_id'),
					image: this.model.get('image'),
					torrents: this.model.get('torrents'),
					title: this.model.get('title'),
					synopsis: this.model.get('synopsis'),
					runtime: this.model.get('runtime'),
					year: this.model.get('year'),
					genre: this.model.get('genre'),
					health: this.model.get('health'),
					subtitle: this.model.get('subtitle'),
					backdrop: this.model.get('backdrop'),
					rating: this.model.get('rating'),
					trailer: this.model.get('trailer'),
					provider: this.model.get('provider'),
				};

				App.Database.add('movies', movie)
					.then(function () {
						return App.Database.add('bookmarks', {
							imdb_id: that.model.get('imdb_id'),
							type: 'movie'
						});
					})
					.then(function () {
						win.info('Bookmark added (' + that.model.get('imdb_id') + ')');
						that.ui.bookmarkIcon.addClass('selected').text(i18n.__('Remove from bookmarks'));
						App.userBookmarks.push(that.model.get('imdb_id'));
						that.model.set('bookmarked', true);
					});
			}
		},

		toggleQuality: function (e) {
			if ($('#switch-hd-off').is(':checked')) {
				$('#switch-hd-on').trigger('click');
			} else {
				$('#switch-hd-off').trigger('click');
			}
			App.vent.emit('qualitychange');

			if (e.type) {
				e.preventDefault();
				e.stopPropagation();
			}
		}
	}, {
		displayName: 'IdentityDetail'
	});
})(window.App);
