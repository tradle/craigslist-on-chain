(function (App) {
	'use strict';

	var TicketCollection = App.Model.Collection.extend({
		model: App.Model.Listing,
		popid: 'id',
		type: 'Tickets',
		getProviders: function () {
			return {
				listings: App.Config.getProvider('ticket')
			};
		},
		fetch: function (options) {
			// START copied from generic_collection
			var self = this;

			if (this.state === 'loading' && !this.hasMore) {
				return;
			}

			this.state = 'loading';
			self.trigger('loading', self);
			// END copied from generic_collection

			var provider = this.providers.listings;
			var promise = provider.fetch(this.filter);

			// START copied from generic_collection
			promise.done(function (data) {
				var results = data.results;
				self.add(results);

				// If any of the providers "haveMore", set it to true
				self.hasMore = data.hasMore;
				// Calculate the sum of all results returned by 1 or more providers
				if (self.hasMore && results.length < 38) {
					self.hasMore = false;
				}

				self.trigger('sync', self);
				self.state = 'loaded';
				self.trigger('loaded', self, self.state);
			});
			// END copied from generic_collection
		}
	});

	App.Model.TicketCollection = TicketCollection;
})(window.App);
