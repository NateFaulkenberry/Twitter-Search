<?php
    require_once 'twitter-php/twitter.class.php';

    $CONSUMER_KEY = 'IyvuuUQSdVlIrTTl6mVp1ea46';
    $CONSUMER_SECRET = 'OXhmeTaW6bJp4D7X0YV56SWYMoGjadeqzIdYdjxeQv3Ow4jRyy';
    $ACCESS_TOKEN = '1111279003896303616-AZrA4IOX1cDhizJhAm0xTzLypDpiZs';
    $ACCESS_TOKEN_SECRET = '2JwSbJJux39B34t3LKoomS59n1kYApYpH4AwQPreBVAb4';

    $twitter = new Twitter($CONSUMER_KEY, $CONSUMER_SECRET, $ACCESS_TOKEN, $ACCESS_TOKEN_SECRET);

    // retrieve data
    $count = $_POST['count'];
    $q = $_POST['q'];

    $api = 'search/tweets.json';

    // api data
    $params = array(
        'q' => $q,
        'count' => $count,
        'includes_rts' => false
    );

    try {
        $results = $twitter->request($api, 'GET', $params);
        echo json_encode($results);
    } catch (TwitterException $e) {
        http_response_code(400);
    }
?>