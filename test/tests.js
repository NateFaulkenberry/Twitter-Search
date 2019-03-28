QUnit.test( "Time Ago (Twitter-style date formatting)", function( assert ) {
    var now = timeago().format(Date.now());
    var minutes = timeago().format(Date.now() - 2 * 1000 * 60);
    var hours = timeago().format(Date.now() - 11 * 1000 * 60 * 60);
    var days = timeago().format(Date.now() - 48 * 1000 * 60 * 60);
    var weeks = timeago().format(Date.now() - 336 * 1000 * 60 * 60);

    assert.ok( now == "just now", "Now");
    assert.ok( minutes == "2 minutes ago", "Minutes");
    assert.ok( hours == "11 hours ago", "Hours" );
    assert.ok( days == "2 days ago", "Days");
    assert.ok( weeks == "2 weeks ago", "Weeks");

});

QUnit.test( "Twitter.ify (Parse Hash Tags, links, usernames)", function( assert) {
    var tweet = "This is a #test tweet @NateFaulk http://google.com";

    assert.ok( Twitter.ify.clean(tweet) == "This is a <a target=\"_blank\" class=\"twtr-hashtag\" href=\"http://twitter.com/search?q=%23test\">#test</a> tweet <a target=\"_blank\" class=\"twtr-atreply\" href=\"http://twitter.com/intent/user?screen_name=NateFaulk\">@NateFaulk</a> <a class=\"twtr-hyperlink\" target=\"_blank\" href=\"http://google.com\">http://google.com</a>", "Clean");
    assert.ok( Twitter.ify.hash(tweet) == "This is a <a target=\"_blank\" class=\"twtr-hashtag\" href=\"http://twitter.com/search?q=%23test\">#test</a> tweet @NateFaulk http://google.com", "Hash");
    assert.ok( Twitter.ify.at(tweet) == "This is a #test tweet <a target=\"_blank\" class=\"twtr-atreply\" href=\"http://twitter.com/intent/user?screen_name=NateFaulk\">@NateFaulk</a> http://google.com", "At");
    assert.ok( Twitter.ify.link(tweet) == "This is a #test tweet @NateFaulk <a class=\"twtr-hyperlink\" target=\"_blank\" href=\"http://google.com\">http://google.com</a>", "Link");
    assert.ok( Twitter.ify.bold(tweet, "tweet") == "This is a #test <b>tweet</b> @NateFaulk http://google.com", "Bold");
});