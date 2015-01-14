(function (App) {
	'use strict';

	var About = Backbone.Marionette.ItemView.extend({
		template: '#about-tpl',
		className: 'about',

		ui: {
			success_alert: '.success_alert'
		},

		events: {
			'click .close-icon': 'closeAbout'
		},

		templateHelpers: {
			paragraphs: [
				'Extending the bitcoin blockchain to non-financial transactions',
				'Enabling premissionless commerce'
			]
		},

		onShow: function () {
			$('.filter-bar').hide();
			$('#header').addClass('header-shadow');

			Mousetrap.bind(['esc', 'backspace'], function (e) {
				App.vent.trigger('about:close');
			});
			$('.links').tooltip();
			console.log('Show about');
			$('#movie-detail').hide();
		},

		onClose: function () {
			Mousetrap.unbind(['esc', 'backspace']);
			$('.filter-bar').show();
			$('#header').removeClass('header-shadow');
			$('#movie-detail').show();
		},

		closeAbout: function () {
			App.vent.trigger('about:close');
		}

	});

	App.View.About = About;
})(window.App);
