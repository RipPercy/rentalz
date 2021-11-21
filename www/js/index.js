var ERROR = 'ERROR';

// Create or Open Database.
var db = window.openDatabase('RentalZ', '1.0', 'RentalZ', 20000);

// To detect whether users use mobile phones horizontally or vertically.
$(window).on('orientationchange', onOrientationChange);

// Display messages in the console.
function log(message, type = 'INFO') {
    console.log(`${new Date()} [${type}] ${message}`);
}

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        log('Portrait.');
    }
    else {
        log('Landscape.');
    }
}

// To detect whether users open applications on mobile phones or browsers.
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    $(document).on('ready', onDeviceReady);
}

// Display errors when executing SQL queries.
function transactionError(tx, error) {
    log(`SQL Error ${error.code}. Message: ${error.message}.`, ERROR);
}

// Run this function after starting the application.
function onDeviceReady() {
    log(`Device is ready.`);

    db.transaction(function (tx) {
        // Create table COMMENT.
        var query = `CREATE TABLE IF NOT EXISTS Apartment (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                           Types TEXT NOT NULL,
                                                           Name TEXT NOT NULL,
                                                           Address TEXT NOT NULL,
                                                           Bedrooms TEXT NOT NULL,
                                                           Furniture TEXT NOT NULL,
                                                           Price NUMBER NOT NULL,
                                                           Note TEXT NOT NULL,
                                                           Reporter TEXT NOT NULL,
                                                           CreatedDate DATE NOT NULL)`;
        tx.executeSql(query, [], function (tx, result) {
            log(`Create table 'Apartment' successfully.`);
        }, transactionError);
    });
}

// Submit a form to adding apartments.
$(document).on('submit', '#page-addapartment #frm-addapartment', registerApartment);

function registerApartment(e) {
    e.preventDefault();

    var types = $('#page-addapartment #frm-addapartment #house-type').val();
    var name = $('#page-addapartment #frm-addapartment #name').val();
    var address = $('#page-addapartment #frm-addapartment #address').val();
    var bedrooms = $('#page-addapartment #frm-addapartment #bedrooms').val();
    var furniture = $('#page-addapartment #frm-addapartment #furniture').val();
    var price = $('#page-addapartment #frm-addapartment #rent-price').val();
    var note = $('#page-addapartment #frm-addapartment #note').val();
    var reporter = $('#page-addapartment #frm-addapartment #reporter').val();
    var createddate = new Date();

    db.transaction(function (tx) {
            var query = `INSERT INTO Apartment (Types, Name, Address, Bedrooms, Furniture, Price, Note, Reporter, CreatedDate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            tx.executeSql(query, [types, name, address, bedrooms, furniture, price, note, reporter, createddate], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                log(`Your apartment is added successfully`);

                // Reset the form.
                $('#frm-addapartment').trigger('reset');
                $('#page-addapartment #error').empty();
                $('#name').focus();

                // Inform adding apartment successfully
                alert('Your apartment is added successfully');
            }
    });
}

// Display Apartment List.
$(document).on('pagebeforeshow', '#page-home', showApartment);

function showApartment() {
    db.transaction(function (tx) {
        var query = 'SELECT Id, Types, Name, Address, Bedrooms, Furniture, Price, Note Reporter, CreatedDate FROM Apartment';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of apartments successfully.`);

            // Prepare the list of accounts.
            var listApartment = `<ul id='list-apartment' data-role='listview' data-filter='true' data-filter-placeholder='Search apartments...'
                                                     data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let apartment of result.rows) {
                listApartment += `<li><a data-details='{"Id" : ${apartment.Id}}'>
                                    <img src='img/rentalz.png'>
                                    <h3>Name of provider: ${apartment.Name}</h3>
                                    <p>Type of house: ${apartment.Types}</p>
                                    <p>Price: ${apartment.Price}</p>
                                    <p>Reporter: ${apartment.Reporter}</p>
                                    <p>CreatedDate: ${apartment.CreatedDate}</p>
                                </a></li>`;
            }
            listApartment += `</ul>`;

            // Add list to UI.
            $('#page-home #list-apartment').empty().append(listApartment).listview('refresh').trigger('create');

            log(`Show list of apartments successfully.`);
        }
    });
}

// Delete Apartment.
$(document).on('submit', '#page-detail #frm-delete', deleteApartment);
$(document).on('keyup', '#page-detail #frm-delete #txt-delete', confirmDeleteApartment);

function confirmDeleteApartment() {
    var text = $('#page-detail #frm-delete #txt-delete').val();

    if (text == 'Confirm') {
        $('#page-detail #frm-delete #btn-delete').removeClass('ui-disabled');
    }
    else {
        $('#page-detail #frm-delete #btn-delete').addClass('ui-disabled');
    }
}

function deleteApartment(e) {
    e.preventDefault();

    var id = localStorage.getItem('currentApartmentId');

    db.transaction(function (tx) {
        var query = 'DELETE FROM Apartment WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Delete apartment '${id}' successfully.`);

            $('#page-detail #frm-delete').trigger('reset');

            $.mobile.navigate('#page-home', { transition: 'none' });
        }
    });
}

// Search for apartment
$(document).on('submit', '#page-search #frm-search', search)

function search() {
    var name = $('#page-search #frm-search #name').val();
    var address = $('#page-search #frm-search #address').val();
    var price = $('#page-search #frm-search #price').val();
    var types = $('#page-search #frm-search #types').val();
    var bedrooms = $('#page-search #frm-search #bedrooms').val();
    var furniture = $('#page-search #frm-search #furniture').val();

db.transaction(function (tx) {
        var query = 'SELECT Id, Name, Address, Price, Types, Bedrooms, Furniture FROM Apartment WHERE';

        if (name) {
            query += ` Name LIKE "%${name}%"   AND`;
        }

        if (address) {
            query += ` Address LIKE "%${address}%"   AND`;
        }

        if (price) {
            query += ` Price >= ${price}   AND`;
        }

        if (types) {
            query += ` Types LIKE "%${types}%"   AND`;
        }

        if (bedrooms) {
            query += ` Bedrooms LIKE "%${bedrooms}%"   AND`;
        }

        if (furniture) {
            query += ` Furniture LIKE "%${furniture}%"   AND`;
        }

        query = query.substring(0, query.length - 6);

        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            log(`Get list of accounts successfully.`);

            // Prepare the list of apartments.
            var listApartment = `<ul id='list-apartment' data-role='listview' class='ui-nodisc-icon ui-alt-icon'>`;
            for (let apartment of result.rows) {
                listApartment += `<li><a data-details='{"Id" : ${apartment.Id}}'>
                                    <img src='img/rentalz.png'>
                                    <h3>Name of provider: ${apartment.Name}</h3>
                                    <p>Address: ${apartment.Address}</p>
                                    <p>Price: ${apartment.Price}</p>
                                    <p>Types: ${apartment.Types}</p>
                                    <p>Bedrooms: ${apartment.Bedrooms}</p>
                                    <p>Furniture: ${apartment.Furniture}</p>
                                </a></li>`;
            }
            listApartment += `</ul>`;

            // Add list to UI.
            $('#page-search #list-apartment').empty().append(listApartment).listview('refresh').trigger('create');

            log(`Show list of apartments successfully.`);
        }
    });
}

// Save Apartment Id.
$(document).on('vclick', '#list-apartment li a', function (e) {
    e.preventDefault();

    var id = $(this).data('details').Id;
    localStorage.setItem('currentApartmentId', id);

    $.mobile.navigate('#page-detail', { transition: 'none' });
});

// Show Apartment Details.
$(document).on('pagebeforeshow', '#page-detail', showApartmentDetail);

function showApartmentDetail() {
    var id = localStorage.getItem('currentApartmentId');
    var createddate = new Date();

    db.transaction(function (tx) {
        var query = 'SELECT * FROM Apartment WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            var errorMessage = 'Apartment not found.';
            var name = errorMessage;

            if (result.rows[0] != null) {
                log(`Get details of apartment have ID '${id}' successfully.`);

                name = result.rows[0].Name;
                types = result.rows[0].Types;
                bedrooms = result.rows[0].Bedrooms;
                furniture = result.rows[0].Furniture;
                price = result.rows[0].Price;
                address = result.rows[0].Address;
                note = result.rows[0].Note;
                reporter = result.rows[0].Reporter;
                createddate = result.rows[0].CreatedDate;
            }
            else {
                log(errorMessage, ERROR);

                $('#page-detail #btn-update').addClass('ui-disabled');
                $('#page-detail #btn-delete-confirm').addClass('ui-disabled');
            }

            $('#page-detail #id').val(id);
            $('#page-detail #name').val(name);
            $('#page-detail #types').val(types);
            $('#page-detail #bedrooms').val(bedrooms);
            $('#page-detail #furniture').val(furniture);
            $('#page-detail #price').val(price);
            $('#page-detail #address').val(address);
            $('#page-detail #note').val(note);
            $('#page-detail #reporter').val(reporter);
            $('#page-detail #createddate').val(createddate);
        }
    });
}