(function (App) {
	'use strict';

	var Identity = Backbone.Model.extend({
		idAttribute: 'id',

		initialize: function () {}

		// updateHealth: function () {
		//   var torrents = this.get('torrents');

		//   _.each(torrents, function (torrent) {
		//     torrent.health = Common.healthMap[Common.calcHealth(torrent)];
		//   });

		//   this.set('torrents', torrents, {
		//     silent: true
		//   });
		// }
	});

	App.Model.Identity = Identity;
})(window.App);
