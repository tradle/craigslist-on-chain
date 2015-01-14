(function (App) {
	'use strict';

	var Filter = Backbone.Model.extend({
		defaults: {
			genres: [],
			cities: [],
			categories: [],
			sorters: [],
			types: [],
			order: -1
		},

		initialize: function () {
			this.set('sorter', this.get('sorter') || this.get('sorters')[0]);
			this.set('genre', this.get('genre') || this.get('genres')[0]);
			this.set('city', this.get('city') || this.get('cities')[0]);
			this.set('category', this.get('category') || this.get('categories')[0]);
			this.set('type', this.get('type') || this.get('types')[0]);
			this.set('order', this.get('order') || -1);
		}
	});

	App.Model.Filter = Filter;
})(window.App);
