(function (App) {
	'use strict';
	var Q = require('q');
	var moment = require('moment');
	var inherits = require('util').inherits;
	var fs = require('fs');
	var pwd = process.env.PWD;
	var BACKDROPS = {
		greyLinen: 'http://tradle.io/images/bg/grey-linen182x182.png',
		abstract1: 'https://newevolutiondesigns.com/images/freebies/abstract-background-25.jpg',
		abstract2: 'http://www.webdesignboom.net/wp-content/uploads/2013/11/Green-Lines-Abstract-Vector-Background08.jpg',
		abstract3: 'http://www.webdesignboom.net/wp-content/uploads/2013/11/red-glowing-bubble-background11.jpg',
		abstract4: 'http://i.imgur.com/ntWZThQ.jpg?2'
	};
	var DEFAULT_IMG = 'http://upload.wikimedia.org/wikipedia/commons/c/c3/Noimage.gif';
	var FAKE_DATA = [{
		url: 'http://tradle.io/',
		id: 0,
		firstName: 'Mr.',
		lastName: 'Tradle',
		gender: 'To be decided',
		description: 'Making Craigslist safer with the help of bitcoin\'s blockchain',
		dob: '2014-05-01',
		image: 'https://avatars0.githubusercontent.com/u/9482126?v=3&s=200'
	}]

	FAKE_DATA.forEach(function (item) {
		item.type = 'identity';
		item.title = item.firstName + ' ' + item.lastName;
		item.date = moment(item.date).format('MMMM Do YYYY');
		// item.year = moment(item.date).year();
		item.provider = 'Identity';
		item.image = item.image || DEFAULT_IMG;

		// item.images.poster = img;
		item.backdrop = BACKDROPS.abstract3;
		return item;
	});

	var Identity = function () {
		Identity.super_.call(this);
	};

	inherits(Identity, App.Providers.Generic);

	// var query = function (filters) {

	//   var Identity = App.Providers.get('Identity');
	//   return Identity.fetch(filters);

	//   // return App.Database.find('bookmarks', {}, offset, byPage)
	//   //   .then(function (data) {
	//   //       return data;
	//   //     },
	//   //     function (error) {
	//   //       return [];
	//   //     });
	// };

	// var formatForPopcorn = function (items) {
	//   return items;
	//   // var listingList = [];

	//   // items.forEach(function (listing) {

	//   //   var deferred = Q.defer();
	//   //   // we check if its a movie
	//   //   // or tv show then we extract right data

	//   //   App.Database.get('listings', {
	//   //       pid: listing.pid
	//   //     })
	//   //     .then(function (data) {
	//   //         data.type = 'bookmarkedlisting';
	//   //         deferred.resolve(data);
	//   //       },
	//   //       function (err) {
	//   //         deferred.reject(err);
	//   //       });


	//   //   listingList.push(deferred.promise);
	//   // });

	//   // return Q.all(listingList);
	// };

	Identity.prototype.extractIds = function (items) {
		return _.pluck(items, 'id');
	};

	Identity.prototype.detail = function (id, old_data) {
		return Q.Promise(function (resolve) {
			resolve(old_data);
		});
	};

	Identity.prototype.fetch = function (filters) {
		var page = filters.page - 1;
		var byPage = 30;
		var offset = page * byPage;
		var keywords = filters.keywords;

		return Q.Promise(function (resolve) {
			var data = FAKE_DATA.filter(function (item) {
				if (!keywords) return item;

				return ~item.title.toLowerCase().indexOf(keywords) ||
					~item.description.toLowerCase().indexOf(keywords);
			});

			resolve({
				results: data,
				hasMore: false
			});
		});
	};

	App.Providers.Identity = Identity;

})(window.App);
