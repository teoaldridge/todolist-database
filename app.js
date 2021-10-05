//Tools
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

//ejs
app.set("view engine", "ejs");
//bodyParser
app.use(bodyParser.urlencoded({
  extended: true
}));
//express
app.use(express.static("public"));
//Connect to MongoDB Atlas
//Includes User Name and Password, which I have deleted when sharing on GitHub
mongoose.connect("mongodb+srv://user-name:password3@cluster0.eibet.mongodb.net/todolistDB");

//Connect the App with MongoDB Database:

//CreateMongoose collection called "items" with each item having a name with a value of "string":
//Schema
const itemsSchema = {
  name: String
};
//Create Mongoose model which creates the collection "items"
const Item = mongoose.model("Item", itemsSchema);

//Start (default) items:
const item1 = new Item({
  name: "Welcome to your to do list :)"
});

const item2 = new Item({
  name: "Hit the + button to add an item."
});

const item3 = new Item({
  name: "<-- Hit this checkbox to delete an item."
});

const startItems = [item1, item2, item3];

//Create Mongoose collection, called "lists", so users can have multiple lists
//Schema
const listSchema = {
  name: String,
  items: [itemsSchema]
};
//Mongoose model which creates the collection "lists"
const List = mongoose.model("Model", listSchema, "lists");

//Create a function which makes sure the start items get added only once to a new list.
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(startItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved the new items to the DB.")
        }
        res.redirect("/");
      });
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });
});

//Connect with list.ejs
//Get from list.ejs the values of the list's name, the item's name, and the new item's name
app.post("/", function(req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  //Ensure that the items, added to each list, keep belonging to their corresponding list
  // and don't get sent to the default "Today" list.
  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

//Make sure that no matter how people write the new list name they create,
// it gets presented on the app as capitalized
app.get("/:customListName", function(req, res) {
  customListName = _.capitalize(req.params.customListName);

  //Create new lists and show existing lists, when typed after the domain on the address bar: /example

  List.findOne({
    name: customListName
  }, function(err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: startItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list in list.ejs
        res.render("list", {
          //Send the foundList.name as "listTitle" in list.ejs
          listTitle: foundList.name,
          //Send the foundList.items as "newListItems" in list.ejs
          newListItems: foundList.items
        });
      }
    }
  });

});

//Delete items
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }
});

//Set app to render About page when /about is added to the domain name
app.get("/about", function(req, res) {
  res.render("about");
});


//Set app to run on any port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server is running successfully");
});
