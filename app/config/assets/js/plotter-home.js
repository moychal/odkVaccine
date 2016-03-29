/**
 * Responsible for rendering the home screen.
 */
'use strict';
/* global odkTables */

function display() {

    var body = $('#main');
    // Set the background to be a picture.
    body.css('background-image', 'url(img/Agriculture_in_Malawi_by_Joachim_Huber_CClicense.jpg)');

    var viewPlotsButton = $('#view-plots');
    viewPlotsButton.on(
        'click',
        function() {
            odkTables.openTableToListView(
                'plot',
                null,
                null,
                'config/tables/plot/html/plot_list.html');
        }
    );

    var viewTeasButton = $('#view-visits');
    viewTeasButton.on(
        'click',
        function() {
            odkTables.openTableToListView(
                'visit',
                null,
                null,
                'config/tables/visit/html/visit_list.html');
        }
    );

}
