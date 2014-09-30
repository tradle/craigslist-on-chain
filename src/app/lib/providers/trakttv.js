(function (App) {
	'use strict';

	var request = require('request'),
		URI = require('URIjs'),
		Q = require('q'),
		_ = require('underscore'),
		inherits = require('util').inherits,
		sha1 = require('sha1');

	var API_ENDPOINT = URI('https://api.trakt.tv/'),
		API_KEY = '515a27ba95fbd83f20690e5c22bceaff0dfbde7c',
		API_PLUGIN_VERSION = AdvSettings.get('traktTvVersion'),
		PT_VERSION = AdvSettings.get('version');

	function TraktTv() {
		App.Providers.CacheProviderV2.call(this, 'metadata');

		this.authenticated = false;
		this._credentials = {
			username: '',
			password: ''
		};

		// Login with stored credentials
		if (AdvSettings.get('traktUsername') !== '' && AdvSettings.get('traktPassword') !== '') {
			this._authenticationPromise = this.authenticate(AdvSettings.get('traktUsername'), AdvSettings.get('traktPassword'), true);
		}

		var self = this;
		// Bind all "sub" method calls to TraktTv
		_.each(this.movie, function (method, key) {
			self.movie[key] = method.bind(self);
		});
		_.each(this.show, function (method, key) {
			self.show[key] = method.bind(self);
		});
	}
	// Inherit the Cache Provider
	inherits(TraktTv, App.Providers.CacheProviderV2);

	function MergePromises(promises) {
		return Q.all(promises).then(function (results) {
			return _.unique(_.flatten(results));
		});
	}

	TraktTv.prototype.isAuthenticating = function () {
		return this._authenticationPromise && this._authenticationPromise.isPending();
	};

	TraktTv.prototype.cache = function (key, ids, func) {
		var self = this;
		return this.fetch(ids).then(function (items) {
			var nonCachedIds = _.difference(ids, _.pluck(items, key));
			return MergePromises([
				Q(items),
				func(nonCachedIds).then(self.store.bind(self, key))
			]);
		});
	};

	TraktTv.prototype.call = function (endpoint, getVariables) {
		var defer = Q.defer();

		getVariables = getVariables || {};

		if (Array.isArray(endpoint)) {
			endpoint = endpoint.map(function (val) {
				if (val === '{KEY}') {
					return API_KEY;
				}
				return val.toString();
			});
		} else {
			endpoint = endpoint.replace('{KEY}', API_KEY);
		}

		var requestUri = API_ENDPOINT.clone()
			.segment(endpoint)
			.addQuery(getVariables);

		request(requestUri.toString(), {
			json: true
		}, function (err, res, body) {
			if (err || !body) {
				defer.reject(err);
			} else {
				defer.resolve(body);
			}
		});

		return defer.promise;
	};

	TraktTv.prototype.post = function (endpoint, postVariables) {
		var defer = Q.defer();

		postVariables = postVariables || {};

		if (Array.isArray(endpoint)) {
			endpoint = endpoint.map(function (val) {
				if (val === '{KEY}') {
					return API_KEY;
				}
				return val.toString();
			});
		} else {
			endpoint = endpoint.replace('{KEY}', API_KEY);
		}

		var requestUri = API_ENDPOINT.clone()
			.segment(endpoint);

		if (postVariables.username === undefined) {
			if (this.authenticated && this._credentials.username !== '') {
				postVariables.username = this._credentials.username;
			}
		}
		if (postVariables.password === undefined) {
			if (this.authenticated && this._credentials.password !== '') {
				postVariables.password = this._credentials.password;
			}
		}

		request(requestUri.toString(), {
			method: 'post',
			body: postVariables,
			json: true
		}, function (err, res, body) {
			if (err || !body) {
				defer.reject(err);
			} else {
				defer.resolve(body);
			}
		});

		return defer.promise;
	};

	TraktTv.prototype.authenticate = function (username, password, preHashed) {
		preHashed = preHashed || false;

		var self = this;
		return this._authenticationPromise = this.post('account/test/{KEY}', {
			username: username,
			password: preHashed ? password : sha1(password)
		}).then(function (data) {
			if (data.status === 'success') {
				self._credentials = {
					username: username,
					password: preHashed ? password : sha1(password)
				};
				self.authenticated = true;
				// Store the credentials (hashed ofc)
				AdvSettings.set('traktUsername', self._credentials.username);
				AdvSettings.set('traktPassword', self._credentials.password);
				return true;
			} else {
				return false;
			}
		});
	};

	TraktTv.prototype.sync = function () {
		return Promise.all([this.show.sync(), this.movie.sync()]);
	};

	TraktTv.prototype.movie = {
		summary: function (id) {
			return this.call(['movie/summary.json', '{KEY}', id]);
		},
		listSummary: function (ids) {
			if (_.isEmpty(ids)) {
				return Q([]);
			}

			var self = this;
			return this.cache('imdb_id', ids, function (ids) {
				if (_.isEmpty(ids)) {
					return Q([]);
				}
				return self.call(['movie/summaries.json', '{KEY}', ids.join(','), 'full']);
			});
		},
		scrobble: function (imdb, progress, duration) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('movie/scrobble/{KEY}', {
				imdb_id: imdb,
				progress: progress,
				duration: duration,
				plugin_version: API_PLUGIN_VERSION,
				media_center_version: PT_VERSION
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		seen: function (movie) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (Array.isArray(movie)) {
				movie = movie.map(function (val) {
					return {
						imdb_id: val
					};
				});
			} else {
				movie = [{
					imdb_id: movie
				}];
			}

			return this.post('movie/seen/{KEY}', {
				movies: movie
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		unseen: function (movie) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (Array.isArray(movie)) {
				movie = movie.map(function (val) {
					return {
						imdb_id: val
					};
				});
			} else {
				movie = [{
					imdb_id: movie
				}];
			}

			return this.post('movie/unseen/{KEY}', {
				movies: movie
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		watching: function (imdb, progress, duration) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('movie/watching/{KEY}', {
				imdb_id: imdb,
				progress: progress,
				duration: duration,
				plugin_version: API_PLUGIN_VERSION,
				media_center_version: PT_VERSION
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		cancelWatching: function () {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('movie/cancelwatching/{KEY}')
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		library: function (movie) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (Array.isArray(movie)) {
				movie = movie.map(function (val) {
					return {
						imdb_id: val
					};
				});
			} else {
				movie = [{
					imdb_id: movie
				}];
			}

			return this.post('movie/library/{KEY}', {
				movies: movie
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		unLibrary: function (movie) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (Array.isArray(movie)) {
				movie = movie.map(function (val) {
					return {
						imdb_id: val
					};
				});
			} else {
				movie = [{
					imdb_id: movie
				}];
			}

			return this.post('movie/unlibrary/{KEY}', {
				movies: movie
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		getWatched: function () {
			return this.call(['user/library/movies/watched.json', '{KEY}', this._credentials.username])
				.then(function (data) {
					return data;
				});
		},

		sync: function () {
			return Promise.all([this.movie.syncFrom(), this.movie.syncTo()]);
		},

		syncFrom: function () {
			this.movie.getWatched()
				.then(function (data) {
					var watched = [];

					if (data) {
						var movie;
						for (var m in data) {
							movie = data[m];
							watched.push({
								movie_id: movie.imdb_id.toString(),
								date: new Date(),
								type: 'movie'
							});
						}
					}

					return watched;
				})
				.then(function (traktWatched) {
					return new Promise(function (resolve, reject) {
						Database.markMoviesWatched(traktWatched, function (err, results) {
							if (err) {
								return reject(err);
							}

							return resolve(results);

						});
					});
				});
		},

		syncTo: function () {

			return new Promise(function (resolve, reject) {
					Database.getMoviesWatched(function (err, results) {
						if (err) {
							return reject(err);
						}

						return resolve(results);

					});
				})
				.then(function (results) {
					return results.map(function (item) {
						return item.movie_id;
					});
				})
				.then((function (movieIds) { // jshint ignore:line
					return this.movie.seen(movieIds);
				}).bind(this));

		}

	};

	TraktTv.prototype.show = {
		summary: function (id) {
			return this.call(['show/summary.json', '{KEY}', id]);
		},
		listSummary: function (ids) {
			if (_.isEmpty(ids)) {
				return Q([]);
			}

			var self = this;
			return this.cache(ids, function (ids) {
				if (_.isEmpty(ids)) {
					return Q([]);
				}
				return self.call(['show/summaries.json', '{KEY}', ids.join(','), 'full']);
			});
		},
		episodeSummary: function (id, season, episode) {
			return this.call(['show/episode/summary.json', '{KEY}', id, season, episode])
				.then(function (data) {
					if (data.show && data.episode) {
						return data;
					} else {
						return undefined;
					}
				});
		},
		scrobble: function (tvdb, season, episode, progress, duration) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('show/scrobble/{KEY}', {
				tvdb_id: tvdb,
				season: season,
				episode: episode,
				progress: progress,
				duration: duration,
				plugin_version: API_PLUGIN_VERSION,
				media_center_version: PT_VERSION
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		episodeSeen: function (id, episode) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			var data = {};

			if (/^tt/.test(id)) {
				data.imdb_id = id;
			} else {
				data.tvdb_id = id;
			}

			if (!Array.isArray(episode)) {
				episode = [{
					season: episode.season,
					episode: episode.episode
				}];
			}

			data.episodes = episode;

			return this.post('show/episode/seen/{KEY}', data)
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		episodeUnseen: function (id, episode) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			var data = {};

			if (/^tt/.test(id)) {
				data.imdb_id = id;
			} else {
				data.tvdb_id = id;
			}

			if (!Array.isArray(episode)) {
				episode = [{
					season: episode.season,
					episode: episode.episode
				}];
			}

			data.episodes = episode;

			return this.post('show/episode/unseen/{KEY}', data)
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		watching: function (tvdb, season, episode, progress, duration) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('show/watching/{KEY}', {
				tvdb_id: tvdb,
				season: season,
				episode: episode,
				progress: progress,
				duration: duration,
				plugin_version: API_PLUGIN_VERSION,
				media_center_version: PT_VERSION
			}).then(function (data) {
				if (data.status === 'success') {
					return true;
				} else {
					return false;
				}
			});
		},
		cancelWatching: function () {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			return this.post('show/cancelwatching/{KEY}')
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		library: function (show) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (/^tt/.test(show)) {
				show = {
					imdb_id: show
				};
			} else {
				show = {
					tvdb_id: show
				};
			}

			return this.post('show/library/{KEY}', show)
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		unLibrary: function (show) {
			if (!this.authenticated) {
				return Q.reject('Not Authenticated');
			}

			if (/^tt/.test(show)) {
				show = {
					imdb_id: show
				};
			} else {
				show = {
					tvdb_id: show
				};
			}

			return this.post('show/unlibrary/{KEY}', show)
				.then(function (data) {
					if (data.status === 'success') {
						return true;
					} else {
						return false;
					}
				});
		},
		getWatched: function () {
			return this.call(['user/library/shows/watched.json', '{KEY}', this._credentials.username])
				.then(function (data) {
					return data;
				});
		},

		sync: function () {
			return Promise.all([this.show.syncFrom(), this.show.syncTo()]);
		},

		syncFrom: function () {
			return this.show.getWatched()
				.then(function (data) {
					// Format them for insertion
					var watched = [];

					if (data) {
						var show;
						var season;
						for (var d in data) {
							show = data[d];
							for (var s in show.seasons) {
								season = show.seasons[s];
								for (var e in season.episodes) {
									watched.push({
										tvdb_id: show.tvdb_id.toString(),
										show_imdb_id: show.imdb_id.toString(),
										season: season.season.toString(),
										episode: season.episodes[e].toString(),
										type: 'episode',
										date: new Date()
									});
								}
							}
						}
					}

					return watched;
				})
				.then(function (traktWatched) {
					// Insert them locally
					return new Promise(function (resolve, reject) {
						Database.markEpisodesWatched(traktWatched, function (err, results) {
							if (err) {
								return reject(err);
							}

							return resolve(results);
						});
					});
				});
		},

		syncTo: function () {
			var self = this;

			return new Promise(function (resolve, reject) {
					Database.getAllEpisodesWatched(function (err, results) {
						if (err) {
							return reject(err);
						}

						return resolve(results);

					});
				})
				.then(function (results) {
					return results.reduce(function (prev, current) {
						if (current.tvdb_id) {
							if (!prev[current.tvdb_id]) {
								prev[current.tvdb_id] = {
									tvdb_id: current.tvdb_id,
									episode: []
								};
							}

							prev[current.tvdb_id].episode.push({
								season: current.season,
								episode: current.episode
							});
						}

						return prev;
					}, {});
				})
				.then(function (shows) {

					var promises = Object.keys(shows).map(function (showId) {
						var show = shows[showId];
						return self.show.episodeSeen(show.tvdb_id, show.episode);
					});

					return Promise.all(promises);
				});
		}
	};

	TraktTv.resizeImage = function (imageUrl, width) {
		var uri = URI(imageUrl),
			ext = uri.suffix(),
			file = uri.filename().split('.' + ext)[0];

		// Don't resize images that don't come from trakt
		//  eg. YTS Movie Covers
		if (uri.domain() !== 'trakt.us') {
			return imageUrl;
		}

		var existingIndex = 0;
		if ((existingIndex = file.search('-\\d\\d\\d$')) !== -1) {
			file = file.slice(0, existingIndex);
		}

		if (file === 'poster-dark') {
			return 'images/posterholder.png'.toString();
		} else {
			return uri.filename(file + '-' + width + '.' + ext).toString();
		}
	};

	function onShowWatched(show, channel) {
		win.debug('Mark TV Show as watched, on channel:', channel);
		switch (channel) {
		case 'scrobble':
			App.Trakt.show
				.scrobble(show.tvdb_id, show.season, show.episode, 100);
			break;
		case 'seen':
			/* falls through */
		default:
			App.Trakt.show
				.episodeSeen(show.tvdb_id, show);
			break;
		}
	}

	function onShowUnWatched(show, channel) {
		win.debug('Mark TV Show as unwatched, on channel:', channel);
		switch (channel) {
		case 'scrobble':
			App.Trakt.show
				.scrobble(show.tvdb_id, show.season, show.episode, 0);
			break;
		case 'seen':
			/* falls through */
		default:
			App.Trakt.show
				.episodeUnseen(show.tvdb_id, show);
			break;
		}
	}

	function onMoviesWatched(movie, channel) {
		win.debug('Mark Movie as watched, on channel:', channel);
		switch (channel) {
		case 'scrobble':
			App.Trakt.movie
				.scrobble(movie.imdb_id, 100);
			break;
		case 'seen':
			/* falls through */
		default:
			App.Trakt.movie
				.seen(movie.imdb_id);
			break;
		}
	}

	App.vent.on('show:watched', onShowWatched);
	App.vent.on('show:unwatched', onShowUnWatched);
	App.vent.on('movie:watched', onMoviesWatched);

	App.Providers.Trakttv = TraktTv;

})(window.App);
