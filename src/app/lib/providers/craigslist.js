(function (App) {
	'use strict';
	var Q = require('q');
	var _ = require('underscore');
	var moment = require('moment');
	var inherits = require('util').inherits;
	var PROVIDER_NAME = 'Craigslist';
	var BACKDROPS = {
		tickets: 'http://www.freeimages.com/pic/l/b/ba/ba1969/1204866_65656628.jpg',
		rock: 'http://www.freeimages.com/pic/l/y/yo/youngpit/1030733_88011029.jpg'
	};

	var CATEGORIES;
	var CATEGORY_NAMES = App.Config.craigslist_categories;

	var REGIONS;
	var REGION_NAMES = App.Config.craigslist_cities;
	var DEFAULT_IMG = 'http://upload.wikimedia.org/wikipedia/commons/c/c3/Noimage.gif';
	var search = require('craigslist-search');

	var Craigslist = function () {
		Craigslist.super_.call(this);
	};

	inherits(Craigslist, App.Providers.Generic);

	Craigslist.prototype.loadRegions = _.once(function () {
		return App.db.getAllCraigslistCities()
			.then(updateCitiesConfig)
			.then(function () {
				if (!REGION_NAMES.length) return lookupCities();
			});
	});

	Craigslist.prototype.loadCategories = _.once(function () {
		return App.db.getAllCraigslistCategories()
			.then(updateCategoriesConfig)
			.then(function () {
				if (!CATEGORY_NAMES.length) return lookupCategories();
			});
	});

	function updateCitiesConfig(cities) {
		if (cities.length) {
			REGIONS = cities;
			REGION_NAMES.length = 0;
			REGION_NAMES.push.apply(REGION_NAMES, _.pluck(cities, 'cityName'));
		}
	}

	function updateCategoriesConfig(categories) {
		if (categories.length) {
			CATEGORIES = categories;
			CATEGORY_NAMES.length = 0;
			CATEGORY_NAMES.push.apply(CATEGORY_NAMES, _.pluck(categories, 'categoryName'));
		}
	}

	function lookupCities() {
		return Q.Promise(function (resolve) {
			search({
				citiesOnly: true
			}, function (err, cities) {
				if (cities) {
					cities.forEach(function (city) {
						city.id = city.city;
						delete city.city;
					});

					updateCitiesConfig(cities);
				}

				resolve();
			});
		});
	}

	function lookupCategories(city) {
		city = city ? REGIONS[city] || city : 'newyork';
		return Q.Promise(function (resolve) {
			search({
				categoriesOnly: true,
				city: city
			}, function (err, categories) {
				if (categories) {
					categories.forEach(function (cat) {
						cat.id = cat.categoryName;
					});

					updateCategoriesConfig(categories);
				}

				resolve();
			});
		});
	}

	// function camelize(str, capitalizeFirst) {
	//    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
	//      return capitalizeFirst || index != 0 ? letter.toUpperCase() : letter.toLowerCase();
	//    }).replace(/\s+/g, '');
	//  }

	function formatForPopcorn(results, common) {
		results = results.map(function (item) {
			item.id = item.pid;
			if (item.date)
				moment(item.date).format('MMMM Do YYYY, h:mm a');
			// item.year = moment(item.date).year();
			_.extend(item, common);
			item.images = {};
			if (item.pics) {
				item.images.poster = item.pics[0];
				item.images.more = item.pics.slice(1);
			}
			else
				item.images.poster = DEFAULT_IMG;

			return item;
		});

		return {
			results: results,
			hasMore: true
		}
	}

	function formatHTML(html) {
		var div = document.createElement('div');
		div.innerHTML = html;

		var $html = $(div);
		$html.find('a').addClass('links');
		// return HTML.toArray().map(function(el) { return el.outerHTML }).join('');
		return $html.html();
	}

	Craigslist.prototype.extractIds = function (items) {
		return _.pluck(items, 'id');
	};

	Craigslist.prototype.detail = function (id, old_data) {
		return Q.Promise(function (resolve, reject) {
			if (old_data.description) return resolve(old_data);

			search({
				url: old_data.url
			}, function (err, new_data) {
				if (err) return resolve(old_data);

				// TODO: update, instead of add
				if (new_data.description) {
					new_data.description = formatHTML(new_data.description);
				}

				new_data = _.defaults(new_data, {
					description: 'Description not available.',
					numTix: 1
				});

				old_data.details = old_data.details || {};

				_.extend(old_data.details, new_data);
				resolve(old_data);
				App.db.addTicket(old_data);
			});
		});
	};

	Craigslist.prototype.fetch = function (filters) {
		var page = filters.page - 1;
		var byPage = 100;
		var offset = page * byPage;
		var query = filters.keywords || filters.type;
		var categoryName = 'ticket'; //filters.category || 'ticket';
		var craigslistCategory = 'tia'; // _.find(CATEGORIES, { categoryName: categoryName }).id;
		var city = filters.city || 'New York';
		var cityId = _.find(REGIONS, {
			cityName: city
		}).id;

		// city = city.toLowerCase().replace(/\s/, '');
		var options = {
			city: cityId,
			category: craigslistCategory,
			hasPic: true,
			offset: offset
		};

		if (query === 'All') query = null;
		if (query) options.query = query;

		var common = {
			city: city,
			backdrop: BACKDROPS.rock,
			type: categoryName,
			provider: PROVIDER_NAME
		}

		return Q.Promise(function (resolve, reject) {
			search(options, function (err, results) {
				if (err) return reject(err);

				var response = formatForPopcorn(results, common);
				resolve(response);
			});
		});
	};

	App.Providers.Craigslist = Craigslist;

})(window.App);
