(function (App) {
	'use strict';

	var IdentityBrowser = App.View.PCTBrowser.extend({
		collectionModel: App.Model.IdentityCollection,
		filters: {
			// genres: App.Config.genres,
			// sorters: App.Config.sorters
		}
	}, {
		displayName: 'IdentityBrowser'
	});

	App.View.IdentityBrowser = IdentityBrowser;
})(window.App);
