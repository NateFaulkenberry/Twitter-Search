Twitter = {

    twitterFeed: '#twitter-feed',
    twitterSearch: '#twitter-search',
    twitterCard: '#twitter-card',
    twitterGeocode: '#twitter-geocode',
    twitterMyLocation: '#twitter-my-location',
    twitterSearchClear: '#twitter-search-clear',
    twitterShare: '#twitter-share',

    twitterCardTemplate: null,

    alert: $('#twitter-alerts').find('div.alert'),

    errorInvalid: '#error-invalid',
    errorGeocode: '#error-geocode',
    errorMyLocation: '#error-my-location',
    errorNoResults: '#error-no-results',
    errorServer: '#error-server',

    successSearch: '#success-search',

    loading: '#loading',

    tutorialSearch: '.tutorial-search',

    shareTweet: '<a href="https://twitter.com/share?ref_src=twsrc%5Etfw" class="twitter-share-button" data-show-count="false" data-text="I\'m using Twitter Search!" data-size="large" data-hashtags="awesome, search, great, job!">Tweet</a><script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>',

    // called on jQuery ready
    init: function() {
        var that = this;

        // Set underscore template variable for twitter cards
        _.templateSettings.variable = "tc";

        // Pre-compile twitter card template
        that.twitterCardTemplate = _.template(
            $(that.twitterCard).html()
        );

        // search form
        $(that.twitterSearch).submit(function(e) {
            that.loadTweets($(this).serializeArray());
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // make twitter feed sortable
        $(that.twitterFeed).sortable({
            placeholder: "ui-state-highlight"
        });

        $(that.twitterFeed).disableSelection();

        // add my location function to search
        $(that.twitterMyLocation).click(function(e) {
            that.getLocation(
                function(coordinates) {
                    $(that.twitterGeocode).val(coordinates.latitude + ',' + coordinates.longitude);
                },
                function() {
                    $(that.errorMyLocation).show();
                }
            );
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // add event listener for twitter card remove buttons
        $(that.twitterFeed).on('click', 'a.twitter-card-remove', function(e) {
            $(this).closest('li').remove();
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // add clear search functionality
        $(that.twitterSearchClear).click(function(e) {
            that.clearSearch();
            history.pushState({}, '', "?username=&term=&geocode=&count=");
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // tutorial links
        $(that.tutorialSearch).not('.location').click(function(e) {
            history.pushState({}, '', $(this).attr('href'));
            that.urlParamsLoadTweets(true);
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        $(that.tutorialSearch).filter('.location').click(function(e) {
            $(that.twitterMyLocation).triggerHandler('click');
            e.preventDefault();
            e.stopImmediatePropagation();
        });

        // add popstate event listener, used to manage search history
        $(window).on('popstate', function(e) {
            that.urlParamsLoadTweets(true);
        });

        // inject Share button html
        $(that.twitterShare).html(that.shareTweet);

        // fetch search results if page was loaded with URL params
        that.urlParamsLoadTweets();
    },

    /**
     * load search result tweets from URL params
     * @param isPopstate Boolean, true when called from popstate event, used to clear search form when no URL params exist
     */
    urlParamsLoadTweets: function( isPopstate ) {
        var that = this;
        var url = new URL(window.location.href);
        var inputs = $(that.twitterSearch).find('input');

        var username = url.searchParams.get('username') || '';
        var term = url.searchParams.get('term') || '';
        var geocode = url.searchParams.get('geocode') || '';
        var count = url.searchParams.get('count') || '';

        inputs.filter('[name=username]').val(username);
        inputs.filter('input[name=term]').val(term);
        inputs.filter('input[name=geocode]').val(geocode);
        inputs.filter('input[name=count]').val(count);

        // don't load tweets unless there's a parameter
        if (username || term || geocode || count ) {
            that.loadTweets([
                {name: 'username', value: username},
                {name: 'term', value: term},
                {name: 'geocode', value: geocode},
                {name: 'count', value: count}
            ], isPopstate);

            return;
        }

        // if there are no params, but isPopstate is true, we'll just clear search
        if (isPopstate) {
            that.clearSearch();
        }
    },

    /**
     *
     * @param serializeArray Array, an array of objects { name, value } for search username, term, geocode, and count
     * @param isPopstate Boolean, true when called from popstate event, used to prevent pushing duplicate page states to history
     */
	loadTweets: function( serializeArray, isPopstate ) {
        var that = this;
        var query;

        var searchUsername = _.findWhere(serializeArray, { name: 'username' }).value;
        var searchTerm = _.findWhere(serializeArray, { name: 'term' }).value;
        var searchGeocode = _.findWhere(serializeArray, { name: 'geocode' }).value;
        var searchCount = _.findWhere(serializeArray, { name: 'count' }).value;

        // support searching for multiple users
        var users = _.map(searchUsername.split(' '), function(user) {
            return 'from:' + user;
        });

        if ( !isPopstate ) {
            history.pushState({}, '', "?username=" + searchUsername + "&term=" + searchTerm + "&geocode=" + searchGeocode + "&count=" + searchCount);
        }
        // convert [user1,user2,user3] to "user1+OR+user2+OR+user3"
        users = users.toString().replace(/,/g, '+OR+');

        // clear previous tweets
        $(that.twitterFeed).empty();

        // hide any alerts
        $(that.alert).hide();

        // update share Tweet button
        $(that.twitterShare).html(that.shareTweet);

        // make sure we have a valid geocode
        // RegExp from: https://stackoverflow.com/questions/3518504/regular-expression-for-matching-latitude-longitude-coordinates
        if (searchGeocode) {
            var regex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

            // remove any spaces from string, which match this regexp, but wouldn't be valid in Twitter's search API
            searchGeocode = searchGeocode.replace(/\s/g, '');

            if (!searchGeocode.match(regex)) {
                $(that.errorGeocode).show();
                return;
            }
        }

        // add search terms and search usernames to query string
        query = searchUsername ? searchTerm + '+' + users : searchTerm;

        // add geocode to query string
        query = searchGeocode ? query + ' geocode:' + searchGeocode + ',15mi' : query;

        // if there's no query we have nothing to search
        if (!query) {
            $(that.errorInvalid).show();
            return;
        }

		$.ajax({
			url: 'backend/tweets.php',
			type: 'post',
			dataType: 'json',
			data: {
                q: query,
                count: searchCount
            },
            beforeSend: function() {
                $(that.loading).show();
            },
            complete: function() {
                $(that.loading).hide();
            },
            error: function() {
                $(that.errorServer).show();
            },
			success: function(tweets, textStatus, xhr) {

                // if not results were found show error message and return
                if (!tweets.statuses.length) {
                    $(that.errorNoResults).show();
                    return;
                }

                // show search success message and update search result count
                $(that.successSearch).show()
                    .find('span.count').text(tweets.statuses.length)
                    .end()
                    .find('span.plural').toggle(tweets.statuses.length > 1);

				// append tweets into page
                _.each(tweets.statuses, function(tweet) {

                    // if there was a search term, we'll add it to the tweet object so we can match and style it later
                    if (searchTerm) {
                        tweet.searchTerm = searchTerm;
                    }

                    // append Twitter card template to Twitter feed
                    $(that.twitterFeed).append(
                        that.twitterCardTemplate(tweet)
                    );
                });
			}	

		});
		
	},

    // resets search to default state
    clearSearch: function() {
        $(this.twitterSearch).find('input').val('');
        $(this.twitterFeed).empty();
        $(this.alert).hide();
        $(this.twitterShare).html(this.shareTweet);
    },

    /**
     * @param success Function callback for geolocation success
     * @param fail Function callback for geolocation failure
     */
    getLocation: function( success, fail ) {
        // check for stored location cookie first
        var coordinates = Cookies.get('location');

        success = success || function() {};
        fail = fail || function() {};

        // location cookie is set, no need to go further
        if (coordinates) {
            success(JSON.parse(coordinates));
            return;
        }

        // no cookie, try to lookup geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(

                // success
                function(position) {

                    coordinates = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    // create location cookie and store coordinates that expires in 7 days
                    Cookies.set('location', coordinates, { expires: 7 });

                    success(coordinates);
                },

                // fail
                function() {
                    fail();
                }
            );
        } else {
            fail();
        }
    },
	
		
	/**
      * @param dateString String twitter date string returned from Twitter API
      * @return String relative time like "2 minutes ago"
      */
    timeAgo: function(dateString) {
        var timeagoInstance = timeago();
        return timeagoInstance.format(dateString);
	},
    
	
    /**
      * The Twitalinkahashifyer!
      * http://www.dustindiaz.com/basement/ify.html
      * Eg:
      * ify.clean('your tweet text');
      */
    ify: {
        link: function(tweet) {
            return tweet.replace(/\b(((https*\:\/\/)|www\.)[^\"\']+?)(([!?,.\)]+)?(\s|$))/g, function(link, m1, m2, m3, m4) {
              var http = m2.match(/w/) ? 'http://' : '';
              return '<a class="twtr-hyperlink" target="_blank" href="' + http + m1 + '">' + ((m1.length > 25) ? m1.substr(0, 24) + '...' : m1) + '</a>' + m4;
            });
        },

        at: function(tweet) {
            return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20})/g, function(m, username) {
              return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/intent/user?screen_name=' + username + '">@' + username + '</a>';
            });
        },

        list: function(tweet) {
            return tweet.replace(/\B[@＠]([a-zA-Z0-9_]{1,20}\/\w+)/g, function(m, userlist) {
              return '<a target="_blank" class="twtr-atreply" href="http://twitter.com/' + userlist + '">@' + userlist + '</a>';
            });
        },

        hash: function(tweet) {
            return tweet.replace(/(^|\s+)#(\w+)/gi, function(m, before, hash) {
              return before + '<a target="_blank" class="twtr-hashtag" href="http://twitter.com/search?q=%23' + hash + '">#' + hash + '</a>';
            });
        },

        clean: function(tweet) {
            return this.hash(this.at(this.list(this.link(tweet))));
        },

        bold: function(tweet, searchTerm) {
            var regex = new RegExp(searchTerm, 'gi');
            return tweet.replace(regex, '<b>' + searchTerm + '</b>');
        }
    }
};