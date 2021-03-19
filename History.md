### Update 2.11.12
I've made some more effort to spruce up the back-end scaffolding.  As such, I've updated the collections in particular which were
giving me some trouble.

Of note, is the constructor to the Mongo.Collection:

```js
constructor() {
    super('CollectionName');

    this.publicFields = {};
    this.privateFields = {};
    this.deny({
      insert() { return true; },
      update() { return true; },
      remove() { return true; },
    });

    this.schema = {};
  }
```

Let me walk you through it -- first I've declared the collection name in the constructor in order to properly bind it.
Second, I move up the public and private fields, which are helpers to the RPC methods, so they are cleaner and clearer.
Next, I've also moved up the deny method into the constructor so it's cleaner.
Last, and certainly not least, I've added a way to define your schema.

...

"SAY WHAAAAAAAT?!" You exclaim? Yes, I've just made a simple schema object and it is checked using Meteor's 'check' package.

For example, in the insert statement, you'll see that if you have defined a schema it'll check the incoming document against
the schema for consistency.  Read more about Meteor's [check](https://docs.meteor.com/api/check.html) package.

```js
  insert(doc, callback) {
    if (this._hasSchema()) {
      check(doc, this.schema);
    }

    const result = super.insert(doc, callback);
    return result;
  }
```

Enjoy!


### Update 2.11.0
New AND improved -- The maka database connection generator!  Ok, so how can it be new AND improved?
Always wanted to connect to that cool postgresql geoserver?  Had the longing to hook-up with that Microsoft SQL instance?  Well now you can!

```sh
$ maka g:dbc sweet-geoserver --type=pgsql
```

This will not only scaffold out your new database connection into /imports/startup/server/dbc/ but it'll also make sure you have the proper npm packages.

Currently this only supports postgresql (pgsql) and Microsoft SQL (mssql).  Mysql and Mongo are en route.

Enjoy!


### Update 2.10.0
Drinking Mocha! While I love me some Jasmine, I think it's best to support the officially supported testing driver by Meteor.  Now when you scaffold your application you may define the following flag:
```sh
$ maka create mocha-app --test=mocha
```
At the moment, I don't have it configured with coverage reports like I do with Jasmine, but that's on the list.  Also, Mocha runs in headless browser mode because there isn't a nice way to display the client tests to the browser like there is for Jasmine.  So all the server and client tests will show up in the server console.

To change this, just open up your config/development/env.sh file and change the variables there.


Enjoy!

## UPDATE 2.9.0
Good evening!

I've been away a little bit, but I just decided to come back! I come with a gift!  REFLUX!

If you don't know what reflux is... well you should find out.  If you DO, then please help yourself to the new
reflux client engine and generator.

```sh
$ maka create reflux-app --client=reflux
```

```sh
$maka g:template new-store --store
```

Look for the new store in:
```sh
$ reflix-app/app/imports/ui/stores/new-store
```

Now, "what about actions?!" you fervently ask?  I'm not sure where to put those at the moment.  For all my dealings, they
sit just fine right in the stores... maybe my ignorance... I'm open to suggestions (and yes, I've already thought of a
directory in ./ui called "actions" but if that makes the MOST sense then so shall it be).

I also want to turn your attention to the new option when creating apps to NOT include 'withTracker'.  I've thought about
this long and hard... and I find that trying to use testing, meteor's reactivity and just another layer has been ever so
exhausting.  I'm not saying I don't love Meteor... after all.. Meteor Apps Kick Ass!  I'm just saying I don't have to
LIKE withTracker right now.  So if you would like to skip the inclusion of withTracker use this option.

```sh
$ maka create no-track-app --skip-tracker
```

For existing apps, if you want to disable the withTracker you'll just need to go into the .maka/config.json and add the following to the object:

```json
...
"features": {
    "withTracker": "false"
}
...
```


Anywho... I also removed all those boiler plate docstrings from the react templates. I may have gotten carried away with the boilerplate... 
