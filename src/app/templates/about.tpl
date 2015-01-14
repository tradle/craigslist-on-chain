<div class="about-container">
	<div class="fa fa-times close-icon"></div>
	<div class="overlay-content"></div>
	<div class="margintop"></div>
	<img class="icon-title" src="/src/app/images/logo-light-blue.png">
	<div class="content">
		<div class="title-version">
			<a href='https://github.com/mvayngrib/craigslist-app/CHANGELOG.md' class="links" data-toggle="tooltip" data-placement="top" title="<%= App.settings.releaseName %>"> <%= App.settings.releaseName %> </a>
		</div>
		<div class="text-about">
			<div class="full-text">
				<%= paragraphs.map(function(p) { return i18n.__(p) }).join('</br>') %>
			</div>
		</div>
		<div class="icons_social">
			<a href='http://tradle.io' data-toggle="tooltip" data-placement="top" title="http://tradle.io" class='links site_icon'></span></a>
			<a href='http://twitter.com/tradles' data-toggle="tooltip" data-placement="top" title="twitter.com/tradles" class='links twitter_icon'></span></a>
			<!--a href='http://www.fb.com/PopcornTimeTV' data-toggle="tooltip" data-placement="top" title="fb.com/PopcornTimeTV" class='links facebook_icon'></span></a-->
			<!--a href='http://gplus.to/PopcornTimeTV' data-toggle="tooltip" data-placement="top" title="gplus.to/PopcornTimeTV" class='links google_icon'></span></a-->
			<a href='http://github.com/tradle/craigslist-on-chain'data-toggle="tooltip" data-placement="top" title="github.com/urbien/tradle" class='links stash_icon'></span></a>
			<!--a href='http://blog.popcorntime.io' data-toggle="tooltip" data-placement="top" title="blog.popcorntime.io" class='links blog_icon'></span></a-->
			<!--a href='http://discuss.popcorntime.io' data-toggle="tooltip" data-placement="top" title="discuss.popcorntime.io" class='links forum_icon'></span></a-->
		</div>
		<div class="last-line">
			<%= i18n.__("Made with") %> <span style="color:#e74c3c;">&#10084;</span> <%= i18n.__("by a bunch of geeks from All Around The World") %>
		</div>
	</div>
</div>