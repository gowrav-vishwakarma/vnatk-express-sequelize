# QuickStart

## Installation
VES can be installed in your existing express-sequelize project as well.

### Step 1.0: setup express app

the below example shows to setup a complete new project from scratch, but if you have all set you just need to do `npm install --save vnatk-express-sequelize`


Considering we are in "Your Project Root Folder"

lets create express app (Server/service) from scratch, you are welcome to use any other way or manual if you know what you are doing

```bash
### FOR NEW SERVICE SETUP

#install express-generator globally, its easy to do setup with this
$yourProjectRoot> npm install -g express-generator
...
$yourProjectRoot> express server --no-view
...
#lets check if a folder with server name created or not
$yourProjectRoot> ls
server

#a default structure is also created in this folder
$yourProjectRoot> ls server
app.js       package.json routes    bin          public

$yourProjectRoot> cd server

#lets install basic things setup by express-generator
$yourProjectRoot/server> npm install

#install our dependencies now
$yourProjectRoot/server> npm install --save bcrypt body-parser cookie-parser express-handlebars jsonwebtoken morgan cors dotenv lodash mysql2 sequelize vnatk-express-sequelize

### If required vnatk-express-sequelize can be installed in existing express seuelize setup also with very ease

#install sequelize cli for easy sequlize setup
$yourProjectRoot/server> npm install --save-dev sequelize-cli
$yourProjectRoot/server> sequelize init

```

### Step 2.0: configure and add route for vnatk-express-sequelize

Please add the following code in your `app.js` file.

(DON'T COPY PASTE WHOLE CODE, ITS NOT FULL FILE CODE) 

`app.js`
```javascript
// somewhere on the top after 
// var express = require('express'); <= after this line
var cors = require('cors');
const bodyParser = require('body-parser');
const vnatk = require('vnatk-express-sequelize');
...
...
// You can already have body-parser added, no need to add again
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

// add cors is a good way and mostly you might need this also
app.use(cors()); // Use this after the variable declaration

var VnatkRouter = require('./routes/vnatk.js');
app.use('/vnatk', VnatkRouter); // '/vnatk' is called basepath here

```

Now create a new file to export Vnatk Routes
`routes/vnatk.js`

```javascript
var express = require('express');
var router = express.Router();
const vnatk = require('vnatk-express-sequelize');

// Optional to use some auth middleware on this route
//router.use(require('./middleware/adminTokenChecker'));

const Models = require('../../models');
module.exports = vnatk({ 
    Models: Models,
    router: router,
    read: true, // Optional, default true
    create: true, // Optional, default true
    update: true, // Optional, default true
    delete: true, // Optional, default true
    import: true, // Optional, default true
    actions: true, // Optional, default true
});

```

## Use APIs

The above setup addes a couple of APIs on defined basepath as follows

vnatk-express-sequlize provides two APIs

- `{base_path}/crud (POST)`
This API is used to read data, DON'T GET CONFUSED with CRUD Name, this API DO NOT Create., Update or Delete. Instead, the API do provide infromation about Create, Update, Delete and Actions to work in combination with VNATK-VUE Fronetnd.

- `{base_path}/executeaction (POST)`
This API is responsible for various actions includeing Create, Update, Delete and Other Methods on Models including autoimport.
