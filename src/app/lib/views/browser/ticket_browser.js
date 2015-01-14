(function (App) {
	'use strict';

	var TicketBrowser = App.View.PCTBrowser.extend({
		collectionModel: App.Model.TicketCollection,
		filters: {
			cities: App.Config.craigslist_cities,
			categories: App.Config.craigslist_categories
		}
	});

	App.View.TicketBrowser = TicketBrowser;
})(window.App);
