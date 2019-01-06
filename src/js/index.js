function DatabaseText(t) {
    return (
        '<li><a class="database green-text" href="#" onclick="loadTables(\'' +
        t +
        "')\"></i>" +
        t +
        '</a><ol class="tables" id="' +
        t +
        '"></ol></li>'
    );
}

function showSQL() {
    var text =
        "<textarea id='sqlText' rows='10' cols='40'></textarea><br><button onclick='sendSQL()'>Go</button><br><div id='sqlResult'></div>";
    $("#result").html(text);
    $("textarea").linedtextarea();
}

function sendSQL(t) {
    t = $("#sqlText").html();
    $.ajax({
        url: "sql.php?db=" + selectedDB + "&sql=" + t,
        success: function(r) {
            r = JSON.parse(r);
        }
    });
}

var selectedDB;
var selectedTable;

function loadTables(t) {
    if ($("#" + t).html().length) {
        $("#" + t).html("");
        selectedDB = "";
    } else {
        selectedDB = t;
        $.ajax({
            url: "sql.php?db=" + t + "&sql=SHOW TABLES",
            success: function(r) {
                r = JSON.parse(r);
                for (var i = 0; i < r.length; i++) {
                    $("#" + t).append(
                        '<a class="table green-text" href="#" onclick="showTable(\'' +
                            r[i]["Tables_in_" + t] +
                            "')\"><li>" +
                            r[i]["Tables_in_" + t] +
                            "</li></a>"
                    );
                }
                $(".tables:not(#" + t + ")").html("");
            }
        });
    }
}

function saveOption() {
    var url = "sql.php?config=cred&server=" +
            escape($("#option-ip").val()) +
            "&password=" +
            escape($("#option-pass").val()) +
            "&user=" +
            escape($("#option-user").val());
    
    $.ajax({
        url: url,
        success: function(e) {
            console.log(e);
            showDatabases();
        }
    });
}

function showTable(t) {
    $("#result").html("");
    selectedTable = t;
    var selection = "";
    var columns;
    $.ajax({
        url: "sql.php?db=" + selectedDB + "&sql=SHOW COLUMNS FROM " + t,
        success: function(r) {
            r = JSON.parse(r);
            columns = r;

            for (var i = 0; i < r.length; i++) {
                if (!r[i].Type.includes("blob")) {
                    selection += r[i].Field + ",";
                }
            }
            selection = selection.slice(0, -1);
            $.ajax({
                url:
                    "sql.php?db=" +
                    selectedDB +
                    "&sql=SELECT " +
                    selection +
                    " FROM " +
                    t,
                success: function(r) {
                    r = JSON.parse(r);

                    var text =
                        "<table class='sortable' id='table'><thead><tr><th></th>";

                    for (var i = 0; i < columns.length; i++) {
                        text +=
                            '<th class="green-text btn-link">' +
                            columns[i].Field +
                            "</th>";
                    }

                    text += "</tr></thead>";

                    for (var i = 0; i < r.length; i++) {
                        text +=
                            "<tr><td class='delete'><button onclick='del()' class='del waves-effect waves-light'><i class='fa fa-minus-circle fa-2x red-text'></i></button></td>";

                        for (var j = 0; j < columns.length; j++) {
                            if (r[i][Object.keys(r[i])[j]] != null) {
                                text +=
                                    "<td><span class='textfield' >" +
                                    r[i][Object.keys(r[i])[j]] +
                                    "</span></td>";
                            } else {
                                text += "<td>blob</td>";
                            }
                        }
                        text += "</tr>";
                    }

                    text +=
                        "<tr><td class='add'><button class='add waves-effect waves-light'><i class='fa fa-plus-circle fa-2x green-text'></i></button></td>";

                    for (var i = 0; i < columns.length; i++) {
                        text +=
                            "<td><textarea style='resize:both; width:50px;height:30px'></textarea></td>";
                    }

                    text += "</tr>";

                    text += "</table>";
                    $("#result").html(text);
                    sorttable.makeSortable(
                        document.getElementsByTagName("table")[1]
                    );

                    textfield();
                    del();
                    add();
                }
            });
        }
    });
}

function add() {
    $(".add").on("click", function() {
        //DELETE FROM table_name WHERE condition;
        var sql =
            "sql.php?db=" +
            selectedDB +
            "&sql=INSERT INTO " +
            selectedTable +
            " VALUES (";

        for (var i = 1; i < $(this).parents()[1].cells.length; i++) {
            if ($(this).parents()[1].cells[i].children[0].value != "blob") {
                if ($(this).parents()[1].cells[i].children[0].value == "") {
                    sql += ", NULL";
                } else {
                    sql +=
                        ", '" +
                        $(this).parents()[1].cells[i].children[0].value +
                        "'";
                }
            }
        }

        sql = sql.replace(", ", "");

        sql += ")";
        console.log(sql);

        $.ajax({
            url: sql,
            success: function(r) {
                console.log(r);
                showTable(selectedTable);
            }
        });
    });
}

function del() {
    $(".del").on("click", function() {
        //DELETE FROM table_name WHERE condition;
        var sql =
            "sql.php?db=" +
            selectedDB +
            "&sql=DELETE FROM " +
            selectedTable +
            " WHERE";

        for (var i = 1; i < $(this).parents()[1].cells.length; i++) {
            if ($(this).parents()[1].cells[i].innerHTML != "blob") {
                if (
                    $(this).parents()[1].cells[i].children[0].nodeName !=
                    "TEXTAREA"
                ) {
                    sql +=
                        " AND " +
                        $(this)
                            .parent()
                            .closest("table")
                            .find("th")
                            .eq($(this).parents()[1].cells[i].cellIndex)[0]
                            .innerHTML +
                        " = '" +
                        $(this).parents()[1].cells[i].children[0].innerHTML +
                        "'";
                } else {
                    sql +=
                        " AND " +
                        $(this)
                            .parent()
                            .closest("table")
                            .find("th")
                            .eq($(this).parents()[1].cells[i].cellIndex)[0]
                            .innerHTML +
                        " = '" +
                        prev +
                        "'";
                }
            }
        }

        sql = sql.replace(" AND", "");

        $.ajax({
            url: sql,
            success: function(r) {
                // showTable(selectedTable);
            }
        });
        showTable(selectedTable);
    });
}

function textfield() {
    $(".textfield").on("dblclick", function() {
        $(this).changeElementType("textarea");
        var prev;
        $(".textfield")
            .on("focus", function() {
                prev = this.value;
            })
            .change(function() {
                this.innerHTML = $(this).val();
                console.log($(this).parent()[0].cellIndex);

                var sql =
                    "sql.php?db=" +
                    selectedDB +
                    "&sql=UPDATE " +
                    selectedTable +
                    " SET " +
                    $(this)
                        .parent()
                        .closest("table")
                        .find("th")
                        .eq(
                            $(this)
                                .parent()
                                .index()
                        )[0].innerHTML +
                    " = '" +
                    $(this).val() +
                    "' WHERE";

                for (var i = 1; i < $(this).parents()[1].cells.length; i++) {
                    if ($(this).parents()[1].cells[i].innerHTML != "blob") {
                        if (
                            $(this).parents()[1].cells[i].children[0]
                                .nodeName != "TEXTAREA"
                        ) {
                            sql +=
                                " AND " +
                                $(this)
                                    .parent()
                                    .closest("table")
                                    .find("th")
                                    .eq(
                                        $(this).parents()[1].cells[i].cellIndex
                                    )[0].innerHTML +
                                " = '" +
                                $(this).parents()[1].cells[i].children[0]
                                    .innerHTML +
                                "'";
                        } else {
                            sql +=
                                " AND " +
                                $(this)
                                    .parent()
                                    .closest("table")
                                    .find("th")
                                    .eq(
                                        $(this).parents()[1].cells[i].cellIndex
                                    )[0].innerHTML +
                                " = '" +
                                prev +
                                "'";
                        }
                    }
                }

                sql = sql.replace(" AND", "");

                $.ajax({
                    url: sql,
                    success: function(r) {
                        // showTable(selectedTable);
                    }
                });

                $(this).changeElementType("span");
                textfield();
            });
    });
}

var g;

function showDatabases() {
    $.ajax({
        url: "sql.php?sql=SHOW DATABASES",
        success: function(r) {
            r = JSON.parse(r);
            $("#database-list").html("");
            for (var i = 0; i < r.length; i++) {
                $("#database-list").append(DatabaseText(r[i].Database));
            }
            $("#database-list").addClass("green-text");
        }
    });
}

$.fn.changeElementType = function(newType) {
    var attrs = {};

    $.each(this[0].attributes, function(idx, attr) {
        attrs[attr.nodeName] = attr.nodeValue;
    });

    var newelement = $("<" + newType + "/>", attrs).append($(this).contents());
    this.replaceWith(newelement);
    return newelement;
};

$(document).ready(function() {
    showDatabases();
    selectedDB = "chat";
    showTable("messages");
    loadTables(selectedDB);
});

function options() {
    $("#options").toggle();
    $("#result").toggle();
}

function sortTable(n) {
    var table,
        rows,
        switching,
        i,
        x,
        y,
        shouldSwitch,
        dir,
        switchcount = 0;
    table = document.getElementById("table");
    switching = true;
    //Set the sorting direction to ascending:
    dir = "asc";
    /*Make a loop that will continue until
    no switching has been done:*/
    while (switching) {
        //start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /*Loop through all table rows (except the
        first, which contains table headers):*/
        for (i = 1; i < rows.length - 1; i++) {
            //start by saying there should be no switching:
            shouldSwitch = false;
            /*Get the two elements you want to compare,
            one from current row and one from the next:*/
            x = rows[i].getElementsByTagName("TD")[n];
            y = rows[i + 1].getElementsByTagName("TD")[n];
            /*check if the two rows should switch place,
            based on the direction, asc or desc:*/
            if (!isNaN(Number(x.innerHTML))) {
                if (dir == "asc") {
                    if (Number(x.innerHTML) > Number(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else if (dir == "desc") {
                    if (Number(x.innerHTML) < Number(y.innerHTML)) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            } else {
                if (dir == "asc") {
                    if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                } else if (dir == "desc") {
                    if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                        //if so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /*If a switch has been marked, make the switch
            and mark that a switch has been done:*/
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
            //Each time a switch is done, increase this count by 1:
            switchcount++;
        } else {
            /*If no switching has been done AND the direction is "asc",
            set the direction to "desc" and run the while loop again.*/
            if (switchcount == 0 && dir == "asc") {
                dir = "desc";
                switching = true;
            }
        }
    }
}
