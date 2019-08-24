// ==UserScript==
// @name         wk-accuracy-tracker-dev
// @namespace    http://patrickayoup.com/
// @version      dev
// @description  Track your accuracy over time
// @author       Patrick Ayoup
// @include      *wanikani.com/*
// @exclude      *community.wanikani.com*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.2/Chart.min.js
// ==/UserScript==

(function() {
    /* global $, wkof, Chart */

    'use strict';

    const currentPath = window.location.pathname;

    console.debug('wk-accuracy-tracker loaded');
    console.debug(`Current Path: ${currentPath}`);

    function persistReview() {
        let storage = window.localStorage;
        const storageKey = `wkat`;

        const reviewTime = summaryData.last_review_date;

        let wkatData = storage.getItem(storageKey);

        if (!wkatData) {
            console.debug('WKAT Data does not exist in localStorage. Creating')
            wkatData = {
                'reviews': {}
            };
        } else {
            wkatData = JSON.parse(wkatData);
            console.debug('Loaded WKAT Data');
        }

        console.log(wkatData);

        if (wkatData.reviews[reviewTime]) {
            console.debug(`Review at ${reviewTime} already persisted`);
            return;
        }

        const reviewData = {
            'percentCorrect': parseInt($('#review-stats-answered-correctly .review-stats-value').text()),
            'radicalsCorrect': parseInt($('#review-stats-radicals .review-stats-value').text()),
            'totalRadicals': parseInt($('#review-stats-radicals .review-stats-total span').text()),
            'kanjiCorrect': parseInt($('#review-stats-kanji .review-stats-value').text()),
            'totalKanji': parseInt($('#review-stats-kanji .review-stats-total span').text()),
            'vocabCorrect': parseInt($('#review-stats-vocabulary .review-stats-value').text()),
            'totalVocab': parseInt($('#review-stats-vocabulary .review-stats-total span').text())
        };

        wkatData.reviews[reviewTime] = reviewData;

        storage.setItem(storageKey, JSON.stringify(wkatData));
        console.debug(`Persisted review at ${reviewTime}`);
    }

    function displayStats() {
        let dashboard = $('.dashboard .span12').first();
        let container = $('<section id="wk-accuracy-tracker"></section>');
        let chart = $('<canvas id="wk-accuracy-tracker-chart" width="1093" height="200"></canvas>');
        container.prepend(chart);
        dashboard.prepend(container);

        let storage = window.localStorage;
        const storageKey = `wkat`;
        let wkatData = storage.getItem(storageKey);

        let labels = null;
        let dataPoints = null;

        if (wkatData) {
            wkatData = JSON.parse(wkatData)
            let reviews = wkatData.reviews
            labels = Object.keys(reviews).filter(k => {
                return k !== 'undefined';
            }).map(k => {
                return new Date(k);
            });

            dataPoints = Object.values(reviews).map(r => {
                return r.percentCorrect;
            }).filter(v => {
                return v !== null;
            });
        } else {
            dataPoints = [];
        }

        console.debug(`Using Labels: ${labels}`);
        console.debug(`Using Datapoints: ${dataPoints}`);

        const data = {
            labels: labels,
            datasets: [
                {
                    label: 'Review Accuracy',
                    data:   dataPoints
                }
            ]
        };

        const options = {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }],
                xAxes: [{
                    ticks: {
                        display: false //this will remove only the label
                    }
                }]
            }
        };

        var ctx = chart.get(0).getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }

    if (currentPath === '/review') {
        persistReview();
    } else if (currentPath === '/dashboard' || currentPath === '/') {
        // Display Stats
        displayStats();
    }
})();
